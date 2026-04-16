import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Stack, usePathname } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as NavigationBar from "expo-navigation-bar";
import * as SystemUI from "expo-system-ui";
import {
  useFonts,
  Inter_400Regular,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from "@expo-google-fonts/inter";
import { GameProvider, useGameContext } from "../src/storage/GameContext";
import { AuthProvider } from "../src/storage/AuthContext";
import { useAuthStore } from "../src/store/authStore";
import { useStatsStore } from "../src/store/statsStore";
import { useGameStore } from "../src/store/gameStore";
import { getThemeColors } from "../src/theme/colors";
import AchievementToast from "../src/components/AchievementToast";
import ThemedBackground from "../src/components/ThemedBackground";
import { initializeAds } from "../src/lib/ads";
import { BillingService } from "../src/services/BillingService";
import { setAdsDisabled } from "../src/lib/ADManager";

SplashScreen.preventAutoHideAsync();

function StoreInitializer() {
  const { initialize, isAuthenticated, isLoading, user } = useAuthStore();
  const { fetchStats, fetchAchievements, reset: resetStats } = useStatsStore();
  const { loadSavedGame, reset: resetGame } = useGameStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      fetchStats(user.id);
      fetchAchievements(user.id);
      loadSavedGame(user.id);
    } else if (!isAuthenticated) {
      resetStats();
      resetGame();
    }
  }, [
    isAuthenticated,
    isLoading,
    user,
    fetchStats,
    fetchAchievements,
    loadSavedGame,
    resetStats,
    resetGame,
  ]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  useEffect(() => {
    initializeAds();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <GameProvider>
        <SafeAreaProvider>
          <StoreInitializer />
          <AppContent />
        </SafeAreaProvider>
      </GameProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { loaded, setPremium } = useGameContext();

  // Init billing once GameContext is loaded so setPremium is ready
  useEffect(() => {
    if (!loaded) return;

    BillingService.init(() => {
      // Called on startup if already purchased, or right after a new purchase
      setPremium(true);
      setAdsDisabled(true);
    });

    return () => {
      BillingService.destroy();
    };
  }, [loaded, setPremium]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <>
      <AppNavigator />
      <AchievementToastHost />
    </>
  );
}

function AppNavigator() {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const syncAndroidNavBar = async () => {
      const navColor = theme.background;
      const navButtonStyle = settings.darkMode ? "light" : "dark";

      try { await SystemUI.setBackgroundColorAsync(navColor); } catch {}
      try { await NavigationBar.setPositionAsync("relative"); } catch {}
      try { await NavigationBar.setBehaviorAsync("inset-swipe"); } catch {}
      try { await NavigationBar.setBackgroundColorAsync(navColor); } catch {}
      try { await NavigationBar.setBorderColorAsync(navColor); } catch {}
      try { await NavigationBar.setButtonStyleAsync(navButtonStyle); } catch {}
      try { await NavigationBar.setVisibilityAsync("visible"); } catch {}
    };

    void syncAndroidNavBar();
  }, [settings.darkMode, theme.background]);

  return (
    <>
      <ThemedBackground theme={theme} />
      <StatusBar
        style={settings.darkMode ? "light" : "dark"}
        backgroundColor={theme.background}
        translucent={false}
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="mode-select" />
        <Stack.Screen name="pregame-ai" />
        <Stack.Screen name="pregame-local" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="game" />
        <Stack.Screen name="victory" />
        <Stack.Screen name="defeat" />
        <Stack.Screen name="trainer" />
        <Stack.Screen name="achievements" />
        <Stack.Screen name="match-history" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="ad-interstitial" />
        <Stack.Screen name="game-over" />
        <Stack.Screen name="match-result" />
      </Stack>
    </>
  );
}

function AchievementToastHost() {
  const {
    homeAchievementQueue,
    resultAchievementQueue,
    clearAchievementQueue,
  } = useGameContext();
  const pathname = usePathname();

  const isHomeScreen =
    pathname === "/" || pathname === "/(tabs)" || pathname === "/index";
  const isResultScreen = ["/victory", "/defeat", "/game-over", "/match-result"].includes(
    pathname,
  );

  if (isHomeScreen && homeAchievementQueue.length > 0) {
    return (
      <AchievementToast
        queue={homeAchievementQueue}
        onComplete={() => clearAchievementQueue("home")}
      />
    );
  }

  if (isResultScreen && resultAchievementQueue.length > 0) {
    return (
      <AchievementToast
        queue={resultAchievementQueue}
        onComplete={() => clearAchievementQueue("result")}
      />
    );
  }

  return null;
}
