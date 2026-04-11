import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";

type AchievementCategory = {
  key: string;
  title: string;
  icon: string;
  ids: string[];
};

const ACHIEVEMENT_CATEGORIES: AchievementCategory[] = [
  {
    key: "victory",
    title: "Victory",
    icon: "trophy-outline",
    ids: [
      "first_victory",
      "win_streak_3",
      "win_streak_5",
      "win_streak_10",
      "comeback_king",
    ],
  },
  {
    key: "walls",
    title: "Walls",
    icon: "grid-outline",
    ids: ["pacifist", "wall_master", "architect", "great_wall"],
  },
  {
    key: "speed",
    title: "Speed",
    icon: "flash-outline",
    ids: ["speedrun", "blitz", "slow_burn"],
  },
  {
    key: "ai",
    title: "AI",
    icon: "hardware-chip-outline",
    ids: [
      "beat_novice",
      "beat_strategic",
      "beat_grandmaster",
      "grandmaster_streak",
      "beat_all_difficulties",
    ],
  },
  {
    key: "progression",
    title: "Progression",
    icon: "trending-up-outline",
    ids: ["dedicated", "veteran", "centurion", "win_25", "win_50", "win_100"],
  },
  {
    key: "pass_play",
    title: "Pass & Play",
    icon: "people-outline",
    ids: ["social_player", "local_legend"],
  },
  {
    key: "special",
    title: "Special",
    icon: "sparkles-outline",
    ids: ["no_jumping", "night_owl", "early_bird"],
  },
];

export default function AchievementsScreen() {
  const router = useRouter();
  const { achievements, settings } = useGameContext();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(ACHIEVEMENT_CATEGORIES.map((c) => [c.key, false])),
  );

  const categorizedAchievements = useMemo(() => {
    const usedIds = new Set<string>();
    const grouped = ACHIEVEMENT_CATEGORIES.map((category) => {
      const items = achievements.filter((achievement) => {
        const included = category.ids.includes(achievement.id);
        if (included) usedIds.add(achievement.id);
        return included;
      });
      const completed = items.filter((item) => item.unlocked).length;
      return { ...category, items, completed };
    }).filter((category) => category.items.length > 0);

    const uncategorized = achievements.filter(
      (achievement) => !usedIds.has(achievement.id),
    );

    if (uncategorized.length > 0) {
      grouped.push({
        key: "other",
        title: "Other",
        icon: "apps-outline",
        ids: [],
        items: uncategorized,
        completed: uncategorized.filter((item) => item.unlocked).length,
      });
    }

    return grouped;
  }, [achievements]);

  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);

  const toggleCategory = (key: string) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
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

        <Text style={st.label}>HALL OF HONOR</Text>
        <Text style={st.heading}>ACHIEVEMENTS</Text>

        <View style={st.progressCard}>
          <Text style={st.progressLabel}>COMPLETION</Text>
          <View style={st.progressRow}>
            <Text style={st.progressValue}>
              {unlockedCount}/{achievements.length}
            </Text>
            <View style={st.progressTrack}>
              <View
                style={[
                  st.progressFill,
                  { width: `${(unlockedCount / achievements.length) * 100}%` },
                ]}
              />
            </View>
          </View>
        </View>

        <View style={st.list}>
          {categorizedAchievements.map((category) => {
            const isExpanded = expanded[category.key] ?? true;
            const completionPercent =
              category.items.length === 0
                ? 0
                : Math.round((category.completed / category.items.length) * 100);

            return (
              <View key={category.key} style={st.categoryWrap}>
                <TouchableOpacity
                  style={st.categoryHeader}
                  activeOpacity={0.75}
                  onPress={() => toggleCategory(category.key)}
                >
                  <View style={st.categoryHeaderLeft}>
                    <View style={st.categoryIconWrap}>
                      <Ionicons
                        name={category.icon as any}
                        size={18}
                        color={theme.accent}
                      />
                    </View>
                    <View style={st.categoryMeta}>
                      <Text style={st.categoryTitle}>{category.title}</Text>
                      <Text style={st.categoryCount}>
                        {category.completed}/{category.items.length} completed
                      </Text>
                    </View>
                  </View>
                  <View style={st.categoryHeaderRight}>
                    <Text style={st.categoryPercent}>{completionPercent}%</Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={18}
                      color={theme.textSecondary}
                    />
                  </View>
                </TouchableOpacity>

                <View style={st.categoryTrack}>
                  <View style={[st.categoryFill, { width: `${completionPercent}%` }]} />
                </View>

                {isExpanded && (
                  <View style={st.categoryList}>
                    {category.items.map((a) => (
                      <View
                        key={a.id}
                        style={[st.achievementCard, a.unlocked && st.achievementUnlocked]}
                      >
                        {a.unlocked && <View style={st.achievementPinstripe} />}
                        <View
                          style={[
                            st.achievementIcon,
                            a.unlocked && st.achievementIconUnlocked,
                          ]}
                        >
                          <Ionicons
                            name={a.unlocked ? "ribbon" : "ribbon-outline"}
                            size={24}
                            color={a.unlocked ? theme.accent : theme.textSecondary}
                          />
                        </View>
                        <View style={st.achievementInfo}>
                          <View style={st.achievementTopRow}>
                            <Text
                              style={[
                                st.achievementName,
                                !a.unlocked && st.achievementNameLocked,
                              ]}
                            >
                              {a.name}
                            </Text>
                            <View style={st.typePill}>
                              <Text style={st.typePillText}>{category.title}</Text>
                            </View>
                          </View>
                          <Text style={st.achievementDesc}>{a.description}</Text>
                          {a.target > 1 && (
                            <View style={st.achievementProgress}>
                              <View style={st.achievementTrack}>
                                <View
                                  style={[
                                    st.achievementFill,
                                    {
                                      width: `${Math.max(
                                        0,
                                        Math.min((a.progress / a.target) * 100, 100),
                                      )}%`,
                                    },
                                  ]}
                                />
                              </View>
                              <Text style={st.achievementCount}>
                                {a.progress}/{a.target}
                              </Text>
                            </View>
                          )}
                        </View>
                        {a.unlocked && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={theme.success}
                          />
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 20 },
    backBtn: { width: 44, height: 44, justifyContent: "center", marginTop: 8 },
    label: {
      color: theme.accent,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    heading: {
      color: theme.spaceTextPrimary,
      fontSize: 32,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      marginTop: 4,
      marginBottom: 20,
    },
    progressCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 18,
      marginBottom: 20,
    },
    progressLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.5,
    },
    progressRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 8,
    },
    progressValue: {
      color: theme.textPrimary,
      fontSize: 20,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      width: 50,
    },
    progressTrack: {
      flex: 1,
      height: 4,
      backgroundColor: theme.secondaryBg,
      borderRadius: 2,
    },
    progressFill: { height: 4, backgroundColor: theme.accent, borderRadius: 2 },
    list: { gap: 8 },
    categoryWrap: {
      backgroundColor: theme.elevated,
      borderRadius: 12,
      padding: 12,
    },
    categoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 10,
    },
    categoryHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
    categoryIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.accentAlpha15,
      flexShrink: 0,
    },
    categoryMeta: { flex: 1, minWidth: 0 },
    categoryTitle: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    categoryCount: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    categoryHeaderRight: { flexDirection: "row", alignItems: "center", gap: 6 },
    categoryPercent: {
      color: theme.accent,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    categoryTrack: {
      height: 4,
      borderRadius: 2,
      backgroundColor: theme.secondaryBg,
      marginTop: 10,
      overflow: "hidden",
    },
    categoryFill: { height: 4, borderRadius: 2, backgroundColor: theme.accent },
    categoryList: { gap: 8, marginTop: 10 },
    achievementCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.elevated,
      borderRadius: 12,
      padding: 16,
      gap: 12,
      overflow: "hidden",
      position: "relative",
    },
    achievementUnlocked: {},
    achievementPinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.accent,
    },
    achievementIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.secondaryBg,
      alignItems: "center",
      justifyContent: "center",
    },
    achievementIconUnlocked: { backgroundColor: theme.accentAlpha15 },
    achievementInfo: { flex: 1 },
    achievementTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    achievementName: {
      color: theme.textPrimary,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      flex: 1,
      minWidth: 0,
    },
    achievementNameLocked: { color: theme.textSecondary },
    typePill: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 999,
      backgroundColor: theme.accentAlpha15,
      flexShrink: 0,
    },
    typePillText: {
      color: theme.accent,
      fontSize: 9,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 0.8,
      textTransform: "uppercase",
    },
    achievementDesc: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 2,
    },
    achievementProgress: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },
    achievementTrack: {
      flex: 1,
      height: 3,
      backgroundColor: theme.secondaryBg,
      borderRadius: 1.5,
    },
    achievementFill: {
      height: 3,
      backgroundColor: theme.accent,
      borderRadius: 1.5,
    },
    achievementCount: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
    },
  });
