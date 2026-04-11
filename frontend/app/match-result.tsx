import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useFocusEffect, useRouter } from "expo-router";
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
  created_at?: string;
  opponent?: string;
  player_name?: string;
  winner_index?: 0 | 1;
  move_log?: MatchLogEntry[];
};

function formatDuration(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDate(iso?: string): string {
  if (!iso) return "Unknown date";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "Unknown date";
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MatchResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);
  const [entry, setEntry] = useState<MatchHistoryEntry | null>(null);

  const recordId = (params.id as string) || "";

  useFocusEffect(
    useCallback(() => {
      const load = async () => {
        if (!user?.id || !recordId) {
          setEntry(null);
          return;
        }

        const historyKey = `${StorageService.KEYS.GAME_HISTORY}:${user.id}`;
        const history =
          (await StorageService.get<MatchHistoryEntry[]>(historyKey)) || [];
        const found = history.find((h) => h.id === recordId) || null;
        setEntry(found);
      };

      load();
    }, [recordId, user?.id]),
  );

  const view = useMemo(() => {
    if (!entry) return null;

    const mode = entry.mode === "local" ? "local" : "ai";
    const result =
      ((entry.result || "LOSS") as string).toUpperCase() === "WIN"
        ? "WIN"
        : "LOSS";
    const p1 = entry.player_name || "Player 1";
    const p2 = entry.opponent || (mode === "ai" ? "AI" : "Player 2");
    const winnerName =
      mode === "local"
        ? entry.winner_index === 1
          ? p2
          : p1
        : result === "WIN"
          ? p1
          : p2;
    const loserName = winnerName === p1 ? p2 : p1;

    return {
      mode,
      result,
      p1,
      p2,
      winnerName,
      loserName,
      moves: entry.moves_made ?? 0,
      walls: entry.walls_placed ?? 0,
      duration: entry.duration_seconds ?? 0,
      difficulty: (entry.difficulty || "").toUpperCase(),
      createdAt: entry.created_at,
      log: entry.move_log || [],
    };
  }, [entry]);

  if (!view) {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.loadingWrap}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={st.backBtn}
            activeOpacity={0.7}
          >
            <Ionicons
              name="arrow-back"
              size={22}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
          <Text style={st.loadingTitle}>MATCH NOT FOUND</Text>
          <Text style={st.loadingDesc}>
            This record may have been deleted or migrated.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isAi = view.mode === "ai";
  const isVictory = view.result === "WIN";

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={st.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        <View style={st.hero}>
          <View
            style={[
              st.heroIconWrap,
              isAi
                ? isVictory
                  ? st.heroWinBg
                  : st.heroLossBg
                : st.heroLocalBg,
            ]}
          >
            <Ionicons
              name={isAi ? (isVictory ? "trophy" : "close-circle") : "people"}
              size={46}
              color={
                isAi
                  ? isVictory
                    ? theme.success
                    : theme.error
                  : theme.accent
              }
            />
          </View>

          <Text style={st.heroTitle}>
            {isAi
              ? isVictory
                ? "VICTORY"
                : "DEFEAT"
              : `${view.winnerName.toUpperCase()} WON`}
          </Text>
          <Text style={st.heroSub}>
            {isAi
              ? `vs ${view.p2}`
              : `${view.winnerName} defeated ${view.loserName}`}
          </Text>
        </View>

        <View style={st.card}>
          <Text style={st.cardTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>MATCH SUMMARY</Text>
          <View style={st.row}>
            <Text style={st.label}>Mode</Text>
            <Text style={st.value}>{isAi ? "AI" : "Multiplayer"}</Text>
          </View>
          {isAi && (
            <View style={st.row}>
              <Text style={st.label}>Difficulty</Text>
              <Text style={st.value}>{view.difficulty || "N/A"}</Text>
            </View>
          )}
          <View style={st.row}>
            <Text style={st.label}>Duration</Text>
            <Text style={st.value}>{formatDuration(view.duration)}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Moves</Text>
            <Text style={st.value}>{view.moves}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Walls Placed</Text>
            <Text style={st.value}>{view.walls}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Played On</Text>
            <Text style={st.value}>{formatDate(view.createdAt)}</Text>
          </View>
        </View>

        <View style={st.card}>
          <Text style={st.cardTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>PLAYERS</Text>
          <View style={st.row}>
            <Text style={st.label}>Player 1</Text>
            <Text style={st.value}>{view.p1}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Player 2</Text>
            <Text style={st.value}>{view.p2}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label} numberOfLines={1}>Winner</Text>
            <Text style={st.value} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{view.winnerName}</Text>
          </View>
          <View style={st.row}>
            <Text style={st.label}>Loser</Text>
            <Text style={st.value}>{view.loserName}</Text>
          </View>
        </View>

        <View style={st.card}>
          <Text style={st.cardTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>MOVE LOG ({view.log.length})</Text>
          {view.log.length === 0 ? (
            <Text style={st.emptyLog}>
              No move log available for this record.
            </Text>
          ) : (
            view.log.map((entry) => (
              <Text
                key={`${entry.num}-${entry.type}-${entry.detail}`}
                style={st.logLine}
              >
                {entry.num}. {entry.type}: {entry.detail}
              </Text>
            ))
          )}
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
  loadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  loadingTitle: {
    color: theme.textPrimary,
    fontSize: 22,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
    letterSpacing: 1.5,
    marginTop: 12,
  },
  loadingDesc: {
    color: theme.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    textAlign: "center",
  },
  backBtn: { width: 44, height: 44, justifyContent: "center", marginTop: 8 },
  hero: { alignItems: "center", marginTop: 8, marginBottom: 16 },
  heroIconWrap: {
    width: 112,
    height: 112,
    borderRadius: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  heroWinBg: { backgroundColor: theme.successAlpha12 },
  heroLossBg: { backgroundColor: theme.errorAlpha12 },
  heroLocalBg: { backgroundColor: theme.accentAlpha15 },
  heroTitle: {
    color: theme.textPrimary,
    fontSize: 28,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 16,
    textAlign: "center",
  },
  heroSub: {
    color: theme.textSecondary,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 6,
    textAlign: "center",
  },
  card: {
    backgroundColor: theme.elevated,
    borderRadius: 14,
    padding: 16,
    marginTop: 10,
  },
  cardTitle: {
    color: theme.accent,
    fontSize: 11,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
    letterSpacing: 1.6,
    marginBottom: 10,
    flexShrink: 1,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  label: {
    color: theme.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  value: {
    color: theme.textPrimary,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    maxWidth: "55%",
    textAlign: "right",
    flexShrink: 1,
  },
  emptyLog: {
    color: theme.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  logLine: {
    color: theme.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
});
