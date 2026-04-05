import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";

export default function ModeSelectScreen() {
  const router = useRouter();
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const st = useMemo(() => createStyles(theme), [theme]);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.inner}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={st.backBtn}
          activeOpacity={0.6}
        >
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.spaceTextSecondary}
          />
        </TouchableOpacity>

        <View style={st.content}>
          <Text style={st.label}>SELECT MODE</Text>
          <Text style={st.heading}>{"HOW DO YOU\nWANT TO PLAY?"}</Text>

          <View style={st.cards}>
            <TouchableOpacity
              style={st.card}
              onPress={() => router.push("/pregame-ai" as never)}
              activeOpacity={0.7}
            >
              <View style={st.cardPinstripe} />
              <View style={st.cardIcon}>
                <Ionicons
                  name="hardware-chip-outline"
                  size={28}
                  color={theme.accent}
                />
              </View>
              <View style={st.cardTextArea}>
                <Text style={st.cardTitle}>VS AI</Text>
                <Text style={st.cardDesc}>
                  Challenge our strategic AI across three difficulty levels.
                  Test your wall-placement mastery.
                </Text>
              </View>
              <View style={st.cardArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={st.card}
              onPress={() => router.push("/pregame-local" as never)}
              activeOpacity={0.7}
            >
              <View style={st.cardPinstripe} />
              <View style={st.cardIcon}>
                <Ionicons
                  name="people-outline"
                  size={28}
                  color={theme.accent}
                />
              </View>
              <View style={st.cardTextArea}>
                <Text style={st.cardTitle}>PASS & PLAY</Text>
                <Text style={st.cardDesc}>
                  Share a device and take turns. Perfect for in-person strategy
                  sessions.
                </Text>
              </View>
              <View style={st.cardArrow}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={theme.textSecondary}
                />
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    inner: { flex: 1, paddingHorizontal: 24 },
    backBtn: { width: 44, height: 44, justifyContent: "center", marginTop: 8 },
    content: { flex: 1, justifyContent: "center" },
    label: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    heading: {
      color: theme.spaceTextPrimary,
      fontSize: 30,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      lineHeight: 36,
      marginTop: 8,
      marginBottom: 32,
    },
    cards: { gap: 12 },
    card: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      overflow: "hidden",
      position: "relative",
    },
    cardPinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2.5,
      backgroundColor: theme.accent,
    },
    cardIcon: {
      width: 52,
      height: 52,
      borderRadius: 14,
      backgroundColor: "rgba(255,255,255,0.04)",
      alignItems: "center",
      justifyContent: "center",
    },
    cardTextArea: { flex: 1 },
    cardTitle: {
      color: theme.textPrimary,
      fontSize: 16,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    cardDesc: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 17,
      marginTop: 4,
    },
    cardArrow: { paddingLeft: 4 },
  });
