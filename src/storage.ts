import type { GameState } from "./types";

const storage_key = "our_gao_kao_save_v1";

/**
 * Loads the saved game state from localStorage, if a compatible save exists.
 */
export function load_saved_state(): GameState | null {
  const saved_text = window.localStorage.getItem(storage_key);

  if (!saved_text) {
    return null;
  }

  try {
    return JSON.parse(saved_text) as GameState;
  } catch {
    window.localStorage.removeItem(storage_key);
    return null;
  }
}

/**
 * Saves the current game state to localStorage.
 */
export function save_state(state: GameState): void {
  window.localStorage.setItem(storage_key, JSON.stringify(state));
}

/**
 * Clears the local game save.
 */
export function clear_saved_state(): void {
  window.localStorage.removeItem(storage_key);
}
