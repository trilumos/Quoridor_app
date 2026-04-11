import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  APP_DATA_VERSION: "@quoridor_app_data_version",
  AUTH_SESSION: "@quoridor_auth_session",
  PROFILE: "@quoridor_profile",
  STATS: "@quoridor_stats",
  SETTINGS: "@quoridor_settings",
  PREMIUM: "@quoridor_premium",
  SAVED_GAME: "@quoridor_saved_game",
  ACHIEVEMENTS: "@quoridor_achievements",
  AD_COUNTER: "@quoridor_ad_counter",
  GAME_HISTORY: "@quoridor_game_history",
  AI_PERFORMANCE: "@quoridor_ai_performance",
  REWARDED_CONTINUE_STATE: "@quoridor_rewarded_continue_state",
  REWARDED_UNDO_STATE: "@quoridor_rewarded_undo_state",
  UNLIMITED_AD_UNLOCK_USAGE: "@quoridor_unlimited_ad_unlock_usage",
  DAILY_PUZZLE: "@quoridor_daily_puzzle",
  LAST_GAME_EXPORT: "@quoridor_last_game_export",
  USERNAME_PROMPT_SEEN: "@quoridor_username_prompt_seen",
};

const CURRENT_APP_DATA_VERSION = "5";

let bootstrapPromise: Promise<void> | null = null;

async function bootstrapStorage(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const storedVersion = await AsyncStorage.getItem(KEYS.APP_DATA_VERSION);
      if (storedVersion !== CURRENT_APP_DATA_VERSION) {
        await AsyncStorage.multiRemove(
          Object.values(KEYS).filter((key) => key !== KEYS.APP_DATA_VERSION),
        );
        await AsyncStorage.setItem(KEYS.APP_DATA_VERSION, CURRENT_APP_DATA_VERSION);
      }
    })();
  }

  await bootstrapPromise;
}

async function get<T>(key: string): Promise<T | null> {
  try {
    await bootstrapStorage();
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function set(key: string, value: unknown): Promise<void> {
  try {
    await bootstrapStorage();
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn("StorageService.set failed:", key, e);
  }
}

async function clear(key: string): Promise<void> {
  try {
    await bootstrapStorage();
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn("StorageService.clear failed:", key, e);
  }
}

export const StorageService = { get, set, clear, KEYS };
