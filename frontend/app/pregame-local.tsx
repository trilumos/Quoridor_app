import React, { useMemo, useState, useRef } from "react";
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
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeColors } from "../src/theme/colors";
import { useGameContext } from "../src/storage/GameContext";
import TopBar from "../src/components/TopBar";
import SectionLabel from "../src/components/SectionLabel";
import PrimaryButton from "../src/components/PrimaryButton";

export default function PregameLocal() {
  const router = useRouter();
  const { settings } = useGameContext();
  const [p1Name, setP1Name] = useState("");
  const [p2Name, setP2Name] = useState("");
  const [timeLimitSec, setTimeLimitSec] = useState<number>(0);
  const [focusedInput, setFocusedInput] = useState<1 | 2 | null>(null);
  const input2Ref = useRef<TextInput>(null);
  const theme = getThemeColors(settings.darkMode);
  const styles = useMemo(() => createStyles(theme), [theme]);

  const TIME_PRESETS = [
    { label: "UNLIMITED", sec: 0 },
    { label: "3 MIN", sec: 180 },
    { label: "5 MIN", sec: 300 },
    { label: "10 MIN", sec: 600 },
  ];

  const handleStart = () => {
    Keyboard.dismiss();
    router.push({
      pathname: "/game",
      params: {
        mode: "local",
        p1Name: p1Name.trim() || "Player 1",
        p2Name: p2Name.trim() || "Player 2",
        p1Color: theme.player1,
        p2Color: theme.player2,
        localTimeSec: String(timeLimitSec),
      },
    } as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="PASS & PLAY" showBack onBack={() => router.back()} />

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <View style={styles.section}>
              <SectionLabel text="PLAYER NAMES" />
            </View>

            <View style={styles.inputGroup}>
              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 1 && styles.inputFocused,
                ]}
              >
                {focusedInput === 1 && <View style={styles.pinstripe} />}
                <Text style={styles.inputLabel}>PLAYER 1</Text>
                <TextInput
                  testID="p1-input"
                  style={styles.input}
                  value={p1Name}
                  onChangeText={setP1Name}
                  placeholder="Enter name"
                  placeholderTextColor={theme.textSecondary}
                  onFocus={() => setFocusedInput(1)}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="next"
                  onSubmitEditing={() => input2Ref.current?.focus()}
                  maxLength={16}
                />
              </View>

              <View
                style={[
                  styles.inputWrapper,
                  focusedInput === 2 && styles.inputFocused,
                ]}
              >
                {focusedInput === 2 && <View style={styles.pinstripe} />}
                <Text style={styles.inputLabel}>PLAYER 2</Text>
                <TextInput
                  ref={input2Ref}
                  testID="p2-input"
                  style={styles.input}
                  value={p2Name}
                  onChangeText={setP2Name}
                  placeholder="Enter name"
                  placeholderTextColor={theme.textSecondary}
                  onFocus={() => setFocusedInput(2)}
                  onBlur={() => setFocusedInput(null)}
                  returnKeyType="done"
                  onSubmitEditing={Keyboard.dismiss}
                  maxLength={16}
                />
              </View>
            </View>

            <View style={styles.sectionSpaced}>
              <SectionLabel text="TIME CONTROL" />
              <View style={styles.timeRow}>
                {TIME_PRESETS.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    style={[
                      styles.timeChip,
                      timeLimitSec === preset.sec && styles.timeChipActive,
                    ]}
                    onPress={() => setTimeLimitSec(preset.sec)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.timeChipText,
                        timeLimitSec === preset.sec &&
                          styles.timeChipTextActive,
                      ]}
                    >
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <View style={styles.footer}>
        <PrimaryButton
          testID="start-local-btn"
          title="START GAME"
          onPress={handleStart}
        />
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    content: {
      flex: 1,
    },
    inner: {
      flex: 1,
      paddingHorizontal: 16,
    },
    section: {
      marginTop: 24,
      marginBottom: 16,
    },
    inputGroup: {
      gap: 12,
    },
    sectionSpaced: {
      marginTop: 26,
    },
    timeRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 10,
    },
    timeChip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.12)",
      backgroundColor: theme.elevated,
    },
    timeChipActive: {
      borderColor: theme.accent,
      backgroundColor: "rgba(255,122,0,0.12)",
    },
    timeChipText: {
      color: theme.textSecondary,
      fontSize: 11,
      fontFamily: "Inter_700Bold",
      fontWeight: "700",
      letterSpacing: 1,
    },
    timeChipTextActive: {
      color: theme.accent,
    },
    inputWrapper: {
      backgroundColor: theme.elevated,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      overflow: "hidden",
      position: "relative",
    },
    inputFocused: {
      backgroundColor: theme.elevated,
    },
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
    footer: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      paddingTop: 8,
    },
  });
