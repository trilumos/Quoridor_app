import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeColors } from "../../src/theme/colors";
import { useGameContext } from "../../src/storage/GameContext";

const THEMES = [
  {
    id: "obsidian",
    name: "Obsidian Dark",
    desc: "Default dark theme",
    active: true,
  },
  {
    id: "walnut",
    name: "Polished Walnut",
    desc: "Warm wood-grain aesthetic",
    active: false,
  },
  {
    id: "marble",
    name: "Carrara Marble",
    desc: "Classic Italian stone finish",
    active: false,
  },
  {
    id: "neon",
    name: "Neon Circuit",
    desc: "Cyberpunk grid overlay",
    active: false,
  },
  {
    id: "frost",
    name: "Arctic Frost",
    desc: "Cool blue tonal palette",
    active: false,
  },
  {
    id: "gold",
    name: "Royal Gold",
    desc: "Luxurious gilded surfaces",
    active: false,
  },
];

export default function CollectionScreen() {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const st = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={[st.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        <View style={st.headerArea}>
          <Text style={[st.label, { color: theme.accent }]}>
            VISUAL IDENTITY
          </Text>
          <Text style={[st.heading, { color: theme.spaceTextPrimary }]}>
            THEMES
          </Text>
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
            <Text style={st.activeTitle}>OBSIDIAN DARK</Text>
            <Text style={st.activeDesc}>
              The signature board material. Deep contrast with precision grid
              lines.
            </Text>
          </View>
        </View>

        {/* Theme Grid */}
        <View style={st.themeGrid}>
          {THEMES.map((theme) => {
            return (
              <TouchableOpacity
                key={theme.id}
                style={[st.themeCard, theme.active && st.themeCardActive]}
                activeOpacity={0.7}
                onPress={() => {}}
              >
                {theme.active && <View style={st.themePinstripe} />}
                <View
                  style={[
                    st.themePreview,
                    theme.active && { backgroundColor: theme.surface },
                  ]}
                >
                  <View style={st.themeGridLines}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <View key={i} style={st.themeGridLine} />
                    ))}
                  </View>
                </View>
                <Text style={st.themeName}>{theme.name}</Text>
                <Text style={st.themeDesc}>{theme.desc}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
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
      gap: 12,
      marginTop: 20,
    },
    themeCard: {
      width: "47%",
      backgroundColor: theme.elevated,
      borderRadius: 12,
      padding: 14,
      overflow: "hidden",
      position: "relative",
    },
    themeCardActive: {},
    themePinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.accent,
    },
    themePreview: {
      height: 60,
      backgroundColor: theme.surfaceLowest,
      borderRadius: 8,
      marginBottom: 10,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
    },
    themeGridLines: { flexDirection: "row", gap: 6, opacity: 0.2 },
    themeGridLine: { width: 2, height: 40, backgroundColor: theme.textPrimary },
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
