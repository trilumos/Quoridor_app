import React, { useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";
import { showInterstitial, showRewarded } from "../src/lib/ads";

export default function AdInterstitialScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { resetAdCounter, isPremium, settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);

  const returnTo = (params.returnTo as string) || "/(tabs)";
  const adType = (params.adType as string) || "interstitial";

  const returnParams = useMemo(() => {
    const next = { ...params } as Record<string, unknown>;
    delete next.returnTo;
    delete next.adType;
    return next;
  }, [params]);

  const navigateAway = () => {
    resetAdCounter();
    router.replace({
      pathname: returnTo as never,
      params: returnParams,
    } as never);
  };

  useEffect(() => {
    // Premium users skip all ads
    if (isPremium) {
      navigateAway();
      return;
    }

    const isRewarded =
      adType === "rewarded_continue" ||
      adType === "rewarded_undo" ||
      adType === "rewarded_unlimited";

    if (isRewarded) {
      showRewarded(() => {
        navigateAway();
      });
    } else {
      showInterstitial(() => {
        navigateAway();
      });
    }
  }, []);

  return (
    <SafeAreaView style={st.container}>
      <View style={st.inner}>
        <ActivityIndicator size="large" color={theme.accent} />
        <Text style={st.loadingText}>Loading ad...</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    inner: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 16,
    },
    loadingText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      letterSpacing: 0.5,
    },
  });