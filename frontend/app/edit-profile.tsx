import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { getThemeColors } from "../src/theme/colors";
import { useAuthStore } from "../src/store/authStore";
import { useGameContext } from "../src/storage/GameContext";

export default function EditProfileScreen() {
  const router = useRouter();
  const { settings } = useGameContext();
  const { profile, updateUsername, updateAvatar } = useAuthStore();
  const [displayName, setDisplayName] = useState(profile?.username || "");
  const [saved, setSaved] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const theme = getThemeColors(settings.darkMode);
  const st = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    setDisplayName(profile?.username || "");
  }, [profile?.username]);

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

    await updateAvatar(result.assets[0].uri);
    setShowAvatarViewer(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSave = async () => {
    Keyboard.dismiss();
    const nextUsername = displayName.trim().toUpperCase();
    if (!nextUsername) return;
    await updateUsername(nextUsername);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <SafeAreaView style={st.container}>
      <KeyboardAvoidingView
        style={st.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={st.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={st.inner}>
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

              <Text style={st.label}>IDENTITY</Text>
              <Text style={st.heading}>EDIT PROFILE</Text>

              {/* Avatar */}
              <View style={st.avatarArea}>
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
                    <Ionicons
                      name="person"
                      size={36}
                      color={theme.textSecondary}
                    />
                  )}
                </TouchableOpacity>
              </View>

              <View style={st.inputGroup}>
                <View
                  style={[
                    st.inputWrap,
                    focusedField === "name" && st.inputFocused,
                  ]}
                >
                  {focusedField === "name" && <View style={st.pinstripe} />}
                  <Text style={st.inputLabel}>DISPLAY NAME</Text>
                  <TextInput
                    style={st.input}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Your display name"
                    placeholderTextColor={theme.textSecondary}
                    autoCapitalize="characters"
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleSave}
                    maxLength={20}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={st.saveBtn}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <Text style={st.saveBtnText}>
                  {saved ? "SAVED!" : "SAVE CHANGES"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>

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
    flex: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    inner: { flex: 1, paddingHorizontal: 24 },
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
      marginBottom: 24,
    },
    avatarArea: { alignItems: "center", marginBottom: 32 },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: theme.elevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
      borderWidth: 2,
      borderColor: "rgba(233, 106, 0, 0.55)",
      overflow: "hidden",
    },
    avatarImage: { width: 74, height: 74, borderRadius: 37 },
    inputGroup: { gap: 12 },
    inputWrap: {
      backgroundColor: theme.elevated,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      overflow: "hidden",
      position: "relative",
    },
    inputFocused: { backgroundColor: theme.surfaceElevated },
    pinstripe: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: theme.accent,
    },
    inputLabel: {
      color: theme.textSecondary,
      fontSize: 10,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
      textTransform: "uppercase",
      marginBottom: 6,
    },
    input: {
      color: theme.textPrimary,
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      fontWeight: "600",
      padding: 0,
    },
    saveBtn: {
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 18,
      alignItems: "center",
      marginTop: 32,
    },
    saveBtnText: {
      color: theme.background,
      fontSize: 15,
      fontFamily: "Inter_800ExtraBold",
      fontWeight: "800",
      letterSpacing: 1,
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
