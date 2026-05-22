import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { asset_requirements, speaker_labels, stat_labels } from "./content";
import { choose_visual_novel_option, create_initial_state, format_effects, get_current_scene, is_collectible_choice_selected } from "./game_logic";
import { clear_saved_state, load_saved_state, save_state } from "./storage";
import type { AssetRequirement, StatKey, VisualNovelChoice, VisualNovelScene, VisualNovelState } from "./types";

const visible_stat_keys: StatKey[] = ["mindset", "pressure", "strategy", "stability", "stamina", "support", "confidence", "growth"];
const scene_asset_root = "/assets/generated/scenes";
const character_asset_root = "/assets/generated/characters";
const title_asset_src = "/assets/generated/title/title_screen.png";
const should_show_character_sprites = false;
const intro_theme_sentence = "高三就像一场游戏，它记录下分数，也记录下努力、勇气、感情。";
const finale_theme_sentence = "高考不是人生的终局，而是青春里认真奔跑的证明。";
const phonetic_fallback_syllables = ["wo", "ni", "de", "shi", "zai", "xiang", "kan", "dao", "xin", "li", "guang", "he", "zou", "wan", "qian", "yi", "tian"];
const phonetic_lookup: Record<string, string> = {
  的: "de",
  一: "yi",
  不: "bu",
  了: "le",
  是: "shi",
  我: "wo",
  你: "ni",
  在: "zai",
  有: "you",
  和: "he",
  到: "dao",
  这: "zhe",
  个: "ge",
  也: "ye",
  会: "hui",
  走: "zou",
  前: "qian",
  学: "xue",
  高: "gao",
  三: "san",
  考: "kao",
  分: "fen",
  数: "shu",
  努: "nu",
  力: "li",
  勇: "yong",
  气: "qi",
  感: "gan",
  情: "qing",
  青: "qing",
  春: "chun",
  认: "ren",
  真: "zhen",
  奔: "ben",
  跑: "pao",
  证: "zheng",
  明: "ming",
  心: "xin",
  态: "tai",
  压: "ya",
  稳: "wen",
  定: "ding",
  成: "cheng",
  长: "zhang",
  题: "ti",
  老: "lao",
  师: "shi",
  同: "tong",
  桌: "zhuo",
  朋: "peng",
  友: "you",
  母: "mu",
  父: "fu",
  亲: "qin"
};

type OverlayState =
  | {
      kind: "intro";
    }
  | {
      act: number;
      kind: "first_scene";
      title: string;
    }
  | {
      consequence: string;
      effects_label: string;
      kind: "choice";
      label: string;
      quote: string;
    }
  | {
      kind: "transition";
      title: string;
    }
  | {
      kind: "finale";
    }
  | null;

interface TypewriterState {
  phonetic_hint: string;
  is_started: boolean;
  visible_count: number;
}

/**
 * Renders the playable visual novel.
 */
export function App(): ReactElement {
  const [game_state, set_game_state] = useState<VisualNovelState | null>(() => load_saved_state());
  const [overlay_state, set_overlay_state] = useState<OverlayState>(null);
  const transition_timeout_ids = useRef<number[]>([]);
  const current_scene = useMemo(() => (game_state ? get_current_scene(game_state) : null), [game_state]);

  useEffect(() => {
    if (game_state) {
      save_state(game_state);
    }
  }, [game_state]);

  useEffect(() => {
    return () => {
      transition_timeout_ids.current.forEach((timeout_id) => window.clearTimeout(timeout_id));
    };
  }, []);

  /**
   * Starts a fresh visual novel run.
   */
  function start_new_game(): void {
    set_overlay_state({ kind: "intro" });
  }

  /**
   * Clears the active local save and returns to the title screen.
   */
  function restart_game(): void {
    clear_transition_timeouts();
    clear_saved_state();
    set_overlay_state(null);
    set_game_state(null);
  }

  /**
   * Schedules a transition timeout and tracks it for cleanup.
   */
  function schedule_transition(callback: () => void, delay_ms: number): void {
    const timeout_id = window.setTimeout(callback, delay_ms);
    transition_timeout_ids.current = [...transition_timeout_ids.current, timeout_id];
  }

  /**
   * Clears all pending transition timeouts.
   */
  function clear_transition_timeouts(): void {
    transition_timeout_ids.current.forEach((timeout_id) => window.clearTimeout(timeout_id));
    transition_timeout_ids.current = [];
  }

  /**
   * Resets old progress and moves from the opening intro into the first scene title card.
   */
  function enter_first_scene(): void {
    clear_transition_timeouts();
    clear_saved_state();
    const initial_state = create_initial_state();
    const first_scene = get_current_scene(initial_state);
    set_overlay_state({ act: first_scene.act, kind: "first_scene", title: first_scene.title });
    set_game_state(initial_state);
    schedule_transition(() => set_overlay_state(null), 2400);
  }

  /**
   * Handles choices with a reveal card and scene transition.
   */
  function handle_choose(choice_id: string): void {
    if (!game_state || !current_scene || overlay_state) {
      return;
    }

    const selected_choice = current_scene.choices.find((choice) => choice.id === choice_id);

    if (!selected_choice) {
      return;
    }

    const next_state = choose_visual_novel_option(game_state, choice_id);
    set_overlay_state({
      consequence: selected_choice.consequence,
      effects_label: format_effects(selected_choice.effects),
      kind: "choice",
      label: selected_choice.label,
      quote: selected_choice.quote
    });

    schedule_transition(() => {
      if (next_state.ending) {
        set_overlay_state({ kind: "finale" });
        schedule_transition(() => {
          set_game_state(next_state);
          set_overlay_state(null);
        }, 3600);
        return;
      }

      if (next_state.current_scene_id !== game_state.current_scene_id) {
        set_overlay_state({ kind: "transition", title: get_current_scene(next_state).title });
        schedule_transition(() => {
          set_game_state(next_state);
          schedule_transition(() => set_overlay_state(null), 460);
        }, 980);
        return;
      }

      set_game_state(next_state);
      set_overlay_state(null);
    }, 2200);
  }

  if (!game_state || !current_scene) {
    return (
      <>
        <TitleScreen has_saved_state={load_saved_state() !== null} on_start={start_new_game} on_continue={(saved_state) => set_game_state(saved_state)} />
        <TransitionOverlay on_intro_continue={enter_first_scene} overlay_state={overlay_state} />
      </>
    );
  }

  if (game_state.ending) {
    return <EndingScreen game_state={game_state} on_restart={restart_game} />;
  }

  return (
    <main className="vn-shell">
      <TopBar scene={current_scene} on_restart={restart_game} />
      <section className="vn-layout">
        <VisualStage game_state={game_state} is_blocked={overlay_state !== null} on_choose={handle_choose} scene={current_scene} />
        <aside className="side-panel">
          <StatusPanel game_state={game_state} />
        </aside>
      </section>
      <TransitionOverlay on_intro_continue={enter_first_scene} overlay_state={overlay_state} />
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
  const [has_failed_title_image, set_has_failed_title_image] = useState<boolean>(false);

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
      {!has_failed_title_image ? <img alt="下一站以前封面" className="title-background-image" onError={() => set_has_failed_title_image(true)} src={title_asset_src} /> : null}
      <div className="title-background-shade" />
      <section className="title-copy">
        <h1>下一站以前</h1>
        <p className="title-subtitle">
          <span>从百日誓师到录取通知书。</span>
          <span>它不只记录分数，也记录你在迷茫里怎样抬头，在害怕时怎样继续往前走。</span>
        </p>
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
    </main>
  );
}

interface TopBarProps {
  scene: VisualNovelScene;
  on_restart: () => void;
}

/**
 * Renders global visual novel progress.
 */
function TopBar({ scene, on_restart }: TopBarProps): ReactElement {
  return (
    <header className="top-bar">
      <div className="top-scene-title">
        <span>第 {scene.act} 幕</span>
        <strong>{scene.title}</strong>
      </div>
      <div className="top-countdown">
        <span>高考倒计时</span>
        <strong>{scene.days_left} 天</strong>
      </div>
      <div className="top-actions">
        <button className="secondary-button" onClick={on_restart} type="button">
          回头看看
        </button>
      </div>
    </header>
  );
}

interface VisualStageProps {
  game_state: VisualNovelState;
  is_blocked: boolean;
  on_choose: (choice_id: string) => void;
  scene: VisualNovelScene;
}

/**
 * Renders a cinematic placeholder for the scene image.
 */
function VisualStage({ game_state, is_blocked, on_choose, scene }: VisualStageProps): ReactElement {
  const [failed_scene_images, set_failed_scene_images] = useState<Set<string>>(() => new Set());
  const [failed_character_images, set_failed_character_images] = useState<Set<string>>(() => new Set());
  const scene_src = `${scene_asset_root}/${scene.background_key}.png`;
  const has_failed_scene = failed_scene_images.has(scene.background_key);

  useEffect(() => {
    set_failed_scene_images(new Set());
    set_failed_character_images(new Set());
  }, [scene.id]);

  /**
   * Records that a background image could not be loaded.
   */
  function handle_scene_error(): void {
    set_failed_scene_images((current) => new Set(current).add(scene.background_key));
  }

  /**
   * Records that a character image could not be loaded.
   */
  function handle_character_error(character_key: string): void {
    set_failed_character_images((current) => new Set(current).add(character_key));
  }

  return (
    <section className={`visual-stage ${scene.id}`}>
      {!has_failed_scene ? <img alt={scene.title} className="scene-image" onError={handle_scene_error} src={scene_src} /> : null}
      {has_failed_scene ? (
        <div className="image-placeholder">
          <p>{scene.background_key}</p>
          <span>等待场景图片</span>
        </div>
      ) : null}
      <div className="stage-vignette" />
      {!has_failed_scene ? <div className="cinema-shade" /> : null}
      {should_show_character_sprites ? (
        <div className="character-layer" aria-label="人物立绘">
          {scene.character_keys.map((character_key, index) => {
            if (failed_character_images.has(character_key)) {
              return null;
            }

            return (
              <img
                alt={character_key}
                className={`character-sprite sprite-${index}`}
                key={character_key}
                onError={() => handle_character_error(character_key)}
                src={`${character_asset_root}/${character_key}.png`}
              />
            );
          })}
        </div>
      ) : null}
      {should_show_character_sprites && !has_failed_scene && scene.character_keys.length > 0 && scene.character_keys.every((character_key) => failed_character_images.has(character_key)) ? (
        <div className="character-placeholder">
          <p>{scene.character_keys.join(" / ")}</p>
        </div>
      ) : null}
      {has_failed_scene ? (
        <div className="fallback-note">
          <p>把图片放到 {scene_src}</p>
        </div>
      ) : null}
      <section className="story-panel">
        <DialoguePanel scene={scene} />
        <ChoicePanel game_state={game_state} is_blocked={is_blocked} scene={scene} on_choose={on_choose} />
      </section>
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
      <p className="panel-title">这一刻的我</p>
      <div className="stat-grid">
        {visible_stat_keys.map((stat_key) => {
          const effect_value = game_state.last_effects[stat_key] ?? 0;
          const effect_class_name = effect_value > 0 ? "positive" : effect_value < 0 ? "negative" : "";
          const stat_value = game_state.stats[stat_key];
          const level_class_name = stat_value >= 70 ? "high" : stat_value <= 35 ? "low" : "mid";

          return (
            <div className={effect_value !== 0 ? `stat-item changed ${effect_class_name} ${level_class_name}` : `stat-item ${level_class_name}`} key={`${stat_key}-${effect_value}-${game_state.choice_history.length}`}>
              <div className="stat-label-row">
                <span>{stat_labels[stat_key]}</span>
                {effect_value !== 0 ? <em>{effect_value > 0 ? "↑" : "↓"}</em> : null}
              </div>
              <div className="stat-track" aria-hidden="true">
                <span className="stat-fill" style={{ width: `${stat_value}%` }} />
              </div>
            </div>
          );
        })}
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
  const line_start_delay_ms = build_typewriter_start_delays([scene.narration, ...scene.dialogue.map((line) => line.text)]);

  return (
    <section className="dialogue-panel">
      <div>
        <p className="panel-title">{scene.subtitle}</p>
        <p className="narration type-line" key={`${scene.id}-narration`} style={{ animationDelay: `${line_start_delay_ms[0] ?? 0}ms` }}>
          <PhoneticTypeText start_delay_ms={line_start_delay_ms[0] ?? 0} text={scene.narration} />
        </p>
      </div>
      <div className="dialogue-lines">
        {scene.dialogue.map((line, index) => {
          const dialogue_line_start_delay_ms = line_start_delay_ms[index + 1] ?? 0;

          if (line.speaker === "narrator") {
            return (
              <p className="narrator-line type-line" key={`${scene.id}-${line.speaker}-${index}`} style={{ animationDelay: `${dialogue_line_start_delay_ms}ms` }}>
                <PhoneticTypeText start_delay_ms={dialogue_line_start_delay_ms} text={line.text} />
              </p>
            );
          }

          return (
            <p className="type-line" key={`${scene.id}-${line.speaker}-${index}`} style={{ animationDelay: `${dialogue_line_start_delay_ms}ms` }}>
              <strong>{line.speaker === "protagonist" ? "我" : speaker_labels[line.speaker]}：</strong>
              <PhoneticTypeText start_delay_ms={dialogue_line_start_delay_ms} text={line.text} />
            </p>
          );
        })}
      </div>
    </section>
  );
}

interface ChoicePanelProps {
  game_state: VisualNovelState;
  is_blocked: boolean;
  scene: VisualNovelScene;
  on_choose: (choice_id: string) => void;
}

/**
 * Renders player choices and their quoted intent.
 */
function ChoicePanel({ game_state, is_blocked, scene, on_choose }: ChoicePanelProps): ReactElement {
  return (
    <section className="choice-panel">
      <p className="panel-title">{scene.choice_prompt}</p>
      <div className="choice-list">
        {scene.choices.map((choice) => {
          const is_selected = scene.choice_mode === "collect_all" && is_collectible_choice_selected(game_state, choice.id);
          return <ChoiceButton choice={choice} is_blocked={is_blocked} is_selected={is_selected} key={choice.id} on_choose={on_choose} />;
        })}
      </div>
    </section>
  );
}

interface ChoiceButtonProps {
  choice: VisualNovelChoice;
  is_blocked: boolean;
  is_selected: boolean;
  on_choose: (choice_id: string) => void;
}

/**
 * Renders a single choice button.
 */
function ChoiceButton({ choice, is_blocked, is_selected, on_choose }: ChoiceButtonProps): ReactElement {
  return (
    <button className={is_selected ? "choice-button selected" : "choice-button"} disabled={is_selected || is_blocked} onClick={() => on_choose(choice.id)} type="button">
      <span className="choice-heading">
        <strong>{choice.label}</strong>
      </span>
      <span className="choice-quote">“{choice.quote}”</span>
    </button>
  );
}

/**
 * Builds sequential start delays so typewriter lines appear one after another.
 */
function build_typewriter_start_delays(text_lines: string[], speed_ms = 44, gap_ms = 260): number[] {
  let accumulated_delay_ms = 0;

  return text_lines.map((text_line) => {
    const start_delay_ms = accumulated_delay_ms;
    accumulated_delay_ms += estimate_typewriter_duration(text_line, speed_ms) + gap_ms;
    return start_delay_ms;
  });
}

/**
 * Estimates how long a text line needs to finish its phonetic typewriter effect.
 */
function estimate_typewriter_duration(text: string, speed_ms = 44): number {
  return Array.from(text).reduce((duration_ms, character) => {
    if (is_chinese_character(character)) {
      return duration_ms + Math.max(58, speed_ms + 20) + speed_ms;
    }

    return duration_ms + Math.max(12, speed_ms / 2);
  }, 0);
}

interface PhoneticTypeTextProps {
  speed_ms?: number;
  start_delay_ms?: number;
  text: string;
}

/**
 * Displays text with a light pinyin-input illusion before each Chinese character appears.
 */
function PhoneticTypeText({ speed_ms = 44, start_delay_ms = 0, text }: PhoneticTypeTextProps): ReactElement {
  const [typewriter_state, set_typewriter_state] = useState<TypewriterState>({ phonetic_hint: "", is_started: false, visible_count: 0 });

  useEffect(() => {
    const timeout_ids: number[] = [];
    let current_index = 0;

    /**
     * Schedules typewriter work and keeps timeout cleanup local to this text run.
     */
    function schedule_typewriter_step(callback: () => void, delay_ms: number): void {
      timeout_ids.push(window.setTimeout(callback, delay_ms));
    }

    /**
     * Reveals the next character after briefly showing its phonetic input.
     */
    function reveal_next_character(): void {
      if (current_index >= text.length) {
        set_typewriter_state({ phonetic_hint: "", is_started: true, visible_count: text.length });
        return;
      }

      const current_character = text[current_index] ?? "";

      if (!is_chinese_character(current_character)) {
        current_index += 1;
        set_typewriter_state({ phonetic_hint: "", is_started: true, visible_count: current_index });
        schedule_typewriter_step(reveal_next_character, Math.max(12, speed_ms / 2));
        return;
      }

      set_typewriter_state({
        phonetic_hint: resolve_phonetic_hint(current_character),
        is_started: true,
        visible_count: current_index
      });

      schedule_typewriter_step(() => {
        current_index += 1;
        set_typewriter_state({ phonetic_hint: "", is_started: true, visible_count: current_index });
        schedule_typewriter_step(reveal_next_character, speed_ms);
      }, Math.max(58, speed_ms + 20));
    }

    set_typewriter_state({ phonetic_hint: "", is_started: false, visible_count: 0 });
    schedule_typewriter_step(reveal_next_character, start_delay_ms);

    return () => {
      timeout_ids.forEach((timeout_id) => window.clearTimeout(timeout_id));
    };
  }, [speed_ms, start_delay_ms, text]);

  return (
    <span aria-label={text} className="type-text">
      <span aria-hidden="true">{text.slice(0, typewriter_state.visible_count)}</span>
      {typewriter_state.phonetic_hint ? (
        <span aria-hidden="true" className="type-text-phonetic">
          {typewriter_state.phonetic_hint}
        </span>
      ) : null}
      {typewriter_state.is_started && typewriter_state.visible_count < text.length ? <span aria-hidden="true" className="type-text-cursor" /> : null}
    </span>
  );
}

/**
 * Checks whether a character should receive the pinyin-input effect.
 */
function is_chinese_character(character: string): boolean {
  return /[\u3400-\u9fff]/u.test(character);
}

/**
 * Returns a readable pinyin hint for a Chinese character.
 */
function resolve_phonetic_hint(character: string): string {
  return phonetic_lookup[character] ?? phonetic_fallback_syllables[character.charCodeAt(0) % phonetic_fallback_syllables.length] ?? "zi";
}

interface TransitionOverlayProps {
  on_intro_continue: () => void;
  overlay_state: OverlayState;
}

/**
 * Renders intro, choice reveal, scene transition, and final pre-ending overlays.
 */
function TransitionOverlay({ on_intro_continue, overlay_state }: TransitionOverlayProps): ReactElement | null {
  if (!overlay_state) {
    return null;
  }

  if (overlay_state.kind === "intro") {
    return (
      <section className="transition-overlay intro-overlay">
        <div className="intro-copy">
          <p>屏幕暗下来的时候，故事才刚刚开始。</p>
          <h2>{intro_theme_sentence}</h2>
          <button className="primary-button" onClick={on_intro_continue} type="button">
            进入百日倒计时
          </button>
        </div>
      </section>
    );
  }

  if (overlay_state.kind === "first_scene") {
    return (
      <section className="transition-overlay first-scene-overlay" aria-label="进入第一幕">
        <div className="transition-title">
          <span>第 {overlay_state.act} 幕</span>
          <h2>{overlay_state.title}</h2>
        </div>
      </section>
    );
  }

  if (overlay_state.kind === "choice") {
    return (
      <section className="choice-reveal-overlay">
        <article className="choice-reveal-card">
          <span>你选择了</span>
          <h2>{overlay_state.label}</h2>
          <p className="choice-reveal-quote">“{overlay_state.quote}”</p>
          <p className="choice-reveal-effect">{overlay_state.effects_label}</p>
          <p>{overlay_state.consequence}</p>
        </article>
      </section>
    );
  }

  if (overlay_state.kind === "finale") {
    return (
      <section className="transition-overlay finale-overlay">
        <div className="intro-copy">
          <p>通知书被轻轻放在桌上，那些日子也终于有了回声。</p>
          <h2>{finale_theme_sentence}</h2>
          <p>你保存下来的不是一个完美分数，而是一段认真走过的青春。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="transition-overlay scene-transition-overlay">
      <div className="transition-title">
        <span>下一幕</span>
        <h2>{overlay_state.title}</h2>
      </div>
    </section>
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
  const final_state = ending?.final_state ?? {
    body: "你已经认真走过这一百天。无论结果怎样，它都不会抹掉你曾经努力、害怕、调整，又继续往前走的事实。",
    title: "下一站已开启"
  };
  const final_state_body_delay_ms = estimate_typewriter_duration(final_state.title, 92) + 320;

  return (
    <main className="ending-screen">
      <section className="ending-card">
        <h1>下一站已开启</h1>
        <p className="ending-subtitle">{ending?.subtitle}</p>
        <p>{ending?.body}</p>
        <article className="final-state-card">
          <span>最终状态</span>
          <h2 className="final-state-title">
            <PhoneticTypeText speed_ms={92} text={final_state.title} />
          </h2>
          <p>
            <PhoneticTypeText start_delay_ms={final_state_body_delay_ms} text={final_state.body} />
          </p>
        </article>
        <button className="primary-button" onClick={on_restart} type="button">
          回头看看
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
