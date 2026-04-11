import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { showInterstitial } from "../src/lib/ads";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../src/theme/colors";
import PrimaryButton from "../src/components/PrimaryButton";
import GhostButton from "../src/components/GhostButton";
import { useGameContext } from "../src/storage/GameContext";

export default function DefeatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const { settings, isPremium } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const p1Name = (params.p1Name as string) || "Player 1";
  const p2Name = (params.p2Name as string) || "Player 2";
  const moves1 = Number(params.moves1 || 0);
  const walls1 = Number(params.walls1 || 0);
  const p1Color = (params.p1Color as string) || "";
  const p2Color = (params.p2Color as string) || "";
  const timeSec = Number(params.time || 0);
  const mode = (params.mode as string) || "ai";
  const difficulty = (params.difficulty as string) || "";
  const mins = Math.floor(timeSec / 60);
  const secs = timeSec % 60;

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
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <View style={styles.iconGlow}>
          <View style={styles.iconCircle}>
            <Ionicons name="close-circle" size={48} color={theme.error} />
          </View>
        </View>

        <Text style={styles.title}>DEFEATED</Text>
        <Text style={styles.subtitle}>ANALYZE & ADAPT</Text>

        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>YOUR MOVES</Text>
            <Text style={styles.statValue}>{moves1}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>WALLS PLACED</Text>
            <Text style={styles.statValue}>{walls1}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statsRow}>
            <Text style={styles.statLabel}>TIME</Text>
            <Text style={styles.statValue}>
              {mins}:{secs.toString().padStart(2, "0")}
            </Text>
          </View>
        </View>

        <View style={styles.buttons}>
          <PrimaryButton
            title="TRY AGAIN"
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
          {!isPremium && mode === "ai" && (
            <View style={styles.rewardedWrap}>
              <Text style={styles.rewardedHint}>WANT TO CONTINUE FROM LAST MOVE?</Text>
              <TouchableOpacity
                style={styles.rewardedBtn}
                onPress={() => {
                  showInterstitial(() => {
                    router.replace({
                      pathname: "/game",
                      params: {
                        adType: "rewarded_continue",
                        mode: "ai",
                        difficulty,
                        p1Name,
                        p2Name,
                        p1Color,
                        p2Color,
                        undoMoves: "5",
                        resume: "false",
                      },
                    } as never);
                  });
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.rewardedBtnText}>
                  WATCH AD TO CONTINUE
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <GhostButton
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
    container: { flex: 1, backgroundColor: theme.background },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    iconGlow: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: theme.errorAlpha12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.elevated,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      color: theme.spaceTextPrimary,
      fontSize: 28,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 3,
      textAlign: "center",
    },
    subtitle: {
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
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 8,
    },
    divider: { height: 1, backgroundColor: theme.border, marginVertical: 4 },
    statLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    statValue: {
      color: theme.textPrimary,
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    rewardedBtn: {
      width: "100%",
      backgroundColor: theme.accentAlpha15,
      borderRadius: 14,
      paddingVertical: 16,
      alignItems: "center",
      borderWidth: 1,
      borderColor: theme.borderFocus,
    },
    rewardedWrap: {
      width: "100%",
      gap: 6,
    },
    rewardedHint: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
      textAlign: "center",
    },
    rewardedBtnText: {
      color: theme.accent,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    buttons: { width: "100%", marginTop: 32, gap: 8 },
  });
