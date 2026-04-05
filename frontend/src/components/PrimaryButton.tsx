import React, { useMemo, useRef } from "react";
import { TouchableOpacity, Text, StyleSheet, Animated } from "react-native";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";

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
  const scale = useRef(new Animated.Value(1)).current;
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handlePressIn = () => {
    Animated.timing(scale, {
      toValue: 0.96,
      duration: 80,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.timing(scale, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        testID={testID}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.85}
        style={[styles.button, disabled && styles.disabled]}
      >
        <Text style={[styles.text, disabled && styles.textDisabled]}>
          {title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    button: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "center",
    },
    disabled: {
      opacity: 0.4,
    },
    text: {
      color: theme.background,
      fontSize: 15,
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    textDisabled: {
      color: theme.background,
    },
  });
