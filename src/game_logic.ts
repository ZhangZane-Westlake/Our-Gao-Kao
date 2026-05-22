import { scene_order, visual_novel_scenes } from "./content";
import type {
  ChoiceRecord,
  SceneId,
  StatEffects,
  StatKey,
  VisualNovelEnding,
  VisualNovelFinalState,
  VisualNovelScene,
  VisualNovelState,
  VisualNovelStats
} from "./types";

const stat_keys: StatKey[] = ["mindset", "pressure", "strategy", "stability", "stamina", "support", "confidence", "growth"];

const initial_stats: VisualNovelStats = {
  mindset: 56,
  pressure: 52,
  strategy: 44,
  stability: 48,
  stamina: 68,
  support: 50,
  confidence: 44,
  growth: 36
};

/**
 * Creates a new visual novel game state.
 */
export function create_initial_state(): VisualNovelState {
  return {
    save_version: 1,
    current_scene_id: "act_01_oath",
    stats: { ...initial_stats },
    last_effects: {},
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
      last_effects: selected_choice.effects,
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
    last_effects: selected_choice.effects,
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
      const direction = value > 0 ? "↑" : "↓";
      return `${labels[key]}${direction}`;
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
  const pressure_line =
    state.stats.pressure >= 65
      ? "你仍然记得那些喘不过气的夜晚，但它们没有替你写下全部结论。"
      : "你学会了让紧张停在能被看见的位置，而不是让它悄悄占满整个房间。";
  const support_line =
    state.stats.support >= 55
      ? "你也慢慢知道，独自努力不等于拒绝所有人的手。"
      : "你有些时候还是习惯一个人撑着，但至少开始知道，沉默不是唯一的办法。";

  return {
    title: "下一站已开启",
    subtitle: "录取通知书被放到桌上，故事没有停在这里。",
    body: `这一百天，你保存下来的不只是分数。${pressure_line}${support_line}当录取通知书被放到桌上，你看见的不是一个完美结局，而是一个更愿意继续往前走的自己。`,
    final_state: resolve_final_state(state)
  };
}

/**
 * Resolves the player's final state from accumulated emotional and strategy stats.
 */
function resolve_final_state(state: VisualNovelState): VisualNovelFinalState {
  const stats = state.stats;

  if (stats.strategy >= 62 && stats.stability >= 58 && stats.mindset >= 52 && stats.pressure <= 68) {
    return {
      title: "理想发挥",
      body: "你没有把这一百天过成一次单纯的燃烧，而是慢慢学会了分配力气、相信方法，也相信自己。真正走进考场时，你带着紧张，也带着稳定。那不是奇迹，是很多个普通日子认真叠起来的结果。"
    };
  }

  if (stats.strategy >= 64 && (stats.pressure >= 70 || stats.support <= 35 || stats.mindset <= 40)) {
    return {
      title: "高分但空心",
      body: "你把很多题目做对了，也把很多情绪放到了最后才处理。值得庆幸的是，你已经看见了这件事。分数证明了你的能力，而接下来的人生，会给你时间重新学习怎样照顾自己、怎样让努力不再只剩孤单。"
    };
  }

  if (stats.growth >= 62 && stats.mindset >= 50) {
    return {
      title: "重新认识自己",
      body: "这一百天没有把你变成所谓标准答案，却让你更清楚自己会害怕、会迟疑，也会一次次重新站起来。你带走的不是完美履历，而是一种更珍贵的确认：原来我可以在不确定里继续长大。"
    };
  }

  if (stats.strategy >= 55 && stats.confidence >= 50) {
    return {
      title: "压线反转",
      body: "你并不是一路顺风走到这里。真正改变局面的，是你愿意停下来复盘，愿意把混乱拆成一道一道可以处理的题。最后的结果带着一点惊险，也带着你亲手争回来的底气。"
    };
  }

  if (stats.stability >= 52 && stats.stamina >= 45) {
    return {
      title: "稳定上岸",
      body: "你没有把每一天都过成热血片段，却把节奏一点点守住了。累的时候休息，乱的时候调整，该往前的时候继续往前。这样的稳定不喧哗，却足够把你送到下一站。"
    };
  }

  return {
    title: "带着光继续",
    body: "这一百天或许还有遗憾，也有来不及补完的地方。但你没有被一次考试定义，也没有被一段低谷困住。你已经知道，人生不是只有一种抵达方式；只要还愿意往前走，新的路就会慢慢亮起来。"
  };
}
