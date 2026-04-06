import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from "react-native";
import { useRouter } from "expo-router";
import { getThemeColors } from "../src/theme/colors";
import { StorageService } from "../src/storage/StorageService";
import { useAuthStore } from "../src/store/authStore";
import { useGameContext } from "../src/storage/GameContext";
import { AuthService } from "../src/services/AuthService";

export default function SplashScreen() {
  const router = useRouter();
  const { isLoading, profile, isAuthenticated } = useAuthStore();
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);

  const [promptReady, setPromptReady] = useState(false);
  const [promptSeen, setPromptSeen] = useState<boolean | null>(null);
  const [freshInstallHandled, setFreshInstallHandled] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const logoRotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Splash screen animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: showSplash ? 1 : 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: showSplash ? 1 : 0.9,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoRotateAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      ),
    ]).start();
  }, [showSplash, fadeAnim, scaleAnim, logoRotateAnim, pulseAnim]);

  // Auto-dismiss splash after 1.6s and proceed with auth flow
  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 1600);

    return () => clearTimeout(splashTimer);
  }, []);

  // Navigation logic (after splash fades)
  useEffect(() => {
    if (!showSplash && isLoading || !promptReady || promptSeen === null) return;

    if (!isAuthenticated && !freshInstallHandled) {
      setFreshInstallHandled(true);
      const anonSession = AuthService.createDemoSession();
      void (async () => {
        try {
          await AuthService.setSession(anonSession);
          const { user: currentUser } = useAuthStore.getState();
          if (!currentUser) {
            useAuthStore.setState({
              user: anonSession.user,
              session: anonSession,
              isAuthenticated: true,
            });
          }
          await useAuthStore.getState().fetchProfile();
          router.replace({
            pathname: "/edit-profile",
            params: { firstRun: "true" },
          } as never);
        } catch (err) {
          console.warn("Fresh install setup failed:", err);
        }
      })();
      return;
    }

    if (!showSplash && isAuthenticated) {
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
        void StorageService.set(
          StorageService.KEYS.USERNAME_PROMPT_SEEN,
          true
        );
      }

      router.replace("/(tabs)" as never);
    }
  }, [
    showSplash,
    isLoading,
    promptReady,
    promptSeen,
    isAuthenticated,
    profile,
    router,
    freshInstallHandled,
  ]);

  const rotation = logoRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const st = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
    },
    splashContent: {
      alignItems: "center",
      justifyContent: "center",
    },
    logoContainer: {
      width: 120,
      height: 120,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 32,
    },
    logo: {
      width: 100,
      height: 100,
      justifyContent: "center",
      alignItems: "center",
    },
    gridCell: {
      width: 28,
      height: 28,
      backgroundColor: theme.accent,
      borderRadius: 6,
      margin: 4,
      opacity: 0.9,
    },
    gridRow: {
      flexDirection: "row",
    },
    titleText: {
      fontSize: 42,
      fontWeight: "800",
      color: theme.textPrimary,
      letterSpacing: 3,
      marginBottom: 12,
      fontFamily: "Inter_800ExtraBold",
    },
    subtitleText: {
      fontSize: 13,
      color: theme.textSecondary,
      letterSpacing: 2,
      fontWeight: "600",
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
    },
    accentLine: {
      width: 80,
      height: 2,
      backgroundColor: theme.accent,
      marginTop: 16,
      borderRadius: 1,
    },
  });

  return (
    <View style={st.container}>
      {showSplash && (
        <Animated.View
          style={[
            st.splashContent,
            {
              opacity: fadeAnim,
              transform: [
                { scale: scaleAnim },
                { scale: pulseAnim },
              ],
            },
          ]}
        >
          {/* Animated Logo Grid */}
          <View style={st.logoContainer}>
            <Animated.View
              style={[
                st.logo,
                {
                  transform: [{ rotate: rotation }],
                },
              ]}
            >
              <View style={st.gridRow}>
                <View style={st.gridCell} />
                <View style={st.gridCell} />
              </View>
              <View style={st.gridRow}>
                <View style={st.gridCell} />
                <View style={st.gridCell} />
              </View>
            </Animated.View>
          </View>

          {/* App Title */}
          <Text style={st.titleText}>QUORIDOR</Text>
          <Text style={st.subtitleText}>Strategy Board Game</Text>

          {/* Accent Line */}
          <View style={st.accentLine} />
        </Animated.View>
      )}
    </View>
  );
}
