import React, { useMemo } from "react";
import {
  Alert,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ALL_THEME_OPTIONS,
  getThemeColors,
  type ThemeName,
} from "../../src/theme/colors";
import { useGameContext } from "../../src/storage/GameContext";

export default function CollectionScreen() {
  const { settings, updateSettings } = useGameContext();
  const { width } = useWindowDimensions();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme, width), [theme, width]);

  const handleApplyTheme = (id: ThemeName, label: string) => {
    if (settings.themeName === id) return;

    Alert.alert(
      "Apply Theme",
      `Apply ${label} theme?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Apply",
          onPress: () => {
            updateSettings({ themeName: id, boardMaterial: label });
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[st.container, { backgroundColor: theme.background }]}
    >
      <View style={st.pageWrap}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={st.scroll}
        >
          <View style={st.headerArea}>
            <Text style={[st.label, { color: theme.accent }]}>VISUAL IDENTITY</Text>
            <Text style={[st.heading, { color: theme.spaceTextPrimary }]}>THEMES</Text>
          </View>

          {/* Active Theme */}
          <View style={st.activeThemeCard}>
            <View style={st.activeThemeOverlay}>
              {Array.from({ length: 6 }).map((_, i) => (
                <View key={i} style={st.activeThemeLine} />
              ))}
            </View>
            <View style={st.activeThemeContent}>
              <Text style={st.activeLabel}>CURRENTLY ACTIVE</Text>
              <Text style={st.activeTitle}>
                {ALL_THEME_OPTIONS.find((item) => item.id === settings.themeName)?.label.toUpperCase()}
              </Text>
              <Text style={st.activeDesc}>
                Switch palettes instantly. Your selection is applied globally and
                saved on this device.
              </Text>
            </View>
          </View>

          {/* Theme Grid */}
          <View style={st.themeGrid}>
            {ALL_THEME_OPTIONS.map((themeItem) => {
              const preview = getThemeColors(settings.darkMode, themeItem.id);
              const isActive = settings.themeName === themeItem.id;
              const isAnimated = preview.themeType === "animated";
              const isGradient = preview.themeType === "gradient";

              const previewColors: [string, string, ...string[]] = isAnimated && preview.animation
                ? [
                    preview.animation.colors[0] ?? preview.buttonGradientStart,
                    preview.animation.colors[1] ?? preview.buttonGradientEnd,
                    ...preview.animation.colors.slice(2),
                  ]
                : [preview.buttonGradientStart, preview.buttonGradientEnd];

              // Removed unused variable 'previewTag'

              return (
                <TouchableOpacity
                  key={themeItem.id}
                  style={[
                    st.themeCard,
                    isActive && st.themeCardActive,
                    isActive && {
                      borderColor: preview.borderFocus,
                      shadowColor: preview.accent,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => handleApplyTheme(themeItem.id, themeItem.label)}
                >
                  {isActive && (isGradient ? (
                    <LinearGradient
                      colors={[preview.highlightGradientStart, preview.highlightGradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 0, y: 1 }}
                      style={st.themePinstripe}
                    />
                  ) : (
                    <View style={[st.themePinstripe, { backgroundColor: preview.accent }]} />
                  ))}
                  <LinearGradient
                    colors={previewColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={st.themePreview}
                  >
                    {/* Removed previewTag (gradient/animated/static) */}
                    <View style={st.previewRow}>
                      <View
                        style={[
                          st.previewSwatch,
                          { backgroundColor: preview.background },
                        ]}
                      />
                      <View
                        style={[
                          st.previewSwatch,
                          { backgroundColor: preview.elevated },
                        ]}
                      />
                      <View
                        style={[
                          st.previewSwatch,
                          { backgroundColor: preview.accent },
                        ]}
                      />
                    </View>
                  </LinearGradient>
                  <Text style={st.themeName}>{themeItem.label}</Text>
                  <Text style={st.themeDesc}>Tap to apply instantly</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>, screenWidth: number) => {
  const isCompact = screenWidth < 360;

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    pageWrap: { flex: 1 },
    scroll: { paddingHorizontal: 20 },
    headerArea: { marginTop: 20, marginBottom: 20 },
    label: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    heading: {
      color: theme.textPrimary,
      fontSize: 32,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 4,
    },
    activeThemeCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      overflow: "hidden",
      position: "relative",
      minHeight: 140,
    },
    activeThemeOverlay: {
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      width: "40%",
      flexDirection: "row",
      gap: 6,
      opacity: 0.08,
      paddingTop: 10,
      paddingRight: 10,
    },
    activeThemeLine: { width: 2, flex: 1, backgroundColor: theme.accent },
    activeThemeContent: { padding: 20, zIndex: 1 },
    activeLabel: {
      color: theme.accent,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    activeTitle: {
      color: theme.textPrimary,
      fontSize: 22,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 6,
    },
    activeDesc: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 19,
      marginTop: 8,
    },
    themeGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 12,
      marginTop: 20,
    },
    themeCard: {
      width: isCompact ? "100%" : "48.5%",
      backgroundColor: theme.elevated,
      borderRadius: 12,
      padding: 14,
      overflow: "hidden",
      position: "relative",
      borderWidth: 1,
      borderColor: "transparent",
    },
    themeCardActive: {
      borderColor: theme.accent,
      shadowColor: theme.accent,
      shadowOpacity: 0.2,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 8 },
      elevation: 4,
    },
    themePinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.accent,
    },
    themePreview: {
      height: 74,
      borderRadius: 8,
      marginBottom: 10,
      overflow: "hidden",
      justifyContent: "center",
      paddingHorizontal: 8,
      paddingVertical: 8,
    },
    previewMetaRow: {
      flexDirection: "row",
      justifyContent: "flex-end",
      marginBottom: 6,
    },
    previewTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: theme.border,
    },
    previewTagText: {
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    previewRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "center",
      justifyContent: "space-between",
      flex: 1,
    },
    previewSwatch: {
      flex: 1,
      borderRadius: 6,
      height: 40,
    },
    themeName: {
      color: theme.textPrimary,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    themeDesc: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
  });
};
