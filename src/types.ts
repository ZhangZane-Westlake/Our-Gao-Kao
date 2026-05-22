export type SceneId =
  | "act_01_oath"
  | "act_02_mock_failure"
  | "act_03_review_unlock"
  | "act_04_friend_boundary"
  | "act_05_family_talk"
  | "act_06_progress"
  | "act_07_low_point"
  | "act_08_exam_day"
  | "act_09_admission";

export type SpeakerId = "narrator" | "teacher" | "protagonist" | "deskmate" | "friend_1" | "friend_2" | "mother" | "father" | "courier";

export type ChoiceMode = "single" | "collect_all";

export type StatKey = "mindset" | "pressure" | "strategy" | "stability" | "stamina" | "support" | "confidence" | "growth";

export interface VisualNovelStats {
  mindset: number;
  pressure: number;
  strategy: number;
  stability: number;
  stamina: number;
  support: number;
  confidence: number;
  growth: number;
}

export type StatEffects = Partial<Record<StatKey, number>>;

export interface DialogueLine {
  speaker: SpeakerId;
  text: string;
}

export interface VisualNovelChoice {
  id: string;
  label: string;
  quote: string;
  consequence: string;
  effects: StatEffects;
  unlocks: string[];
  recommended?: boolean;
}

export interface VisualNovelScene {
  id: SceneId;
  act: number;
  title: string;
  subtitle: string;
  days_left: number;
  status_text: string;
  background_key: string;
  character_keys: string[];
  real_text: string[];
  ui_text: string[];
  narration: string;
  dialogue: DialogueLine[];
  choice_prompt: string;
  choice_mode: ChoiceMode;
  next_scene_id?: SceneId;
  choices: VisualNovelChoice[];
}

export interface ChoiceRecord {
  scene_id: SceneId;
  scene_title: string;
  choice_id: string;
  label: string;
  quote: string;
  consequence: string;
  effects: StatEffects;
  unlocked: string[];
}

export interface AssetRequirement {
  key: string;
  type: "scene" | "character" | "prop";
  name: string;
  description: string;
  used_in_scene_ids: SceneId[];
}

export interface VisualNovelEnding {
  title: string;
  subtitle: string;
  body: string;
  final_state: VisualNovelFinalState;
}

export interface VisualNovelFinalState {
  title: string;
  body: string;
}

export interface VisualNovelState {
  save_version: 1;
  current_scene_id: SceneId;
  stats: VisualNovelStats;
  last_effects: StatEffects;
  unlocked_items: string[];
  selected_collectible_choice_ids: string[];
  choice_history: ChoiceRecord[];
  ending?: VisualNovelEnding;
}
