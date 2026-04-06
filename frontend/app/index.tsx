import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { COLORS } from "../src/theme/colors";
import { StorageService } from "../src/storage/StorageService";
import { useAuthStore } from "../src/store/authStore";

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, profile, isAuthenticated } = useAuthStore();
  const [promptReady, setPromptReady] = useState(false);
  const [promptSeen, setPromptSeen] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    const loadPromptState = async () => {
      const seen = await StorageService.get<boolean>(
        StorageService.KEYS.USERNAME_PROMPT_SEEN,
      );
      if (!active) return;
      setPromptSeen(Boolean(seen));
      setPromptReady(true);
    };

    void loadPromptState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isLoading || !promptReady || promptSeen === null) return;

    if (!isAuthenticated) {
      router.replace("/login" as never);
      return;
    }

    if (!profile) return;

    const currentName = profile.username.trim();
    const needsNamePrompt = !currentName;

    if (needsNamePrompt) {
      router.replace({
        pathname: "/edit-profile",
        params: { firstRun: "true" },
      } as never);
      return;
    }

    if (!promptSeen) {
      void StorageService.set(StorageService.KEYS.USERNAME_PROMPT_SEEN, true);
    }

    router.replace("/(tabs)" as never);
  }, [isLoading, promptReady, promptSeen, isAuthenticated, profile, router]);

  return (
    <View testID="splash-screen" style={styles.container}>
      <ActivityIndicator size="small" color={COLORS.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
  },
});
