import React, { useMemo, useRef, useState } from "react";
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
import { useAuthStore } from "../src/store/authStore";
import { useGameContext } from "../src/storage/GameContext";

const FEATURES = [
  {
    icon: "ban-outline",
    label: "Ad-free",
    desc: "Remove ads from the entire app.",
  },
];

export default function PaywallScreen() {
  const router = useRouter();
  const { activatePremium, setPremiumStatus } = useAuthStore();
  const { setPremium } = useGameContext();
  const { settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);
  const pressedRef = useRef(false);
  const [success, setSuccess] = useState(false);

  const handlePurchase = async (tier: "monthly" | "annual") => {
    if (pressedRef.current) return;
    pressedRef.current = true;
    const ok = await activatePremium(tier);
    if (ok) {
      await setPremiumStatus(true);
      setPremium(true);
      setSuccess(true);
      setTimeout(() => {
        pressedRef.current = false;
        router.back();
      }, 800);
      return;
    }
    pressedRef.current = false;
  };

  if (success) {
    return (
      <SafeAreaView style={st.container}>
        <View style={st.successArea}>
          <View style={st.successIcon}>
            <Ionicons name="checkmark-circle" size={56} color={theme.success} />
          </View>
          <Text style={st.successTitle}>ADS REMOVED</Text>
          <Text style={st.successSub}>
            You will no longer see ads anywhere in the app.
          </Text>
          <TouchableOpacity
            style={st.successBtn}
            onPress={() => router.back()}
            activeOpacity={0.85}
          >
            <Text style={st.successBtnText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        <View style={st.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
            style={st.closeBtn}
          >
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={st.badge}>
          <Text style={st.badgeText}>AD REMOVAL</Text>
        </View>

        <Text style={st.title}>REMOVE ADS</Text>
        <Text style={st.subtitle}>
          Keep every feature and remove ads from the whole app.
        </Text>

        <View style={st.features}>
          {FEATURES.map((f, i) => (
            <View key={i} style={st.featureCard}>
              <View style={st.featureIcon}>
                <Ionicons name={f.icon as any} size={20} color={theme.accent} />
              </View>
              <Text style={st.featureLabel}>{f.label}</Text>
              <Text style={st.featureDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>

        <View style={st.planCardHighlight}>
          <View style={st.bestValueBadge}>
            <Text style={st.bestValueText}>BEST VALUE</Text>
          </View>
          <Text style={st.planTitle}>ANNUAL AD-FREE PASS</Text>
          <View style={st.priceRow}>
            <Text style={st.priceMain}>$49.99</Text>
            <Text style={st.pricePer}>/year</Text>
          </View>
          <Text style={st.planDesc}>
            Billed annually. That&apos;s just $4.17/mo.
          </Text>
          <TouchableOpacity
            style={st.unlockBtn}
            onPress={() => handlePurchase("annual")}
            activeOpacity={0.85}
          >
            <Text style={st.unlockBtnText}>UNLOCK NOW</Text>
          </TouchableOpacity>
        </View>

        <View style={st.planCard}>
          <Text style={st.planTitle}>MONTHLY AD-FREE PASS</Text>
          <View style={st.priceRow}>
            <Text style={st.priceMain}>$6.99</Text>
            <Text style={st.pricePer}>/month</Text>
          </View>
          <Text style={st.planDesc}>Cancel anytime. No commitments.</Text>
          <TouchableOpacity
            style={st.monthlyBtn}
            onPress={() => handlePurchase("monthly")}
            activeOpacity={0.85}
          >
            <Text style={st.monthlyBtnText}>START MONTHLY</Text>
          </TouchableOpacity>
        </View>

        <Text style={st.legalText}>
          Payment will be charged to your account at confirmation. Subscription
          automatically renews unless cancelled at least 24 hours before the end
          of the current period.
        </Text>
        <View style={st.legalLinks}>
          <TouchableOpacity>
            <Text style={st.legalLink}>TERMS OF SERVICE</Text>
          </TouchableOpacity>
          <Text style={st.legalSep}>|</Text>
          <TouchableOpacity>
            <Text style={st.legalLink}>PRIVACY POLICY</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scroll: { paddingHorizontal: 20, paddingBottom: 32 },
    header: {
      flexDirection: "row",
      justifyContent: "flex-end",
      paddingVertical: 12,
    },
    closeBtn: {
      width: 44,
      height: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      backgroundColor: theme.accentAlpha15,
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      marginTop: 8,
    },
    badgeText: {
      color: theme.accent,
      fontSize: 10,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 2,
    },
    title: {
      color: theme.textPrimary,
      fontSize: 36,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      lineHeight: 42,
      marginTop: 12,
    },
    subtitle: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      lineHeight: 20,
      marginTop: 12,
    },
    features: { flexDirection: "row", gap: 10, marginTop: 24 },
    featureCard: {
      flex: 1,
      backgroundColor: theme.elevated,
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
    },
    featureIcon: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: theme.accentAlpha15,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    featureLabel: {
      color: theme.textPrimary,
      fontSize: 12,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      textAlign: "center",
    },
    featureDesc: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      marginTop: 4,
      lineHeight: 14,
    },
    planCardHighlight: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 20,
      marginTop: 24,
      position: "relative",
      overflow: "hidden",
    },
    bestValueBadge: {
      position: "absolute",
      top: 14,
      right: 14,
      backgroundColor: theme.accent,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 4,
    },
    bestValueText: {
      color: theme.background,
      fontSize: 9,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    planCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 20,
      marginTop: 12,
    },
    planTitle: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    priceRow: { flexDirection: "row", alignItems: "baseline", marginTop: 6 },
    priceMain: {
      color: theme.textPrimary,
      fontSize: 32,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
    },
    pricePer: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginLeft: 4,
    },
    planDesc: {
      color: theme.textSecondary,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    unlockBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
      marginTop: 18,
    },
    unlockBtnText: {
      color: theme.background,
      fontSize: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    monthlyBtn: {
      backgroundColor: theme.secondaryBg,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      marginTop: 18,
    },
    monthlyBtnText: {
      color: theme.textPrimary,
      fontSize: 14,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    legalText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      lineHeight: 16,
      textAlign: "center",
      marginTop: 24,
    },
    legalLinks: {
      flexDirection: "row",
      justifyContent: "center",
      gap: 8,
      marginTop: 12,
    },
    legalLink: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    legalSep: { color: theme.textSecondary, fontSize: 10 },
    successArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 24,
    },
    successIcon: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: theme.successAlpha12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 24,
    },
    successTitle: {
      color: theme.textPrimary,
      fontSize: 28,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      textAlign: "center",
      lineHeight: 34,
    },
    successSub: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginTop: 8,
    },
    successBtn: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
      marginTop: 32,
      width: "100%",
    },
    successBtnText: {
      color: theme.background,
      fontSize: 15,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
  });
