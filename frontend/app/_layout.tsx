import React, { useEffect } from "react";
import { Platform } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import * as NavigationBar from "expo-navigation-bar";
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
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthProvider>
      <GameProvider>
        <SafeAreaProvider>
          <StoreInitializer />
          <AppNavigator />
        </SafeAreaProvider>
      </GameProvider>
    </AuthProvider>
  );
}

function AppNavigator() {
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const syncAndroidNavBar = async () => {
      await NavigationBar.setPositionAsync("relative");
      await NavigationBar.setBehaviorAsync("inset-swipe");
      await NavigationBar.setBackgroundColorAsync(
        settings.darkMode ? "#121212" : "#F6F4F1",
      );
      await NavigationBar.setButtonStyleAsync(
        settings.darkMode ? "light" : "dark",
      );
    };

    void syncAndroidNavBar();
  }, [settings.darkMode]);

  return (
    <>
      <StatusBar style={settings.darkMode ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: theme.background },
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
        <Stack.Screen name="subscription" />
        <Stack.Screen name="ad-interstitial" />
        <Stack.Screen name="daily-puzzle" />
      </Stack>
    </>
  );
}
