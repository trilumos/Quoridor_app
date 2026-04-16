import React, { useMemo, useRef, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Modal,
  PanResponder,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { AdManager } from "../src/lib/ADManager";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";
import TopBar from "../src/components/TopBar";
import SectionLabel from "../src/components/SectionLabel";
import PrimaryButton from "../src/components/PrimaryButton";

type LocalTimeMode =
  | "unlimited"
  | "preset-90"
  | "preset-120"
  | "preset-150"
  | "custom"
  | null;

const CUSTOM_TIME_MIN_SEC = 30;
const CUSTOM_TIME_MAX_SEC = 300;

export default function PregameLocal() {
  const router = useRouter();
  const { settings, isPremium } = useGameContext();
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [timeMode, setTimeMode] = useState<LocalTimeMode>(null);
  const [customTimeSec, setCustomTimeSec] = useState<number | null>(null);
  const [customTimeDraftSec, setCustomTimeDraftSec] = useState<number | null>(null);
  const [customSliderHeight, setCustomSliderHeight] = useState(0);
  const [customTimeVisible, setCustomTimeVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState<1 | 2 | null>(null);
  const input2Ref = useRef<TextInput>(null);
  const dragStartSecRef = useRef(180);
  const customDraftTimeRef = useRef(180);
  const customCommittedTimeRef = useRef<number | null>(null);
  const customSliderHeightRef = useRef(0);

  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const TIME_PRESETS = [
    { key: "unlimited", label: "UNLIMITED", sec: 0 },
    { key: "preset-90", label: "1.5 MIN", sec: 90 },
    { key: "preset-120", label: "2 MIN", sec: 120 },
    { key: "preset-150", label: "2.5 MIN", sec: 150 },
    { key: "custom", label: "CUSTOM", sec: null },
  ];

  const timeLimitSec = useMemo(() => {
    switch (timeMode) {
      case "unlimited":
        return 0;
      case "preset-90":
        return 90;
      case "preset-120":
        return 120;
      case "preset-150":
        return 150;
      case "custom":
        return customTimeSec;
      default:
        return null;
    }
  }, [customTimeSec, timeMode]);

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const customCommittedTimeSec = Math.min(
    CUSTOM_TIME_MAX_SEC,
    Math.max(CUSTOM_TIME_MIN_SEC, customTimeSec ?? 180),
  );
  const customDraftTimeSec = Math.min(
    CUSTOM_TIME_MAX_SEC,
    Math.max(CUSTOM_TIME_MIN_SEC, customTimeDraftSec ?? customCommittedTimeSec),
  );

  const customCommittedTimeLabel = useMemo(
    () => formatTime(customCommittedTimeSec),
    [customCommittedTimeSec],
  );
  const customDraftTimeLabel = useMemo(
    () => formatTime(customDraftTimeSec),
    [customDraftTimeSec],
  );

  const getTimePresetLabel = (presetKey: LocalTimeMode, presetLabel: string) => {
    if (presetKey !== "custom") return presetLabel;
    return customTimeSec == null ? "CUSTOM" : `CUSTOM ${customCommittedTimeLabel}`;
  };

  const gameParams = {
    mode: "local",
    p1Name: p1Name.trim() || "Player 1",
    p2Name: p2Name.trim() || "Player 2",
    p1Color: theme.player1,
    p2Color: theme.player2,
    localTimeSec: String(timeLimitSec ?? 0),
  };

  const openCustomTimeMode = () => {
    const initialTime = customTimeSec ?? 180;
    customDraftTimeRef.current = initialTime;
    setCustomTimeDraftSec(initialTime);
    setCustomTimeVisible(true);
  };

  const confirmCustomTime = (seconds?: number) => {
    const nextSeconds = Math.min(
      CUSTOM_TIME_MAX_SEC,
      Math.max(CUSTOM_TIME_MIN_SEC, seconds ?? customDraftTimeRef.current ?? 180),
    );
    if (nextSeconds <= 0) {
      Alert.alert("Invalid time", "Enter a custom time greater than 0.");
      return;
    }

    setCustomTimeSec(nextSeconds);
    customCommittedTimeRef.current = nextSeconds;
    setTimeMode("custom");
    setCustomTimeVisible(false);
  };

  // Removed unused variable 'customSliderValue'
  const customDraftSliderValue = customTimeDraftSec ?? customCommittedTimeRef.current ?? customCommittedTimeSec;
  const customThumbTop = useMemo(() => {
    const thumbSize = 24;
    if (!customSliderHeightRef.current) return 0;
    const usableHeight = Math.max(0, customSliderHeightRef.current - thumbSize);
    const ratio =
      (customDraftSliderValue - CUSTOM_TIME_MIN_SEC) /
      (CUSTOM_TIME_MAX_SEC - CUSTOM_TIME_MIN_SEC);
    return Math.min(
      usableHeight,
      Math.max(0, usableHeight - ratio * usableHeight),
    );
  }, [customDraftSliderValue]);

  const customSliderPanResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          dragStartSecRef.current = customDraftTimeRef.current;
        },
        onPanResponderMove: (_event, gestureState) => {
          if (!customSliderHeightRef.current) return;
          const deltaSec =
            (gestureState.dy / customSliderHeightRef.current) *
            (CUSTOM_TIME_MAX_SEC - CUSTOM_TIME_MIN_SEC);
          const nextSec = Math.round(dragStartSecRef.current - deltaSec);
          const clamped = Math.min(
            CUSTOM_TIME_MAX_SEC,
            Math.max(CUSTOM_TIME_MIN_SEC, nextSec),
          );
          customDraftTimeRef.current = clamped;
          setCustomTimeDraftSec(clamped);
        },
        onPanResponderRelease: () => {},
      }),
    [],
  );

  const startGame = () => {
    router.push({
      pathname: "/game",
      params: gameParams,
    } as never);
  };

  

  const handleStart = () => {
  Keyboard.dismiss();

  if (timeMode == null || timeLimitSec == null) {
    return;
  }

  const isUnlimitedOrCustom =
    timeMode === "unlimited" || timeMode === "custom";

  // Unlimited and custom modes require internet (ads can't be skipped)
  if (isUnlimitedOrCustom && !AdManager.isOnline()) {
    Alert.alert(
      "Internet Required",
      "Unlimited and custom time modes require an internet connection.",
      [{ text: "OK" }]
    );
    return;
  }

  // Show ad for unlimited and custom modes
  if (!isPremium && isUnlimitedOrCustom) {
    const shouldShow = AdManager.shouldShowAd({
      event: "LOCAL_GAME_START",
    });
    if (shouldShow) {
      AdManager.showInterstitial(() => {
        startGame();
      });
      return;
    }
  }

  // Timed presets (90s, 120s, 150s): no ad, go straight in
  startGame();
};

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="PASS & PLAY" showBack onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.section}>
              <SectionLabel text="PLAYER NAMES" />
            </View>

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 1 && styles.inputFocused,
                ]}
              >
                {focusedInput === 1 && <View style={styles.pinstripe} />}
                <Text style={styles.inputLabel}>PLAYER 1</Text>
                <TextInput
                  testID="p1-input"
                  style={styles.input}
                  value={p1Name}
                  onChangeText={setP1Name}
                  placeholder="Enter name"
                  placeholderTextColor={theme.textSecondary}
                  onFocus={() => setFocusedInput(1)}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => input2Ref.current?.focus()}
                  maxLength={16}
                />
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 2 && styles.inputFocused,
                ]}
              >
                {focusedInput === 2 && <View style={styles.pinstripe} />}
                <Text style={styles.inputLabel}>PLAYER 2</Text>
                <TextInput
                  ref={input2Ref}
                  testID="p2-input"
                  style={styles.input}
                  value={p2Name}
                  onChangeText={setP2Name}
                  placeholder="Enter name"
                  placeholderTextColor={theme.textSecondary}
                  onFocus={() => setFocusedInput(2)}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  maxLength={16}
                />
              </View>
            </View>

            <View style={styles.sectionSpaced}>
              <SectionLabel text="TIME CONTROL" />
              <View style={styles.timeGroup}>
                <View style={styles.timeRow}>
                  <TouchableOpacity
                    style={[
                      styles.timeChip,
                      styles.timeChipHalf,
                      timeMode === "unlimited" && styles.timeChipActive,
                    ]}
                    onPress={() => setTimeMode("unlimited")}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        timeMode === "unlimited" && styles.timeChipTextActive,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      UNLIMITED
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.timeChip,
                      styles.timeChipHalf,
                      timeMode === "custom" && styles.timeChipActive,
                    ]}
                    onPress={openCustomTimeMode}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        timeMode === "custom" && styles.timeChipTextActive,
                      ]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {getTimePresetLabel("custom", "CUSTOM")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.timeRow}>
                  {TIME_PRESETS.filter((preset) => preset.key !== "unlimited" && preset.key !== "custom").map((preset) => (
                    <TouchableOpacity
                      key={preset.key}
                      style={[
                        styles.timeChip,
                        timeMode === preset.key && styles.timeChipActive,
                      ]}
                      onPress={() => {
                        if (preset.key === "custom") {
                          openCustomTimeMode();
                          return;
                        }

                        setTimeMode(
                          preset.key as Exclude<LocalTimeMode, "custom">,
                        );
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.timeChipText,
                          timeMode === preset.key && styles.timeChipTextActive,
                        ]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {getTimePresetLabel(
                          preset.key as LocalTimeMode,
                          preset.label,
                        )}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <Modal
        visible={customTimeVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setCustomTimeVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>CUSTOM TIME</Text>
            <Text style={styles.modalDescription}>
              Slide to choose any time from 0:30 up to 5:00.
            </Text>
            <View style={styles.customTimeLayout}>
              <View style={styles.customValueRow}>
                <Text style={styles.customValueLabel}>SELECTED TIME</Text>
                <Text style={styles.customValue}>{customDraftTimeLabel}</Text>
              </View>
              <View style={styles.verticalSliderShell}>
                <Text style={styles.sliderMarkTop}>5:00</Text>
                <View
                  style={styles.verticalSliderTrack}
                  onLayout={(event) =>
                    (customSliderHeightRef.current = event.nativeEvent.layout.height,
                    setCustomSliderHeight(event.nativeEvent.layout.height))
                  }
                  {...customSliderPanResponder.panHandlers}
                >
                  <View style={styles.verticalSliderRail} />
                  <View
                    style={[
                      styles.verticalSliderFill,
                      {
                        height: Math.max(
                          0,
                          customSliderHeight - (customThumbTop + 12),
                        ),
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.verticalSliderThumb,
                      { top: customThumbTop },
                    ]}
                  />
                </View>
                <Text style={styles.sliderMarkBottom}>0:30</Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalAction, styles.modalCancel]}
                onPress={() => {
                  customDraftTimeRef.current = customCommittedTimeRef.current ?? customCommittedTimeSec;
                  setCustomTimeDraftSec(customCommittedTimeRef.current ?? customCommittedTimeSec);
                  setCustomTimeVisible(false);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.modalCancelText}>CANCEL</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalAction, styles.modalConfirm]}
                onPress={() => confirmCustomTime(customDraftTimeSec)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalConfirmText}>USE TIME</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.footer}>
        <View style={styles.timeNoteCard}>
          <Text style={styles.timeNoteLabel}>TIME INFO</Text>
          <Text style={styles.timeNote}>
            The time you choose is given separately to each player. It is not
            shared across the whole match, so every player gets their own full
            clock to use during their turns.
          </Text>
        </View>
        <PrimaryButton
          testID="start-local-btn"
          title="START GAME"
          onPress={handleStart}
          disabled={timeMode == null || timeLimitSec == null}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
    },
    inner: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginTop: 24,
      marginBottom: 16,
    },
    inputGroup: {
      gap: 12,
    },
    sectionSpaced: {
      marginTop: 26,
    },
    timeGroup: {
      gap: 8,
      marginTop: 10,
    },
    timeRow: {
      flexDirection: "row",
      gap: 8,
      width: "100%",
    },
    timeChip: {
      flex: 1,
      minWidth: 0,
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.elevated,
    },
    timeChipHalf: {
      flexBasis: 0,
    },
    timeChipActive: {
      borderColor: theme.accent,
      backgroundColor: theme.accentAlpha15,
    },
    timeChipText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    timeChipTextActive: {
      color: theme.accent,
    },
    inputWrapper: {
      backgroundColor: theme.elevated,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      overflow: "hidden",
      position: "relative",
    },
    inputFocused: {
      backgroundColor: theme.elevated,
    },
    pinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.accent,
    },
    inputLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    input: {
      color: theme.textPrimary,
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
      padding: 0,
    },
    footer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 8,
      gap: 10,
    },
    timeNoteCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.borderFocus,
      paddingHorizontal: 14,
      paddingVertical: 12,
      gap: 6,
    },
    timeNoteLabel: {
      color: theme.accent,
      fontSize: 11,
      lineHeight: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1.2,
      textTransform: "uppercase",
    },
    timeNote: {
      color: theme.textPrimary,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      textAlign: "center",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: theme.overlayGlass,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    modalCard: {
      borderRadius: 18,
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      padding: 20,
      gap: 12,
    },
    modalTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    modalDescription: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
    },
    modalInput: {
      display: "none",
    },
    customValueRow: {
      flexDirection: "row",
      alignItems: "baseline",
      justifyContent: "space-between",
      marginTop: 4,
    },
    customValueLabel: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    customValue: {
      color: theme.accent,
      fontSize: 26,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    customTimeLayout: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 18,
      marginTop: 8,
    },
    verticalSliderShell: {
      width: 96,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    verticalSliderTrack: {
      width: 64,
      height: 260,
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
    },
    verticalSliderRail: {
      position: "absolute",
      top: 0,
      bottom: 0,
      left: 27,
      width: 10,
      borderRadius: 999,
      backgroundColor: theme.elevated,
    },
    verticalSliderFill: {
      position: "absolute",
      left: 27,
      width: 10,
      borderRadius: 999,
      backgroundColor: theme.accentAlpha40,
      bottom: 0,
    },
    verticalSliderThumb: {
      position: "absolute",
      left: 20,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: theme.accent,
      borderWidth: 2,
      borderColor: theme.background,
      shadowColor: theme.overlay,
      shadowOpacity: 0.25,
      shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 },
    },
    sliderMarkTop: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
      textAlign: "center",
    },
    sliderMarkBottom: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
      textAlign: "center",
    },
    modalActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 4,
    },
    modalAction: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
    },
    modalCancel: {
      backgroundColor: theme.elevated,
    },
    modalConfirm: {
      backgroundColor: theme.accent,
    },
    modalCancelText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    modalConfirmText: {
      color: theme.background,
      fontSize: 13,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
  });
