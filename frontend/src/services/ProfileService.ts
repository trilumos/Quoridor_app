import { StorageService } from "../storage/StorageService";

export interface Profile {
  user_id: string;
  username: string;
  avatar_url: string | null;
  is_premium: boolean;
  premium_tier: "lifetime" | null;
  premium_expires_at: null;
  created_at: string;
}

function profileKey(userId: string) {
  return `${StorageService.KEYS.PROFILE}:${userId}`;
}

function createDefaultProfile(userId: string): Profile {
  return {
    user_id: userId,
    username: "",
    avatar_url: null,
    is_premium: false,
    premium_tier: null,
    premium_expires_at: null,
    created_at: new Date().toISOString(),
  };
}

export const ProfileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      const stored = await StorageService.get<Profile>(profileKey(userId));
      if (stored) return stored;
      const profile = createDefaultProfile(userId);
      await StorageService.set(profileKey(userId), profile);
      return profile;
    } catch {
      return null;
    }
  },

  async updateUsername(userId: string, username: string): Promise<boolean> {
    try {
      const current = await this.getProfile(userId);
      const next = current
        ? { ...current, username }
        : { ...createDefaultProfile(userId), username };
      await StorageService.set(profileKey(userId), next);
      return true;
    } catch {
      return false;
    }
  },

  async updateAvatar(userId: string, avatarUrl: string): Promise<boolean> {
    try {
      const current = await this.getProfile(userId);
      const next = current
        ? { ...current, avatar_url: avatarUrl }
        : { ...createDefaultProfile(userId), avatar_url: avatarUrl };
      await StorageService.set(profileKey(userId), next);
      return true;
    } catch {
      return false;
    }
  },

  async isPremium(userId: string): Promise<boolean> {
    try {
      const profile = await this.getProfile(userId);
      return !!profile?.is_premium;
    } catch {
      return false;
    }
  },

  async activatePremium(userId: string): Promise<boolean> {
    try {
      const current = await this.getProfile(userId);
      const next = current
        ? {
            ...current,
            is_premium: true,
            premium_tier: "lifetime" as const,
            premium_expires_at: null,
          }
        : {
            ...createDefaultProfile(userId),
            is_premium: true,
            premium_tier: "lifetime" as const,
            premium_expires_at: null,
          };
      await StorageService.set(profileKey(userId), next);
      return true;
    } catch {
      return false;
    }
  },

  async deactivatePremium(userId: string): Promise<boolean> {
    try {
      const current = await this.getProfile(userId);
      const next = current
        ? {
            ...current,
            is_premium: false,
            premium_tier: null,
            premium_expires_at: null,
          }
        : createDefaultProfile(userId);
      await StorageService.set(profileKey(userId), next);
      return true;
    } catch {
      return false;
    }
  },
};