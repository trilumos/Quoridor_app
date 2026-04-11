import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../theme/colors";
import { useGameContext } from "../storage/GameContext";
import { LinearGradient } from "expo-linear-gradient";

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
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const isGradientTheme = theme.themeType === "gradient";
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
          {isGradientTheme ? (
            <LinearGradient
              colors={[theme.highlightGradientStart, theme.highlightGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gridGradient}
            >
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
              <View style={styles.gridRow}>
                <View style={styles.gridCell} />
                <View style={styles.gridCell} />
              </View>
            </LinearGradient>
          ) : (
            <View style={[styles.gridGradient, styles.gridSolid]}>
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
        </View>
      )}
      <Text
        style={styles.title}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {title}
      </Text>
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
        <View style={styles.iconSpacer} />
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
      gap: 8,
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
      borderRadius: 8,
      overflow: "hidden",
      flexShrink: 0,
    },
    gridGradient: {
      width: "100%",
      height: "100%",
      alignItems: "center",
      justifyContent: "center",
      gap: 3,
    },
    gridSolid: {
      backgroundColor: theme.secondaryBg,
    },
    gridRow: {
      flexDirection: "row",
      gap: 3,
    },
    gridCell: {
      width: 8,
      height: 8,
      borderRadius: 2,
      backgroundColor: theme.surface,
    },
    title: {
      flex: 1,
      minWidth: 0,
      color: theme.spaceTextPrimary,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 3,
      textAlign: "center",
    },
    iconSpacer: { width: 32, height: 32, flexShrink: 0 },
  });
