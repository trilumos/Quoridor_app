import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '../src/theme/colors';
import { useGameContext } from '../src/storage/GameContext';
import { useAuthStore } from '../src/store/authStore';
import { DailyPuzzleService, DailyPuzzleProgress } from '../src/services/DailyPuzzleService';

const MOCK_PUZZLES = [
  { id: 'dp_001', title: 'The Corridor Trap', desc: 'Find the winning wall placement to trap your opponent.' },
  { id: 'dp_002', title: 'Shortest Path', desc: 'Reach the goal in minimum moves despite walls.' },
  { id: 'dp_003', title: 'Wall Economy', desc: 'Win using only 3 walls.' },
];

export default function DailyPuzzleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { settings } = useGameContext();
  const [progress, setProgress] = useState<DailyPuzzleProgress | null>(null);
  const [completed, setCompleted] = useState<string[]>([]);
  const [streakToast, setStreakToast] = useState(false);
  const theme = getThemeColors(settings.darkMode, settings.themeName);
  const st = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    if (user) {
      DailyPuzzleService.getProgress(user.id).then((p) => {
        if (p) {
          setProgress(p);
          setCompleted(p.puzzles_completed || []);
        }
      });
    }
  }, [user]);

  const handleComplete = async (puzzleId: string) => {
    if (!user) return;
    const prevStreak = progress?.current_streak ?? 0;
    const ok = await DailyPuzzleService.completePuzzle(user.id, puzzleId);
    if (ok) {
      setCompleted((prev) => [...prev, puzzleId]);
      const updated = await DailyPuzzleService.getProgress(user.id);
      if (updated) {
        setProgress(updated);
        if (updated.current_streak > prevStreak) {
          setStreakToast(true);
          setTimeout(() => setStreakToast(false), 2000);
        }
      }
    }
  };

  return (
    <SafeAreaView style={st.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={st.scroll}>
        <TouchableOpacity onPress={() => router.back()} style={st.backBtn} activeOpacity={0.6}>
          <Ionicons name="arrow-back" size={22} color={theme.textSecondary} />
        </TouchableOpacity>

        <Text style={st.label}>DAILY CHALLENGE</Text>
        <Text style={st.heading}>PUZZLE</Text>

        <View style={st.streakCard}>
          <View style={st.streakRow}>
            <View>
              <Text style={st.streakLabel}>CURRENT STREAK</Text>
              <Text style={st.streakValue}>{progress?.current_streak ?? 0}</Text>
            </View>
            <View>
              <Text style={st.streakLabel}>BEST STREAK</Text>
              <Text style={st.streakValue}>{progress?.best_streak ?? 0}</Text>
            </View>
            <View>
              <Text style={st.streakLabel}>COMPLETED</Text>
              <Text style={st.streakValue}>{progress?.total_completed ?? 0}</Text>
            </View>
          </View>
        </View>

        <View style={st.puzzleList}>
          {MOCK_PUZZLES.map((p) => {
            const done = completed.includes(p.id);
            return (
              <View key={p.id} style={st.puzzleCard}>
                {done && <View style={st.puzzlePinstripe} />}
                <View style={st.puzzleHeader}>
                  <Text style={st.puzzleTitle}>{p.title}</Text>
                  {done && <Ionicons name="checkmark-circle" size={20} color={theme.success} />}
                </View>
                <Text style={st.puzzleDesc}>{p.desc}</Text>
                {!done && (
                  <TouchableOpacity style={st.solveBtn} onPress={() => handleComplete(p.id)} activeOpacity={0.85}>
                    <Text style={st.solveBtnText}>SOLVE</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {streakToast && (
        <View style={st.toast}>
          <Ionicons name="flame" size={16} color={theme.accent} />
          <Text style={st.toastText}>STREAK INCREASED!</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  scroll: { paddingHorizontal: 20 },
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginTop: 8 },
  label: { color: theme.accent, fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 2 },
  heading: { color: theme.textPrimary, fontSize: 32, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', marginTop: 4, marginBottom: 20 },
  streakCard: { backgroundColor: theme.elevated, borderRadius: 14, padding: 18 },
  streakRow: { flexDirection: 'row', justifyContent: 'space-around' },
  streakLabel: { color: theme.textSecondary, fontSize: 9, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  streakValue: { color: theme.textPrimary, fontSize: 24, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', textAlign: 'center', marginTop: 4 },
  puzzleList: { marginTop: 20, gap: 10 },
  puzzleCard: { backgroundColor: theme.elevated, borderRadius: 12, padding: 16, overflow: 'hidden', position: 'relative' },
  puzzlePinstripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, backgroundColor: theme.accent },
  puzzleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  puzzleTitle: { color: theme.textPrimary, fontSize: 16, fontFamily: 'Inter_700Bold', fontWeight: '700' },
  puzzleDesc: { color: theme.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 6, lineHeight: 19 },
  solveBtn: { backgroundColor: theme.accent, borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 12 },
  solveBtnText: { color: theme.background, fontSize: 13, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', letterSpacing: 1 },
  toast: { position: 'absolute', bottom: 100, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.elevated, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, zIndex: 200 },
  toastText: { color: theme.accent, fontSize: 12, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', letterSpacing: 1 },
});
