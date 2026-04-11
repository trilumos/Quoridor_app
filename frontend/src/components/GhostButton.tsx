import React, { useMemo } from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";

interface Props {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  color?: string;
}

export default function GhostButton({
  title,
  onPress,
  disabled,
  testID,
  color,
}: Props) {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
      style={[styles.button, disabled && styles.disabled]}
    >
      <Text
        style={[styles.text, color ? { color } : null]}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    button: {
      paddingVertical: 12,
      paddingHorizontal: 12,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 0,
    },
    disabled: { opacity: 0.35 },
    text: {
      color: theme.textSecondary,
      fontSize: 14,
      fontWeight: "600",
      letterSpacing: 0.3,
      textAlign: "center",
    },
  });
