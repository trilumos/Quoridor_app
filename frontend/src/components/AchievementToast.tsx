import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { PanResponder, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { getThemeColors } from "../theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useGameContext } from "../storage/GameContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

const ACHIEVEMENT_NAMES: Record<string, string> = {
  first_victory: "FIRST VICTORY",
  wall_master: "WALL MASTER",
  speedrun: "SPEEDRUN",
  pacifist: "PACIFIST",
  strategist: "STRATEGIST",
  dedicated: "DEDICATED",
  veteran: "VETERAN",
};

const ACHIEVEMENT_DESCRIPTIONS: Record<string, string> = {
  first_victory: "Win your first game.",
  wall_master: "Win using all 10 walls.",
  speedrun: "Win in under 15 moves.",
  pacifist: "Win without placing walls.",
  strategist: "Beat GRANDMASTER AI.",
  dedicated: "Play 25 games.",
  veteran: "Play 100 games.",
};

const EASING = Easing.bezier(0.16, 1, 0.3, 1);

interface AchievementToastProps {
  queue: string[];
  onComplete: () => void;
}

export default function AchievementToast({
  queue,
  onComplete,
}: AchievementToastProps) {
  const { settings } = useGameContext();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const isGradientTheme = theme.themeType === "gradient";
  const styles = useMemo(
    () => createStyles(theme, width, settings.darkMode, insets.top),
    [theme, width, settings.darkMode, insets.top],
  );
  const contentColor = isGradientTheme ? theme.buttonText : theme.textPrimary;
  const iconColor = contentColor;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showing, setShowing] = useState(false);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQueueLen = useRef(0);
  const dismissingRef = useRef(false);

  const advanceQueue = useCallback(() => {
    setCurrentIndex((prev) => prev + 1);
  }, []);

  const clearDismissingFlag = useCallback(() => {
    dismissingRef.current = false;
  }, []);

  const scheduleNextToast = useCallback(() => {
    nextTimerRef.current = setTimeout(() => {
      advanceQueue();
      clearDismissingFlag();
    }, 500);
  }, [advanceQueue, clearDismissingFlag]);

  const finishCurrentToast = useCallback(
    (direction: "up" | "right" = "up") => {
      if (dismissingRef.current) return;
      dismissingRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);

      translateX.value = withTiming(direction === "right" ? 120 : 0, {
        duration: 180,
        easing: EASING,
      });
      translateY.value = withTiming(direction === "up" ? -120 : 0, {
        duration: 180,
        easing: EASING,
      });
      opacity.value = withTiming(0, { duration: 180, easing: EASING }, () => {
        runOnJS(scheduleNextToast)();
      });
    },
    [opacity, scheduleNextToast, translateX, translateY],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_evt, gestureState) =>
          gestureState.dy < -10 || gestureState.dx > 10,
        onPanResponderMove: (_evt, gestureState) => {
          if (gestureState.dx > 0 && Math.abs(gestureState.dx) >= Math.abs(gestureState.dy)) {
            translateX.value = gestureState.dx;
            translateY.value = 0;
          } else if (gestureState.dy < 0) {
            translateX.value = 0;
            translateY.value = gestureState.dy;
          }
        },
        onPanResponderRelease: (_evt, gestureState) => {
          const shouldDismiss = gestureState.dy < -60 || gestureState.dx > 60;

          if (shouldDismiss) {
            finishCurrentToast(gestureState.dx > 60 ? "right" : "up");
          } else {
            translateX.value = withTiming(0, { duration: 150, easing: EASING });
            translateY.value = withTiming(0, { duration: 150, easing: EASING });
            opacity.value = withTiming(1, { duration: 150, easing: EASING });
          }
        },
      }),
    [finishCurrentToast, opacity, translateX, translateY],
  );

  useEffect(() => {
    if (queue.length > 0 && queue.length !== prevQueueLen.current) {
      prevQueueLen.current = queue.length;
      if (!showing) {
        setCurrentIndex(0);
        setShowing(true);
      }
    }
  }, [queue, showing]);

  useEffect(() => {
    if (!showing || currentIndex >= queue.length) {
      if (showing && currentIndex >= queue.length) {
        setShowing(false);
        prevQueueLen.current = 0;
        onComplete();
      }
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    if (nextTimerRef.current) clearTimeout(nextTimerRef.current);

    translateX.value = 0;
    translateY.value = -80;
    opacity.value = 0;
    dismissingRef.current = false;

    translateY.value = withTiming(0, { duration: 300, easing: EASING });
    opacity.value = withTiming(1, { duration: 300, easing: EASING });

    timerRef.current = setTimeout(() => {
      finishCurrentToast("up");
    }, 1800);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (nextTimerRef.current) clearTimeout(nextTimerRef.current);
    };
  }, [showing, currentIndex, queue, onComplete, finishCurrentToast, opacity, translateX, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!showing || currentIndex >= queue.length) return null;

  const key = queue[currentIndex];
  const name = ACHIEVEMENT_NAMES[key] || key.toUpperCase();
  const description = ACHIEVEMENT_DESCRIPTIONS[key] || "Achievement unlocked.";

  return (
    <Animated.View style={[styles.container, animStyle]} {...panResponder.panHandlers}>
      {isGradientTheme ? (
        <LinearGradient
          colors={[theme.highlightGradientStart, theme.highlightGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientFill}
        >
          <View style={styles.headerRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="ribbon" size={20} color={iconColor} />
            </View>
            <View style={styles.headerTextArea}>
              <Text style={[styles.label, { color: contentColor }]}>ACHIEVEMENT UNLOCKED</Text>
              <Text
                style={[styles.name, { color: contentColor }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {name}
              </Text>
            </View>
          </View>
          <View style={styles.textArea}>
            <Text
              style={[styles.description, { color: contentColor }]}
              numberOfLines={3}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {description}
            </Text>
          </View>
        </LinearGradient>
      ) : (
        <View style={styles.solidFill}>
          <View style={styles.headerRow}>
            <View style={styles.iconBadge}>
              <Ionicons name="ribbon" size={20} color={iconColor} />
            </View>
            <View style={styles.headerTextArea}>
              <Text style={[styles.label, { color: contentColor }]}>ACHIEVEMENT UNLOCKED</Text>
              <Text
                style={[styles.name, { color: contentColor }]}
                numberOfLines={2}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {name}
              </Text>
            </View>
          </View>
          <View style={styles.textArea}>
            <Text
              style={[styles.description, { color: contentColor }]}
              numberOfLines={3}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {description}
            </Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (
  theme: ReturnType<typeof getThemeColors>,
  width: number,
  darkMode: boolean,
  topInset: number,
) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: topInset + 10,
      alignSelf: "center",
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.borderFocus,
      overflow: "hidden",
      zIndex: 150,
      width: Math.max(240, Math.min(width - 16, 460)),
      minHeight: 110,
      maxHeight: 200,
      shadowColor: theme.overlay,
      shadowOpacity: 0.22,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 },
      elevation: 10,
    },
    gradientFill: {
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 18,
    },
    solidFill: {
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 18,
      backgroundColor: theme.elevated,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
    },
    iconBadge: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.secondaryBg,
      flexShrink: 0,
    },
    headerTextArea: {
      flex: 1,
      minWidth: 0,
    },
    textArea: {
      marginTop: 12,
    },
    label: {
      color: theme.textPrimary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.4,
      textTransform: "uppercase",
    },
    name: {
      color: theme.textPrimary,
      fontSize: 20,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 0.8,
      marginTop: 4,
      flexShrink: 1,
    },
    description: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
      lineHeight: 19,
      letterSpacing: 0.2,
    },
  });
