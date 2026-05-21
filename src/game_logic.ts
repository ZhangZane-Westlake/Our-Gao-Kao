import { scene_order, visual_novel_scenes } from "./content";
import type {
  ChoiceRecord,
  SceneId,
  StatEffects,
  StatKey,
  VisualNovelEnding,
  VisualNovelScene,
  VisualNovelState,
  VisualNovelStats
} from "./types";

const stat_keys: StatKey[] = ["mindset", "pressure", "strategy", "stability", "stamina", "support", "confidence", "growth"];

const initial_stats: VisualNovelStats = {
  mindset: 42,
  pressure: 46,
  strategy: 28,
  stability: 32,
  stamina: 58,
  support: 36,
  confidence: 30,
  growth: 20
};

/**
 * Creates a new visual novel game state.
 */
export function create_initial_state(): VisualNovelState {
  return {
    save_version: 1,
    current_scene_id: "act_01_oath",
    stats: { ...initial_stats },
    unlocked_items: [],
    selected_collectible_choice_ids: [],
    choice_history: []
  };
}

/**
 * Returns the scene currently displayed by the game.
 */
export function get_current_scene(state: VisualNovelState): VisualNovelScene {
  return visual_novel_scenes.find((scene) => scene.id === state.current_scene_id) ?? visual_novel_scenes[0];
}

/**
 * Applies a selected choice, updates state, and advances the story when needed.
 */
export function choose_visual_novel_option(state: VisualNovelState, choice_id: string): VisualNovelState {
  if (state.ending) {
    return state;
  }

  const current_scene = get_current_scene(state);
  const selected_choice = current_scene.choices.find((choice) => choice.id === choice_id);

  if (!selected_choice) {
    return state;
  }

  if (current_scene.choice_mode === "collect_all" && state.selected_collectible_choice_ids.includes(choice_id)) {
    return state;
  }

  const next_stats = apply_stat_effects(state.stats, selected_choice.effects);
  const next_unlocked_items = merge_unlocked_items(state.unlocked_items, selected_choice.unlocks);
  const choice_record: ChoiceRecord = {
    scene_id: current_scene.id,
    scene_title: current_scene.title,
    choice_id: selected_choice.id,
    label: selected_choice.label,
    quote: selected_choice.quote,
    consequence: selected_choice.consequence,
    effects: selected_choice.effects,
    unlocked: selected_choice.unlocks
  };

  if (current_scene.choice_mode === "collect_all") {
    const next_selected_choice_ids = [...state.selected_collectible_choice_ids, choice_id];
    const has_collected_all = current_scene.choices.every((choice) => next_selected_choice_ids.includes(choice.id));
    const next_state: VisualNovelState = {
      ...state,
      stats: next_stats,
      unlocked_items: next_unlocked_items,
      selected_collectible_choice_ids: next_selected_choice_ids,
      choice_history: [...state.choice_history, choice_record]
    };

    return has_collected_all ? { ...next_state, ending: create_ending(next_state) } : next_state;
  }

  const next_scene_id = current_scene.next_scene_id ?? get_next_scene_id(current_scene.id);
  const next_state: VisualNovelState = {
    ...state,
    current_scene_id: next_scene_id,
    stats: next_stats,
    unlocked_items: next_unlocked_items,
    selected_collectible_choice_ids: [],
    choice_history: [...state.choice_history, choice_record]
  };

  return next_scene_id === current_scene.id ? { ...next_state, ending: create_ending(next_state) } : next_state;
}

/**
 * Checks whether a collect-all choice has already been selected.
 */
export function is_collectible_choice_selected(state: VisualNovelState, choice_id: string): boolean {
  return state.selected_collectible_choice_ids.includes(choice_id);
}

/**
 * Returns a short readable stat effect label for UI display.
 */
export function format_effects(effects: StatEffects): string {
  const labels: Record<StatKey, string> = {
    mindset: "心态",
    pressure: "压力",
    strategy: "策略",
    stability: "稳定",
    stamina: "体力",
    support: "支持",
    confidence: "信心",
    growth: "成长"
  };

  return stat_keys
    .filter((key) => effects[key] !== undefined && effects[key] !== 0)
    .map((key) => {
      const value = effects[key] ?? 0;
      const sign = value > 0 ? "+" : "";
      return `${labels[key]} ${sign}${value}`;
    })
    .join(" / ");
}

/**
 * Applies stat changes while keeping all values in the expected range.
 */
function apply_stat_effects(stats: VisualNovelStats, effects: StatEffects): VisualNovelStats {
  return stat_keys.reduce<VisualNovelStats>(
    (next_stats, key) => {
      next_stats[key] = clamp_value(stats[key] + (effects[key] ?? 0));
      return next_stats;
    },
    { ...stats }
  );
}

/**
 * Keeps a stat between 0 and 100.
 */
function clamp_value(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Adds unlocked items without duplicates.
 */
function merge_unlocked_items(current_items: string[], new_items: string[]): string[] {
  return Array.from(new Set([...current_items, ...new_items]));
}

/**
 * Resolves the next scene by order when a scene omits an explicit next id.
 */
function get_next_scene_id(scene_id: SceneId): SceneId {
  const current_index = scene_order.indexOf(scene_id);
  return scene_order[current_index + 1] ?? scene_id;
}

/**
 * Creates the final ending copy from the player's state and choice history.
 */
function create_ending(state: VisualNovelState): VisualNovelEnding {
  const saved_items = build_saved_items(state);
  const pressure_line =
    state.stats.pressure >= 65
      ? "你仍然记得那些喘不过气的夜晚，但它们没有替你写下全部结论。"
      : "你学会了让紧张停在能被看见的位置，而不是让它悄悄占满整个房间。";
  const support_line =
    state.stats.support >= 55
      ? "你也慢慢知道，独自努力不等于拒绝所有人的手。"
      : "你有些时候还是习惯一个人撑着，但至少开始知道，沉默不是唯一的办法。";

  return {
    title: "高三副本完成",
    subtitle: "下一站已开启",
    body: `这一百天，你保存下来的不只是分数。${pressure_line}${support_line}当录取通知书被放到桌上，你看见的不是一个完美结局，而是一个更愿意继续往前走的自己。`,
    saved_items
  };
}

/**
 * Builds the final saved item list shown on the ending screen.
 */
function build_saved_items(state: VisualNovelState): string[] {
  const base_items = ["分数已保存"];
  const story_items = state.unlocked_items.filter((item) => item.endsWith("已保存"));
  const inferred_items = [
    state.stats.support >= 52 ? "友情已保存" : "孤独也被看见",
    state.stats.growth >= 45 ? "成长已保存" : "成长仍在继续"
  ];

  return Array.from(new Set([...base_items, ...story_items, ...inferred_items]));
}
