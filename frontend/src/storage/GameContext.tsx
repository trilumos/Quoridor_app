import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { StorageService } from "./StorageService";
import { FeedbackService } from "../services/FeedbackService";

export interface GameStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  bestStreak: number;
  totalWallsPlaced: number;
  rating: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  boardMaterial: string;
  darkMode: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  progress: number;
  target: number;
}

const DEFAULT_STATS: GameStats = {
  totalGames: 0,
  totalWins: 0,
  totalLosses: 0,
  currentStreak: 0,
  bestStreak: 0,
  totalWallsPlaced: 0,
  rating: 1200,
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  boardMaterial: "Obsidian Dark",
  darkMode: true,
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_victory",
    name: "First Victory",
    description: "Win your first game",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "wall_master",
    name: "Wall Master",
    description: "Win using all 10 walls",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "speedrun",
    name: "Speedrun",
    description: "Win in under 15 moves",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "pacifist",
    name: "Pacifist",
    description: "Win without placing walls",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "strategist",
    name: "Strategist",
    description: "Beat GRANDMASTER AI",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "puzzle_addict",
    name: "Puzzle Addict",
    description: "Complete 7 daily puzzles",
    unlocked: false,
    progress: 0,
    target: 7,
  },
  {
    id: "dedicated",
    name: "Dedicated",
    description: "Play 25 games",
    unlocked: false,
    progress: 0,
    target: 25,
  },
  {
    id: "veteran",
    name: "Veteran",
    description: "Play 100 games",
    unlocked: false,
    progress: 0,
    target: 100,
  },
];

interface SavedGame {
  data: any;
  mode: string;
  difficulty?: string;
}

interface GameContextType {
  stats: GameStats;
  settings: GameSettings;
  isPremium: boolean;
  achievements: Achievement[];
  savedGame: SavedGame | null;
  gamesCompletedSinceAd: number;
  recentUnlock: Achievement | null;
  loaded: boolean;
  updateStats: (u: Partial<GameStats>) => void;
  updateSettings: (u: Partial<GameSettings>) => void;
  setPremium: (v: boolean) => void;
  recordWin: (wallsUsed?: number, moves?: number, difficulty?: string) => void;
  recordLoss: (wallsPlaced?: number) => void;
  saveGame: (data: any, mode: string, difficulty?: string) => void;
  clearSavedGame: () => void;
  incrementAdCounter: () => void;
  resetAdCounter: () => void;
  shouldShowAd: () => boolean;
  dismissUnlock: () => void;
  recordWallsPlaced: (count: number) => void;
}

const GameContext = createContext<GameContextType>({} as GameContextType);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const persist = useCallback((key: string, value: unknown) => {
    StorageService.set(key, value);
  }, []);

  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isPremium, setIsPremium] = useState(true);
  const [achievements, setAchievements] =
    useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);
  const [adCounter, setAdCounter] = useState(0);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);
  const [loaded, setLoaded] = useState(false);
  // Load from storage on mount
  useEffect(() => {
    (async () => {
      const [s, se, p, a, sg, ac] = await Promise.all([
        StorageService.get<GameStats>(StorageService.KEYS.STATS),
        StorageService.get<GameSettings>(StorageService.KEYS.SETTINGS),
        StorageService.get<boolean>(StorageService.KEYS.PREMIUM),
        StorageService.get<Achievement[]>(StorageService.KEYS.ACHIEVEMENTS),
        StorageService.get<SavedGame>(StorageService.KEYS.SAVED_GAME),
        StorageService.get<number>(StorageService.KEYS.AD_COUNTER),
      ]);
      if (s) setStats(s);
      if (se) {
        const maybeLegacy = se as GameSettings & {
          highContrast?: boolean;
          darkMode?: boolean;
        };
        const normalized: GameSettings = {
          ...DEFAULT_SETTINGS,
          ...maybeLegacy,
          darkMode:
            typeof maybeLegacy.darkMode === "boolean"
              ? maybeLegacy.darkMode
              : true,
        };
        setSettings(normalized);
        persist(StorageService.KEYS.SETTINGS, normalized);
      }
      if (p !== null) setIsPremium(true);
      if (a) setAchievements(a);
      if (sg) setSavedGame(sg);
      if (ac !== null) setAdCounter(ac);
      setLoaded(true);
    })();
  }, [persist]);

  const updateStats = useCallback(
    (u: Partial<GameStats>) => {
      setStats((prev) => {
        const next = { ...prev, ...u };
        persist(StorageService.KEYS.STATS, next);
        return next;
      });
    },
    [persist],
  );

  useEffect(() => {
    FeedbackService.configure({
      soundEnabled: settings.soundEnabled,
      hapticsEnabled: settings.hapticsEnabled,
    });
  }, [settings.soundEnabled, settings.hapticsEnabled]);

  const updateSettings = useCallback(
    (u: Partial<GameSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...u };
        persist(StorageService.KEYS.SETTINGS, next);
        return next;
      });
    },
    [persist],
  );

  const setPremiumState = useCallback(
    (v: boolean) => {
      setIsPremium(true);
      persist(StorageService.KEYS.PREMIUM, true);
    },
    [persist],
  );

  const checkAchievements = useCallback(
    (
      newStats: GameStats,
      wallsUsed?: number,
      moves?: number,
      difficulty?: string,
    ) => {
      setAchievements((prev) => {
        const next = [...prev.map((a) => ({ ...a }))];
        let unlocked: Achievement | null = null;
        const check = (id: string, condition: boolean) => {
          const a = next.find((x) => x.id === id);
          if (a && !a.unlocked && condition) {
            a.unlocked = true;
            a.progress = a.target;
            unlocked = a;
          }
        };
        check("first_victory", newStats.totalWins >= 1);
        check("wall_master", wallsUsed === 10);
        check("speedrun", (moves ?? 99) < 15);
        check("pacifist", wallsUsed === 0);
        check("strategist", difficulty === "hard");
        const ded = next.find((x) => x.id === "dedicated");
        if (ded) {
          ded.progress = Math.min(newStats.totalGames, 25);
          if (ded.progress >= 25) {
            ded.unlocked = true;
            if (!prev.find((x) => x.id === "dedicated")?.unlocked)
              unlocked = ded;
          }
        }
        const vet = next.find((x) => x.id === "veteran");
        if (vet) {
          vet.progress = Math.min(newStats.totalGames, 100);
          if (vet.progress >= 100) {
            vet.unlocked = true;
            if (!prev.find((x) => x.id === "veteran")?.unlocked) unlocked = vet;
          }
        }
        if (unlocked) setRecentUnlock(unlocked);
        persist(StorageService.KEYS.ACHIEVEMENTS, next);
        return next;
      });
    },
    [persist],
  );

  const recordWin = useCallback(
    (wallsUsed: number = 0, moves: number = 0, difficulty?: string) => {
      setStats((prev) => {
        const newStreak = prev.currentStreak + 1;
        const next: GameStats = {
          ...prev,
          totalGames: prev.totalGames + 1,
          totalWins: prev.totalWins + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          totalWallsPlaced: prev.totalWallsPlaced + wallsUsed,
          rating: prev.rating + 12,
        };
        persist(StorageService.KEYS.STATS, next);
        checkAchievements(next, wallsUsed, moves, difficulty);
        return next;
      });
    },
    [persist, checkAchievements],
  );

  const recordLoss = useCallback(
    (wallsPlaced: number = 0) => {
      setStats((prev) => {
        const next: GameStats = {
          ...prev,
          totalGames: prev.totalGames + 1,
          totalLosses: prev.totalLosses + 1,
          currentStreak: 0,
          totalWallsPlaced: prev.totalWallsPlaced + wallsPlaced,
          rating: Math.max(800, prev.rating - 8),
        };
        persist(StorageService.KEYS.STATS, next);
        checkAchievements(next);
        return next;
      });
    },
    [persist, checkAchievements],
  );

  const saveGameState = useCallback(
    (data: any, mode: string, difficulty?: string) => {
      const sg = { data, mode, difficulty };
      setSavedGame(sg);
      persist(StorageService.KEYS.SAVED_GAME, sg);
    },
    [persist],
  );

  const clearSavedGame = useCallback(() => {
    setSavedGame(null);
    StorageService.clear(StorageService.KEYS.SAVED_GAME);
  }, []);

  const recordWallsPlaced = useCallback(
    (count: number) => {
      setStats((prev) => {
        const next = {
          ...prev,
          totalWallsPlaced: prev.totalWallsPlaced + count,
        };
        persist(StorageService.KEYS.STATS, next);
        return next;
      });
    },
    [persist],
  );

  const incrementAdCounter = useCallback(() => {
    setAdCounter((prev) => {
      const next = prev + 1;
      persist(StorageService.KEYS.AD_COUNTER, next);
      return next;
    });
  }, [persist]);

  const resetAdCounter = useCallback(() => {
    setAdCounter(0);
    persist(StorageService.KEYS.AD_COUNTER, 0);
  }, [persist]);

  const shouldShowAd = useCallback(() => {
    return !isPremium && adCounter >= 2;
  }, [isPremium, adCounter]);

  const dismissUnlock = useCallback(() => setRecentUnlock(null), []);

  return (
    <GameContext.Provider
      value={{
        stats,
        settings,
        isPremium,
        achievements,
        savedGame,
        gamesCompletedSinceAd: adCounter,
        recentUnlock,
        loaded,
        updateStats,
        updateSettings,
        setPremium: setPremiumState,
        recordWin,
        recordLoss,
        saveGame: saveGameState,
        clearSavedGame,
        incrementAdCounter,
        resetAdCounter,
        shouldShowAd,
        dismissUnlock,
        recordWallsPlaced,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGameContext = () => useContext(GameContext);
