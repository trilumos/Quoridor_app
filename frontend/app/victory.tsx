import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../src/theme/colors";
import PrimaryButton from "../src/components/PrimaryButton";
import GhostButton from "../src/components/GhostButton";
import { useGameContext } from "../src/storage/GameContext";
import { useAuthStore } from "../src/store/authStore";

export default function VictoryScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const { settings } = useGameContext();
  const { profile } = useAuthStore();
  const theme = getThemeColors(settings.darkMode);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const winner = Number(params.winner || 0);
  const p1Name = (params.p1Name as string) || profile?.username || "Player 1";
  const p2Name = (params.p2Name as string) || "Player 2";
  const moves1 = Number(params.moves1 || 0);
  const moves2 = Number(params.moves2 || 0);
  const walls1 = Number(params.walls1 || 0);
  const walls2 = Number(params.walls2 || 0);
  const timeSec = Number(params.time || 0);
  const mode = (params.mode as string) || "ai";
  const difficulty = (params.difficulty as string) || "";

  const winnerName = winner === 0 ? p1Name : p2Name;
  const winnerColor = winner === 0 ? theme.player1 : theme.player2;
  const loserName = winner === 0 ? p2Name : p1Name;
  const winnerMoves = winner === 0 ? moves1 : moves2;
  const loserMoves = winner === 0 ? moves2 : moves1;
  const winnerWalls = winner === 0 ? walls1 : walls2;
  const mins = Math.floor(timeSec / 60);
  const secs = timeSec % 60;
  const titleText =
    mode === "ai" ? "YOU WIN" : `${winnerName.toUpperCase()} WINS`;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <SafeAreaView testID="victory-screen" style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        {/* Trophy */}
        <View
          style={[
            styles.trophyGlow,
            {
              backgroundColor:
                winnerColor === theme.player1
                  ? theme.player1Glow
                  : theme.player2Glow,
            },
          ]}
        >
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={48} color={winnerColor} />
          </View>
        </View>

        {/* Winner text */}
        <Text style={styles.winnerName}>{titleText}</Text>
        <Text style={styles.winsLabel}>MATCH COMPLETE</Text>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.cardHeader}>GAME STATS</Text>
          <View style={[styles.winnerBadge, { borderColor: winnerColor }]}>
            <View
              style={[styles.playerDot, { backgroundColor: winnerColor }]}
            />
            <Text style={styles.winnerBadgeLabel}>{winnerName}</Text>
          </View>

          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>YOUR MOVES</Text>
            <Text style={styles.statValue}>{winnerMoves}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>WALLS LEFT</Text>
            <Text style={styles.statValue}>{winnerWalls}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>
              {mode === "ai" ? "AI MOVES" : `${loserName.toUpperCase()} MOVES`}
            </Text>
            <Text style={styles.statValue}>{loserMoves}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>MATCH TIME</Text>
            <Text style={styles.statValueLarge}>
              {mins}:{secs.toString().padStart(2, "0")}
            </Text>
          </View>
          {mode === "ai" && (
            <>
              <View style={styles.divider} />
              <View style={styles.statsRow}>
                <Text style={styles.statLabel}>DIFFICULTY</Text>
                <Text style={styles.statValue}>
                  {(difficulty || "AI").toString().toUpperCase()}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Buttons */}
        <View style={styles.buttons}>
          <PrimaryButton
            testID="play-again-btn"
            title="PLAY AGAIN"
            onPress={() => {
              if (mode === "ai") {
                router.replace({
                  pathname: "/game",
                  params: {
                    mode: "ai",
                    difficulty,
                    p1Name,
                    p2Name,
                    p1Color: theme.player1,
                    p2Color: theme.player2,
                  },
                } as never);
              } else {
                router.replace({
                  pathname: "/game",
                  params: {
                    mode: "local",
                    p1Name,
                    p2Name,
                    p1Color: theme.player1,
                    p2Color: theme.player2,
                  },
                } as never);
              }
            }}
          />
          <GhostButton
            testID="home-btn"
            title="HOME"
            onPress={() => router.replace("/(tabs)" as never)}
          />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    trophyGlow: {
      width: 120,
      height: 120,
      borderRadius: 60,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    trophyCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.elevated,
      alignItems: "center",
      justifyContent: "center",
    },
    winnerName: {
      color: theme.spaceTextPrimary,
      fontSize: 28,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 3,
      textAlign: "center",
    },
    winsLabel: {
      color: theme.spaceTextSecondary,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 3,
      marginTop: 4,
    },
    statsCard: {
      backgroundColor: theme.elevated,
      borderRadius: 16,
      padding: 20,
      width: "100%",
      marginTop: 32,
    },
    cardHeader: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.5,
      marginBottom: 10,
    },
    winnerBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 8,
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 10,
      backgroundColor: theme.secondaryBg,
    },
    winnerBadgeLabel: {
      color: theme.textPrimary,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    statsRow: {
      paddingVertical: 4,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: 8,
    },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
    },
    playerDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    statValue: {
      color: theme.textPrimary,
      fontSize: 16,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    statValueLarge: {
      color: theme.textPrimary,
      fontSize: 20,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    buttons: {
      width: "100%",
      marginTop: 32,
      gap: 8,
    },
  });
