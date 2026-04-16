import { showInterstitial, showRewarded } from "./ads";
import NetInfo from "@react-native-community/netinfo";

const TWO_HOURS = 2 * 60 * 60 * 1000;
const MIN_COOLDOWN = 1000;

let lastAdTime = 0;
let aiGameCount = 0;
let _freeUndoUsed = false;
let _freeUndoGameId = "";
let _pendingRewardedUndo = false;
let _isOnline = true;
let _adsDisabled = false; // true when user owns premium_unlock

// Listen to network state changes
NetInfo.addEventListener((state) => {
  _isOnline = state.isConnected === true &&
              state.isInternetReachable !== false;
});

/**
 * Call this with true after a confirmed purchase or ownership check.
 * All ad methods will silently no-op while disabled.
 */
export function setAdsDisabled(disabled: boolean) {
  _adsDisabled = disabled;
}

function canShowAd() {
  const now = Date.now();
  return now - lastAdTime >= MIN_COOLDOWN;
}

function recordAdShown() {
  lastAdTime = Date.now();
}

export const AdManager = {

  isOnline(): boolean {
    return _isOnline;
  },

  resetUndoGate(gameId: string) {
    _freeUndoUsed = false;
    _freeUndoGameId = gameId;
    _pendingRewardedUndo = false;
  },

  restoreUndoGate(gameId: string) {
    _freeUndoUsed = true;
    _freeUndoGameId = gameId;
    _pendingRewardedUndo = false;
  },

  canUndoFree(gameId: string): boolean {
    if (_freeUndoGameId !== gameId) return true;
    return !_freeUndoUsed;
  },

  consumeFreeUndo(gameId: string) {
    _freeUndoUsed = true;
    _freeUndoGameId = gameId;
  },

  showRewardedUndo(onRewarded: () => void) {
    // If premium, just grant the undo for free — no ad
    if (_adsDisabled) {
      onRewarded();
      return;
    }
    if (_pendingRewardedUndo) return;
    _pendingRewardedUndo = true;
    showRewarded(() => {
      _pendingRewardedUndo = false;
      onRewarded();
    });
  },

  shouldShowAd({ event }: { event: string }): boolean {
    // Premium users never see ads
    if (_adsDisabled) return false;

    const now = Date.now();

    const alwaysShowEvents = [
      "GRANDMASTER_START",
      "LOCAL_GAME_START",
      "LOCAL_GAME_END",
    ];

    const neverForceEvents = [
      "AI_GAME_START",
    ];

    if (event === "AI_GAME_START") return false;

    if (!alwaysShowEvents.includes(event)) {
      if (!canShowAd()) return false;
    }

    if (!neverForceEvents.includes(event)) {
      if (now - lastAdTime > TWO_HOURS) return true;
    }

    if (event === "GRANDMASTER_START") return true;
    if (event === "LOCAL_GAME_START") return true;
    if (event === "LOCAL_GAME_END") return true;

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
    // Premium users skip straight to the callback
    if (_adsDisabled) {
      callback?.();
      return;
    }
    showInterstitial(() => {
      recordAdShown();
      if (callback) callback();
    });
  },

  recordEvent(_event: string) {
    // No-op kept for compatibility
  },
};
