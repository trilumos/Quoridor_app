import React, { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showInterstitial } from "../src/lib/ads";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";
import { useAuthStore } from "../src/store/authStore";
import { useGameStore } from "../src/store/gameStore";

type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTIES: {
  key: Difficulty;
  label: string;
  icon: string;
  desc: string;
}[] = [
  {
    key: "easy",
    label: "NOVICE",
    icon: "school-outline",
    desc: "Linear Patterns & Fundamental Blocking",
  },
  {
    key: "medium",
    label: "STRATEGIC",
    icon: "flash-outline",
    desc: "Path Minimization & Resource Efficiency",
  },
  {
    key: "hard",
    label: "GRANDMASTER",
    icon: "skull-outline",
    desc: "Heuristic Symmetry & Infinite Game Loops",
  },
];

export default function PregameAI() {
  const router = useRouter();
  useLocalSearchParams();
  const { settings, isPremium, hasPlayedInLast24Hours } = useGameContext();
  const { profile, user } = useAuthStore();
  const { savedGame, deleteSavedGame } = useGameStore();
  const savedAiGame = savedGame?.mode === "ai" ? savedGame : null;
  const [selected, setSelected] = useState<Difficulty | null>(
    () => (savedAiGame?.difficulty as Difficulty | null) ?? null,
  );
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (savedAiGame?.difficulty && !selected) {
      setSelected(savedAiGame.difficulty as Difficulty);
    }
  }, [savedAiGame?.difficulty, selected]);

  const buildGameParams = (difficulty: Difficulty, resume = false) => ({
    pathname: "/game",
    params: {
      mode: "ai",
      difficulty,
      resume: resume ? "true" : "false",
      p1Name: profile?.username || "PLAYER",
      p2Name:
        difficulty === "easy"
          ? "Novice AI"
          : difficulty === "medium"
            ? "Strategic AI"
            : "Grandmaster AI",
      p1Color: theme.player1,
      p2Color: theme.player2,
    },
  });

  const handleStart = async () => {
    if (!selected) return;
    if (savedAiGame && user?.id) {
      await deleteSavedGame(user.id);
    }

    const gameParams = buildGameParams(selected);


    if (!isPremium && (selected === "hard" || !hasPlayedInLast24Hours())) {
      showInterstitial(() => {
        router.push({
          pathname: "/game",
          params: {
            adType: "session_start",
            ...gameParams.params,
          },
        } as never);
      });
      return;
    }

    router.push(gameParams as never);
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        style={st.scroll}
        contentContainerStyle={st.screen}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={st.configLabel}>GAME CONFIGURATION</Text>
        <Text style={st.pageTitle}>{"Select Strategic\nComplexity"}</Text>

        {/* Difficulty Cards */}
        <View style={st.cards}>
          {DIFFICULTIES.map((d) => {
            const isSelected = selected === d.key;
            return (
              <View key={d.key}>
                <TouchableOpacity
                  testID={`diff-${d.key}`}
                  style={[
                    st.diffCard,
                    isSelected && st.diffCardSelected,
                  ]}
                  onPress={() => {
                    setSelected(d.key);
                  }}
                  activeOpacity={0.78}
                >
                  {isSelected && <View style={st.pinstripe} />}
                  <View style={st.diffInner}>
                    <View style={st.diffLeft}>
                      <View
                        style={st.diffIconWrap}
                      >
                        <Ionicons
                          name={d.icon as any}
                          size={20}
                          color={
                            isSelected
                                ? theme.accent
                                : theme.textSecondary
                          }
                        />
                      </View>
                      <View style={st.diffText}>
                        <View style={st.diffTitleRow}>
                          <Text
                            style={st.diffTitle}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            minimumFontScale={0.75}
                          >
                            {d.label}
                          </Text>
                          {d.key === "medium" && (
                            <View style={st.recoBadge}>
                              <Text style={st.recoText}>RECOMMENDED</Text>
                            </View>
                          )}
                        </View>
                        <Text style={st.diffDesc}>{d.desc}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* System Preview */}
        <View style={st.previewCard}>
          <Text style={st.previewLabel}>SYSTEM PREVIEW</Text>
          <Text style={st.previewDesc}>
            The AI evaluates <Text style={st.bold}>Shortest Path</Text>{" "}
            algorithms in real-time, adapting wall placement to maximize path
            disruption while minimizing resource expenditure.
          </Text>
        </View>

        {/* Bottom buttons */}
        <View style={st.bottomBtns}>
          <TouchableOpacity
            style={st.changeModeBtn}
            onPress={() => router.back()}
            activeOpacity={0.6}
          >
            <Ionicons name="arrow-back" size={16} color={theme.textSecondary} />
            <Text style={st.changeModeText}>CHANGE MODE</Text>
          </TouchableOpacity>
          <TouchableOpacity
            testID="start-ai-btn"
            style={[st.continueBtn, !selected && st.continueBtnDisabled]}
            onPress={handleStart}
            activeOpacity={0.85}
            disabled={!selected}
          >
            <Text style={st.continueBtnText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { flex: 1 },
    screen: {
      flexGrow: 1,
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 32,
    },
    configLabel: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
      marginTop: 24,
    },
    pageTitle: {
      color: theme.spaceTextPrimary,
      fontSize: 30,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      lineHeight: 36,
      marginTop: 8,
      flexShrink: 1,
    },
    cards: { gap: 10, marginTop: 24 },
    diffCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      overflow: "hidden",
      position: "relative",
      borderWidth: 1.5,
      borderColor: "transparent",
    },
    diffCardSelected: { borderColor: theme.accent },
    pinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2.5,
      backgroundColor: theme.accent,
      zIndex: 1,
    },
    diffInner: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      paddingRight: 18,
    },
    diffLeft: { flexDirection: "row", alignItems: "center", flex: 1, gap: 12 },
    diffIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.secondaryBg,
      alignItems: "center",
      justifyContent: "center",
    },
    diffText: { flex: 1 },
    diffTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    diffTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
      flexShrink: 1,
    },
    recoBadge: {
      backgroundColor: theme.accentAlpha15,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    recoText: {
      color: theme.accent,
      fontSize: 8,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.5,
    },
    diffDesc: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 3,
    },
    previewCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 18,
      marginTop: 20,
    },
    previewLabel: {
      color: theme.accent,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    previewDesc: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 19,
      marginTop: 10,
    },
    bold: {
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      color: theme.textPrimary,
    },
    bottomBtns: { marginTop: 28, gap: 12 },
    changeModeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 14,
    },
    changeModeText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    continueBtn: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
    },
    continueBtnDisabled: { opacity: 0.4 },
    continueBtnText: {
      color: theme.background,
      fontSize: 15,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    resumeBackdrop: {
      flex: 1,
      backgroundColor: theme.overlayGlass,
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    resumeCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: theme.elevated,
      borderRadius: 20,
      padding: 20,
      alignItems: "center",
    },
    resumeTitle: {
      color: theme.accent,
      fontSize: 12,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 2,
      textAlign: "center",
    },
    resumeBody: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 10,
      lineHeight: 18,
    },
    resumePrimaryBtn: {
      width: "100%",
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 18,
    },
    resumePrimaryText: {
      color: theme.background,
      fontSize: 13,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    resumeSecondaryBtn: {
      width: "100%",
      marginTop: 10,
      paddingVertical: 14,
      alignItems: "center",
      borderRadius: 14,
      backgroundColor: theme.secondaryBg,
    },
    resumeSecondaryText: {
      color: theme.textPrimary,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
  });
