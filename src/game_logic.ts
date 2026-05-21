import { character_profiles, player_actions, story_events } from "./content";
import type {
  CharacterProfile,
  ChoiceHistoryEntry,
  Effects,
  EndingResult,
  ExamRecord,
  GameState,
  HiddenStats,
  PlayerAction,
  Stats,
  StoryEvent
} from "./types";

const stat_keys: Array<keyof Stats> = ["score", "energy", "mindset", "health", "relations", "family"];
const hidden_stat_keys: Array<keyof HiddenStats> = ["focus", "pressure", "phone_dependency", "resilience"];
const periods: GameState["current_period"][] = ["daytime", "evening", "night"];
const exam_days = [10, 20, 30];

/**
 * Keeps a numeric game value inside the intended 0 to 100 range.
 */
export function clamp_value(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Creates a fresh game state from the selected character profile.
 */
export function create_initial_state(character_id: string): GameState {
  const selected_profile = get_character_profile(character_id);

  return {
    day: 1,
    phase: "playing",
    current_period: "daytime",
    selected_character_id: selected_profile.id,
    initial_score: selected_profile.stats.score,
    stats: { ...selected_profile.stats },
    hidden: { ...selected_profile.hidden },
    counters: { late_night_days: 0, phone_days: 0, rest_days: 0 },
    completed_periods: [],
    triggered_event_ids: [],
    exam_records: [],
    choice_history: [],
    recent_tags: [],
    current_scene: "classroom",
    message: selected_profile.opening
  };
}

/**
 * Finds a character profile and falls back to the stable profile.
 */
export function get_character_profile(character_id: string): CharacterProfile {
  return character_profiles.find((profile) => profile.id === character_id) ?? character_profiles[0];
}

/**
 * Calculates the current study efficiency from visible and hidden state.
 */
export function calculate_study_efficiency(state: GameState): number {
  const energy_factor = 0.55 + state.stats.energy / 160;
  const mindset_factor = 0.62 + state.stats.mindset / 180;
  const health_factor = 0.58 + state.stats.health / 190;
  const focus_factor = 0.72 + state.hidden.focus / 260;
  const pressure_penalty = state.hidden.pressure / 260;
  const raw_efficiency = energy_factor * mindset_factor * health_factor * focus_factor - pressure_penalty;

  return Math.max(0.35, Math.min(1.35, raw_efficiency));
}

/**
 * Applies visible and hidden effects, optionally scaling score gain by study efficiency.
 */
export function apply_effects(state: GameState, effects: Effects, score_multiplier: number): GameState {
  const next_stats = { ...state.stats };
  const next_hidden = { ...state.hidden };

  stat_keys.forEach((stat_key) => {
    const raw_delta = effects.stats?.[stat_key] ?? 0;
    const adjusted_delta = stat_key === "score" && raw_delta > 0 ? raw_delta * score_multiplier : raw_delta;
    next_stats[stat_key] = clamp_value(next_stats[stat_key] + adjusted_delta);
  });

  hidden_stat_keys.forEach((hidden_key) => {
    const raw_delta = effects.hidden?.[hidden_key] ?? 0;
    next_hidden[hidden_key] = clamp_value(next_hidden[hidden_key] + raw_delta);
  });

  return { ...state, stats: next_stats, hidden: next_hidden };
}

/**
 * Returns actions that can be selected in the current period.
 */
export function get_available_actions(state: GameState): PlayerAction[] {
  return player_actions.filter((action) => action.periods.includes(state.current_period));
}

/**
 * Selects an action, updates the game state, and advances the period or day.
 */
export function choose_action(state: GameState, action_id: string): GameState {
  const selected_action = player_actions.find((action) => action.id === action_id);

  if (!selected_action || state.phase !== "playing") {
    return state;
  }

  const score_multiplier = selected_action.tags.includes("study") ? calculate_study_efficiency(state) : 1;
  const changed_state = apply_effects(state, selected_action.effects, score_multiplier);
  const next_state = apply_action_side_effects(changed_state, selected_action);
  const history_entry: ChoiceHistoryEntry = {
    day: state.day,
    period: state.current_period,
    label: selected_action.label,
    narration: selected_action.narration,
    tags: selected_action.tags
  };

  const updated_state: GameState = {
    ...next_state,
    completed_periods: [...next_state.completed_periods, state.current_period],
    choice_history: [...next_state.choice_history, history_entry],
    recent_tags: [...selected_action.tags, ...next_state.recent_tags].slice(0, 8),
    current_scene: selected_action.scene,
    message: selected_action.narration
  };

  return advance_period_or_day(updated_state);
}

/**
 * Resolves the current story event choice and continues the day transition.
 */
export function resolve_event_choice(state: GameState, choice_id: string): GameState {
  const current_event = story_events.find((event_item) => event_item.id === state.current_event_id);
  const selected_choice = current_event?.choices.find((choice) => choice.id === choice_id);

  if (!current_event || !selected_choice || state.phase !== "event") {
    return state;
  }

  const changed_state = apply_effects(state, selected_choice.effects, 1);
  const history_entry: ChoiceHistoryEntry = {
    day: state.day,
    period: "event",
    label: selected_choice.label,
    narration: selected_choice.after_text,
    tags: []
  };

  const next_state: GameState = {
    ...changed_state,
    phase: "playing",
    current_event_id: undefined,
    triggered_event_ids: [...changed_state.triggered_event_ids, current_event.id],
    choice_history: [...changed_state.choice_history, history_entry],
    current_scene: current_event.scene,
    message: selected_choice.after_text
  };

  return move_to_next_day_or_ending(next_state);
}

/**
 * Acknowledges the current exam result and advances to the next day or ending.
 */
export function acknowledge_exam(state: GameState): GameState {
  if (state.phase !== "exam" || !state.current_exam) {
    return state;
  }

  const changed_state = apply_effects(state, state.current_exam.effects, 1);
  const history_entry: ChoiceHistoryEntry = {
    day: state.day,
    period: "exam",
    label: state.current_exam.name,
    narration: state.current_exam.feedback,
    tags: []
  };

  const next_state: GameState = {
    ...changed_state,
    phase: "playing",
    current_exam: undefined,
    exam_records: [...changed_state.exam_records, state.current_exam],
    choice_history: [...changed_state.choice_history, history_entry],
    current_scene: "classroom",
    message: state.current_exam.feedback
  };

  return move_to_next_day_or_ending(next_state);
}

/**
 * Creates a final ending from the finished game state.
 */
export function determine_ending(state: GameState): EndingResult {
  const score_growth = state.stats.score - state.initial_score;
  const latest_exam_score = state.exam_records[state.exam_records.length - 1]?.score ?? Math.round(state.stats.score * 7.1);
  const balanced_average = (state.stats.energy + state.stats.mindset + state.stats.health) / 3;

  if (state.stats.score >= 80 && (state.stats.mindset <= 38 || state.stats.relations <= 35)) {
    return build_ending(
      "hollow",
      "高分但空心",
      "你抵达了很高的地方，却发现自己一路上把很多声音留在了身后。",
      state,
      latest_exam_score
    );
  }

  if (state.stats.score >= 72 && (state.stats.mindset <= 42 || state.hidden.pressure >= 78)) {
    return build_ending(
      "misfire",
      "发挥失常",
      "你不是没有实力，只是最后几天的心太紧，没能把平时的自己完整带进考场。",
      state,
      latest_exam_score
    );
  }

  if (state.stats.score >= 78 && balanced_average >= 58) {
    return build_ending(
      "ideal",
      "理想发挥",
      "你把努力和呼吸都带到了终点。分数不是奇迹，而是这一段节奏慢慢长出的结果。",
      state,
      latest_exam_score
    );
  }

  if (score_growth >= 20 && state.stats.score >= 58) {
    return build_ending(
      "comeback",
      "压线反转",
      "你没有一路漂亮，但你一路没有停。最后的分数像一盏不算耀眼、却真正属于你的灯。",
      state,
      latest_exam_score
    );
  }

  if (balanced_average >= 58 && state.stats.score >= 55) {
    return build_ending(
      "stable",
      "稳定上岸",
      "你没有把每一天都过成冲刺，却把大多数日子稳稳接住了。",
      state,
      latest_exam_score
    );
  }

  return build_ending(
    "rediscover",
    "重新认识自己",
    "这三十天没有给你一个完美答案，却让你更清楚自己害怕什么、需要什么、还能怎么往前走。",
    state,
    latest_exam_score
  );
}

/**
 * Returns the currently active story event.
 */
export function get_current_event(state: GameState): StoryEvent | undefined {
  return story_events.find((event_item) => event_item.id === state.current_event_id);
}

/**
 * Applies counter effects from action tags and repeated behavior.
 */
function apply_action_side_effects(state: GameState, action: PlayerAction): GameState {
  const next_counters = {
    late_night_days: action.tags.includes("late") ? state.counters.late_night_days + 1 : Math.max(0, state.counters.late_night_days - 1),
    phone_days: action.tags.includes("phone") ? state.counters.phone_days + 1 : Math.max(0, state.counters.phone_days - 1),
    rest_days: action.tags.includes("rest") ? state.counters.rest_days + 1 : Math.max(0, state.counters.rest_days - 1)
  };

  let next_state: GameState = { ...state, counters: next_counters };

  if (next_counters.late_night_days >= 2) {
    next_state = apply_effects(next_state, { stats: { energy: -5, health: -3, mindset: -2 }, hidden: { pressure: 3 } }, 1);
  }

  if (next_counters.phone_days >= 2) {
    next_state = apply_effects(next_state, { stats: { score: -1 }, hidden: { focus: -4, phone_dependency: 3 } }, 1);
  }

  if (next_counters.rest_days >= 2) {
    next_state = apply_effects(next_state, { stats: { energy: 2, mindset: 2 }, hidden: { pressure: -2 } }, 1);
  }

  return next_state;
}

/**
 * Advances to the next period, or resolves the end of the day.
 */
function advance_period_or_day(state: GameState): GameState {
  const next_period = periods.find((period) => !state.completed_periods.includes(period));

  if (next_period) {
    return { ...state, current_period: next_period };
  }

  const settled_state = apply_end_of_day_effects({ ...state, completed_periods: [], current_period: "daytime" });

  if (exam_days.includes(settled_state.day)) {
    return {
      ...settled_state,
      phase: "exam",
      current_exam: create_exam_record(settled_state),
      current_scene: "classroom"
    };
  }

  const possible_event = pick_story_event(settled_state);

  if (possible_event) {
    return {
      ...settled_state,
      phase: "event",
      current_event_id: possible_event.id,
      current_scene: possible_event.scene
    };
  }

  return move_to_next_day_or_ending(settled_state);
}

/**
 * Applies daily recovery and fatigue before events or exams trigger.
 */
function apply_end_of_day_effects(state: GameState): GameState {
  const rest_pressure_delta = state.stats.energy < 35 ? 4 : -1;
  const health_energy_delta = state.stats.health < 40 ? -3 : 1;
  const mindset_pressure_delta = state.stats.mindset < 35 ? 4 : 0;

  return apply_effects(
    state,
    {
      stats: { energy: health_energy_delta },
      hidden: { pressure: rest_pressure_delta + mindset_pressure_delta }
    },
    1
  );
}

/**
 * Advances to tomorrow or closes the run with a final ending.
 */
function move_to_next_day_or_ending(state: GameState): GameState {
  if (state.day >= 30) {
    const final_ending = determine_ending(state);

    return {
      ...state,
      phase: "ending",
      final_ending,
      message: final_ending.body
    };
  }

  return {
    ...state,
    day: state.day + 1,
    current_period: "daytime",
    completed_periods: [],
    current_event_id: undefined,
    current_exam: undefined,
    phase: "playing"
  };
}

/**
 * Picks a matching story event with a light deterministic cadence.
 */
function pick_story_event(state: GameState): StoryEvent | undefined {
  if (state.day % 2 !== 0) {
    return undefined;
  }

  const candidates = story_events.filter((event_item) => {
    return !state.triggered_event_ids.includes(event_item.id) && matches_event_trigger(state, event_item);
  });

  if (candidates.length === 0) {
    return undefined;
  }

  const event_index = (state.day + state.choice_history.length + state.hidden.pressure) % candidates.length;
  return candidates[event_index];
}

/**
 * Checks whether a story event can trigger in the current state.
 */
function matches_event_trigger(state: GameState, event_item: StoryEvent): boolean {
  const trigger = event_item.trigger;

  if (trigger.min_day !== undefined && state.day < trigger.min_day) {
    return false;
  }

  if (trigger.max_day !== undefined && state.day > trigger.max_day) {
    return false;
  }

  if (trigger.required_recent_tag && !state.recent_tags.includes(trigger.required_recent_tag)) {
    return false;
  }

  const min_stats_match = Object.entries(trigger.min_stats ?? {}).every(([stat_key, value]) => {
    return state.stats[stat_key as keyof Stats] >= value;
  });
  const max_stats_match = Object.entries(trigger.max_stats ?? {}).every(([stat_key, value]) => {
    return state.stats[stat_key as keyof Stats] <= value;
  });
  const min_hidden_match = Object.entries(trigger.min_hidden ?? {}).every(([hidden_key, value]) => {
    return state.hidden[hidden_key as keyof HiddenStats] >= value;
  });
  const max_hidden_match = Object.entries(trigger.max_hidden ?? {}).every(([hidden_key, value]) => {
    return state.hidden[hidden_key as keyof HiddenStats] <= value;
  });

  return min_stats_match && max_stats_match && min_hidden_match && max_hidden_match;
}

/**
 * Creates an exam result that reflects score, condition, pressure, and focus.
 */
function create_exam_record(state: GameState): ExamRecord {
  const condition_bonus = state.stats.energy * 0.42 + state.stats.mindset * 0.55 + state.stats.health * 0.35;
  const preparation_score = state.stats.score * 5.95 + state.hidden.focus * 0.62 + state.hidden.resilience * 0.4;
  const pressure_penalty = state.hidden.pressure * 0.75;
  const raw_score = preparation_score + condition_bonus - pressure_penalty + 95;
  const exam_score = Math.max(310, Math.min(690, Math.round(raw_score)));
  const exam_name = state.day === 10 ? "第一次阶段测" : state.day === 20 ? "一模前模拟" : "一模";
  const title = exam_score >= 610 ? "卷面上出现了你熟悉的秩序" : exam_score >= 520 ? "有些题稳住了，有些题还在摇晃" : "你看见了漏洞，也看见了还没结束的路";
  const feedback = build_exam_feedback(state, exam_name, exam_score);
  const pressure_delta = exam_score >= 560 ? -5 : 6;
  const mindset_delta = exam_score >= 560 ? 4 : -4;

  return {
    day: state.day,
    name: exam_name,
    score: exam_score,
    title,
    feedback,
    effects: { stats: { mindset: mindset_delta, energy: -6 }, hidden: { pressure: pressure_delta, resilience: 2 } }
  };
}

/**
 * Builds a restrained narrative summary for each exam.
 */
function build_exam_feedback(state: GameState, exam_name: string, exam_score: number): string {
  if (exam_score >= 610) {
    return `${exam_name}结束后，你没有立刻欢呼。你只是把笔盖扣上，发现那些按时睡觉、认真订正、忍住比较的日子，终于在卷面上留下了痕迹。`;
  }

  if (state.hidden.pressure >= 72) {
    return `${exam_name}里，你会做的题也卡住了几道。不是因为你不够努力，而是心太紧的时候，连熟悉的路也会变窄。`;
  }

  if (state.stats.health <= 42 || state.stats.energy <= 38) {
    return `${exam_name}后半场，你明显感觉脑子转慢了。身体没有背叛你，它只是把这段时间欠下的休息拿回去了一部分。`;
  }

  if (exam_score >= 520) {
    return `${exam_name}不算惊艳，但比你想象中稳。那些细小的整理、提问和停下来喘气，没有白费。`;
  }

  return `${exam_name}的分数有些刺眼。可卷子摊在桌上时，它也把问题摊开了：不是整个人失败，只是有些地方需要被重新照看。`;
}

/**
 * Builds a final ending with a dynamic review paragraph.
 */
function build_ending(id: EndingResult["id"], title: string, subtitle: string, state: GameState, latest_exam_score: number): EndingResult {
  const strongest_stat = find_strongest_stat(state.stats);
  const weakest_stat = find_weakest_stat(state.stats);
  const final_review = `最后一次成绩约为 ${latest_exam_score} 分。回看这三十天，你最用力守住的是${strongest_stat}，最常被忽略的是${weakest_stat}。你做过一些聪明的选择，也做过一些只是为了撑过当晚的选择。它们没有把你变成标准答案，却真实地塑造了这一段路。`;

  return {
    id,
    title,
    subtitle,
    body: subtitle,
    review: final_review
  };
}

/**
 * Finds the highest visible stat name for the final review.
 */
function find_strongest_stat(stats: Stats): string {
  return find_named_stat(stats, "max");
}

/**
 * Finds the lowest visible stat name for the final review.
 */
function find_weakest_stat(stats: Stats): string {
  return find_named_stat(stats, "min");
}

/**
 * Selects a visible stat name by max or min value.
 */
function find_named_stat(stats: Stats, mode: "max" | "min"): string {
  const labels: Record<keyof Stats, string> = {
    score: "成绩",
    energy: "精力",
    mindset: "心态",
    health: "健康",
    relations: "人际",
    family: "家庭关系"
  };
  const selected_key = stat_keys.reduce((current_key, next_key) => {
    const is_better = mode === "max" ? stats[next_key] > stats[current_key] : stats[next_key] < stats[current_key];
    return is_better ? next_key : current_key;
  }, stat_keys[0]);

  return labels[selected_key];
}
