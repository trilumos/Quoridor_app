import React, { useEffect, useMemo, useRef } from "react";
import { TouchableOpacity, Text, StyleSheet, Animated as RNAnimated, View } from "react-native";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

export default function PrimaryButton({
  title,
  onPress,
  disabled,
  testID,
}: Props) {
  const scale = useRef(new RNAnimated.Value(1)).current;
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const drift = useSharedValue(0);
  const shimmer = useSharedValue(0.12);
  const isGradientTheme = theme.accentType === "gradient";
  const isAnimatedTheme = theme.accentType === "animated";
  const animationDuration = Math.max(theme.animationDuration ?? 12000, 6000);
  const animationColors: [string, string, ...string[]] =
    theme.animationColors && theme.animationColors.length >= 2
      ? [
          theme.animationColors[0],
          theme.animationColors[1],
          ...theme.animationColors.slice(2),
        ]
      : [theme.buttonGradientStart, theme.buttonGradientEnd];

  // For gradient themes, use all available gradient colors (as in theme card preview)
  const gradientColors: [string, string, ...string[]] =
    isGradientTheme && theme.gradient && theme.gradientStart && theme.gradientEnd
      ? [theme.gradientStart, theme.gradientEnd]
      : [theme.buttonGradientStart, theme.buttonGradientEnd];
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (!isAnimatedTheme) {
      drift.value = 0;
      shimmer.value = 0.12;
      return;
    }

    drift.value = withRepeat(
      withTiming(1, {
        duration: animationDuration,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    shimmer.value = withRepeat(
      withTiming(0.2, {
        duration: animationDuration,
        easing: Easing.inOut(Easing.quad),
      }),
      -1,
      true,
    );
  }, [animationDuration, drift, isAnimatedTheme, shimmer]);

  const animatedOverlayStyle = useAnimatedStyle(() => ({
    opacity: shimmer.value,
    transform: [{ translateX: (drift.value - 0.5) * 24 }],
  }));

  const handlePressIn = () => {
    RNAnimated.timing(scale, {
      toValue: 0.96,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    RNAnimated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <RNAnimated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.85}
        style={[styles.button, disabled && styles.disabled]}
      >
        {isAnimatedTheme ? (
          <View style={styles.gradientFill}>
            <LinearGradient
              colors={[theme.buttonGradientStart, theme.buttonGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />
            <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, animatedOverlayStyle]}>
              <LinearGradient
                colors={animationColors}
                start={{ x: 0, y: 0.2 }}
                end={{ x: 1, y: 0.8 }}
                style={StyleSheet.absoluteFillObject}
              />
            </Animated.View>
            <Text
              style={[styles.text, disabled && styles.textDisabled]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {title}
            </Text>
          </View>
        ) : isGradientTheme ? (
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientFill}
          >
            <Text
              style={[styles.text, disabled && styles.textDisabled]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {title}
            </Text>
          </LinearGradient>
        ) : (
          <View style={styles.solidFill}>
            <Text
              style={[styles.text, disabled && styles.textDisabled]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {title}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </RNAnimated.View>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    button: {
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 0,
      alignSelf: "stretch",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: theme.borderFocus,
    },
    gradientFill: {
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    solidFill: {
      width: "100%",
      paddingVertical: 16,
      paddingHorizontal: 16,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.accent,
    },
    disabled: {
      opacity: 0.4,
    },
    text: {
      color: theme.buttonText,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.5,
      textAlign: "center",
    },
    textDisabled: {
      color: theme.buttonText,
    },
  });
