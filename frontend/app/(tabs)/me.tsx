import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { getThemeColors } from "../../src/theme/colors";
import { useGameContext } from "../../src/storage/GameContext";
import { useAuthStore } from "../../src/store/authStore";
import { useStatsStore } from "../../src/store/statsStore";
import {
  StatsService,
  AiPerformanceSummary,
  AiDifficulty,
} from "../../src/services/StatsService";

type AIDifficultyFilter = "EASY" | "MEDIUM" | "HARD";

const ACHIEVEMENT_MAP: Record<string, { name: string; desc: string }> = {
  first_victory: { name: "First Victory", desc: "Win your first game" },
  wall_master: { name: "Wall Master", desc: "Use all 10 walls and win" },
  speedrun: { name: "Speedrun", desc: "Win in 15 moves or fewer" },
  pacifist: { name: "Pacifist", desc: "Win without placing any walls" },
  strategist: { name: "Strategist", desc: "Beat Grandmaster AI" },
  dedicated: { name: "Dedicated", desc: "Play 25 games" },
  veteran: { name: "Veteran", desc: "Play 100 games" },
};

function formatDuration(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  if (clamped < 60) return `${clamped}s`;
  if (clamped < 3600) return `${Math.floor(clamped / 60)}m`;
  return `${Math.floor(clamped / 3600)}h`;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { settings } = useGameContext();
  const { profile, isPremium, user } = useAuthStore();
  const { achievements, fetchAchievements } = useStatsStore();
  const theme = getThemeColors(settings.darkMode);
  const st = useMemo(() => createStyles(theme), [theme]);
  const [difficultyFilter, setDifficultyFilter] =
    useState<AIDifficultyFilter>("EASY");
  const [aiPerformance, setAiPerformance] =
    useState<AiPerformanceSummary | null>(null);
  const [showMore, setShowMore] = useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);

  const displayName =
    profile?.username || user?.user_metadata?.display_name || "COMMANDER";
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "";

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        if (!user?.id) {
          setAiPerformance(null);
          return;
        }

        const performance = await StatsService.getAiPerformance(user.id);
        setAiPerformance(performance);
      };

      loadStats();
      if (user?.id) fetchAchievements(user.id);
    }, [fetchAchievements, user?.id]),
  );

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Please allow photo library access to set a profile picture.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.length) return;

    await useAuthStore.getState().updateAvatar(result.assets[0].uri);
    setShowAvatarViewer(false);
  };

  const selectedBucket =
    aiPerformance?.by_difficulty[difficultyFilter as AiDifficulty];
  const overallBucket = aiPerformance?.overall;
  const totalGames = selectedBucket?.total_games ?? 0;
  const totalWins = selectedBucket?.total_wins ?? 0;
  const avgTime =
    selectedBucket && selectedBucket.total_games > 0
      ? Math.round(
          selectedBucket.total_duration_seconds / selectedBucket.total_games,
        )
      : 0;
  const winRate =
    totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;
  const overallGames = overallBucket?.total_games ?? 0;

  return (
    <SafeAreaView style={[st.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        <View style={st.profileHeader}>
          <TouchableOpacity
            style={st.avatarCircle}
            activeOpacity={0.85}
            onPress={() => setShowAvatarViewer(true)}
          >
            {profile?.avatar_url ? (
              <ExpoImage
                source={{ uri: profile.avatar_url }}
                style={st.avatarImage}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="person" size={36} color={theme.textSecondary} />
            )}
          </TouchableOpacity>
          <Text style={[st.displayName, { color: theme.spaceTextPrimary }]}>
            {displayName.toUpperCase()}
          </Text>
          {isPremium && (
            <View style={st.premiumBadge}>
              <Ionicons name="diamond" size={12} color={theme.accent} />
              <Text style={st.premiumText}>PREMIUM</Text>
            </View>
          )}
          {memberSince ? (
            <Text style={[st.memberSince, { color: theme.spaceTextSecondary }]}>
              Member since {memberSince}
            </Text>
          ) : null}
          <TouchableOpacity
            style={st.editBtn}
            onPress={() => router.push("/edit-profile" as never)}
            activeOpacity={0.7}
          >
            <Text style={st.editBtnText}>EDIT PROFILE</Text>
          </TouchableOpacity>
        </View>

        <View style={st.statsCard}>
          <View style={st.statsHeader}>
            <Text style={st.statsTitle}>VS AI PERFORMANCE</Text>
            <View style={st.difficultyToggle}>
              {(["EASY", "MEDIUM", "HARD"] as AIDifficultyFilter[]).map(
                (level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      st.diffBtn,
                      difficultyFilter === level && st.diffBtnActive,
                    ]}
                    activeOpacity={0.8}
                    onPress={() => setDifficultyFilter(level)}
                  >
                    <Text
                      style={[
                        st.diffBtnText,
                        difficultyFilter === level && st.diffBtnTextActive,
                      ]}
                    >
                      {level}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>

          <View style={st.statsGrid}>
            <View style={st.statCell}>
              <Text style={st.statLabel}>TOTAL GAMES</Text>
              <Text style={st.statValue}>{totalGames}</Text>
              <Text style={st.statHint}>
                AT <Text style={st.statHintMode}>{difficultyFilter}</Text>
              </Text>
            </View>
            <View style={st.statCell}>
              <Text style={st.statLabel}>TOTAL WINS</Text>
              <Text style={st.statValue}>{totalWins}</Text>
              <Text style={st.statHint}>
                AT <Text style={st.statHintMode}>{difficultyFilter}</Text>
              </Text>
            </View>
            <View style={st.statCell}>
              <Text style={st.statLabel}>WIN PERCENTAGE</Text>
              <View style={st.statRow}>
                <Text style={st.statValue}>{winRate}%</Text>
                <View style={st.statBar} />
              </View>
              <Text style={st.statHint}>
                AT <Text style={st.statHintMode}>{difficultyFilter}</Text>
              </Text>
            </View>
            <View style={st.statCell}>
              <Text style={st.statLabel}>AVERAGE DURATION</Text>
              <Text style={[st.statValue, st.statValueCompact]}>
                {formatDuration(avgTime)}
              </Text>
              <Text style={st.statHint}>TO COMPLETE A GAME</Text>
            </View>
          </View>

          <TouchableOpacity
            style={st.moreBar}
            onPress={() => setShowMore((value) => !value)}
            activeOpacity={0.8}
          >
            <Text style={st.moreBarText}>
              {showMore ? "SHOW LESS" : "SHOW MORE"}
            </Text>
            <Ionicons
              name={showMore ? "chevron-up" : "chevron-down"}
              size={14}
              color={theme.accent}
            />
          </TouchableOpacity>

          {showMore && (
            <View style={st.moreGrid}>
              <View style={st.moreCell}>
                <Text style={st.statLabel}>TOTAL GAMES</Text>
                <Text style={st.moreSubtle}>ALL MODES</Text>
                <Text style={st.moreValue}>{overallGames}</Text>
              </View>
              <View style={st.moreCell}>
                <Text style={st.statLabel}>WIN RATE ({difficultyFilter})</Text>
                <Text style={st.moreValue}>{winRate}%</Text>
              </View>
              <View style={st.moreCell}>
                <Text style={st.statLabel}>
                  TOTAL DURATION ({difficultyFilter})
                </Text>
                <Text style={st.moreValue}>
                  {formatDuration(selectedBucket?.total_duration_seconds ?? 0)}
                </Text>
              </View>
            </View>
          )}
        </View>

        {achievements.length > 0 && (
          <View style={st.achSection}>
            <Text style={st.achTitle}>UNLOCKED ACHIEVEMENTS</Text>
            {achievements.map((key) => {
              const info = ACHIEVEMENT_MAP[key];
              if (!info) return null;
              return (
                <View key={key} style={st.achRow}>
                  <Ionicons name="ribbon" size={18} color={theme.accent} />
                  <View style={st.achInfo}>
                    <Text style={st.achName}>{info.name}</Text>
                    <Text style={st.achDesc}>{info.desc}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={st.menuGroup}>
          <TouchableOpacity
            style={st.menuItem}
            onPress={() => router.push("/achievements" as never)}
            activeOpacity={0.7}
          >
            <View style={st.menuIconWrap}>
              <Ionicons name="ribbon-outline" size={20} color={theme.accent} />
            </View>
            <View style={st.menuInfo}>
              <Text style={st.menuTitle}>Achievements</Text>
              <Text style={st.menuSub}>
                {achievements.length}/{Object.keys(ACHIEVEMENT_MAP).length}{" "}
                unlocked
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={st.menuItem}
            onPress={() => router.push("/match-history" as never)}
            activeOpacity={0.7}
          >
            <View style={st.menuIconWrap}>
              <Ionicons
                name="time-outline"
                size={20}
                color={theme.textPrimary}
              />
            </View>
            <View style={st.menuInfo}>
              <Text style={st.menuTitle}>Match History</Text>
              <Text style={st.menuSub}>View all AI and multiplayer logs</Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={st.menuItem}
            onPress={() =>
              router.push(
                isPremium ? ("/subscription" as never) : ("/paywall" as never),
              )
            }
            activeOpacity={0.7}
          >
            <View
              style={[
                st.menuIconWrap,
                { backgroundColor: theme.accentAlpha15 },
              ]}
            >
              <Ionicons name="diamond-outline" size={20} color={theme.accent} />
            </View>
            <View style={st.menuInfo}>
              <Text style={st.menuTitle}>
                {isPremium ? "Subscription" : "Go Premium"}
              </Text>
              <Text style={st.menuSub}>
                {isPremium ? "Manage your plan" : "Unlock all features"}
              </Text>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.textSecondary}
            />
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <Modal
        visible={showAvatarViewer}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAvatarViewer(false)}
      >
        <View style={st.avatarModalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setShowAvatarViewer(false)}
          />
          <View style={st.avatarModalCard}>
            <Text style={st.avatarModalTitle}>PROFILE IMAGE</Text>
            <View style={st.avatarModalPreviewWrap}>
              <View style={st.avatarModalPreview}>
                {profile?.avatar_url ? (
                  <ExpoImage
                    source={{ uri: profile.avatar_url }}
                    style={st.avatarModalImage}
                    contentFit="cover"
                  />
                ) : (
                  <Ionicons
                    name="person"
                    size={84}
                    color={theme.textSecondary}
                  />
                )}
              </View>
            </View>
            <TouchableOpacity
              style={st.avatarModalPrimaryBtn}
              activeOpacity={0.85}
              onPress={handlePickAvatar}
            >
              <Text style={st.avatarModalPrimaryText}>
                CHANGE PROFILE PICTURE
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={st.avatarModalSecondaryBtn}
              activeOpacity={0.8}
              onPress={() => setShowAvatarViewer(false)}
            >
              <Text style={st.avatarModalSecondaryText}>CLOSE</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 20 },
    profileHeader: { alignItems: "center", paddingTop: 24, paddingBottom: 20 },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.elevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      borderWidth: 2,
      borderColor: "rgba(233, 106, 0, 0.55)",
      overflow: "hidden",
    },
    avatarImage: { width: 80, height: 80, borderRadius: 40 },
    displayName: {
      color: theme.textPrimary,
      fontSize: 24,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 2,
    },
    premiumBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.accentAlpha15,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 8,
    },
    premiumText: {
      color: theme.accent,
      fontSize: 10,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    memberSince: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      marginTop: 6,
    },
    editBtn: {
      backgroundColor: theme.secondaryBg,
      borderRadius: 10,
      paddingHorizontal: 24,
      paddingVertical: 10,
      marginTop: 16,
    },
    editBtnText: {
      color: theme.textPrimary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    statsCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 14,
      marginTop: 8,
    },
    statsHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
      flexWrap: "wrap",
    },
    statsTitle: {
      color: theme.accent,
      fontSize: 12,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 2,
    },
    difficultyToggle: {
      flexDirection: "row",
      backgroundColor: theme.surfaceElevated,
      borderRadius: 10,
      padding: 3,
    },
    diffBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
    diffBtnActive: { backgroundColor: theme.accent },
    diffBtnText: {
      color: theme.textSecondary,
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.8,
    },
    diffBtnTextActive: { color: theme.background },
    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: 12,
      gap: 8,
    },
    statCell: { flex: 1, minWidth: 96, paddingVertical: 6, paddingRight: 6 },
    statLabel: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1.4,
    },
    statValue: {
      color: theme.textPrimary,
      fontSize: 32,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 2,
    },
    statValueCompact: { fontSize: 24 },
    statHint: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    statHintMode: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    statRow: { flexDirection: "row", alignItems: "center" },
    statBar: {
      width: 32,
      height: 3,
      backgroundColor: theme.accent,
      borderRadius: 1.5,
      marginLeft: 8,
      marginTop: 14,
    },
    moreBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      marginTop: 10,
      paddingVertical: 10,
      borderTopWidth: 1,
      borderTopColor: "rgba(255,255,255,0.06)",
    },
    moreBarText: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    moreGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
    moreCell: {
      flex: 1,
      minWidth: 120,
      backgroundColor: theme.surfaceLowest,
      borderRadius: 10,
      padding: 10,
    },
    moreSubtle: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
      letterSpacing: 1,
    },
    moreValue: {
      color: theme.textPrimary,
      fontSize: 18,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 4,
    },
    achSection: { marginTop: 16 },
    achTitle: {
      color: theme.accent,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
      marginBottom: 8,
    },
    achRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: theme.elevated,
      borderRadius: 10,
      padding: 12,
      marginBottom: 6,
    },
    achInfo: { flex: 1 },
    achName: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    achDesc: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    menuGroup: { marginTop: 20, gap: 4 },
    menuItem: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.elevated,
      borderRadius: 12,
      padding: 16,
      gap: 12,
    },
    menuIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: "rgba(255,255,255,0.04)",
      alignItems: "center",
      justifyContent: "center",
    },
    menuInfo: { flex: 1 },
    menuTitle: {
      color: theme.textPrimary,
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
    },
    menuSub: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    avatarModalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.72)",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
    },
    avatarModalCard: {
      width: "100%",
      maxWidth: 360,
      backgroundColor: theme.elevated,
      borderRadius: 20,
      padding: 18,
      alignItems: "center",
    },
    avatarModalTitle: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 2,
      marginBottom: 14,
    },
    avatarModalPreviewWrap: {
      width: "100%",
      alignItems: "center",
      marginBottom: 16,
    },
    avatarModalPreview: {
      width: 220,
      height: 220,
      borderRadius: 110,
      overflow: "hidden",
      backgroundColor: theme.secondaryBg,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "rgba(233, 106, 0, 0.45)",
    },
    avatarModalImage: { width: "100%", height: "100%" },
    avatarModalPrimaryBtn: {
      width: "100%",
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: "center",
    },
    avatarModalPrimaryText: {
      color: theme.background,
      fontSize: 13,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    avatarModalSecondaryBtn: {
      marginTop: 10,
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    avatarModalSecondaryText: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
  });
