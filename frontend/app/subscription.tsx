import React, { useMemo } from "react";
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

export default function SubscriptionScreen() {
  const router = useRouter();
  const { isPremium, setPremium, settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode);
  const st = useMemo(() => createStyles(theme), [theme]);

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
          <Ionicons
            name="arrow-back"
            size={22}
            color={theme.spaceTextSecondary}
          />
        </TouchableOpacity>

        <Text style={st.label}>ACCOUNT</Text>
        <Text style={st.heading}>SUBSCRIPTION</Text>

        {isPremium ? (
          <View style={st.activeCard}>
            <View style={st.activePinstripe} />
            <View style={st.activeHeader}>
              <Ionicons name="diamond" size={24} color={theme.accent} />
              <Text style={st.activeTitle}>GRANDMASTER PASS</Text>
            </View>
            <Text style={st.activeStatus}>Active</Text>
            <View style={st.activePlanRow}>
              <Text style={st.activePlanLabel}>PLAN</Text>
              <Text style={st.activePlanValue}>Annual - $49.99/year</Text>
            </View>
            <View style={st.activePlanRow}>
              <Text style={st.activePlanLabel}>RENEWS</Text>
              <Text style={st.activePlanValue}>December 15, 2025</Text>
            </View>

            <View style={st.features}>
              <Text style={st.featuresTitle}>INCLUDED</Text>
              {[
                "Grandmaster AI Difficulty",
                "All Board Themes",
                "Ad-free Experience",
                "Deep Game Analysis",
                "Priority Support",
              ].map((f, i) => (
                <View key={i} style={st.featureRow}>
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={theme.success}
                  />
                  <Text style={st.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={st.cancelBtn}
              onPress={() => setPremium(false)}
              activeOpacity={0.7}
            >
              <Text style={st.cancelBtnText}>CANCEL SUBSCRIPTION</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={st.inactiveArea}>
            <View style={st.inactiveIcon}>
              <Ionicons
                name="diamond-outline"
                size={40}
                color={theme.textSecondary}
              />
            </View>
            <Text style={st.inactiveTitle}>NO ACTIVE SUBSCRIPTION</Text>
            <Text style={st.inactiveDesc}>
              Upgrade to Premium to unlock all features.
            </Text>
            <TouchableOpacity
              style={st.upgradeBtn}
              onPress={() => router.push("/paywall" as never)}
              activeOpacity={0.85}
            >
              <Text style={st.upgradeBtnText}>VIEW PLANS</Text>
            </TouchableOpacity>
          </View>
        )}

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
    activeCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 20,
      overflow: "hidden",
      position: "relative",
    },
    activePinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2.5,
      backgroundColor: theme.accent,
    },
    activeHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
    activeTitle: {
      color: theme.textPrimary,
      fontSize: 18,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    activeStatus: {
      color: theme.success,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
      marginTop: 8,
    },
    activePlanRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 16,
    },
    activePlanLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    activePlanValue: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
    },
    features: { marginTop: 24 },
    featuresTitle: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1.5,
      marginBottom: 12,
    },
    featureRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 6,
    },
    featureText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    cancelBtn: {
      backgroundColor: theme.secondaryBg,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 24,
    },
    cancelBtnText: {
      color: theme.error,
      fontSize: 13,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    inactiveArea: { alignItems: "center", paddingVertical: 48 },
    inactiveIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.elevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    },
    inactiveTitle: {
      color: theme.spaceTextPrimary,
      fontSize: 18,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 2,
    },
    inactiveDesc: {
      color: theme.spaceTextSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginTop: 8,
    },
    upgradeBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 14,
      paddingHorizontal: 32,
      marginTop: 24,
    },
    upgradeBtnText: {
      color: theme.background,
      fontSize: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
  });
