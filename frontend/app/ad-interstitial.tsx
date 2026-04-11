import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";

export default function AdInterstitialScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { resetAdCounter, isPremium, settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);
  const [countdown, setCountdown] = useState(5);
  const [canSkip, setCanSkip] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const returnTo = (params.returnTo as string) || "/(tabs)";
  const returnParams = useMemo(() => {
    const next = { ...params } as Record<string, unknown>;
    delete next.returnTo;
    return next;
  }, [params]);

  useEffect(() => {
    if (isPremium) {
      resetAdCounter();
      router.replace({
        pathname: returnTo as never,
        params: returnParams,
      } as never);
      return;
    }

    intervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanSkip(true);
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPremium, resetAdCounter, returnTo, returnParams, router]);

  const handleSkip = () => {
    resetAdCounter();
    router.replace({
      pathname: returnTo as never,
      params: returnParams,
    } as never);
  };

  return (
    <SafeAreaView style={st.container}>
      <View style={st.inner}>
        {/* Mock Ad Content */}
        <View style={st.adArea}>
          <View style={st.adPlaceholder}>
            <View style={st.adGrid}>
              {Array.from({ length: 16 }).map((_, i) => (
                <View key={i} style={st.adGridCell} />
              ))}
            </View>
            <Text style={st.adLabel}>ADVERTISEMENT</Text>
            <Text style={st.adTitle}>AD BREAK{`\n`}REMOVE ADS</Text>
            <Text style={st.adDesc}>Remove ads from the app and keep playing uninterrupted.</Text>
          </View>
        </View>

        {/* Bottom Controls */}
        <View style={st.controls}>
          {canSkip ? (
            <TouchableOpacity
              style={st.skipBtn}
              onPress={handleSkip}
              activeOpacity={0.85}
            >
              <Text style={st.skipBtnText}>SKIP AD</Text>
            </TouchableOpacity>
          ) : (
            <View style={st.countdownArea}>
              <View style={st.countdownCircle}>
                <Text style={st.countdownText}>{countdown}</Text>
              </View>
              <Text style={st.countdownLabel}>AD ENDS IN {countdown}s</Text>
            </View>
          )}

          <TouchableOpacity
            style={st.removeBtn}
            onPress={() => router.push("/paywall" as never)}
            activeOpacity={0.7}
          >
            <Text style={st.removeBtnText}>REMOVE ADS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  inner: { flex: 1, justifyContent: "space-between" },
  adArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  adPlaceholder: {
    width: "100%",
    backgroundColor: theme.elevated,
    borderRadius: 14,
    padding: 32,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    minHeight: 280,
  },
  adGrid: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    width: 100,
    opacity: 0.06,
  },
  adGridCell: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: theme.accent,
  },
  adLabel: {
    color: theme.textSecondary,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 2,
  },
  adTitle: {
    color: theme.textPrimary,
    fontSize: 28,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 34,
    marginTop: 12,
  },
  adDesc: {
    color: theme.textSecondary,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  controls: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  skipBtn: {
    backgroundColor: theme.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: "center",
  },
  skipBtnText: {
    color: theme.background,
    fontSize: 15,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
    letterSpacing: 1,
  },
  countdownArea: { alignItems: "center", gap: 8 },
  countdownCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.elevated,
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    color: theme.textPrimary,
    fontSize: 20,
    fontFamily: "Inter_800ExtraBold",
    fontWeight: "800",
  },
  countdownLabel: {
    color: theme.textSecondary,
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 1,
  },
  removeBtn: {
    backgroundColor: theme.secondaryBg,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  removeBtnText: {
    color: theme.textPrimary,
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
    letterSpacing: 1,
  },
});