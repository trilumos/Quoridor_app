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
    console.log('AdMob initialized successfully');

    // Preload both ad types after init
    loadInterstitial();
    loadRewarded();

  } catch (error) {
    console.log('AdMob init error:', error);
  }
}

/* ================= INTERSTITIAL ================= */

let interstitial: InterstitialAd | null = null;
let isInterstitialLoaded = false;
let interstitialLoadCallbacks: (() => void)[] = [];

export function loadInterstitial() {
  interstitial = InterstitialAd.createForAdRequest(
    AD_UNIT_IDS.interstitial,
    { requestNonPersonalizedAdsOnly: true }
  );
  isInterstitialLoaded = false;

  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    console.log('Interstitial loaded');
    isInterstitialLoaded = true;
    // Notify anyone waiting for this ad
    const callbacks = [...interstitialLoadCallbacks];
    interstitialLoadCallbacks = [];
    callbacks.forEach(cb => cb());
  });

  interstitial.addAdEventListener(AdEventType.ERROR, (error) => {
    console.log('Interstitial failed to load:', error);
    isInterstitialLoaded = false;
    // Clear waiting callbacks — they will get onClose fallback
    interstitialLoadCallbacks = [];
  });

  interstitial.load();
}

export function showInterstitial(onClose?: () => void) {
  if (!interstitial) {
    console.log('No interstitial instance');
    onClose?.();
    return;
  }

  if (isInterstitialLoaded) {
    // Ad is ready — show immediately
    _showLoadedInterstitial(onClose);
    return;
  }

  // Ad not ready yet — wait up to 6 seconds for it to load
  console.log('Interstitial not ready — waiting for load...');

  let waited = false;
  const timeout = setTimeout(() => {
    waited = true;
    // Remove our callback from waiting list
    interstitialLoadCallbacks = interstitialLoadCallbacks.filter(cb => cb !== onLoad);
    console.log('Interstitial wait timeout — skipping ad');
    loadInterstitial(); // reload for next time
    onClose?.();
  }, 6000);

  const onLoad = () => {
    if (waited) return;
    clearTimeout(timeout);
    _showLoadedInterstitial(onClose);
  };

  interstitialLoadCallbacks.push(onLoad);
}

function _showLoadedInterstitial(onClose?: () => void) {
  if (!interstitial || !isInterstitialLoaded) {
    onClose?.();
    return;
  }

  const unsubscribe = interstitial.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      unsubscribe();
      loadInterstitial(); // preload next
      onClose?.();
    }
  );

  const unsubscribeError = interstitial.addAdEventListener(
    AdEventType.ERROR,
    (error) => {
      console.log('Interstitial show error:', error);
      unsubscribeError();
      loadInterstitial();
      onClose?.();
    }
  );

  try {
    interstitial.show();
    isInterstitialLoaded = false;
  } catch (e) {
    console.log('Interstitial show failed:', e);
    loadInterstitial();
    onClose?.();
  }
}

/* ================= REWARDED ================= */

let rewarded: RewardedAd | null = null;
let isRewardedLoaded = false;
let rewardedLoadCallbacks: (() => void)[] = [];

export function loadRewarded() {
  rewarded = RewardedAd.createForAdRequest(
    AD_UNIT_IDS.rewarded,
    { requestNonPersonalizedAdsOnly: true }
  );
  isRewardedLoaded = false;

  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    console.log('Rewarded loaded');
    isRewardedLoaded = true;
    // Notify anyone waiting
    const callbacks = [...rewardedLoadCallbacks];
    rewardedLoadCallbacks = [];
    callbacks.forEach(cb => cb());
  });

  rewarded.addAdEventListener(AdEventType.ERROR, (error) => {
    console.log('Rewarded failed to load:', error);
    isRewardedLoaded = false;
    rewardedLoadCallbacks = [];
  });

  rewarded.load();
}

export function showRewarded(onComplete?: () => void) {
  if (!rewarded) {
    console.log('No rewarded instance');
    onComplete?.();
    return;
  }

  if (isRewardedLoaded) {
    // Ad is ready — show immediately
    _showLoadedRewarded(onComplete);
    return;
  }

  // Ad not ready yet — wait up to 8 seconds
  console.log('Rewarded not ready — waiting for load...');

  let waited = false;
  const timeout = setTimeout(() => {
    waited = true;
    rewardedLoadCallbacks = rewardedLoadCallbacks.filter(cb => cb !== onLoad);
    console.log('Rewarded wait timeout — skipping ad');
    loadRewarded();
    onComplete?.();
  }, 8000);

  const onLoad = () => {
    if (waited) return;
    clearTimeout(timeout);
    _showLoadedRewarded(onComplete);
  };

  rewardedLoadCallbacks.push(onLoad);
}

function _showLoadedRewarded(onComplete?: () => void) {
  if (!rewarded || !isRewardedLoaded) {
    onComplete?.();
    return;
  }

  const unsubscribeReward = rewarded.addAdEventListener(
    RewardedAdEventType.EARNED_REWARD,
    () => {
      console.log('User earned reward');
      unsubscribeReward();
    }
  );

  const unsubscribeClose = rewarded.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      console.log('Rewarded ad closed');
      unsubscribeClose();
      loadRewarded(); // preload next
      onComplete?.();
    }
  );

  const unsubscribeError = rewarded.addAdEventListener(
    AdEventType.ERROR,
    (error: any) => {
      console.log('Rewarded show error:', error);
      unsubscribeError();
      loadRewarded();
      onComplete?.();
    }
  );

  try {
    rewarded.show();
    isRewardedLoaded = false;
  } catch (e) {
    console.log('Rewarded show failed:', e);
    loadRewarded();
    onComplete?.();
  }
}