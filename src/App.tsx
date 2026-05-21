import { useEffect, useMemo, useState, type ReactElement } from "react";
import { character_profiles, period_labels, scene_labels } from "./content";
import {
  acknowledge_exam,
  calculate_study_efficiency,
  choose_action,
  create_initial_state,
  get_available_actions,
  get_current_event,
  resolve_event_choice
} from "./game_logic";
import { clear_saved_state, load_saved_state, save_state } from "./storage";
import type { CharacterProfile, GameState, PlayerAction, Stats } from "./types";

const stat_labels: Record<keyof Stats, string> = {
  score: "成绩",
  energy: "精力",
  mindset: "心态",
  health: "健康",
  relations: "人际",
  family: "家庭"
};

/**
 * Renders the full playable single-page game.
 */
export function App(): ReactElement {
  const [game_state, set_game_state] = useState<GameState | null>(() => load_saved_state());
  const available_actions = useMemo(() => (game_state ? get_available_actions(game_state) : []), [game_state]);

  useEffect(() => {
    if (game_state) {
      save_state(game_state);
    }
  }, [game_state]);

  /**
   * Starts a new run from a character profile.
   */
  function start_new_game(character_id: string): void {
    const initial_state = create_initial_state(character_id);
    set_game_state(initial_state);
  }

  /**
   * Clears the save and returns to the start screen.
   */
  function restart_game(): void {
    clear_saved_state();
    set_game_state(null);
  }

  if (!game_state) {
    return <StartScreen on_start={start_new_game} saved_state={load_saved_state()} />;
  }

  if (game_state.phase === "ending" && game_state.final_ending) {
    return <EndingScreen game_state={game_state} on_restart={restart_game} />;
  }

  return (
    <main className="game-shell">
      <HeaderBar game_state={game_state} on_restart={restart_game} />
      <section className="game-grid">
        <aside className="status-panel">
          <StatusBars stats={game_state.stats} />
          <HiddenHints game_state={game_state} />
        </aside>
        <section className="stage-panel">
          <PixelScene scene_id={game_state.current_scene} />
          <DialogueBox text={game_state.message} />
        </section>
        <aside className="choice-panel">
          {game_state.phase === "event" ? (
            <EventPanel game_state={game_state} on_choose={(choice_id) => set_game_state(resolve_event_choice(game_state, choice_id))} />
          ) : null}
          {game_state.phase === "exam" && game_state.current_exam ? (
            <ExamPanel game_state={game_state} on_continue={() => set_game_state(acknowledge_exam(game_state))} />
          ) : null}
          {game_state.phase === "playing" ? (
            <ActionPanel
              actions={available_actions}
              game_state={game_state}
              on_choose={(action_id) => set_game_state(choose_action(game_state, action_id))}
            />
          ) : null}
        </aside>
      </section>
    </main>
  );
}

interface StartScreenProps {
  saved_state: GameState | null;
  on_start: (character_id: string) => void;
}

/**
 * Renders the character selection and continue entry.
 */
function StartScreen({ saved_state, on_start }: StartScreenProps): ReactElement {
  const [selected_character_id, set_selected_character_id] = useState<string>(character_profiles[0].id);
  const selected_profile = character_profiles.find((profile) => profile.id === selected_character_id) ?? character_profiles[0];

  return (
    <main className="start-screen">
      <section className="title-block">
        <p className="kicker">像素风高三生活模拟</p>
        <h1>一模前30天</h1>
        <p className="subtitle">你不是在选择一天怎么过，而是在选择自己会变成什么样的人。</p>
      </section>
      <section className="profile-layout">
        <div className="profile-list" aria-label="角色类型">
          {character_profiles.map((profile) => (
            <button
              className={profile.id === selected_character_id ? "profile-card active" : "profile-card"}
              key={profile.id}
              onClick={() => set_selected_character_id(profile.id)}
              type="button"
            >
              <strong>{profile.name}</strong>
              <span>{profile.summary}</span>
            </button>
          ))}
        </div>
        <div className="profile-preview">
          <PixelPortrait profile={selected_profile} />
          <p>{selected_profile.opening}</p>
          <button className="primary-button" onClick={() => on_start(selected_character_id)} type="button">
            开始倒计时
          </button>
          {saved_state ? <p className="save-note">检测到本地存档，继续游戏会在主界面自动保留当前进度。</p> : null}
        </div>
      </section>
    </main>
  );
}

interface HeaderBarProps {
  game_state: GameState;
  on_restart: () => void;
}

/**
 * Renders day, scene, phase, and reset controls.
 */
function HeaderBar({ game_state, on_restart }: HeaderBarProps): ReactElement {
  const days_left = Math.max(0, 31 - game_state.day);

  return (
    <header className="top-bar">
      <div>
        <span className="pixel-label">倒计时</span>
        <strong>{days_left} 天</strong>
      </div>
      <div>
        <span className="pixel-label">第 {game_state.day} 天</span>
        <strong>{scene_labels[game_state.current_scene]}</strong>
      </div>
      <div>
        <span className="pixel-label">时段</span>
        <strong>{period_labels[game_state.current_period]}</strong>
      </div>
      <button className="ghost-button" onClick={on_restart} type="button">
        重新开始
      </button>
    </header>
  );
}

interface StatusBarsProps {
  stats: Stats;
}

/**
 * Renders visible player stats as pixel-style bars.
 */
function StatusBars({ stats }: StatusBarsProps): ReactElement {
  const stat_entries = Object.entries(stat_labels) as Array<[keyof Stats, string]>;

  return (
    <div className="stat-stack">
      {stat_entries.map(([stat_key, label]) => (
        <div className="stat-row" key={stat_key}>
          <div className="stat-heading">
            <span>{label}</span>
            <strong>{stats[stat_key]}</strong>
          </div>
          <div className="stat-track">
            <span className={`stat-fill stat-${stat_key}`} style={{ width: `${stats[stat_key]}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

interface HiddenHintsProps {
  game_state: GameState;
}

/**
 * Renders qualitative hints for hidden state without exposing all numbers.
 */
function HiddenHints({ game_state }: HiddenHintsProps): ReactElement {
  const efficiency = Math.round(calculate_study_efficiency(game_state) * 100);
  const pressure_text = game_state.hidden.pressure >= 70 ? "心里很紧" : game_state.hidden.pressure >= 45 ? "压力可感" : "还能呼吸";
  const focus_text = game_state.hidden.focus >= 65 ? "专注清晰" : game_state.hidden.focus >= 42 ? "偶有分神" : "容易飘走";

  return (
    <div className="hint-box">
      <p>
        学习效率 <strong>{efficiency}%</strong>
      </p>
      <p>{pressure_text}</p>
      <p>{focus_text}</p>
    </div>
  );
}

interface PixelSceneProps {
  scene_id: string;
}

/**
 * Renders a CSS-only pixel scene for the current story location.
 */
function PixelScene({ scene_id }: PixelSceneProps): ReactElement {
  return (
    <div className={`pixel-scene scene-${scene_id}`} aria-label={scene_labels[scene_id]}>
      <div className="pixel-sun" />
      <div className="pixel-window" />
      <div className="pixel-board" />
      <div className="pixel-desk desk-one" />
      <div className="pixel-desk desk-two" />
      <div className="pixel-person" />
      <div className="pixel-ground" />
    </div>
  );
}

interface DialogueBoxProps {
  text: string;
}

/**
 * Renders the latest narration text.
 */
function DialogueBox({ text }: DialogueBoxProps): ReactElement {
  return (
    <div className="dialogue-box">
      <p>{text}</p>
    </div>
  );
}

interface ActionPanelProps {
  actions: PlayerAction[];
  game_state: GameState;
  on_choose: (action_id: string) => void;
}

/**
 * Renders period actions for the player to choose from.
 */
function ActionPanel({ actions, game_state, on_choose }: ActionPanelProps): ReactElement {
  return (
    <div className="panel-card">
      <p className="panel-title">{period_labels[game_state.current_period]}</p>
      <div className="action-list">
        {actions.map((action) => (
          <button className="choice-button" key={action.id} onClick={() => on_choose(action.id)} type="button">
            <strong>{action.label}</strong>
            <span>{action.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

interface EventPanelProps {
  game_state: GameState;
  on_choose: (choice_id: string) => void;
}

/**
 * Renders the active story event and its choices.
 */
function EventPanel({ game_state, on_choose }: EventPanelProps): ReactElement | null {
  const current_event = get_current_event(game_state);

  if (!current_event) {
    return null;
  }

  return (
    <div className="panel-card event-card">
      <p className="panel-title">{current_event.title}</p>
      <p className="event-body">{current_event.body}</p>
      <div className="action-list">
        {current_event.choices.map((choice) => (
          <button className="choice-button" key={choice.id} onClick={() => on_choose(choice.id)} type="button">
            <strong>{choice.label}</strong>
          </button>
        ))}
      </div>
    </div>
  );
}

interface ExamPanelProps {
  game_state: GameState;
  on_continue: () => void;
}

/**
 * Renders the current exam result.
 */
function ExamPanel({ game_state, on_continue }: ExamPanelProps): ReactElement | null {
  if (!game_state.current_exam) {
    return null;
  }

  return (
    <div className="panel-card exam-card">
      <p className="panel-title">{game_state.current_exam.name}</p>
      <h2>{game_state.current_exam.score}</h2>
      <h3>{game_state.current_exam.title}</h3>
      <p>{game_state.current_exam.feedback}</p>
      <button className="primary-button" onClick={on_continue} type="button">
        收起卷子
      </button>
    </div>
  );
}

interface EndingScreenProps {
  game_state: GameState;
  on_restart: () => void;
}

/**
 * Renders the final ending and a compact choice review.
 */
function EndingScreen({ game_state, on_restart }: EndingScreenProps): ReactElement {
  const ending = game_state.final_ending;
  const history_preview = game_state.choice_history.slice(-6);

  if (!ending) {
    return (
      <main className="ending-screen">
        <button className="primary-button" onClick={on_restart} type="button">
          重新开始
        </button>
      </main>
    );
  }

  return (
    <main className="ending-screen">
      <section className="ending-card">
        <p className="kicker">结局</p>
        <h1>{ending.title}</h1>
        <p className="ending-subtitle">{ending.subtitle}</p>
        <p>{ending.review}</p>
        <div className="exam-list">
          {game_state.exam_records.map((record) => (
            <span key={`${record.day}-${record.name}`}>
              第 {record.day} 天 · {record.name} · {record.score}
            </span>
          ))}
        </div>
        <div className="history-list">
          {history_preview.map((entry) => (
            <p key={`${entry.day}-${entry.period}-${entry.label}`}>
              第 {entry.day} 天：{entry.label}
            </p>
          ))}
        </div>
        <button className="primary-button" onClick={on_restart} type="button">
          再来一次
        </button>
      </section>
    </main>
  );
}

interface PixelPortraitProps {
  profile: CharacterProfile;
}

/**
 * Renders a small pixel portrait using the profile id as the palette hook.
 */
function PixelPortrait({ profile }: PixelPortraitProps): ReactElement {
  return (
    <div className={`pixel-portrait portrait-${profile.id}`} aria-label={profile.name}>
      <span />
      <span />
      <span />
    </div>
  );
}
