import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { getThemeColors } from "../theme/colors";

type Props = {
  theme: ReturnType<typeof getThemeColors>;
};

export default function ThemedBackground({ theme }: Props) {
  const shimmer = useSharedValue(0.2);
  const drift = useSharedValue(0);
  const pulse = useSharedValue(1);
  const hasAnimatedTheme = theme.accentType === "animated" && Boolean(theme.animation);
  const animationColors: [string, string, ...string[]] = hasAnimatedTheme && theme.animation
    ? [
        theme.animation.colors[0] ?? theme.accentGradientStart,
        theme.animation.colors[1] ?? theme.accentGradientEnd,
        ...theme.animation.colors.slice(2),
      ]
    : [theme.accentGradientStart, theme.accentGradientEnd];

  useEffect(() => {
    if (!hasAnimatedTheme || !theme.animation) {
      shimmer.value = 0.2;
      drift.value = 0;
      pulse.value = 1;
      return;
    }

    const speed = Math.max(theme.animation.speed, 0.25);
    const intensity = Math.min(theme.animation.intensity, 0.45);

    if (theme.animation.type === "gradientShift") {
      const duration = theme.animationDuration ?? Math.max(7000, Math.round(13000 / speed));
      shimmer.value = withRepeat(
        withTiming(0.08 + intensity * 0.18, {
          duration,
          easing: Easing.inOut(Easing.cubic),
        }),
        -1,
        true,
      );
      drift.value = withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
      pulse.value = withRepeat(
        withTiming(1.03, {
          duration: duration + 1200,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      );
      return;
    }

    if (theme.animation.type === "liquidFlow" || theme.animation.type === "fluid") {
      const duration = theme.animationDuration ?? Math.max(8500, Math.round(15000 / speed));
      shimmer.value = withRepeat(
        withTiming(0.06 + intensity * 0.14, {
          duration,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      );
      drift.value = withRepeat(
        withTiming(1, {
          duration,
          easing: Easing.inOut(Easing.exp),
        }),
        -1,
        true,
      );
      pulse.value = withRepeat(
        withTiming(1.04, {
          duration: duration + 1500,
          easing: Easing.inOut(Easing.sin),
        }),
        -1,
        true,
      );
      return;
    }

    const fallbackDuration = Math.max(6000, Math.round(12000 / speed));
    shimmer.value = withRepeat(
      withTiming(0.1 + intensity * 0.15, {
        duration: fallbackDuration,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
    drift.value = withRepeat(
      withTiming(1, {
        duration: fallbackDuration,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
    pulse.value = withRepeat(
      withTiming(1.02, {
        duration: fallbackDuration,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [drift, hasAnimatedTheme, pulse, shimmer, theme.animation, theme.animationDuration]);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
    transform: [
      { translateX: (drift.value - 0.5) * 36 },
      { translateY: (drift.value - 0.5) * 14 },
      { scale: pulse.value },
    ],
  }));

  const animatedLiquidStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value * 0.65,
    transform: [
      { translateX: (0.5 - drift.value) * 28 },
      { translateY: (drift.value - 0.5) * 20 },
      { scale: 1.08 - (pulse.value - 1) * 0.4 },
    ],
  }));

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <LinearGradient
        colors={[
          theme.background,
          theme.backgroundGradientStart,
          theme.backgroundGradientEnd,
          theme.background,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {hasAnimatedTheme && theme.animation ? (
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedOverlayStyle]}>
          <LinearGradient
            colors={animationColors}
            start={{ x: 0, y: 0.3 }}
            end={{ x: 1, y: 0.7 }}
            style={styles.animationOverlay}
          />
        </Animated.View>
      ) : null}
      {hasAnimatedTheme && (theme.animation?.type === "liquidFlow" || theme.animation?.type === "fluid") ? (
        <Animated.View style={[StyleSheet.absoluteFillObject, animatedLiquidStyle]}>
          <LinearGradient
            colors={[...animationColors].reverse() as [string, string, ...string[]]}
            start={{ x: 1, y: 0.2 }}
            end={{ x: 0, y: 0.85 }}
            style={styles.animationOverlay}
          />
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  animationOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
