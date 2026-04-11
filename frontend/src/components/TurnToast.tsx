import React, { useEffect, useMemo, useRef } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from "react-native-reanimated";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";
import { LinearGradient } from "expo-linear-gradient";

interface TurnToastProps {
  playerName: string;
  visible: boolean;
  onDismiss: () => void;
}

const EASING = Easing.bezier(0.16, 1, 0.3, 1);

export default function TurnToast({
  playerName,
  visible,
  onDismiss,
}: TurnToastProps) {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const isGradientTheme = theme.themeType === "gradient";
  const styles = useMemo(() => createStyles(theme), [theme]);

  const translateY = useSharedValue(-80);
  const opacity = useSharedValue(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, { duration: 300, easing: EASING });
      opacity.value = withTiming(1, { duration: 300, easing: EASING });

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        translateY.value = withTiming(-80, { duration: 300, easing: EASING });
        opacity.value = withTiming(0, { duration: 300, easing: EASING }, () => {
          runOnJS(onDismiss)();
        });
      }, 1500);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible, playerName, onDismiss, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {isGradientTheme ? (
        <LinearGradient
          colors={[theme.highlightGradientStart, theme.highlightGradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.pinstripe}
        />
      ) : (
        <Animated.View style={styles.pinstripe} />
      )}
      <Text style={styles.text} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.8}>
        {`${playerName.toUpperCase()}'S TURN`}
      </Text>
    </Animated.View>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      top: 56,
      alignSelf: "center",
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.elevated,
      borderRadius: 8,
      overflow: "hidden",
      paddingVertical: 10,
      paddingHorizontal: 16,
      paddingLeft: 14,
      zIndex: 100,
      width: "92%",
      maxWidth: 320,
    },
    pinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.accent,
    },
    text: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.1,
      flexShrink: 1,
      textAlign: "center",
    },
  });
