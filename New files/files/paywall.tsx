import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";
import { BillingService, getProductPrice } from "../src/services/BillingService";
import { setAdsDisabled } from "../src/lib/ADManager";

export default function PaywallScreen() {
  const router = useRouter();
  const { setPremium, settings } = useGameContext();
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);

  const [price, setPrice] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [success, setSuccess] = useState(false);
  const pressedRef = useRef(false);

  // Load the price from Google Play on mount
  useEffect(() => {
    const loadPrice = async () => {
      const product = BillingService.getProduct();
      if (product) {
        setPrice(getProductPrice(product));
        return;
      }
      // Not cached yet — fetch now
      const fetched = await BillingService.loadProduct();
      if (fetched) setPrice(getProductPrice(fetched));
    };
    void loadPrice();
  }, []);

  const handleUnlock = async () => {
    if (pressedRef.current) return;
    pressedRef.current = true;
    setPurchasing(true);

    try {
      // The purchaseUpdatedListener in BillingService.init() calls
      // onPremiumUnlocked which calls setPremium(true) + setAdsDisabled(true).
      // We register a one-shot override here to also update local UI.
      await BillingService.purchase();

      // Give the listener a moment to fire before we check
      // (listener fires synchronously on most devices, but await to be safe)
      await new Promise((res) => setTimeout(res, 500));

      // Check ownership again to confirm
      const owned = await BillingService.restorePurchases();
      if (owned) {
        setPremium(true);
        setAdsDisabled(true);
        setSuccess(true);
      }
      // If not owned yet, the purchaseUpdatedListener will handle it
      // (user might have dismissed the sheet — that's fine)
    } catch {
      // errors already logged inside BillingService
    } finally {
      setPurchasing(false);
      pressedRef.current = false;
    }
  };

  const handleRestore = async () => {
    if (restoring) return;
    setRestoring(true);
    const owned = await BillingService.restorePurchases();
    setRestoring(false);
    if (owned) {
      setPremium(true);
      setAdsDisabled(true);
      setSuccess(true);
    } else {
      Alert.alert(
        "No Purchase Found",
        "We couldn't find a previous purchase of Remove Ads on this Google account.",
      );
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
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

  // ── Main screen ───────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={st.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={st.scroll}
      >
        {/* Header */}
        <View style={st.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            activeOpacity={0.6}
            style={st.closeBtn}
          >
            <Ionicons name="close" size={24} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Badge */}
        <View style={st.badge}>
          <Text style={st.badgeText}>ONE-TIME PURCHASE</Text>
        </View>

        <Text style={st.title}>REMOVE ADS</Text>
        <Text style={st.subtitle}>
          Pay once and enjoy the game forever — no subscriptions, no renewals.
        </Text>

        {/* Feature card */}
        <View style={st.featureCard}>
          <View style={st.featureIcon}>
            <Ionicons name="ban-outline" size={22} color={theme.accent} />
          </View>
          <View style={st.featureTextArea}>
            <Text style={st.featureLabel}>Ad-Free Forever</Text>
            <Text style={st.featureDesc}>
              Remove all interstitial and rewarded ads from the entire app. Permanently.
            </Text>
          </View>
        </View>

        {/* Price + Buy button */}
        <View style={st.priceCard}>
          <Text style={st.planLabel}>LIFETIME AD-FREE PASS</Text>
          <View style={st.priceRow}>
            {price ? (
              <Text style={st.priceText}>{price}</Text>
            ) : (
              <ActivityIndicator size="small" color={theme.accent} />
            )}
            <Text style={st.priceOnce}> one-time</Text>
          </View>

          <TouchableOpacity
            style={[st.unlockBtn, purchasing && st.unlockBtnDisabled]}
            onPress={handleUnlock}
            activeOpacity={0.85}
            disabled={purchasing}
          >
            {purchasing ? (
              <ActivityIndicator size="small" color={theme.background} />
            ) : (
              <Text style={st.unlockBtnText}>REMOVE ADS — {price ?? "..."}</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Restore */}
        <TouchableOpacity
          style={st.restoreBtn}
          onPress={handleRestore}
          activeOpacity={0.6}
          disabled={restoring}
        >
          {restoring ? (
            <ActivityIndicator size="small" color={theme.textSecondary} />
          ) : (
            <Text style={st.restoreText}>Restore Purchase</Text>
          )}
        </TouchableOpacity>

        {/* Legal */}
        <Text style={st.legalText}>
          This is a one-time, non-refundable purchase. Payment is charged to
          your Google Play account at confirmation.
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

        <View style={{ height: 32 }} />
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
    featureCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 16,
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 14,
      marginTop: 24,
    },
    featureIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: theme.accentAlpha15,
      alignItems: "center",
      justifyContent: "center",
    },
    featureTextArea: { flex: 1 },
    featureLabel: {
      color: theme.textPrimary,
      fontSize: 15,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
    },
    featureDesc: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
      lineHeight: 18,
    },
    priceCard: {
      backgroundColor: theme.elevated,
      borderRadius: 14,
      padding: 20,
      marginTop: 16,
    },
    planLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 2,
    },
    priceRow: {
      flexDirection: "row",
      alignItems: "baseline",
      marginTop: 8,
      marginBottom: 18,
    },
    priceText: {
      color: theme.textPrimary,
      fontSize: 34,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
    },
    priceOnce: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    unlockBtn: {
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: "center",
    },
    unlockBtnDisabled: {
      opacity: 0.6,
    },
    unlockBtnText: {
      color: theme.background,
      fontSize: 14,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
    },
    restoreBtn: {
      alignItems: "center",
      paddingVertical: 16,
    },
    restoreText: {
      color: theme.textSecondary,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      textDecorationLine: "underline",
    },
    legalText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_400Regular",
      lineHeight: 16,
      textAlign: "center",
      marginTop: 8,
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
    },
    successSub: {
      color: theme.textSecondary,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginTop: 8,
      textAlign: "center",
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
