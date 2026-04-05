import * as Haptics from "expo-haptics";
import Constants from "expo-constants";
import { Audio } from "expo-av";
import { Platform, Vibration } from "react-native";

type FeedbackPreferences = {
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};

const TAP_BEEP_BASE64 =
  "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";

class FeedbackServiceImpl {
  private preferences: FeedbackPreferences = {
    soundEnabled: true,
    hapticsEnabled: true,
  };

  private audioReady = false;
  private initPromise: Promise<void> | null = null;
  private lastPlayMs = 0;
  private hapticsAvailable: boolean | null = null;

  private isExpoGo() {
    return (
      Constants.appOwnership === "expo" ||
      Constants.executionEnvironment === "storeClient"
    );
  }

  configure(preferences: Partial<FeedbackPreferences>) {
    this.preferences = { ...this.preferences, ...preferences };
    if (this.preferences.soundEnabled) {
      void this.ensureAudioReady();
    }
  }

  private ensureAudioReady() {
    if (this.audioReady) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
    })
      .then(() => {
        this.audioReady = true;
      })
      .catch(() => {
        this.audioReady = false;
      })
      .finally(() => {
        this.initPromise = null;
      });

    return this.initPromise;
  }

  private async playTapSound() {
    if (!this.preferences.soundEnabled) return;

    const now = Date.now();
    if (now - this.lastPlayMs < 50) return;
    this.lastPlayMs = now;

    await this.ensureAudioReady();
    if (!this.audioReady) return;

    const source = { uri: `data:audio/wav;base64,${TAP_BEEP_BASE64}` };
    const { sound } = await Audio.Sound.createAsync(source, {
      shouldPlay: true,
      volume: 0.24,
    });
    sound.setOnPlaybackStatusUpdate((status) => {
      if ("didJustFinish" in status && status.didJustFinish) {
        void sound.unloadAsync();
      }
    });
  }

  private async ensureHapticsAvailable() {
    if (this.hapticsAvailable !== null) return this.hapticsAvailable;
    try {
      const maybeCheck = (
        Haptics as unknown as { isAvailableAsync?: () => Promise<boolean> }
      ).isAvailableAsync;
      if (typeof maybeCheck === "function") {
        this.hapticsAvailable = await maybeCheck();
      } else {
        this.hapticsAvailable = true;
      }
    } catch {
      this.hapticsAvailable = false;
    }
    return this.hapticsAvailable;
  }

  private isHapticsEngineError(error: unknown) {
    const message =
      error instanceof Error ? error.message : String(error ?? "");
    return /haptics engine is not available|performHapticsAsync|performAndroidHapticsAsync/i.test(
      message,
    );
  }

  private async triggerHaptic(
    kind: "selection" | "success" | "error" | "impact",
    impactStyle: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle
      .Medium,
  ) {
    if (!this.preferences.hapticsEnabled) return;

    if (Platform.OS === "android" && this.isExpoGo()) {
      Vibration.vibrate(kind === "selection" ? 10 : 20);
      return;
    }

    try {
      if (Platform.OS === "android" && this.hapticsAvailable === false) {
        Vibration.vibrate(kind === "selection" ? 10 : 20);
        return;
      }

      const available = await this.ensureHapticsAvailable();
      if (!available) {
        Vibration.vibrate(kind === "selection" ? 10 : 20);
        return;
      }

      if (Platform.OS === "android") {
        Vibration.vibrate(kind === "selection" ? 10 : 20);
        return;
      }

      if (kind === "selection") {
        await Haptics.selectionAsync();
        return;
      }
      if (kind === "success") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
        return;
      }
      if (kind === "error") {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      await Haptics.impactAsync(impactStyle);
    } catch {
      this.hapticsAvailable = false;
      // Final fallback so users still get tactile feedback.
      Vibration.vibrate(kind === "selection" ? 10 : 20);
    }
  }

  async selection() {
    await this.triggerHaptic("selection");
    await this.playTapSound();
  }

  async success() {
    await this.triggerHaptic("success");
    await this.playTapSound();
  }

  async error() {
    await this.triggerHaptic("error");
    await this.playTapSound();
  }

  async impact(
    style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light,
  ) {
    await this.triggerHaptic("impact", style);
    await this.playTapSound();
  }
}

export const FeedbackService = new FeedbackServiceImpl();
