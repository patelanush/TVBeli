import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { FeedbackState } from '@/components/FeedbackState';
import { SavedShowCard } from '@/components/SavedShowCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { TmdbAttribution } from '@/components/TmdbAttribution';
import { colors, radii, spacing } from '@/constants/theme';
import { hydrateSavedShows } from '@/services/library';
import { getHighestRatedShows, getLibraryStats } from '@/services/savedShows';
import { LibraryStats, SavedShowWithMetadata } from '@/types/savedShow';

const emptyStats: LibraryStats = { watched: 0, watching: 0, wantToWatch: 0, averageRating: null };

export default function ProfileScreen() {
  const db = useSQLiteContext();
  const [stats, setStats] = useState(emptyStats);
  const [topShows, setTopShows] = useState<SavedShowWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([getLibraryStats(db), getHighestRatedShows(db, 10)])
      .then(async ([nextStats, rows]) => ({ nextStats, shows: await hydrateSavedShows(rows) }))
      .then(({ nextStats, shows }) => { if (active) { setStats(nextStats); setTopShows(shows); } })
      .catch(() => { if (active) { setStats(emptyStats); setTopShows([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [db]));

  const statItems = [
    { value: stats.watched, label: 'Watched' },
    { value: stats.watching, label: 'Watching' },
    { value: stats.wantToWatch, label: 'Watchlist' },
  ];

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View><Text style={styles.title}>Your TV stats</Text><Text style={styles.subtitle}>A snapshot of your personal library</Text></View>
          <View style={styles.icon}><AppIcon name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }} color={colors.accent} size={23} /></View>
        </View>
        <View style={styles.stats}>{statItems.map((stat, index) => <View key={stat.label} style={[styles.stat, index < statItems.length - 1 && styles.statBorder]}><Text style={styles.statValue}>{stat.value}</Text><Text style={styles.statLabel}>{stat.label}</Text></View>)}</View>
        <View style={styles.averageCard}>
          <View><Text style={styles.averageLabel}>AVERAGE PERSONAL RATING</Text><Text style={styles.averageCopy}>{stats.averageRating === null ? 'Rate a watched show to get started' : 'Across every show you have rated'}</Text></View>
          <View style={styles.averageValue}><AppIcon name={{ ios: 'star.fill', android: 'star', web: 'star' }} color={colors.black} size={17} /><Text style={styles.averageNumber}>{stats.averageRating === null ? '—' : stats.averageRating.toFixed(1)}</Text></View>
        </View>
        <View style={styles.ranking}>
          <SectionHeader title="Top Shows" />
          {loading ? <FeedbackState title="Calculating your stats…" message="Reading your local library." loading /> : null}
          {!loading && topShows.length === 0 ? <FeedbackState title="Your Top Shows will live here" message="Personal ratings determine this list for now." /> : null}
          {!loading && topShows.length ? <View style={styles.list}>{topShows.map((item, index) => <SavedShowCard key={item.saved.tmdbId} item={item} rank={index + 1} />)}</View> : null}
        </View>
        <TmdbAttribution />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { color: colors.textMuted, fontSize: 13, marginTop: 4 },
  icon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C2112' },
  stats: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.xl, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 10, fontWeight: '700', marginTop: 4 },
  averageCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: '#39451C', backgroundColor: '#151A0D' },
  averageLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  averageCopy: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  averageValue: { minWidth: 69, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radii.md, backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 10 },
  averageNumber: { color: colors.black, fontSize: 19, fontWeight: '900' },
  ranking: { marginTop: spacing.xl },
  list: { gap: spacing.sm, paddingHorizontal: spacing.lg },
});
