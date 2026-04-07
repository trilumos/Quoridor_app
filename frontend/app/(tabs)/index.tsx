import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { getThemeColors } from "../../src/theme/colors";
import { useGameContext } from "../../src/storage/GameContext";
import { useAuthStore } from "../../src/store/authStore";
import { useStatsStore } from "../../src/store/statsStore";
import {
  AiDifficulty,
  AiPerformanceSummary,
  StatsService,
} from "../../src/services/StatsService";

function formatDuration(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  const units: Array<{ label: string; seconds: number }> = [
    { label: "y", seconds: 365 * 24 * 60 * 60 },
    { label: "mo", seconds: 30 * 24 * 60 * 60 },
    { label: "w", seconds: 7 * 24 * 60 * 60 },
    { label: "d", seconds: 24 * 60 * 60 },
    { label: "h", seconds: 60 * 60 },
    { label: "m", seconds: 60 },
  ];

  for (const unit of units) {
    if (clamped >= unit.seconds) {
      return `${Math.floor(clamped / unit.seconds)}${unit.label}`;
    }
  }

  return `${clamped}s`;
}

export default function HomeScreen() {
  const router = useRouter();
  const { settings, stats: ctxStats } = useGameContext();
  const { user, profile } = useAuthStore();
  const { stats: supaStats } = useStatsStore();
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "easy",
  );
  const [aiPerformance, setAiPerformance] =
    useState<AiPerformanceSummary | null>(null);

  const theme = getThemeColors(settings.darkMode);
  const s = useMemo(
    () => createStyles(theme, settings.darkMode),
    [theme, settings.darkMode],
  );

  useFocusEffect(
    useCallback(() => {
      const loadAiPerformance = async () => {
        if (!user?.id) {
          setAiPerformance(null);
          return;
        }
        const performance = await StatsService.getAiPerformance(user.id);
        setAiPerformance(performance);
      };

      loadAiPerformance();
    }, [user?.id]),
  );

  const fallbackTotalWins = supaStats?.total_wins ?? ctxStats.totalWins;
  const fallbackTotalGames = supaStats?.total_games ?? ctxStats.totalGames;

  const selectedBucket =
    aiPerformance?.by_difficulty[difficulty.toUpperCase() as AiDifficulty];
  const totalGames = selectedBucket?.total_games ?? fallbackTotalGames;
  const totalWins = selectedBucket?.total_wins ?? fallbackTotalWins;
  const winRate =
    totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const averageDuration =
    selectedBucket && selectedBucket.total_games > 0
      ? Math.round(
          selectedBucket.total_duration_seconds / selectedBucket.total_games,
        )
      : 0;
  const averageDurationLabel = formatDuration(averageDuration);

  const difficultyLabel = difficulty.toUpperCase();

  return (
    <SafeAreaView
      edges={["top", "left", "right"]}
      style={[s.container, { backgroundColor: theme.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.gridIcon}>
              <View style={s.gridDot} />
              <View style={s.gridDot} />
              <View style={s.gridDot} />
              <View style={s.gridDot} />
            </View>
            <Text style={s.logoText}>QUORIDOR</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/me" as never)}
            activeOpacity={0.7}
          >
            {profile?.avatar_url ? (
              <ExpoImage
                source={{ uri: profile.avatar_url }}
                style={s.profileImage}
                contentFit="cover"
              />
            ) : (
              <View style={s.profileFallback}>
                <Ionicons name="person" size={20} color={theme.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={s.heroSection}>
          <Text style={s.heroLabel}>STRATEGY ARENA</Text>
          <Text style={s.heroTitle}>{"COMMAND THE\nBOARD."}</Text>
          <TouchableOpacity
            testID="start-game-btn"
            style={s.startBtn}
            activeOpacity={0.85}
            onPress={() => router.push("/mode-select" as never)}
          >
            <Text style={s.startBtnText}>START GAME</Text>
            <Ionicons name="play" size={18} color={theme.background} />
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>VS AI PERFORMANCE</Text>
          <View style={s.difficultyRow}>
            {(["easy", "medium", "hard"] as const).map((value) => {
              const active = value === difficulty;
              return (
                <TouchableOpacity
                  key={value}
                  style={[s.difficultyChip, active && s.difficultyChipActive]}
                  onPress={() => setDifficulty(value)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[s.difficultyText, active && s.difficultyTextActive]}
                  >
                    {value.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.statsGrid}>
            <View style={s.statCell}>
              <Text style={s.statLabel}>TOTAL GAMES</Text>
              <Text style={s.statValue}>{totalGames}</Text>
              <Text style={s.statSub}>{`AT ${difficultyLabel}`}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>TOTAL WINS</Text>
              <Text style={s.statValue}>{totalWins}</Text>
              <Text style={s.statSub}>{`AT ${difficultyLabel}`}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>WIN PERCENTAGE</Text>
              <Text style={s.statValue}>{winRate}%</Text>
              <View style={s.statBarTrack}>
                <View
                  style={[
                    s.statBarFill,
                    { width: `${Math.max(0, Math.min(winRate, 100))}%` },
                  ]}
                />
              </View>
              <Text style={s.statSub}>{`AT ${difficultyLabel}`}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>AVERAGE DURATION</Text>
              <Text style={s.statValue}>{averageDurationLabel}</Text>
              <Text style={s.statSub}>TO COMPLETE A GAME</Text>
            </View>
          </View>
        </View>

        <Text style={s.dividerLabel}>TRAINING GROUNDS</Text>
        <TouchableOpacity
          style={s.trainingCard}
          activeOpacity={0.7}
          onPress={() => router.push("/trainer" as never)}
        >
          <View style={s.trainingContent}>
            <Text style={s.eliteLabel}>RULES & STRATEGY</Text>
            <Text style={s.trainingTitle}>Mastering the game</Text>
            <Text style={s.trainingDesc}>
              Study openings, wall economy, and endgame paths to outplay every
              difficulty.
            </Text>
            <View style={s.readLink}>
              <Text style={s.readLinkText}>Open Training</Text>
              <Ionicons name="arrow-forward" size={16} color={theme.accent} />
            </View>
          </View>
        </TouchableOpacity>

        <Text style={s.dividerLabel}>QUICK ACTIONS</Text>
        <View style={s.quickRow}>
          <TouchableOpacity
            style={s.quickCard}
            onPress={() => router.push("/achievements" as never)}
            activeOpacity={0.7}
          >
            <Ionicons name="ribbon-outline" size={22} color={theme.accent} />
            <Text style={s.quickTitle}>Achievements</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickCard}
            onPress={() => router.push("/match-history" as never)}
            activeOpacity={0.7}
          >
            <Ionicons name="time-outline" size={22} color={theme.accent} />
            <Text style={s.quickTitle}>Match History</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (
  theme: ReturnType<typeof getThemeColors>,
  darkMode: boolean,
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingHorizontal: 20 },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 10,
      paddingBottom: 4,
    },
    logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    gridIcon: {
      width: 24,
      height: 24,
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 2,
    },
    gridDot: {
      width: 10,
      height: 10,
      borderRadius: 1.5,
      backgroundColor: theme.accent,
    },
    logoText: {
      color: theme.textPrimary,
      fontSize: 18,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 3,
    },
    profileImage: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.border,
    },
    profileFallback: {
      width: 38,
      height: 38,
      borderRadius: 19,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.elevated,
    },
    heroSection: { marginTop: 26 },
    heroLabel: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    heroTitle: {
      color: theme.textPrimary,
      fontSize: 38,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      lineHeight: 44,
      marginTop: 8,
    },
    startBtn: {
      backgroundColor: theme.accent,
      borderRadius: 20,
      paddingVertical: 22,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      marginTop: 24,
    },
    startBtnText: {
      color: theme.background,
      fontSize: 16,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    card: {
      backgroundColor: theme.elevated,
      borderRadius: 20,
      padding: 20,
      marginTop: 18,
    },
    sectionTitle: {
      color: theme.accent,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    difficultyRow: {
      flexDirection: "row",
      backgroundColor: darkMode ? "#23262E" : theme.surfaceElevated,
      borderRadius: 16,
      marginTop: 14,
      padding: 4,
      gap: 6,
    },
    difficultyChip: {
      flex: 1,
      borderRadius: 12,
      paddingVertical: 10,
      alignItems: "center",
    },
    difficultyChipActive: { backgroundColor: theme.accent },
    difficultyText: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.2,
    },
    difficultyTextActive: { color: theme.background },
    statsGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 18 },
    statCell: { width: "50%", paddingVertical: 14, paddingRight: 12 },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.5,
    },
    statValue: {
      color: theme.textPrimary,
      fontSize: 34,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 2,
      lineHeight: 40,
    },
    statSub: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
      marginTop: 4,
      letterSpacing: 0.5,
    },
    statBarTrack: {
      width: 52,
      height: 4,
      borderRadius: 2,
      marginTop: 8,
      backgroundColor: darkMode ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.14)",
      overflow: "hidden",
    },
    statBarFill: { height: 4, borderRadius: 2, backgroundColor: theme.accent },
    dividerLabel: {
      color: theme.accent,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
      marginTop: 32,
      marginBottom: 4,
    },
    trainingCard: {
      backgroundColor: theme.elevated,
      borderRadius: 20,
      overflow: "hidden",
      marginTop: 12,
    },
    trainingContent: { padding: 20 },
    eliteLabel: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    trainingTitle: {
      color: theme.textPrimary,
      fontSize: 22,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      lineHeight: 28,
      marginTop: 8,
    },
    trainingDesc: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      lineHeight: 19,
      marginTop: 8,
    },
    readLink: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 14,
    },
    readLinkText: {
      color: theme.accent,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    quickRow: { flexDirection: "row", gap: 12, marginTop: 12 },
    quickCard: {
      flex: 1,
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 18,
      alignItems: "center",
      gap: 8,
    },
    quickTitle: {
      color: theme.textPrimary,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
  });
