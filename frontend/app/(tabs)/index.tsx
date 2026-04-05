import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/theme/colors';
import { useGameContext } from '../../src/storage/GameContext';
import { useAuthStore } from '../../src/store/authStore';
import { useStatsStore } from '../../src/store/statsStore';

export default function HomeScreen() {
  const router = useRouter();
  const { stats: ctxStats } = useGameContext();
  const { profile } = useAuthStore();
  const { stats: supaStats } = useStatsStore();
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');

  const totalWins = supaStats?.total_wins ?? ctxStats.totalWins;
  const totalGames = supaStats?.total_games ?? ctxStats.totalGames;
  const winRate = totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

  const difficultyLabel = difficulty.toUpperCase();
  const averageDuration = 0;

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <View style={s.header}>
          <View style={s.logoRow}>
            <View style={s.gridIcon}>
              <View style={s.gridDot} /><View style={s.gridDot} />
              <View style={s.gridDot} /><View style={s.gridDot} />
            </View>
            <Text style={s.logoText}>QUORIDOR</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/edit-profile' as never)} activeOpacity={0.7}>
            <Ionicons name="person-circle-outline" size={36} color={COLORS.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={s.heroSection}>
          <Text style={s.heroLabel}>STRATEGY ARENA</Text>
          <Text style={s.heroTitle}>{'COMMAND THE\nBOARD.'}</Text>
          <TouchableOpacity testID="start-game-btn" style={s.startBtn} activeOpacity={0.85} onPress={() => router.push('/mode-select' as never)}>
            <Text style={s.startBtnText}>START GAME</Text>
            <Ionicons name="play" size={18} color={COLORS.background} />
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          <Text style={s.sectionTitle}>VS AI PERFORMANCE</Text>
          <View style={s.difficultyRow}>
            {(['easy', 'medium', 'hard'] as const).map((value) => {
              const active = value === difficulty;
              return (
                <TouchableOpacity key={value} style={[s.difficultyChip, active && s.difficultyChipActive]} onPress={() => setDifficulty(value)} activeOpacity={0.8}>
                  <Text style={[s.difficultyText, active && s.difficultyTextActive]}>{value.toUpperCase()}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.statsGrid}>
            <View style={s.statCell}>
              <Text style={s.statLabel}>TOTAL GAMES</Text>
              <Text style={s.statValue}>{totalGames}</Text>
              <Text style={s.statSub}>{`AT ${difficultyLabel}`}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>TOTAL WINS</Text>
              <Text style={s.statValue}>{totalWins}</Text>
              <Text style={s.statSub}>{`AT ${difficultyLabel}`}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>WIN PERCENTAGE</Text>
              <View style={s.statInline}>
                <Text style={s.statValue}>{winRate}%</Text>
                <View style={s.statBar} />
              </View>
              <Text style={s.statSub}>{`AT ${difficultyLabel}`}</Text>
            </View>
            <View style={s.statCell}>
              <Text style={s.statLabel}>AVERAGE DURATION</Text>
              <Text style={s.statValue}>{`${averageDuration}s`}</Text>
              <Text style={s.statSub}>TO COMPLETE A GAME</Text>
            </View>
          </View>
        </View>

        <Text style={s.dividerLabel}>TRAINING GROUNDS</Text>
        <TouchableOpacity style={s.trainingCard} activeOpacity={0.7} onPress={() => router.push('/trainer' as never)}>
          <View style={s.trainingContent}>
            <Text style={s.eliteLabel}>RULES & STRATEGY</Text>
            <Text style={s.trainingTitle}>Master Positioning and Tempo</Text>
            <Text style={s.trainingDesc}>Study openings, wall economy, and endgame paths to outplay every difficulty.</Text>
            <View style={s.readLink}>
              <Text style={s.readLinkText}>Open Training</Text>
              <Ionicons name="arrow-forward" size={16} color={COLORS.accent} />
            </View>
          </View>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  gridIcon: { width: 24, height: 24, flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridDot: { width: 10, height: 10, borderRadius: 1.5, backgroundColor: COLORS.accent },
  logoText: { color: COLORS.textPrimary, fontSize: 18, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', letterSpacing: 3 },
  heroSection: { marginTop: 26 },
  heroLabel: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 2 },
  heroTitle: { color: COLORS.textPrimary, fontSize: 38, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', lineHeight: 44, marginTop: 8 },
  startBtn: { backgroundColor: COLORS.accent, borderRadius: 20, paddingVertical: 22, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 24 },
  startBtnText: { color: COLORS.background, fontSize: 16, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', letterSpacing: 1 },
  card: { backgroundColor: '#15171B', borderRadius: 20, padding: 20, marginTop: 18 },
  sectionTitle: { color: COLORS.accent, fontSize: 12, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 2 },
  difficultyRow: { flexDirection: 'row', backgroundColor: '#23262E', borderRadius: 16, marginTop: 14, padding: 4, gap: 6 },
  difficultyChip: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  difficultyChipActive: { backgroundColor: COLORS.accent },
  difficultyText: { color: COLORS.textSecondary, fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1.2 },
  difficultyTextActive: { color: COLORS.background },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 18 },
  statCell: { width: '50%', paddingVertical: 14, paddingRight: 12 },
  statLabel: { color: COLORS.textSecondary, fontSize: 10, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 1.5 },
  statValue: { color: COLORS.textPrimary, fontSize: 54, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', marginTop: 2, lineHeight: 60 },
  statSub: { color: COLORS.textSecondary, fontSize: 12, fontFamily: 'Inter_600SemiBold', fontWeight: '600', marginTop: 4, letterSpacing: 0.5 },
  statInline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statBar: { width: 64, height: 4, backgroundColor: COLORS.accent, borderRadius: 2, marginTop: 16 },
  dividerLabel: { color: COLORS.textSecondary, fontSize: 10, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 2, marginTop: 32, marginBottom: 4 },
  trainingCard: { backgroundColor: '#15171B', borderRadius: 20, overflow: 'hidden', marginTop: 12 },
  trainingContent: { padding: 20 },
  eliteLabel: { color: COLORS.accent, fontSize: 11, fontFamily: 'Inter_700Bold', fontWeight: '700', letterSpacing: 2 },
  trainingTitle: { color: COLORS.textPrimary, fontSize: 22, fontFamily: 'Inter_800ExtraBold', fontWeight: '800', lineHeight: 28, marginTop: 8 },
  trainingDesc: { color: COLORS.textSecondary, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 19, marginTop: 8 },
  readLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  readLinkText: { color: COLORS.accent, fontSize: 15, fontFamily: 'Inter_700Bold', fontWeight: '700' },
});
