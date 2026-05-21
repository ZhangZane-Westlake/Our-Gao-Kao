export type Period = "daytime" | "evening" | "night";

export type SceneId = "classroom" | "bedroom" | "track" | "office" | "home" | "canteen";

export type GamePhase = "playing" | "event" | "exam" | "ending";

export type ActionTag =
  | "study"
  | "rest"
  | "social"
  | "family"
  | "phone"
  | "late"
  | "exercise"
  | "reflection";

export type EndingId =
  | "ideal"
  | "stable"
  | "comeback"
  | "misfire"
  | "hollow"
  | "rediscover";

export interface Stats {
  score: number;
  energy: number;
  mindset: number;
  health: number;
  relations: number;
  family: number;
}

export interface HiddenStats {
  focus: number;
  pressure: number;
  phone_dependency: number;
  resilience: number;
}

export interface Effects {
  stats?: Partial<Stats>;
  hidden?: Partial<HiddenStats>;
}

export interface GameCounters {
  late_night_days: number;
  phone_days: number;
  rest_days: number;
}

export interface CharacterProfile {
  id: string;
  name: string;
  summary: string;
  opening: string;
  stats: Stats;
  hidden: HiddenStats;
}

export interface PlayerAction {
  id: string;
  label: string;
  description: string;
  periods: Period[];
  scene: SceneId;
  effects: Effects;
  narration: string;
  tags: ActionTag[];
}

export interface EventTrigger {
  min_day?: number;
  max_day?: number;
  min_stats?: Partial<Stats>;
  max_stats?: Partial<Stats>;
  min_hidden?: Partial<HiddenStats>;
  max_hidden?: Partial<HiddenStats>;
  required_recent_tag?: ActionTag;
}

export interface EventChoice {
  id: string;
  label: string;
  effects: Effects;
  after_text: string;
}

export interface StoryEvent {
  id: string;
  title: string;
  body: string;
  scene: SceneId;
  trigger: EventTrigger;
  choices: EventChoice[];
}

export interface ChoiceHistoryEntry {
  day: number;
  period: Period | "event" | "exam";
  label: string;
  narration: string;
  tags: ActionTag[];
}

export interface ExamRecord {
  day: number;
  name: string;
  score: number;
  title: string;
  feedback: string;
  effects: Effects;
}

export interface EndingResult {
  id: EndingId;
  title: string;
  subtitle: string;
  body: string;
  review: string;
}

export interface GameState {
  day: number;
  phase: GamePhase;
  current_period: Period;
  selected_character_id: string;
  initial_score: number;
  stats: Stats;
  hidden: HiddenStats;
  counters: GameCounters;
  completed_periods: Period[];
  triggered_event_ids: string[];
  exam_records: ExamRecord[];
  choice_history: ChoiceHistoryEntry[];
  recent_tags: ActionTag[];
  current_scene: SceneId;
  current_event_id?: string;
  current_exam?: ExamRecord;
  final_ending?: EndingResult;
  message: string;
}
