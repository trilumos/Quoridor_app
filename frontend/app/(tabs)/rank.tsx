import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../src/theme/colors";
import { useGameContext } from "../../src/storage/GameContext";

const LEADERBOARD = [
  { rank: 1, name: "PHANTOM_K", rating: 2340, wins: 312, streak: 15 },
  { rank: 2, name: "ZERO_WALL", rating: 2285, wins: 290, streak: 8 },
  { rank: 3, name: "XENON_72", rating: 2201, wins: 267, streak: 12 },
  { rank: 4, name: "DARK_BISHOP", rating: 2180, wins: 245, streak: 5 },
  { rank: 5, name: "MAZE_RUNNER", rating: 2095, wins: 198, streak: 3 },
  { rank: 6, name: "GRID_MASTER", rating: 2010, wins: 175, streak: 7 },
  { rank: 7, name: "WALL_SAGE", rating: 1980, wins: 160, streak: 4 },
  { rank: 8, name: "PATH_FINDER", rating: 1920, wins: 142, streak: 2 },
];

export default function RankScreen() {
  const { stats } = useGameContext();

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        <View style={st.headerArea}>
          <Text style={st.label}>GLOBAL RANKINGS</Text>
          <Text style={st.heading}>LEADERBOARD</Text>
        </View>

        {/* Your Rank Card */}
        <View style={st.yourRankCard}>
          <View style={st.yourRankPinstripe} />
          <View style={st.yourRankContent}>
            <View style={st.yourRankLeft}>
              <Text style={st.yourRankLabel}>YOUR RANK</Text>
              <Text style={st.yourRankNumber}>#247</Text>
            </View>
            <View style={st.yourRankRight}>
              <View style={st.yourRankStat}>
                <Text style={st.yourRankStatLabel}>RATING</Text>
                <Text style={st.yourRankStatValue}>{stats.rating}</Text>
              </View>
              <View style={st.yourRankStat}>
                <Text style={st.yourRankStatLabel}>WINS</Text>
                <Text style={st.yourRankStatValue}>{stats.totalWins}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Leaderboard List */}
        <View style={st.listArea}>
          {LEADERBOARD.map((entry, i) => (
            <View key={entry.rank} style={st.listItem}>
              <View style={st.rankBadge}>
                <Text style={[st.rankText, i < 3 && st.rankTextTop]}>
                  {entry.rank}
                </Text>
              </View>
              <View style={st.listInfo}>
                <Text style={st.listName}>{entry.name}</Text>
                <Text style={st.listMeta}>
                  {entry.wins} wins · {entry.streak} streak
                </Text>
              </View>
              <Text style={st.listRating}>{entry.rating}</Text>
            </View>
          ))}
        </View>

        {stats.totalGames === 0 && (
          <View style={st.emptyState}>
            <Ionicons
              name="trophy-outline"
              size={40}
              color={COLORS.textSecondary}
            />
            <Text style={st.emptyTitle}>NO RANKING YET</Text>
            <Text style={st.emptyDesc}>
              Play games to earn your position on the leaderboard.
            </Text>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: 20 },
  headerArea: { marginTop: 20, marginBottom: 20 },
  label: {
    color: COLORS.accent,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 2,
  },
  heading: {
    color: COLORS.textPrimary,
    fontSize: 32,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
    marginTop: 4,
  },
  yourRankCard: {
    backgroundColor: COLORS.elevated,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
  },
  yourRankPinstripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: COLORS.accent,
  },
  yourRankContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
  },
  yourRankLeft: {},
  yourRankLabel: {
    color: COLORS.accent,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  yourRankNumber: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
    marginTop: 2,
  },
  yourRankRight: { flexDirection: "row", gap: 20 },
  yourRankStat: { alignItems: "flex-end" },
  yourRankStatLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 1,
  },
  yourRankStatValue: {
    color: COLORS.textPrimary,
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    marginTop: 2,
  },
  listArea: { marginTop: 20 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.secondaryBg,
    alignItems: "center",
    justifyContent: "center",
  },
  rankText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  rankTextTop: { color: COLORS.accent },
  listInfo: { flex: 1 },
  listName: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  listMeta: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  listRating: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
  },
  emptyState: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 16,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
    letterSpacing: 2,
  },
  emptyDesc: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
