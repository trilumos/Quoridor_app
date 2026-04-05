import { StorageService } from "../storage/StorageService";

export interface SavedGame {
  user_id: string;
  game_state: Record<string, any>;
  mode: string;
  difficulty: string | null;
  saved_at: string;
}

function saveKey(userId: string) {
  return `${StorageService.KEYS.SAVED_GAME}:${userId}`;
}

export const GameSaveService = {
  async saveGame(
    userId: string,
    gameState: Record<string, any>,
    mode: string,
    difficulty: string | null,
  ): Promise<boolean> {
    try {
      const savedGame: SavedGame = {
        user_id: userId,
        game_state: gameState,
        mode,
        difficulty,
        saved_at: new Date().toISOString(),
      };
      await StorageService.set(saveKey(userId), savedGame);
      return true;
    } catch {
      return false;
    }
  },

  async loadSavedGame(userId: string): Promise<SavedGame | null> {
    try {
      return (await StorageService.get<SavedGame>(saveKey(userId))) || null;
    } catch {
      return null;
    }
  },

  async deleteSavedGame(userId: string): Promise<boolean> {
    try {
      await StorageService.clear(saveKey(userId));
      return true;
    } catch {
      return false;
    }
  },
};
