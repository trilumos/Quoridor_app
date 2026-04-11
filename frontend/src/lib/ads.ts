import mobileAds, {
  MaxAdContentRating,
  InterstitialAd,
  RewardedAd,
  AdEventType,
  RewardedAdEventType,
} from 'react-native-google-mobile-ads';

const IS_TESTING = true;

export const AD_UNIT_IDS = {
  interstitial: IS_TESTING
    ? 'ca-app-pub-3940256099942544/1033173712'
    : 'ca-app-pub-4447692643301149/5141936641',

  rewarded: IS_TESTING
    ? 'ca-app-pub-3940256099942544/5224354917'
    : 'ca-app-pub-4447692643301149/8262924000',
};

/* ================= INIT ================= */

export async function initializeAds() {
  try {
    await mobileAds().setRequestConfiguration({
      testDeviceIdentifiers: [
        'EMULATOR',
        '83a5188c-6f11-407c-beb5-3c4e5f2bbd95',
      ],
      maxAdContentRating: MaxAdContentRating.PG,
    });

    await mobileAds().initialize();

    // 🔥 Preload ads
    loadInterstitial();
    loadRewarded();

    console.log('AdMob initialized successfully');
  } catch (error) {
    console.log('AdMob init error:', error);
  }
}

/* ================= INTERSTITIAL ================= */

let interstitial: InterstitialAd | null = null;
let isInterstitialLoaded = false;

export function loadInterstitial() {
  interstitial = InterstitialAd.createForAdRequest(
    AD_UNIT_IDS.interstitial
  );

  isInterstitialLoaded = false;

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    console.log("Interstitial loaded");
    isInterstitialLoaded = true;
  });

  interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
    console.log("Interstitial failed to load", error);
    isInterstitialLoaded = false;
  });

  interstitial.load();
}

export function showInterstitial(onClose?: () => void) {

  if (!interstitial) {
    onClose?.();
    return;
  }

  // 🔥 If not ready → reload and skip
  if (!isInterstitialLoaded) {
    console.log("Ad not ready → loading now");
    loadInterstitial();
    onClose?.();
    return;
  }

  const unsubscribe = interstitial.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      unsubscribe();

      // 🔥 Preload next ad
      loadInterstitial();

      onClose?.();
    }
  );

  try {
    interstitial.show();
    isInterstitialLoaded = false;
  } catch (e) {
    console.log("Ad failed, reloading:", e);

    loadInterstitial(); // 🔥 critical fallback

    onClose?.();
  }
}

/* ================= REWARDED ================= */

let rewarded: RewardedAd | null = null;
let isRewardedLoaded = false;

export function loadRewarded() {
  rewarded = RewardedAd.createForAdRequest(
    AD_UNIT_IDS.rewarded
  );

  isRewardedLoaded = false;

  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    console.log("Rewarded loaded");
    isRewardedLoaded = true;
  });

  rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
    console.log("Rewarded failed to load", error);
    isRewardedLoaded = false;
  });

  rewarded.load();
}

export function showRewarded(onComplete?: () => void) {
  if (!rewarded || !isRewardedLoaded) {
    console.log("Rewarded not ready → loading for next time");
    loadRewarded();
    // Give reward anyway if ad not available
    // Better UX than blocking the user
    onComplete?.();
    return;
  }

  const unsubscribeReward = rewarded.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    () => {
      console.log("User earned reward");
      unsubscribeReward();
    }
  );

  const unsubscribeClose = rewarded.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      console.log("Rewarded ad closed");
      unsubscribeClose();
      loadRewarded();
      onComplete?.();
    }
  );

  const unsubscribeError = rewarded.addAdEventListener(
    AdEventType.ERROR,
    (error: any) => {
      console.log("Rewarded show error:", error);
      unsubscribeError();
      loadRewarded();
      onComplete?.();
    }
  );

  try {
    rewarded.show();
    isRewardedLoaded = false;
  } catch (e) {
    console.log("Rewarded show failed:", e);
    loadRewarded();
    onComplete?.();
  }
}