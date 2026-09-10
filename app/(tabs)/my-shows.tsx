import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FeedbackState } from '@/components/FeedbackState';
import { SavedShowCard } from '@/components/SavedShowCard';
import { Screen } from '@/components/Screen';
import { colors, radii, spacing } from '@/constants/theme';
import { hydrateSavedShows } from '@/services/library';
import { getSavedShows } from '@/services/savedShows';
import { SavedShowSort, SavedShowStatus, SavedShowWithMetadata } from '@/types/savedShow';

type Filter = 'all' | SavedShowStatus;

const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'watched', label: 'Watched' },
  { value: 'watching', label: 'Watching' },
  { value: 'want_to_watch', label: 'Want to Watch' },
];

const sorts: { value: SavedShowSort; label: string }[] = [
  { value: 'recently_added', label: 'Recent' },
  { value: 'personal_rating', label: 'Rating' },
  { value: 'title', label: 'Title' },
];

export default function MyShowsScreen() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<SavedShowWithMetadata[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SavedShowSort>('recently_added');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLibrary = useCallback(() => {
    let active = true;
    setLoading(true);
    getSavedShows(db)
      .then(hydrateSavedShows)
      .then((nextItems) => { if (active) { setItems(nextItems); setError(null); } })
      .catch(() => { if (active) setError('Your saved shows could not be loaded.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [db]);

  useFocusEffect(loadLibrary);

  const handleRetry = () => {
    setError(null);
    loadLibrary();
  };

  const visibleItems = useMemo(() => {
    const next = items.filter((item) => filter === 'all' || item.saved.status === filter);
    return next.slice().sort((a, b) => {
      if (sort === 'personal_rating') return (b.saved.personalRating ?? -1) - (a.saved.personalRating ?? -1);
      if (sort === 'title') return (a.show?.title ?? '').localeCompare(b.show?.title ?? '');
      return b.saved.createdAt.localeCompare(a.saved.createdAt);
    });
  }, [filter, items, sort]);

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>My Shows</Text>
          <Text style={styles.subtitle}>Your personal television library</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {filters.map((item) => <Chip key={item.value} label={item.label} active={filter === item.value} onPress={() => setFilter(item.value)} />)}
        </ScrollView>
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>SORT BY</Text>
          <View style={styles.sorts}>{sorts.map((item) => <Chip key={item.value} label={item.label} compact active={sort === item.value} onPress={() => setSort(item.value)} />)}</View>
        </View>
        {loading ? <FeedbackState title="Loading your shows…" message="Opening your personal library." loading /> : null}
        {!loading && error ? <FeedbackState title="Library unavailable" message={error} onRetry={handleRetry} /> : null}
        {!loading && !error && visibleItems.length === 0 ? (
          <FeedbackState title={items.length ? 'Nothing in this section' : 'Your library is ready'} message={items.length ? 'Choose another filter to see your saved shows.' : 'Search for a show, then mark it Watched, Watching, or Want to Watch.'} />
        ) : null}
        {!loading && !error ? <View style={styles.list}>{visibleItems.map((item) => <SavedShowCard key={item.saved.tmdbId} item={item} />)}</View> : null}
      </ScrollView>
    </Screen>
  );
}

function Chip({ label, active, compact = false, onPress }: { label: string; active: boolean; compact?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, compact && styles.chipCompact, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 15, paddingVertical: 10 },
  chipCompact: { paddingHorizontal: 11, paddingVertical: 7 },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
  chipTextActive: { color: colors.black },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sortLabel: { color: colors.textDim, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  sorts: { flexDirection: 'row', gap: spacing.xs },
  list: { gap: spacing.sm, paddingHorizontal: spacing.lg },
});
