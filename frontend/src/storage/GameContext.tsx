import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { StorageService } from "./StorageService";
import { FeedbackService } from "../services/FeedbackService";
import {
  DEFAULT_THEME_NAME,
  isThemeName,
  type ThemeName,
} from "../theme/colors";

export interface GameStats {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  currentStreak: number;
  bestStreak: number;
  totalWallsPlaced: number;
  rating: number;
  grandmasterStreak: number;
  aiDifficultiesBeaten: string[];
  passAndPlayGames: number;
  passAndPlayWins: number;
  puzzlesCompleted: number;
  puzzleStreak: number;
  undosUsedThisGame: number;
  lastGameTimestamp: number;
}

export interface GameSettings {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  boardMaterial: string;
  darkMode: boolean;
  themeName: ThemeName;
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
  grandmasterStreak: 0,
  aiDifficultiesBeaten: [],
  passAndPlayGames: 0,
  passAndPlayWins: 0,
  puzzlesCompleted: 0,
  puzzleStreak: 0,
  undosUsedThisGame: 0,
  lastGameTimestamp: 0,
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  hapticsEnabled: true,
  boardMaterial: "Obsidian Dark",
  darkMode: true,
  themeName: DEFAULT_THEME_NAME,
};

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  // VICTORY
  {
    id: "first_victory",
    name: "First Blood",
    description: "Win your first game",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "win_streak_3",
    name: "On Fire",
    description: "Win 3 games in a row",
    unlocked: false,
    progress: 0,
    target: 3,
  },
  {
    id: "win_streak_5",
    name: "Unstoppable",
    description: "Win 5 games in a row",
    unlocked: false,
    progress: 0,
    target: 5,
  },
  {
    id: "win_streak_10",
    name: "Legendary",
    description: "Win 10 games in a row",
    unlocked: false,
    progress: 0,
    target: 10,
  },
  {
    id: "comeback_king",
    name: "Comeback King",
    description: "Win when opponent is 1 move from goal",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  // WALLS
  {
    id: "pacifist",
    name: "Pacifist",
    description: "Win without placing any walls",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "wall_master",
    name: "Wall Master",
    description: "Win using all 10 of your walls",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "architect",
    name: "The Architect",
    description: "Place 100 walls across all games",
    unlocked: false,
    progress: 0,
    target: 100,
  },
  {
    id: "great_wall",
    name: "Great Wall",
    description: "Place 500 walls across all games",
    unlocked: false,
    progress: 0,
    target: 500,
  },
  // SPEED
  {
    id: "speedrun",
    name: "Speedrun",
    description: "Win in 15 moves or fewer",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "blitz",
    name: "Blitz",
    description: "Win in 10 moves or fewer",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "slow_burn",
    name: "Chess Master",
    description: "Win a game lasting 60 or more moves",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  // AI
  {
    id: "beat_novice",
    name: "Baby Steps",
    description: "Beat Novice AI",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "beat_strategic",
    name: "Strategist",
    description: "Beat Strategic AI",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "beat_grandmaster",
    name: "Grandmaster Slayer",
    description: "Beat Grandmaster AI",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "grandmaster_streak",
    name: "Machine Breaker",
    description: "Beat Grandmaster AI 3 times in a row",
    unlocked: false,
    progress: 0,
    target: 3,
  },
  {
    id: "beat_all_difficulties",
    name: "Completionist",
    description: "Beat all 3 AI difficulties",
    unlocked: false,
    progress: 0,
    target: 3,
  },
  // PROGRESSION
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
  {
    id: "centurion",
    name: "Centurion",
    description: "Play 200 games",
    unlocked: false,
    progress: 0,
    target: 200,
  },
  {
    id: "win_25",
    name: "Rising Star",
    description: "Win 25 games",
    unlocked: false,
    progress: 0,
    target: 25,
  },
  {
    id: "win_50",
    name: "Elite",
    description: "Win 50 games",
    unlocked: false,
    progress: 0,
    target: 50,
  },
  {
    id: "win_100",
    name: "Legend",
    description: "Win 100 games",
    unlocked: false,
    progress: 0,
    target: 100,
  },
  // PASS AND PLAY
  {
    id: "social_player",
    name: "Social Player",
    description: "Play 5 Pass & Play games",
    unlocked: false,
    progress: 0,
    target: 5,
  },
  {
    id: "local_legend",
    name: "Local Legend",
    description: "Win 10 Pass & Play games",
    unlocked: false,
    progress: 0,
    target: 10,
  },
  // PUZZLE
  {
    id: "puzzle_first",
    name: "Problem Solver",
    description: "Complete your first daily puzzle",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "puzzle_streak_3",
    name: "Puzzle Addict",
    description: "Complete 3 daily puzzles in a row",
    unlocked: false,
    progress: 0,
    target: 3,
  },
  {
    id: "puzzle_streak_7",
    name: "Puzzle Master",
    description: "Complete 7 daily puzzles in a row",
    unlocked: false,
    progress: 0,
    target: 7,
  },
  {
    id: "puzzle_10",
    name: "Puzzle Hunter",
    description: "Complete 10 total puzzles",
    unlocked: false,
    progress: 0,
    target: 10,
  },
  // SPECIAL
  {
    id: "no_jumping",
    name: "Ground Walker",
    description: "Win without ever jumping over the opponent",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "night_owl",
    name: "Night Owl",
    description: "Play a game between midnight and 4am",
    unlocked: false,
    progress: 0,
    target: 1,
  },
  {
    id: "early_bird",
    name: "Early Bird",
    description: "Play a game before 6am",
    unlocked: false,
    progress: 0,
    target: 1,
  },
];

interface SavedGame {
  data: any;
  mode: string;
  difficulty?: string;
}

type AchievementToastTarget = "home" | "result";

function getAchievementToastTarget(id: string): AchievementToastTarget {
  return id === "dedicated" || id === "veteran" || id === "puzzle_addict"
    ? "home"
    : "result";
}

function syncAchievementsWithStats(
  achievements: Achievement[],
  stats: GameStats,
): Achievement[] {
  const next = achievements.map((achievement) => ({ ...achievement }));

  const check = (id: string, condition: boolean) => {
    const achievement = next.find((item) => item.id === id);
    if (achievement && condition) {
      achievement.unlocked = true;
      achievement.progress = achievement.target;
    }
  };

  const updateProgress = (
    id: string,
    progress: number,
    condition: boolean,
  ) => {
    const achievement = next.find((item) => item.id === id);
    if (achievement) {
      achievement.progress = Math.min(progress, achievement.target);
      if (condition) {
        achievement.unlocked = true;
      }
    }
  };

  check("first_victory", stats.totalWins >= 1);
  updateProgress("win_streak_3", stats.currentStreak, stats.currentStreak >= 3);
  updateProgress("win_streak_5", stats.currentStreak, stats.currentStreak >= 5);
  updateProgress("win_streak_10", stats.currentStreak, stats.currentStreak >= 10);

  updateProgress("architect", stats.totalWallsPlaced, stats.totalWallsPlaced >= 100);
  updateProgress("great_wall", stats.totalWallsPlaced, stats.totalWallsPlaced >= 500);

  updateProgress("dedicated", stats.totalGames, stats.totalGames >= 25);
  updateProgress("veteran", stats.totalGames, stats.totalGames >= 100);
  updateProgress("centurion", stats.totalGames, stats.totalGames >= 200);
  updateProgress("win_25", stats.totalWins, stats.totalWins >= 25);
  updateProgress("win_50", stats.totalWins, stats.totalWins >= 50);
  updateProgress("win_100", stats.totalWins, stats.totalWins >= 100);

  updateProgress(
    "grandmaster_streak",
    stats.grandmasterStreak,
    stats.grandmasterStreak >= 3,
  );
  updateProgress(
    "beat_all_difficulties",
    stats.aiDifficultiesBeaten.length,
    stats.aiDifficultiesBeaten.length >= 3,
  );
  check("beat_novice", stats.aiDifficultiesBeaten.includes("novice"));
  check("beat_strategic", stats.aiDifficultiesBeaten.includes("strategic"));
  check("beat_grandmaster", stats.aiDifficultiesBeaten.includes("grandmaster"));

  updateProgress(
    "social_player",
    stats.passAndPlayGames,
    stats.passAndPlayGames >= 5,
  );
  updateProgress(
    "local_legend",
    stats.passAndPlayWins,
    stats.passAndPlayWins >= 10,
  );

  updateProgress(
    "puzzle_first",
    stats.puzzlesCompleted,
    stats.puzzlesCompleted >= 1,
  );
  updateProgress(
    "puzzle_streak_3",
    stats.puzzleStreak,
    stats.puzzleStreak >= 3,
  );
  updateProgress(
    "puzzle_streak_7",
    stats.puzzleStreak,
    stats.puzzleStreak >= 7,
  );
  updateProgress("puzzle_10", stats.puzzlesCompleted, stats.puzzlesCompleted >= 10);

  return next;
}

interface GameContextType {
  stats: GameStats;
  settings: GameSettings;
  isPremium: boolean;
  achievements: Achievement[];
  savedGame: SavedGame | null;
  gamesCompletedSinceAd: number;
  recentUnlock: Achievement | null;
  homeAchievementQueue: string[];
  resultAchievementQueue: string[];
  loaded: boolean;
  updateStats: (u: Partial<GameStats>) => void;
  updateSettings: (u: Partial<GameSettings>) => void;
  setPremium: (v: boolean) => void;
  recordWin: (
    wallsUsed?: number,
    moves?: number,
    difficulty?: string,
    isPassAndPlay?: boolean,
    opponentWasOneStepFromGoal?: boolean,
    didJump?: boolean,
  ) => void;
  recordLoss: (wallsPlaced?: number, isPassAndPlay?: boolean) => void;
  saveGame: (data: any, mode: string, difficulty?: string) => void;
  clearSavedGame: () => void;
  incrementAdCounter: () => void;
  resetAdCounter: () => void;
  shouldShowAd: () => boolean;
  dismissUnlock: () => void;
  queueAchievementUnlocks: (achievementIds: string[]) => void;
  clearAchievementQueue: (target: AchievementToastTarget) => void;
  recordWallsPlaced: (count: number) => void;
  recordPuzzleComplete: () => void;
  recordPuzzleStreak: (streak: number) => void;
  canUseUndo: () => boolean;
  useUndo: () => void;
  resetUndoCount: () => void;
  recordGameTimestamp: () => void;
  hasPlayedInLast24Hours: () => boolean;
}

const GameContext = createContext<GameContextType>({} as GameContextType);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const persist = useCallback((key: string, value: unknown) => {
    StorageService.set(key, value);
  }, []);

  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [isPremium, setIsPremium] = useState(false);
  const [achievements, setAchievements] =
    useState<Achievement[]>(DEFAULT_ACHIEVEMENTS);
  const [savedGame, setSavedGame] = useState<SavedGame | null>(null);
  const [adCounter, setAdCounter] = useState(0);
  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);
  const [homeAchievementQueue, setHomeAchievementQueue] = useState<string[]>([]);
  const [resultAchievementQueue, setResultAchievementQueue] = useState<string[]>([]);
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
      if (s) {
        const normalizedStats: GameStats = {
          ...DEFAULT_STATS,
          ...s,
        };
        setStats(normalizedStats);
        persist(StorageService.KEYS.STATS, normalizedStats);
      }
      if (se) {
        const maybeLegacy = se as GameSettings & {
          highContrast?: boolean;
          darkMode?: boolean;
          themeName?: string;
        };
        const normalized: GameSettings = {
          ...DEFAULT_SETTINGS,
          ...maybeLegacy,
          darkMode:
            typeof maybeLegacy.darkMode === "boolean"
              ? maybeLegacy.darkMode
              : true,
          themeName: isThemeName(maybeLegacy.themeName ?? "")
            ? maybeLegacy.themeName
            : DEFAULT_THEME_NAME,
        };
        setSettings(normalized);
        persist(StorageService.KEYS.SETTINGS, normalized);
      }
      if (p !== null) setIsPremium(!!p);
      if (a) {
        const mergedAchievements = DEFAULT_ACHIEVEMENTS.map((defaultAchievement) => {
          const storedAchievement = a.find((item) => item.id === defaultAchievement.id);
          if (!storedAchievement) return defaultAchievement;

          return {
            ...defaultAchievement,
            unlocked: storedAchievement.unlocked,
            progress: Math.min(storedAchievement.progress, defaultAchievement.target),
          };
        });

        const normalizedStats = s ? { ...DEFAULT_STATS, ...s } : DEFAULT_STATS;
        const hydratedAchievements = syncAchievementsWithStats(
          mergedAchievements,
          normalizedStats,
        );

        setAchievements(hydratedAchievements);
        persist(StorageService.KEYS.ACHIEVEMENTS, hydratedAchievements);
      }
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
      setIsPremium(v);
      persist(StorageService.KEYS.PREMIUM, v);
    },
    [persist],
  );

  const queueAchievementUnlocks = useCallback((achievementIds: string[]) => {
    const uniqueIds = [...new Set(achievementIds)];
    if (uniqueIds.length === 0) return;

    const homeQueue: string[] = [];
    const resultQueue: string[] = [];

    for (const id of uniqueIds) {
      if (getAchievementToastTarget(id) === "home") {
        homeQueue.push(id);
      } else {
        resultQueue.push(id);
      }
    }

    if (homeQueue.length > 0) {
      setHomeAchievementQueue((prev) => {
        const next = [...prev];
        for (const id of homeQueue) {
          if (!next.includes(id)) next.push(id);
        }
        return next;
      });
    }

    if (resultQueue.length > 0) {
      setResultAchievementQueue((prev) => {
        const next = [...prev];
        for (const id of resultQueue) {
          if (!next.includes(id)) next.push(id);
        }
        return next;
      });
    }
  }, []);

  const checkAchievements = useCallback(
    (
      newStats: GameStats,
      wallsUsed?: number,
      moves?: number,
      difficulty?: string,
      isPassAndPlay: boolean = false,
      opponentWasOneStepFromGoal: boolean = false,
      didJump: boolean = false,
    ) => {
      const hour = new Date().getHours();
      const isWin = newStats.totalWins > (newStats.totalWins - 1);

      setAchievements((prev) => {
        const next = [...prev.map((a) => ({ ...a }))];
        const newlyUnlocked: Achievement[] = [];

        const check = (id: string, condition: boolean) => {
          const a = next.find((x) => x.id === id);
          if (a && !a.unlocked && condition) {
            a.unlocked = true;
            a.progress = a.target;
            newlyUnlocked.push(a);
          }
        };

        const updateProgress = (
          id: string,
          progress: number,
          condition: boolean,
        ) => {
          const a = next.find((x) => x.id === id);
          if (a) {
            a.progress = Math.min(progress, a.target);
            if (!a.unlocked && condition) {
              a.unlocked = true;
              newlyUnlocked.push(a);
            }
          }
        };

        // VICTORY achievements
        check("first_victory", newStats.totalWins >= 1);
        updateProgress(
          "win_streak_3",
          newStats.currentStreak,
          newStats.currentStreak >= 3,
        );
        updateProgress(
          "win_streak_5",
          newStats.currentStreak,
          newStats.currentStreak >= 5,
        );
        updateProgress(
          "win_streak_10",
          newStats.currentStreak,
          newStats.currentStreak >= 10,
        );
        check("comeback_king", opponentWasOneStepFromGoal && isWin);

        // WALL achievements
        check("pacifist", wallsUsed === 0 && isWin);
        check("wall_master", wallsUsed === 10 && isWin);
        updateProgress(
          "architect",
          newStats.totalWallsPlaced,
          newStats.totalWallsPlaced >= 100,
        );
        updateProgress(
          "great_wall",
          newStats.totalWallsPlaced,
          newStats.totalWallsPlaced >= 500,
        );

        // SPEED achievements
        check("speedrun", (moves ?? 99) <= 15 && isWin);
        check("blitz", (moves ?? 99) <= 10 && isWin);
        check("slow_burn", (moves ?? 0) >= 60 && isWin);

        // AI achievements
        check("beat_novice", difficulty === "easy" && isWin);
        check("beat_strategic", difficulty === "medium" && isWin);
        check("beat_grandmaster", difficulty === "hard" && isWin);
        updateProgress(
          "grandmaster_streak",
          newStats.grandmasterStreak,
          newStats.grandmasterStreak >= 3,
        );
        updateProgress(
          "beat_all_difficulties",
          newStats.aiDifficultiesBeaten.length,
          newStats.aiDifficultiesBeaten.length >= 3,
        );

        // PROGRESSION achievements
        updateProgress(
          "dedicated",
          newStats.totalGames,
          newStats.totalGames >= 25,
        );
        updateProgress(
          "veteran",
          newStats.totalGames,
          newStats.totalGames >= 100,
        );
        updateProgress(
          "centurion",
          newStats.totalGames,
          newStats.totalGames >= 200,
        );
        updateProgress("win_25", newStats.totalWins, newStats.totalWins >= 25);
        updateProgress("win_50", newStats.totalWins, newStats.totalWins >= 50);
        updateProgress("win_100", newStats.totalWins, newStats.totalWins >= 100);

        // PASS AND PLAY achievements
        updateProgress(
          "social_player",
          newStats.passAndPlayGames,
          newStats.passAndPlayGames >= 5,
        );
        updateProgress(
          "local_legend",
          newStats.passAndPlayWins,
          newStats.passAndPlayWins >= 10,
        );

        // SPECIAL achievements
        check("no_jumping", !didJump && isWin);
        check("night_owl", hour >= 0 && hour < 4);
        check("early_bird", hour < 6);

        if (newlyUnlocked.length > 0) {
          if (newlyUnlocked.length === 1) {
            setRecentUnlock(newlyUnlocked[0]);
          }
          const ids = newlyUnlocked.map((a) => a.id);
          queueAchievementUnlocks(ids);
        }

        persist(StorageService.KEYS.ACHIEVEMENTS, next);
        return next;
      });
    },
    [persist, queueAchievementUnlocks],
  );

  const canUseUndo = useCallback(() => {
    if (isPremium) return true;
    return stats.undosUsedThisGame < 1;
  }, [stats.undosUsedThisGame, isPremium]);

  const useUndo = useCallback(() => {
    setStats((prev) => {
      const next = {
        ...prev,
        undosUsedThisGame: prev.undosUsedThisGame + 1,
      };
      persist(StorageService.KEYS.STATS, next);
      return next;
    });
  }, [persist]);

  const resetUndoCount = useCallback(() => {
    setStats((prev) => {
      const next = { ...prev, undosUsedThisGame: 0 };
      persist(StorageService.KEYS.STATS, next);
      return next;
    });
  }, [persist]);

  const recordGameTimestamp = useCallback(() => {
    setStats((prev) => {
      const next = { ...prev, lastGameTimestamp: Date.now() };
      persist(StorageService.KEYS.STATS, next);
      return next;
    });
  }, [persist]);

  const hasPlayedInLast24Hours = useCallback(() => {
    if (!stats.lastGameTimestamp) return false;
    const diff = Date.now() - stats.lastGameTimestamp;
    return diff < 2 * 60 * 60 * 1000;
  }, [stats.lastGameTimestamp]);

  const recordWin = useCallback(
    (
      wallsUsed: number = 0,
      moves: number = 0,
      difficulty?: string,
      isPassAndPlay: boolean = false,
      opponentWasOneStepFromGoal: boolean = false,
      didJump: boolean = false,
    ) => {
      resetUndoCount();
      recordGameTimestamp();
      setStats((prev) => {
        const newStreak = prev.currentStreak + 1;
        const newGrandmasterStreak =
          difficulty === "hard" ? prev.grandmasterStreak + 1 : 0;
        const difficultyMap: Record<string, string> = {
          easy: "novice",
          medium: "strategic",
          hard: "grandmaster",
        };
        const mappedDifficulty = difficulty ? difficultyMap[difficulty] : null;
        const newDifficultiesBeaten =
          mappedDifficulty && !prev.aiDifficultiesBeaten.includes(mappedDifficulty)
            ? [...prev.aiDifficultiesBeaten, mappedDifficulty]
            : prev.aiDifficultiesBeaten;
        const next: GameStats = {
          ...prev,
          totalGames: prev.totalGames + 1,
          totalWins: prev.totalWins + 1,
          currentStreak: newStreak,
          bestStreak: Math.max(prev.bestStreak, newStreak),
          totalWallsPlaced: prev.totalWallsPlaced + wallsUsed,
          rating: prev.rating + 12,
          grandmasterStreak: newGrandmasterStreak,
          aiDifficultiesBeaten: newDifficultiesBeaten,
          passAndPlayGames: isPassAndPlay
            ? prev.passAndPlayGames + 1
            : prev.passAndPlayGames,
          passAndPlayWins: isPassAndPlay
            ? prev.passAndPlayWins + 1
            : prev.passAndPlayWins,
        };
        persist(StorageService.KEYS.STATS, next);
        checkAchievements(
          next,
          wallsUsed,
          moves,
          difficulty,
          isPassAndPlay,
          opponentWasOneStepFromGoal,
          didJump,
        );
        return next;
      });
    },
    [persist, checkAchievements, resetUndoCount, recordGameTimestamp],
  );

  const recordLoss = useCallback(
    (
      wallsPlaced: number = 0,
      isPassAndPlay: boolean = false,
    ) => {
      resetUndoCount();
      recordGameTimestamp();
      setStats((prev) => {
        const next: GameStats = {
          ...prev,
          totalGames: prev.totalGames + 1,
          totalLosses: prev.totalLosses + 1,
          currentStreak: 0,
          totalWallsPlaced: prev.totalWallsPlaced + wallsPlaced,
          rating: Math.max(800, prev.rating - 8),
          grandmasterStreak: 0,
          passAndPlayGames: isPassAndPlay
            ? prev.passAndPlayGames + 1
            : prev.passAndPlayGames,
        };
        persist(StorageService.KEYS.STATS, next);
        checkAchievements(next);
        return next;
      });
    },
    [persist, checkAchievements, resetUndoCount, recordGameTimestamp],
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

  const clearAchievementQueue = useCallback((target: AchievementToastTarget) => {
    if (target === "home") {
      setHomeAchievementQueue([]);
      return;
    }

    setResultAchievementQueue([]);
  }, []);

  const recordPuzzleComplete = useCallback(() => {
    setStats((prev) => {
      const next = {
        ...prev,
        puzzlesCompleted: prev.puzzlesCompleted + 1,
      };
      persist(StorageService.KEYS.STATS, next);

      setAchievements((prevAch) => {
        const next2 = [...prevAch.map((a) => ({ ...a }))];
        const newlyUnlocked: Achievement[] = [];

        const check = (id: string, condition: boolean) => {
          const a = next2.find((x) => x.id === id);
          if (a && !a.unlocked && condition) {
            a.unlocked = true;
            a.progress = a.target;
            newlyUnlocked.push(a);
          }
        };

        const updateProgress = (
          id: string,
          progress: number,
          condition: boolean,
        ) => {
          const a = next2.find((x) => x.id === id);
          if (a) {
            a.progress = Math.min(progress, a.target);
            if (!a.unlocked && condition) {
              a.unlocked = true;
              newlyUnlocked.push(a);
            }
          }
        };

        check("puzzle_first", next.puzzlesCompleted >= 1);
        updateProgress(
          "puzzle_10",
          next.puzzlesCompleted,
          next.puzzlesCompleted >= 10,
        );

        if (newlyUnlocked.length > 0) {
          const ids = newlyUnlocked.map((a) => a.id);
          queueAchievementUnlocks(ids);
        }

        persist(StorageService.KEYS.ACHIEVEMENTS, next2);
        return next2;
      });

      return next;
    });
  }, [persist, queueAchievementUnlocks]);

  const recordPuzzleStreak = useCallback(
    (streak: number) => {
      setStats((prev) => {
        const next = {
          ...prev,
          puzzleStreak: streak,
        };
        persist(StorageService.KEYS.STATS, next);

        setAchievements((prevAch) => {
          const next2 = [...prevAch.map((a) => ({ ...a }))];
          const newlyUnlocked: Achievement[] = [];

          const updateProgress = (
            id: string,
            progress: number,
            condition: boolean,
          ) => {
            const a = next2.find((x) => x.id === id);
            if (a) {
              a.progress = Math.min(progress, a.target);
              if (!a.unlocked && condition) {
                a.unlocked = true;
                newlyUnlocked.push(a);
              }
            }
          };

          updateProgress("puzzle_streak_3", streak, streak >= 3);
          updateProgress("puzzle_streak_7", streak, streak >= 7);

          if (newlyUnlocked.length > 0) {
            const ids = newlyUnlocked.map((a) => a.id);
            queueAchievementUnlocks(ids);
          }

          persist(StorageService.KEYS.ACHIEVEMENTS, next2);
          return next2;
        });

        return next;
      });
    },
    [persist, queueAchievementUnlocks],
  );

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
        homeAchievementQueue,
        resultAchievementQueue,
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
        queueAchievementUnlocks,
        clearAchievementQueue,
        recordWallsPlaced,
        recordPuzzleComplete,
        recordPuzzleStreak,
        canUseUndo,
        useUndo,
        resetUndoCount,
        recordGameTimestamp,
        hasPlayedInLast24Hours,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGameContext = () => useContext(GameContext);
