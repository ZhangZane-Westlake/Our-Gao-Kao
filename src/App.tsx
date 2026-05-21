import { useEffect, useMemo, useState, type ReactElement } from "react";
import { asset_requirements, speaker_labels, stat_labels } from "./content";
import { choose_visual_novel_option, create_initial_state, format_effects, get_current_scene, is_collectible_choice_selected } from "./game_logic";
import { clear_saved_state, load_saved_state, save_state } from "./storage";
import type { AssetRequirement, StatKey, VisualNovelChoice, VisualNovelScene, VisualNovelState } from "./types";

const visible_stat_keys: StatKey[] = ["mindset", "pressure", "strategy", "stability", "stamina", "support", "confidence", "growth"];

/**
 * Renders the playable visual novel.
 */
export function App(): ReactElement {
  const [game_state, set_game_state] = useState<VisualNovelState | null>(() => load_saved_state());
  const current_scene = useMemo(() => (game_state ? get_current_scene(game_state) : null), [game_state]);

  useEffect(() => {
    if (game_state) {
      save_state(game_state);
    }
  }, [game_state]);

  /**
   * Starts a fresh visual novel run.
   */
  function start_new_game(): void {
    set_game_state(create_initial_state());
  }

  /**
   * Clears the active local save and returns to the title screen.
   */
  function restart_game(): void {
    clear_saved_state();
    set_game_state(null);
  }

  if (!game_state || !current_scene) {
    return <TitleScreen has_saved_state={load_saved_state() !== null} on_start={start_new_game} on_continue={(saved_state) => set_game_state(saved_state)} />;
  }

  if (game_state.ending) {
    return <EndingScreen game_state={game_state} on_restart={restart_game} />;
  }

  return (
    <main className="vn-shell">
      <TopBar game_state={game_state} scene={current_scene} on_restart={restart_game} />
      <section className="vn-layout">
        <VisualStage scene={current_scene} />
        <aside className="side-panel">
          <StatusPanel game_state={game_state} />
          <InventoryPanel unlocked_items={game_state.unlocked_items} />
        </aside>
      </section>
      <section className="story-panel">
        <DialoguePanel scene={current_scene} />
        <ChoicePanel game_state={game_state} scene={current_scene} on_choose={(choice_id) => set_game_state(choose_visual_novel_option(game_state, choice_id))} />
      </section>
    </main>
  );
}

interface TitleScreenProps {
  has_saved_state: boolean;
  on_start: () => void;
  on_continue: (saved_state: VisualNovelState) => void;
}

/**
 * Renders the title and save controls.
 */
function TitleScreen({ has_saved_state, on_start, on_continue }: TitleScreenProps): ReactElement {
  /**
   * Loads a save when the player chooses to continue.
   */
  function continue_saved_game(): void {
    const saved_state = load_saved_state();

    if (saved_state) {
      on_continue(saved_state);
    }
  }

  return (
    <main className="title-screen">
      <section className="title-copy">
        <p className="eyebrow">视觉小说改版</p>
        <h1>倒计时100天</h1>
        <p>从百日誓师到录取通知书。不是把高三写成一场胜利，而是写成一个人慢慢学会选择、承受和继续往前走。</p>
        <div className="title-actions">
          <button className="primary-button" onClick={on_start} type="button">
            开始游戏
          </button>
          {has_saved_state ? (
            <button className="secondary-button" onClick={continue_saved_game} type="button">
              继续存档
            </button>
          ) : null}
        </div>
      </section>
      <section className="asset-preview-card">
        <p className="panel-title">资源接入状态</p>
        <p>当前版本先使用剧情占位画面。后续把你提供的场景图和人物图按清单放入项目后，即可替换占位层。</p>
      </section>
    </main>
  );
}

interface TopBarProps {
  game_state: VisualNovelState;
  scene: VisualNovelScene;
  on_restart: () => void;
}

/**
 * Renders global visual novel progress.
 */
function TopBar({ game_state, scene, on_restart }: TopBarProps): ReactElement {
  return (
    <header className="top-bar">
      <div>
        <span>第 {scene.act} 幕</span>
        <strong>{scene.title}</strong>
      </div>
      <div>
        <span>剩余时间</span>
        <strong>{scene.days_left} 天</strong>
      </div>
      <div>
        <span>当前状态</span>
        <strong>{scene.status_text}</strong>
      </div>
      <div>
        <span>已选择</span>
        <strong>{game_state.choice_history.length}</strong>
      </div>
      <button className="secondary-button" onClick={on_restart} type="button">
        重新开始
      </button>
    </header>
  );
}

interface VisualStageProps {
  scene: VisualNovelScene;
}

/**
 * Renders a cinematic placeholder for the scene image.
 */
function VisualStage({ scene }: VisualStageProps): ReactElement {
  return (
    <section className={`visual-stage ${scene.id}`}>
      <div className="image-placeholder">
        <p>{scene.background_key}</p>
        <span>等待场景图片</span>
      </div>
      <div className="real-text-stack" aria-label="画面内真实文字">
        {scene.real_text.map((text) => (
          <span key={text}>{text}</span>
        ))}
      </div>
      <div className="ui-overlay-card">
        {scene.ui_text.map((text) => (
          <p key={text}>{text}</p>
        ))}
      </div>
    </section>
  );
}

interface StatusPanelProps {
  game_state: VisualNovelState;
}

/**
 * Renders the lightweight state values used by the visual novel.
 */
function StatusPanel({ game_state }: StatusPanelProps): ReactElement {
  return (
    <section className="info-card">
      <p className="panel-title">状态</p>
      <div className="stat-grid">
        {visible_stat_keys.map((stat_key) => (
          <div className="stat-item" key={stat_key}>
            <div>
              <span>{stat_labels[stat_key]}</span>
              <strong>{game_state.stats[stat_key]}</strong>
            </div>
            <div className="stat-track">
              <span className={`stat-fill stat-${stat_key}`} style={{ width: `${game_state.stats[stat_key]}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

interface InventoryPanelProps {
  unlocked_items: string[];
}

/**
 * Renders unlocked story equipment and memory markers.
 */
function InventoryPanel({ unlocked_items }: InventoryPanelProps): ReactElement {
  return (
    <section className="info-card">
      <p className="panel-title">已装备 / 已保存</p>
      <div className="tag-list">
        {unlocked_items.length > 0 ? unlocked_items.map((item) => <span key={item}>{item}</span>) : <span>尚未解锁</span>}
      </div>
    </section>
  );
}

interface DialoguePanelProps {
  scene: VisualNovelScene;
}

/**
 * Renders narration and dialogue lines for the scene.
 */
function DialoguePanel({ scene }: DialoguePanelProps): ReactElement {
  return (
    <section className="dialogue-panel">
      <div>
        <p className="panel-title">{scene.subtitle}</p>
        <p className="narration">{scene.narration}</p>
      </div>
      <div className="dialogue-lines">
        {scene.dialogue.map((line, index) => (
          <p key={`${line.speaker}-${index}`}>
            <strong>{speaker_labels[line.speaker]}：</strong>
            {line.text}
          </p>
        ))}
      </div>
    </section>
  );
}

interface ChoicePanelProps {
  game_state: VisualNovelState;
  scene: VisualNovelScene;
  on_choose: (choice_id: string) => void;
}

/**
 * Renders player choices and their quoted intent.
 */
function ChoicePanel({ game_state, scene, on_choose }: ChoicePanelProps): ReactElement {
  return (
    <section className="choice-panel">
      <p className="panel-title">{scene.choice_prompt}</p>
      <div className="choice-list">
        {scene.choices.map((choice) => {
          const is_selected = scene.choice_mode === "collect_all" && is_collectible_choice_selected(game_state, choice.id);
          return <ChoiceButton choice={choice} is_selected={is_selected} key={choice.id} on_choose={on_choose} />;
        })}
      </div>
    </section>
  );
}

interface ChoiceButtonProps {
  choice: VisualNovelChoice;
  is_selected: boolean;
  on_choose: (choice_id: string) => void;
}

/**
 * Renders a single choice button.
 */
function ChoiceButton({ choice, is_selected, on_choose }: ChoiceButtonProps): ReactElement {
  return (
    <button className={is_selected ? "choice-button selected" : "choice-button"} disabled={is_selected} onClick={() => on_choose(choice.id)} type="button">
      <span className="choice-heading">
        <strong>{choice.label}</strong>
        {choice.recommended ? <em>推荐</em> : null}
      </span>
      <span className="choice-quote">“{choice.quote}”</span>
      <span className="choice-effect">{format_effects(choice.effects)}</span>
    </button>
  );
}

interface EndingScreenProps {
  game_state: VisualNovelState;
  on_restart: () => void;
}

/**
 * Renders the final completion screen.
 */
function EndingScreen({ game_state, on_restart }: EndingScreenProps): ReactElement {
  const ending = game_state.ending;
  const last_choices = game_state.choice_history.slice(-5);

  return (
    <main className="ending-screen">
      <section className="ending-card">
        <p className="eyebrow">高三副本完成</p>
        <h1>{ending?.title ?? "下一站已开启"}</h1>
        <p className="ending-subtitle">{ending?.subtitle}</p>
        <p>{ending?.body}</p>
        <div className="save-grid">
          {(ending?.saved_items ?? []).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="history-list">
          {last_choices.map((choice) => (
            <article key={`${choice.scene_id}-${choice.choice_id}`}>
              <strong>{choice.scene_title} · {choice.label}</strong>
              <p>{choice.consequence}</p>
            </article>
          ))}
        </div>
        <button className="primary-button" onClick={on_restart} type="button">
          重新开始
        </button>
      </section>
    </main>
  );
}

/**
 * Exposes the image requirements for README and future integration work.
 */
export function get_asset_requirements(): AssetRequirement[] {
  return asset_requirements;
}
