import React, { useMemo } from "react";
import { Text, StyleSheet } from "react-native";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";

interface Props {
  text: string;
  color?: string;
}

export default function SectionLabel({ text, color }: Props) {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <Text
      testID={`section-${text}`}
      style={[styles.label, color ? { color } : null]}
    >
      {text}
    </Text>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    label: {
      color: theme.spaceTextSecondary,
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 2,
      textTransform: "uppercase",
    },
  });
