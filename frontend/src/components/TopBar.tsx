import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";

interface Props {
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  showSettings?: boolean;
  onSettings?: () => void;
  rightElement?: React.ReactNode;
}

export default function TopBar({
  title = "QUORIDOR",
  showBack,
  onBack,
  showSettings,
  onSettings,
  rightElement,
}: Props) {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const styles = useMemo(() => createStyles(theme), [theme]);

  return (
    <View testID="top-bar" style={styles.container}>
      {showBack ? (
        <TouchableOpacity
          testID="top-bar-back"
          onPress={onBack}
          style={styles.iconBtn}
          activeOpacity={0.6}
        >
          <Ionicons
            name="arrow-back"
            size={20}
            color={theme.spaceTextSecondary}
          />
        </TouchableOpacity>
      ) : (
        <View style={styles.gridIcon}>
          <View style={styles.gridRow}>
            <View style={styles.gridCell} />
            <View style={styles.gridCell} />
          </View>
          <View style={styles.gridRow}>
            <View style={styles.gridCell} />
            <View style={styles.gridCell} />
          </View>
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {rightElement ? (
        rightElement
      ) : showSettings ? (
        <TouchableOpacity
          testID="top-bar-settings"
          onPress={onSettings}
          style={styles.iconBtn}
          activeOpacity={0.6}
        >
          <Ionicons
            name="settings-outline"
            size={20}
            color={theme.spaceTextSecondary}
          />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 32 }} />
      )}
    </View>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: theme.background,
    },
    iconBtn: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
    },
    gridIcon: {
      width: 32,
      height: 32,
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },
    gridRow: {
      flexDirection: "row",
      gap: 3,
    },
    gridCell: {
      width: 8,
      height: 8,
      borderRadius: 2,
      backgroundColor: theme.accent,
    },
    title: {
      color: theme.spaceTextPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 3,
    },
  });
