import mobileAds, {
  MaxAdContentRating,
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
    loadInterstitial(); 
    console.log('AdMob initialized successfully');
  } catch (error) {
    console.log('AdMob init error:', error);
  }
}

import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';

let interstitial: InterstitialAd | null = null;
let lastAdTime = 0;

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
  const now = Date.now();

  // ⏱️ Cooldown: 60 seconds
  if (now - lastAdTime < 60000) {
    onClose?.();
    return;
  }

  if (!interstitial) {
    onClose?.(); // fallback if not initialized
    return;
  }

  const unsubscribe = interstitial.addAdEventListener(
    AdEventType.CLOSED,
    () => {
      unsubscribe();
      loadInterstitial(); // preload next ad
      lastAdTime = Date.now(); // 👈 UPDATE TIME HERE
      onClose?.();
    }
  );

  if (!isInterstitialLoaded) {
  console.log("Ad not ready, skipping");
  onClose?.();
  return;
}

try {
  interstitial.show();
  isInterstitialLoaded = false; // reset after showing
} catch (e) {
    console.log("Ad not ready, skipping:", e);
    onClose?.(); // fallback if ad fails
  }
}