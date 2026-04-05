import { StorageService } from "../storage/StorageService";

export type AiDifficulty = "EASY" | "MEDIUM" | "HARD";

export interface AiBucketStats {
  total_games: number;
  total_wins: number;
  total_losses: number;
  total_duration_seconds: number;
  total_moves: number;
  fastest_win_seconds: number;
}

export interface AiPerformanceSummary {
  user_id: string;
  overall: AiBucketStats;
  by_difficulty: Record<AiDifficulty, AiBucketStats>;
  created_at: string;
  updated_at: string;
}

export interface GameStats {
  user_id: string;
  total_games: number;
  total_wins: number;
  total_losses: number;
  current_streak: number;
  best_streak: number;
  rating: number;
  total_walls_placed: number;
  avg_moves_per_game: number;
  avg_game_duration: number;
  fastest_win: number;
  created_at: string;
  updated_at: string;
}

export interface GameData {
  difficulty: string;
  result: "WIN" | "LOSS";
  duration_seconds: number;
  moves_made: number;
  walls_placed: number;
  wall_efficiency: number;
  rating_before: number;
  rating_after: number;
  rating_change: number;
}

function statsKey(userId: string) {
  return `${StorageService.KEYS.STATS}:${userId}`;
}

function historyKey(userId: string) {
  return `${StorageService.KEYS.GAME_HISTORY}:${userId}`;
}

function aiPerformanceKey(userId: string) {
  return `${StorageService.KEYS.AI_PERFORMANCE}:${userId}`;
}

function createEmptyBucketStats(): AiBucketStats {
  return {
    total_games: 0,
    total_wins: 0,
    total_losses: 0,
    total_duration_seconds: 0,
    total_moves: 0,
    fastest_win_seconds: 0,
  };
}

function createDefaultAiPerformance(userId: string): AiPerformanceSummary {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    overall: createEmptyBucketStats(),
    by_difficulty: {
      EASY: createEmptyBucketStats(),
      MEDIUM: createEmptyBucketStats(),
      HARD: createEmptyBucketStats(),
    },
    created_at: now,
    updated_at: now,
  };
}

function normalizeDifficulty(difficulty: string): AiDifficulty | null {
  const normalized = difficulty.toUpperCase();
  if (normalized === "EASY" || normalized === "MEDIUM" || normalized === "HARD")
    return normalized;
  return null;
}

function updateBucket(
  bucket: AiBucketStats,
  gameData: GameData,
): AiBucketStats {
  const isWin = gameData.result === "WIN";
  const nextTotalGames = bucket.total_games + 1;
  const nextTotalWins = bucket.total_wins + (isWin ? 1 : 0);
  const nextTotalLosses = bucket.total_losses + (isWin ? 0 : 1);
  const nextTotalDuration =
    bucket.total_duration_seconds + gameData.duration_seconds;
  const nextTotalMoves = bucket.total_moves + gameData.moves_made;
  const nextFastestWin =
    isWin && gameData.duration_seconds > 0
      ? bucket.fastest_win_seconds === 0
        ? gameData.duration_seconds
        : Math.min(bucket.fastest_win_seconds, gameData.duration_seconds)
      : bucket.fastest_win_seconds;

  return {
    total_games: nextTotalGames,
    total_wins: nextTotalWins,
    total_losses: nextTotalLosses,
    total_duration_seconds: nextTotalDuration,
    total_moves: nextTotalMoves,
    fastest_win_seconds: nextFastestWin,
  };
}

function createDefaultStats(userId: string): GameStats {
  const now = new Date().toISOString();
  return {
    user_id: userId,
    total_games: 0,
    total_wins: 0,
    total_losses: 0,
    current_streak: 0,
    best_streak: 0,
    rating: 1200,
    total_walls_placed: 0,
    avg_moves_per_game: 0,
    avg_game_duration: 0,
    fastest_win: 0,
    created_at: now,
    updated_at: now,
  };
}

export const StatsService = {
  async getStats(userId: string): Promise<GameStats | null> {
    try {
      const stored = await StorageService.get<GameStats>(statsKey(userId));
      if (stored) return stored;

      const stats = createDefaultStats(userId);
      await StorageService.set(statsKey(userId), stats);
      return stats;
    } catch {
      return null;
    }
  },

  async getAiPerformance(userId: string): Promise<AiPerformanceSummary | null> {
    try {
      const stored = await StorageService.get<AiPerformanceSummary>(
        aiPerformanceKey(userId),
      );
      if (stored) return stored;

      const summary = createDefaultAiPerformance(userId);
      await StorageService.set(aiPerformanceKey(userId), summary);
      return summary;
    } catch {
      return null;
    }
  },

  async recordGameResult(userId: string, gameData: GameData): Promise<boolean> {
    try {
      const history = await StorageService.get<GameData[]>(historyKey(userId));
      const currentHistory = history || [];
      currentHistory.unshift(gameData);
      await StorageService.set(
        historyKey(userId),
        currentHistory.slice(0, 100),
      );

      const current = await this.getStats(userId);
      if (!current) return false;

      const difficulty = normalizeDifficulty(gameData.difficulty);
      if (difficulty) {
        const performance = await this.getAiPerformance(userId);
        if (performance) {
          const nextOverall = updateBucket(performance.overall, gameData);
          const nextDifficulty = updateBucket(
            performance.by_difficulty[difficulty],
            gameData,
          );

          await StorageService.set(aiPerformanceKey(userId), {
            ...performance,
            overall: nextOverall,
            by_difficulty: {
              ...performance.by_difficulty,
              [difficulty]: nextDifficulty,
            },
            updated_at: new Date().toISOString(),
          });
        }
      }

      // 3. Calculate updated stats
      const isWin = gameData.result === "WIN";
      const newTotalGames = current.total_games + 1;
      const newTotalWins = current.total_wins + (isWin ? 1 : 0);
      const newTotalLosses = current.total_losses + (isWin ? 0 : 1);
      const newCurrentStreak = isWin ? current.current_streak + 1 : 0;
      const newBestStreak = Math.max(current.best_streak, newCurrentStreak);
      const newTotalWalls = current.total_walls_placed + gameData.walls_placed;
      const newAvgMoves =
        (current.avg_moves_per_game * current.total_games +
          gameData.moves_made) /
        newTotalGames;
      const newAvgDuration =
        (current.avg_game_duration * current.total_games +
          gameData.duration_seconds) /
        newTotalGames;
      const newFastestWin =
        isWin && gameData.duration_seconds > 0
          ? current.fastest_win === 0
            ? gameData.duration_seconds
            : Math.min(current.fastest_win, gameData.duration_seconds)
          : current.fastest_win;

      const nextStats: GameStats = {
        ...current,
        total_games: newTotalGames,
        total_wins: newTotalWins,
        total_losses: newTotalLosses,
        current_streak: newCurrentStreak,
        best_streak: newBestStreak,
        rating: gameData.rating_after,
        total_walls_placed: newTotalWalls,
        avg_moves_per_game: Math.round(newAvgMoves * 10) / 10,
        avg_game_duration: Math.round(newAvgDuration),
        fastest_win: newFastestWin,
        updated_at: new Date().toISOString(),
      };

      await StorageService.set(statsKey(userId), nextStats);

      return true;
    } catch {
      return false;
    }
  },
};
