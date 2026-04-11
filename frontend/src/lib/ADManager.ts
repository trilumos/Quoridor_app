import { showInterstitial } from "./ads";

const TWO_HOURS = 2 * 60 * 60 * 1000;
const MIN_COOLDOWN = 1000; // ✅ reduced to 3 sec

let lastAdTime = 0;
let aiGameCount = 0;

// ---------------- CORE ----------------

function canShowAd() {
  const now = Date.now();
  return now - lastAdTime >= MIN_COOLDOWN;
}

function recordAdShown() {
  lastAdTime = Date.now();
}

// ---------------- PUBLIC API ----------------

export const AdManager = {
  shouldShowAd({ event }: { event: string }) {
    const now = Date.now();

    // ✅ EVENTS THAT IGNORE COOLDOWN
    const bypassCooldownEvents = [
      "GRANDMASTER_START",
      "LOCAL_GAME_START",
      "LOCAL_GAME_END",
    ];

    // 🚫 Apply cooldown ONLY for non-critical events
    if (!bypassCooldownEvents.includes(event)) {
      if (!canShowAd()) return false;
    }

    // 🚨 Force ad after 2 hours
    if (now - lastAdTime > TWO_HOURS) {
      return true;
    }

    // ---------------- START EVENTS ----------------
    if (event === "LOCAL_GAME_START") {
      return true;
    }

    if (event === "GRANDMASTER_START") {
      return true;
    }

    if (event === "AI_GAME_START") {
      return false;
    }

    // ---------------- END EVENTS ----------------
    if (event === "LOCAL_GAME_END") {
      return true;
    }

    if (event === "AI_GAME_END") {
      aiGameCount++;

      if (aiGameCount >= 2) {
        aiGameCount = 0;
        return true;
      }

      return false;
    }

    return false;
  },

  showInterstitial(callback?: () => void) {
    showInterstitial(() => {
      recordAdShown();
      if (callback) callback();
    });
  },

  recordEvent(_event: string) {
    // No-op (kept for compatibility)
  },
};