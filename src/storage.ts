import type { VisualNovelState } from "./types";

const storage_key = "our_gao_kao_visual_novel_save_v1";

/**
 * Loads the saved visual novel state from localStorage.
 */
export function load_saved_state(): VisualNovelState | null {
  const saved_text = window.localStorage.getItem(storage_key);

  if (!saved_text) {
    return null;
  }

  try {
    const parsed_state = JSON.parse(saved_text) as Partial<VisualNovelState>;

    if (parsed_state.save_version !== 1 || !parsed_state.current_scene_id || !parsed_state.stats) {
      window.localStorage.removeItem(storage_key);
      return null;
    }

    return parsed_state as VisualNovelState;
  } catch {
    window.localStorage.removeItem(storage_key);
    return null;
  }
}

/**
 * Saves the current visual novel state to localStorage.
 */
export function save_state(state: VisualNovelState): void {
  window.localStorage.setItem(storage_key, JSON.stringify(state));
}

/**
 * Clears the local visual novel save.
 */
export function clear_saved_state(): void {
  window.localStorage.removeItem(storage_key);
}
