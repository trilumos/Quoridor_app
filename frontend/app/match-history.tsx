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
import { getThemeColors } from "../src/theme/colors";
import { StorageService } from "../src/storage/StorageService";
import { useAuthStore } from "../src/store/authStore";
import { useGameContext } from "../src/storage/GameContext";

type MatchLogEntry = { num: number; type: string; detail: string };
type MatchHistoryEntry = {
  id: string;
  mode?: "ai" | "local" | string;
  difficulty?: string;
  result?: "WIN" | "LOSS" | "win" | "loss";
  played_at_ms?: number;
  duration_seconds?: number;
  moves_made?: number;
  walls_placed?: number;
  walls_used_p1?: number;
  walls_used_p2?: number;
  created_at?: string;
  date?: string;
  opponent?: string;
  player_name?: string;
  winner_index?: 0 | 1;
  move_log?: MatchLogEntry[];
  moves?: number;
  walls?: number;
};

function formatRelativeTime(input?: number | string): string {
  if (input === undefined || input === null) return "Unknown";
  const then = typeof input === "number" ? input : new Date(input).getTime();
  if (!Number.isFinite(then)) return "Unknown";

  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "Just now";

  const units: { label: string; seconds: number }[] = [
    { label: "year", seconds: 365 * 24 * 60 * 60 },
    { label: "month", seconds: 30 * 24 * 60 * 60 },
    { label: "week", seconds: 7 * 24 * 60 * 60 },
    { label: "day", seconds: 24 * 60 * 60 },
    { label: "hour", seconds: 60 * 60 },
    { label: "minute", seconds: 60 },
  ];

  for (const unit of units) {
    if (diffSec >= unit.seconds) {
      const value = Math.floor(diffSec / unit.seconds);
      return `${value} ${unit.label}${value === 1 ? "" : "s"} ago`;
    }
  }

  return "Just now";
}

function parseLegacyDateToMs(date?: string): number | undefined {
  if (!date) return undefined;
  const normalized = date.trim().toLowerCase();
  const now = Date.now();

  if (normalized === "yesterday") {
    return now - 24 * 60 * 60 * 1000;
  }

  const match = normalized.match(
    /^(\d+)\s+(minute|minutes|hour|hours|day|days|week|weeks|month|months|year|years)\s+ago$/,
  );
  if (!match) return undefined;

  const value = Number(match[1]);
  const unit = match[2];
  if (!Number.isFinite(value) || value <= 0) return undefined;

  const unitMs: Record<string, number> = {
    minute: 60 * 1000,
    minutes: 60 * 1000,
    hour: 60 * 60 * 1000,
    hours: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    year: 365 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
  };

  return now - value * unitMs[unit];
}

function normalizeHistoryEntry(
  entry: MatchHistoryEntry,
  index: number,
): MatchHistoryEntry | null {
  const rawResult = (entry.result || "").toString().toUpperCase();
  const result: "WIN" | "LOSS" = rawResult === "WIN" ? "WIN" : "LOSS";

  const normalizedDifficulty = (entry.difficulty || "")
    .toString()
    .toUpperCase();
  const normalizedMode =
    entry.mode === "ai" || entry.mode === "local"
      ? entry.mode
      : normalizedDifficulty
        ? "ai"
        : "local";

  const derivedMsFromCreatedAt = entry.created_at
    ? new Date(entry.created_at).getTime()
    : undefined;
  const legacyMs = parseLegacyDateToMs(entry.date);
  const playedAtMs =
    typeof entry.played_at_ms === "number"
      ? entry.played_at_ms
      : Number.isFinite(derivedMsFromCreatedAt)
        ? (derivedMsFromCreatedAt as number)
        : legacyMs;

  if (!playedAtMs || !Number.isFinite(playedAtMs)) return null;
  const createdAt = new Date(playedAtMs).toISOString();

  const playerName = entry.player_name || "Player 1";
  const opponentName =
    entry.opponent || (normalizedMode === "ai" ? "Strategic AI" : "Player 2");
  const winnerIndex = entry.winner_index ?? (result === "WIN" ? 0 : 1);

  return {
    ...entry,
    id: entry.id || `${new Date(createdAt).getTime()}-${index}`,
    mode: normalizedMode,
    difficulty: normalizedMode === "ai" ? normalizedDifficulty : "",
    result,
    played_at_ms: playedAtMs,
    created_at: createdAt,
    player_name: playerName,
    opponent: opponentName,
    winner_index: winnerIndex === 1 ? 1 : 0,
    duration_seconds: entry.duration_seconds ?? 0,
    moves_made: entry.moves_made ?? entry.moves ?? 0,
    walls_placed: entry.walls_placed ?? entry.walls ?? 0,
    walls_used_p1:
      entry.walls_used_p1 ?? entry.walls_placed ?? entry.walls ?? 0,
    walls_used_p2: entry.walls_used_p2 ?? 0,
  };
}

function formatDuration(totalSec: number): string {
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export default function MatchHistoryScreen() {
  const router = useRouter();
  const { settings } = useGameContext();
  const { user } = useAuthStore();
  const [matches, setMatches] = useState<MatchHistoryEntry[]>([]);
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);

  useFocusEffect(
    useCallback(() => {
      const loadHistory = async () => {
        if (!user?.id) {
          setMatches([]);
          return;
        }
        const historyKey = `${StorageService.KEYS.GAME_HISTORY}:${user.id}`;
        const history =
          (await StorageService.get<MatchHistoryEntry[]>(historyKey)) || [];
        const normalized = history
          .map((entry, index) => normalizeHistoryEntry(entry, index))
          .filter((entry): entry is MatchHistoryEntry => !!entry);

        // Persist migrated history so old cards are permanently fixed.
        if (
          normalized.length !== history.length ||
          JSON.stringify(normalized) !== JSON.stringify(history)
        ) {
          await StorageService.set(historyKey, normalized.slice(0, 100));
        }

        setMatches(normalized);
      };

      loadHistory();
    }, [user?.id]),
  );

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={st.backBtn}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        <Text style={st.label}>VAULT ACTIVITY</Text>
        <Text style={st.heading}>MATCH HISTORY</Text>

        {matches.length === 0 ? (
          <View style={st.emptyState}>
            <View style={st.emptyIcon}>
              <Ionicons
                name="game-controller-outline"
                size={40}
                color={theme.textSecondary}
              />
            </View>
            <Text style={st.emptyTitle}>NO MATCHES YET</Text>
            <Text style={st.emptyDesc}>
              Complete your first game to start building your match history.
            </Text>
            <TouchableOpacity
              style={st.emptyBtn}
              onPress={() => router.replace("/mode-select" as never)}
              activeOpacity={0.85}
            >
              <Text style={st.emptyBtnText}>PLAY NOW</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={st.list}>
            {matches.map((match, index) => {
              const entryId =
                match.id || `${match.created_at || "legacy"}-${index}`;
              const result =
                ((match.result || "LOSS") as string).toUpperCase() === "WIN"
                  ? "WIN"
                  : "LOSS";
              const inferredLocalFromOpponent =
                !!match.opponent && !/ai/i.test(match.opponent);
              const isLocal =
                match.mode === "local" ||
                (!match.mode && inferredLocalFromOpponent);
              const p1Name = match.player_name || "Player 1";
              const p2Name = match.opponent || "Player 2";
              const p1Walls = match.walls_used_p1 ?? match.walls_placed ?? 0;
              const p2Walls = match.walls_used_p2 ?? 0;
              const winnerName = isLocal
                ? match.winner_index === 1
                  ? p2Name
                  : p1Name
                : result === "WIN"
                  ? p1Name
                  : p2Name;
              const loserName = winnerName === p1Name ? p2Name : p1Name;
              return (
                <TouchableOpacity
                  key={entryId}
                  style={st.matchCard}
                  activeOpacity={0.8}
                  onPress={() =>
                    router.push({
                      pathname: "/match-result",
                      params: { id: entryId },
                    } as never)
                  }
                >
                  {!isLocal && result === "WIN" && (
                    <View style={st.matchPinstripe} />
                  )}
                  <View style={st.matchHeader}>
                    <View
                      style={[
                        st.resultBadge,
                        isLocal
                          ? st.localBadge
                          : result === "WIN"
                            ? st.winBadge
                            : st.lossBadge,
                      ]}
                    >
                      <Text
                        style={[
                          st.resultText,
                          isLocal
                            ? st.localText
                            : result === "WIN"
                              ? st.winText
                              : st.lossText,
                        ]}
                      >
                        {isLocal
                          ? "MULTIPLAYER"
                          : result === "WIN"
                            ? "VICTORY"
                            : "DEFEAT"}
                      </Text>
                    </View>
                    <Text style={st.matchDate}>
                      {formatRelativeTime(
                        match.played_at_ms ?? match.created_at,
                      )}
                    </Text>
                  </View>

                  <View style={st.metaRow}>
                    <Text style={st.metaText}>
                      {match.mode === "ai"
                        ? `AI ${match.difficulty || ""}`
                        : "MULTIPLAYER"}
                    </Text>
                    <Text style={st.metaText}>
                      DURATION {formatDuration(match.duration_seconds || 0)}
                    </Text>
                  </View>

                  <View style={st.matchDetails}>
                    <View style={st.matchDetail}>
                      <Text style={st.matchDetailLabel}>
                        {isLocal ? "WINNER" : "OPPONENT"}
                      </Text>
                      <Text style={st.matchDetailValue}>
                        {isLocal ? winnerName : match.opponent || "Unknown"}
                      </Text>
                    </View>
                    <View style={st.matchDetail}>
                      <Text style={st.matchDetailLabel}>
                        {isLocal ? "LOSER" : "MOVES"}
                      </Text>
                      <Text style={st.matchDetailValue}>
                        {isLocal ? loserName : (match.moves_made ?? 0)}
                      </Text>
                    </View>
                    <View style={st.matchDetail}>
                      <Text style={st.matchDetailLabel}>
                        {isLocal ? "WALLS USED (P1/P2)" : "WALLS USED (YOU)"}
                      </Text>
                      <Text style={st.matchDetailValue}>
                        {isLocal ? `${p1Walls}/${p2Walls}` : `${p1Walls}`}
                      </Text>
                    </View>
                  </View>

                  {!!match.move_log?.length && (
                    <TouchableOpacity
                      style={st.logToggle}
                      activeOpacity={0.7}
                      onPress={() =>
                        setExpandedMatchId(
                          expandedMatchId === entryId ? null : entryId,
                        )
                      }
                    >
                      <Text style={st.logToggleText}>
                        {expandedMatchId === entryId ? "HIDE LOG" : "VIEW LOG"}
                      </Text>
                      <Ionicons
                        name={
                          expandedMatchId === entryId
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={14}
                        color={theme.accent}
                      />
                    </TouchableOpacity>
                  )}

                  {expandedMatchId === entryId && !!match.move_log?.length && (
                    <View style={st.logArea}>
                      {match.move_log.slice(0, 10).map((entry) => (
                        <Text
                          key={`${entryId}-${entry.num}`}
                          style={st.logLine}
                        >
                          {entry.num}. {entry.type}: {entry.detail}
                        </Text>
                      ))}
                      {match.move_log.length > 10 && (
                        <Text style={st.logMore}>
                          ...and {match.move_log.length - 10} more moves
                        </Text>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 20 },
    backBtn: { width: 44, height: 44, justifyContent: "center", marginTop: 8 },
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
      marginBottom: 20,
    },
    emptyState: { alignItems: "center", paddingVertical: 48 },
    emptyIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.elevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    emptyTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 2,
    },
    emptyDesc: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 8,
      lineHeight: 19,
      paddingHorizontal: 20,
    },
    emptyBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 32,
      marginTop: 24,
    },
    emptyBtnText: {
      color: theme.background,
      fontSize: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    list: { gap: 10 },
    matchCard: {
      backgroundColor: theme.elevated,
      borderRadius: 12,
      padding: 16,
      overflow: "hidden",
      position: "relative",
    },
    matchPinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.accent,
    },
    matchHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    resultBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    localBadge: { backgroundColor: theme.accentAlpha15 },
    winBadge: { backgroundColor: theme.successAlpha12 },
    lossBadge: { backgroundColor: theme.errorAlpha12 },
    resultText: {
      fontSize: 10,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    localText: { color: theme.accent },
    winText: { color: theme.success },
    lossText: { color: theme.error },
    matchDate: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 10,
    },
    metaText: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    matchDetails: { flexDirection: "row", marginTop: 12, gap: 16 },
    matchDetail: {},
    matchDetailLabel: {
      color: theme.textSecondary,
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    matchDetailValue: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      marginTop: 2,
    },
    logToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 12,
    },
    logToggleText: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    logArea: {
      backgroundColor: theme.surfaceLowest,
      borderRadius: 8,
      padding: 10,
      marginTop: 8,
      gap: 4,
    },
    logLine: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
    },
    logMore: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      marginTop: 4,
    },
  });
