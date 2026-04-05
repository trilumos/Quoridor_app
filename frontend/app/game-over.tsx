import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { getThemeColors } from "../src/theme/colors";
import { StorageService } from "../src/storage/StorageService";
import PrimaryButton from "../src/components/PrimaryButton";
import { useGameContext } from "../src/storage/GameContext";

type ExportLogEntry = { num: number; type: string; detail: string };

type PlayerSummary = {
  index: number;
  name: string;
  moves: number;
  wallsPlaced: number;
  wallsRemaining: number;
  timeRemainingSec?: number;
};

type ExportPayload = {
  mode: string;
  difficulty: string;
  startTime: number;
  durationSec: number;
  winner: number | null;
  players: [PlayerSummary, PlayerSummary];
  timeLimitSec: number;
  moveLog: ExportLogEntry[];
};

function formatClock(totalSec: number): string {
  const clamped = Math.max(0, totalSec);
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function GameOverScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { width } = useWindowDimensions();
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const st = useMemo(() => createStyles(theme), [theme]);

  const [payload, setPayload] = useState<ExportPayload | null>(null);
  const [activeTab, setActiveTab] = useState<0 | 1>(0);
  const [toast, setToast] = useState("");
  const statsScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      const stored = await StorageService.get<ExportPayload>(
        StorageService.KEYS.LAST_GAME_EXPORT,
      );
      if (!mounted) return;

      if (stored) {
        setPayload(stored);
        return;
      }

      const fallbackWinner = Number(params.winner ?? 0);
      const fallback: ExportPayload = {
        mode: (params.mode as string) || "local",
        difficulty: (params.difficulty as string) || "N/A",
        startTime: Date.now(),
        durationSec: Number(params.time || 0),
        winner: Number.isNaN(fallbackWinner) ? null : fallbackWinner,
        players: [
          {
            index: 0,
            name: (params.p1Name as string) || "Player 1",
            moves: Number(params.moves1 || 0),
            wallsPlaced: Number(params.walls1 || 0),
            wallsRemaining: 10 - Number(params.walls1 || 0),
          },
          {
            index: 1,
            name: (params.p2Name as string) || "Player 2",
            moves: Number(params.moves2 || 0),
            wallsPlaced: Number(params.walls2 || 0),
            wallsRemaining: 10 - Number(params.walls2 || 0),
          },
        ],
        timeLimitSec: 0,
        moveLog: [],
      };

      setPayload(fallback);
    };

    load();

    return () => {
      mounted = false;
    };
  }, [params]);

  const winnerName = useMemo(() => {
    if (!payload || payload.winner === null) return "DRAW";
    return payload.players[payload.winner]?.name || "WINNER";
  }, [payload]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const handleTabPress = (index: 0 | 1) => {
    setActiveTab(index);
    statsScrollRef.current?.scrollTo({
      x: index * (width - 32),
      animated: true,
    });
  };

  const handleStatsScrollEnd = (e: any) => {
    const pageWidth = width - 32;
    const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setActiveTab(page === 1 ? 1 : 0);
  };

  const handleDownloadPdf = async () => {
    if (!payload) return;

    try {
      const rows = payload.moveLog
        .map(
          (m) =>
            `<tr><td>${m.num}</td><td>${escapeHtml(m.type)}</td><td>${escapeHtml(m.detail)}</td></tr>`,
        )
        .join("");

      const html = `
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; color: #111; padding: 24px; }
              h1 { margin: 0 0 6px 0; font-size: 22px; }
              p { margin: 4px 0; font-size: 12px; }
              table { width: 100%; border-collapse: collapse; margin-top: 16px; }
              th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
              th { background: #f5f5f5; }
            </style>
          </head>
          <body>
            <h1>Quoridor Match Export</h1>
            <p><strong>Winner:</strong> ${escapeHtml(winnerName)}</p>
            <p><strong>Mode:</strong> ${escapeHtml(payload.mode)}</p>
            <p><strong>Players:</strong> ${escapeHtml(payload.players[0].name)} vs ${escapeHtml(payload.players[1].name)}</p>
            <p><strong>Duration:</strong> ${payload.durationSec}s</p>
            <p><strong>Time Control:</strong> ${payload.timeLimitSec > 0 ? `${payload.timeLimitSec / 60} min` : "Unlimited"}</p>
            <p><strong>Total Logged Actions:</strong> ${payload.moveLog.length}</p>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Action</th>
                  <th>Move Detail</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Download match data",
          UTI: ".pdf",
        });
        showToast("Match data exported.");
      } else {
        showToast(`PDF created: ${uri}`);
      }
    } catch {
      showToast("Failed to export match data.");
    }
  };

  if (!payload) {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.loadingWrap}>
          <Text style={st.loadingText}>Loading match summary...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tabWidth = (width - 64) / 2;

  return (
    <SafeAreaView style={st.container}>
      <View style={st.wrap}>
        <Text style={st.title}>GAME OVER</Text>
        <Text style={st.winner}>{winnerName} WINS</Text>
        <Text style={st.meta}>
          TIME TAKEN: {formatClock(payload.durationSec)}
        </Text>
        <Text style={st.meta}>
          TIME CONTROL:{" "}
          {payload.timeLimitSec > 0
            ? `${payload.timeLimitSec / 60} MIN`
            : "UNLIMITED"}
        </Text>

        <View style={st.tabRow}>
          <TouchableOpacity
            style={st.tabBtn}
            onPress={() => handleTabPress(0)}
            activeOpacity={0.8}
          >
            <Text style={[st.tabText, activeTab === 0 && st.tabTextActive]}>
              {payload.players[0].name}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={st.tabBtn}
            onPress={() => handleTabPress(1)}
            activeOpacity={0.8}
          >
            <Text style={[st.tabText, activeTab === 1 && st.tabTextActive]}>
              {payload.players[1].name}
            </Text>
          </TouchableOpacity>
          <View
            style={[
              st.tabIndicator,
              {
                width: tabWidth,
                transform: [{ translateX: activeTab * tabWidth }],
              },
            ]}
          />
        </View>

        <ScrollView
          ref={statsScrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleStatsScrollEnd}
          style={st.statsPager}
        >
          {payload.players.map((p, i) => (
            <View key={p.index} style={[st.statCard, { width: width - 32 }]}>
              <Text style={st.cardTitle}>PLAYER {i + 1} STATS</Text>
              <View style={st.statRow}>
                <Text style={st.statLabel}>Moves</Text>
                <Text style={st.statValue}>{p.moves}</Text>
              </View>
              <View style={st.statRow}>
                <Text style={st.statLabel}>Walls Placed</Text>
                <Text style={st.statValue}>{p.wallsPlaced}</Text>
              </View>
              <View style={st.statRow}>
                <Text style={st.statLabel}>Walls Remaining</Text>
                <Text style={st.statValue}>{p.wallsRemaining}</Text>
              </View>
              <View style={st.statRow}>
                <Text style={st.statLabel}>Clock</Text>
                <Text style={st.statValue}>
                  {payload.timeLimitSec > 0
                    ? formatClock(p.timeRemainingSec || 0)
                    : "Unlimited"}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        <PrimaryButton
          title="DOWNLOAD MATCH DATA"
          onPress={handleDownloadPdf}
        />

        <TouchableOpacity
          style={st.homeBtn}
          onPress={() => router.replace("/(tabs)" as never)}
          activeOpacity={0.8}
        >
          <Text style={st.homeText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>

      {toast !== "" && (
        <View style={st.toast}>
          <Text style={st.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    wrap: { flex: 1, paddingHorizontal: 16, paddingBottom: 16 },
    title: {
      marginTop: 18,
      color: theme.textPrimary,
      fontSize: 26,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 2,
      textAlign: "center",
    },
    winner: {
      marginTop: 10,
      color: theme.accent,
      fontSize: 20,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      textAlign: "center",
    },
    meta: {
      marginTop: 6,
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      textAlign: "center",
      letterSpacing: 1,
    },
    tabRow: {
      marginTop: 18,
      flexDirection: "row",
      backgroundColor: theme.elevated,
      borderRadius: 10,
      padding: 4,
      position: "relative",
      overflow: "hidden",
    },
    tabBtn: { flex: 1, paddingVertical: 10, alignItems: "center", zIndex: 2 },
    tabText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    tabTextActive: { color: theme.accent },
    tabIndicator: {
      position: "absolute",
      left: 4,
      top: 4,
      bottom: 4,
      borderRadius: 8,
      backgroundColor: "rgba(255,122,0,0.12)",
    },
    statsPager: { marginTop: 14, marginBottom: 18 },
    statCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 16,
      marginRight: 8,
    },
    cardTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
      marginBottom: 10,
    },
    statRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 7,
    },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.7,
    },
    statValue: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    homeBtn: {
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.accent,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
    },
    homeText: {
      color: theme.accent,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    toast: {
      position: "absolute",
      bottom: 70,
      alignSelf: "center",
      backgroundColor: theme.elevated,
      borderRadius: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    toastText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
    },
    loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      fontWeight: "500",
    },
  });
