import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";
import { useAuthStore } from "../src/store/authStore";
import { FeedbackService } from "../src/services/FeedbackService";

export default function SettingsScreen() {
  const router = useRouter();
  const { settings, updateSettings } = useGameContext();
  const { profile } = useAuthStore();
  const theme = getThemeColors(settings.darkMode);
  const st = createStyles(theme);

  const handleSoundToggle = (v: boolean) => {
    updateSettings({ soundEnabled: v });
    FeedbackService.configure({ soundEnabled: v });
    if (v) void FeedbackService.selection();
  };

  const handleHapticsToggle = (v: boolean) => {
    updateSettings({ hapticsEnabled: v });
    FeedbackService.configure({ hapticsEnabled: v });
    if (v) void FeedbackService.selection();
  };

  const handleThemeToggle = (isLight: boolean) => {
    updateSettings({ darkMode: !isLight });
    void FeedbackService.selection();
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={st.backBtn}
          activeOpacity={0.6}
        >
          <Ionicons name="arrow-back" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        <Text style={st.pageTitle}>SETTINGS</Text>
        <Text style={st.pageSubtitle}>CONFIGURATION INTERFACE</Text>

        <Text style={st.sectionLabel}>ACCOUNT</Text>
        <View style={st.card}>
          <TouchableOpacity
            style={st.settingsRow}
            activeOpacity={0.6}
            onPress={() => router.push("/me" as never)}
          >
            <View style={st.avatarCircle}>
              {profile?.avatar_url ? (
                <ExpoImage
                  source={{ uri: profile.avatar_url }}
                  style={st.avatarImage}
                  contentFit="cover"
                />
              ) : (
                <Ionicons name="person" size={22} color={theme.textSecondary} />
              )}
            </View>
            <View style={st.rowInfo}>
              <Text style={st.rowTitle}>Profile</Text>
              <Text style={st.rowSub}>View and edit profile</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <View style={st.card}>
          <TouchableOpacity
            style={st.settingsRow}
            activeOpacity={0.6}
            onPress={() => router.push("/subscription" as never)}
          >
            <View
              style={[st.iconCircle, { backgroundColor: theme.accentAlpha15 }]}
            >
              <Ionicons name="diamond-outline" size={18} color={theme.accent} />
            </View>
            <View style={st.rowInfo}>
              <Text style={st.rowTitle}>Subscription</Text>
              <Text style={st.rowSub}>View subscription status</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <Text style={st.sectionLabel}>PREFERENCES</Text>
        <View style={st.card}>
          <View style={st.settingsRow}>
            <View style={st.iconCircle}>
              <Ionicons
                name="volume-high-outline"
                size={18}
                color={theme.textPrimary}
              />
            </View>
            <View style={st.rowInfo}>
              <Text style={st.rowTitle}>Sound Effects</Text>
            </View>
            <Switch
              value={settings.soundEnabled}
              onValueChange={handleSoundToggle}
              trackColor={{
                false: "rgba(255,255,255,0.08)",
                true: theme.accent,
              }}
              thumbColor={
                Platform.OS === "android" ? theme.textPrimary : undefined
              }
            />
          </View>
        </View>
        <View style={st.card}>
          <View style={st.settingsRow}>
            <View style={st.iconCircle}>
              <Ionicons
                name="phone-portrait-outline"
                size={18}
                color={theme.textPrimary}
              />
            </View>
            <View style={st.rowInfo}>
              <Text style={st.rowTitle}>Haptic Feedback</Text>
            </View>
            <Switch
              value={settings.hapticsEnabled}
              onValueChange={handleHapticsToggle}
              trackColor={{
                false: "rgba(255,255,255,0.08)",
                true: theme.accent,
              }}
              thumbColor={
                Platform.OS === "android" ? theme.textPrimary : undefined
              }
            />
          </View>
        </View>
        <View style={st.card}>
          <View style={st.settingsRow}>
            <View style={st.iconCircle}>
              <Ionicons
                name="moon-outline"
                size={18}
                color={theme.textPrimary}
              />
            </View>
            <View style={st.rowInfo}>
              <Text style={st.rowTitle}>Light Theme</Text>
            </View>
            <Switch
              value={!settings.darkMode}
              onValueChange={handleThemeToggle}
              trackColor={{
                false: "rgba(255,255,255,0.08)",
                true: theme.accent,
              }}
              thumbColor={
                Platform.OS === "android" ? theme.textPrimary : undefined
              }
            />
          </View>
        </View>

        <Text style={st.sectionLabel}>ABOUT</Text>
        <View style={st.card}>
          <TouchableOpacity style={st.settingsRow} activeOpacity={0.6}>
            <View style={st.rowInfo}>
              <Text style={st.rowTitle}>Privacy Policy</Text>
            </View>
            <Ionicons
              name="open-outline"
              size={16}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <View style={st.card}>
          <TouchableOpacity style={st.settingsRow} activeOpacity={0.6}>
            <View style={st.rowInfo}>
              <Text style={st.rowTitle}>Terms of Service</Text>
            </View>
            <Ionicons
              name="open-outline"
              size={16}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>
        <View style={st.card}>
          <View style={st.settingsRow}>
            <View style={st.rowInfo}>
              <Text style={st.rowTitle}>Version</Text>
            </View>
            <Text style={st.versionText}>2.4.0 (Gold)</Text>
          </View>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 20, paddingBottom: 32 },
    backBtn: { width: 44, height: 44, justifyContent: "center", marginTop: 8 },
    pageTitle: {
      color: theme.spaceTextPrimary,
      fontSize: 34,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 12,
    },
    pageSubtitle: {
      color: theme.spaceTextSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
      marginTop: 4,
    },
    sectionLabel: {
      color: theme.accent,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
      marginTop: 28,
      marginBottom: 10,
    },
    card: {
      backgroundColor: theme.elevated,
      borderRadius: 12,
      marginBottom: 8,
      overflow: "hidden",
      borderWidth: 0,
      borderColor: theme.border,
    },
    settingsRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 14,
      gap: 12,
    },
    avatarCircle: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.secondaryBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1.5,
      borderColor: "rgba(233, 106, 0, 0.55)",
      overflow: "hidden",
    },
    avatarImage: { width: 42, height: 42, borderRadius: 21 },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: theme.secondaryBg,
      alignItems: "center",
      justifyContent: "center",
    },
    rowInfo: { flex: 1 },
    rowTitle: {
      color: theme.textPrimary,
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
    },
    rowSub: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    versionText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
  });
