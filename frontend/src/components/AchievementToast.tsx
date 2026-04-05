import React, { useEffect, useMemo, useState, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
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

const ACHIEVEMENT_NAMES: Record<string, string> = {
  first_victory: "FIRST VICTORY",
  wall_master: "WALL MASTER",
  speedrun: "SPEEDRUN",
  pacifist: "PACIFIST",
  strategist: "STRATEGIST",
  dedicated: "DEDICATED",
  veteran: "VETERAN",
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
  const theme = getThemeColors(settings.darkMode);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [showing, setShowing] = useState(false);
  const translateY = useSharedValue(80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevQueueLen = useRef(0);

  useEffect(() => {
    if (queue.length > 0 && queue.length !== prevQueueLen.current) {
      prevQueueLen.current = queue.length;
      setCurrentIndex(0);
      setShowing(true);
    }
  }, [queue]);

  useEffect(() => {
    if (!showing || currentIndex >= queue.length) {
      if (showing && currentIndex >= queue.length) {
        setShowing(false);
        prevQueueLen.current = 0;
        onComplete();
      }
      return;
    }

    translateY.value = 80;
    opacity.value = 0;
    translateY.value = withTiming(0, { duration: 300, easing: EASING });
    opacity.value = withTiming(1, { duration: 300, easing: EASING });

    timerRef.current = setTimeout(() => {
      translateY.value = withTiming(80, { duration: 300, easing: EASING });
      opacity.value = withTiming(0, { duration: 300, easing: EASING }, () => {
        runOnJS(setCurrentIndex)(currentIndex + 1);
      });
    }, 2000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showing, currentIndex, queue, onComplete, opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!showing || currentIndex >= queue.length) return null;

  const key = queue[currentIndex];
  const name = ACHIEVEMENT_NAMES[key] || key.toUpperCase();

  return (
    <Animated.View style={[styles.container, animStyle]}>
      <View style={styles.pinstripe} />
      <Ionicons name="ribbon" size={18} color={theme.accent} />
      <View style={styles.textArea}>
        <Text style={styles.label}>ACHIEVEMENT UNLOCKED</Text>
        <Text style={styles.name}>{name}</Text>
      </View>
    </Animated.View>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      bottom: 100,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.elevated,
      borderRadius: 10,
      overflow: "hidden",
      paddingVertical: 12,
      paddingHorizontal: 16,
      paddingLeft: 14,
      zIndex: 150,
      minWidth: 240,
    },
    pinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2.5,
      backgroundColor: theme.accent,
    },
    textArea: { flex: 1 },
    label: {
      color: theme.accent,
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.5,
    },
    name: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
      marginTop: 2,
    },
  });
