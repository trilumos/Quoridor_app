import { StorageService } from "../storage/StorageService";
import { GameData, GameStats } from "./StatsService";

interface AchievementCondition {
  key: string;
  check: (gameData: GameData, stats: GameStats) => boolean;
}

const ACHIEVEMENT_CONDITIONS: AchievementCondition[] = [
  {
    key: "first_victory",
    check: (_gd, stats) => stats.total_wins >= 1,
  },
  {
    key: "wall_master",
    check: (gd) => gd.walls_placed === 10 && gd.result === "WIN",
  },
  {
    key: "speedrun",
    check: (gd) => gd.moves_made <= 15 && gd.result === "WIN",
  },
  {
    key: "pacifist",
    check: (gd) => gd.walls_placed === 0 && gd.result === "WIN",
  },
  {
    key: "strategist",
    check: (gd) => gd.difficulty === "GRANDMASTER" && gd.result === "WIN",
  },
  {
    key: "dedicated",
    check: (_gd, stats) => stats.total_games >= 25,
  },
  {
    key: "veteran",
    check: (_gd, stats) => stats.total_games >= 100,
  },
];

function achievementsKey(userId: string) {
  return `${StorageService.KEYS.ACHIEVEMENTS}:${userId}`;
}

export const AchievementService = {
  async getUnlocked(userId: string): Promise<string[]> {
    try {
      const unlocked = await StorageService.get<string[]>(
        achievementsKey(userId),
      );
      return unlocked || [];
    } catch {
      return [];
    }
  },

  async checkAndUnlock(
    userId: string,
    gameData: GameData,
    currentStats: GameStats,
  ): Promise<string[]> {
    try {
      const alreadyUnlocked = await this.getUnlocked(userId);
      const newlyUnlocked: string[] = [];

      for (const condition of ACHIEVEMENT_CONDITIONS) {
        if (alreadyUnlocked.includes(condition.key)) continue;
        if (condition.check(gameData, currentStats)) {
          newlyUnlocked.push(condition.key);
        }
      }

      if (newlyUnlocked.length > 0) {
        await StorageService.set(achievementsKey(userId), [
          ...alreadyUnlocked,
          ...newlyUnlocked,
        ]);
      }

      return newlyUnlocked;
    } catch {
      return [];
    }
  },
};
