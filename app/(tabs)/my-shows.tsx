import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FeedbackState } from '@/components/FeedbackState';
import { SavedShowCard } from '@/components/SavedShowCard';
import { Screen } from '@/components/Screen';
import { colors, radii, spacing } from '@/constants/theme';
import { usePersonalLibrary } from '@/hooks/usePersonalLibrary';
import type { SavedShowSort, SavedShowStatus } from '@/types/savedShow';

type Filter = 'all' | SavedShowStatus;
const filters: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' }, { value: 'watched', label: 'Watched' },
  { value: 'watching', label: 'Watching' }, { value: 'want_to_watch', label: 'Want to Watch' },
];
const sorts: { value: SavedShowSort; label: string }[] = [
  { value: 'recently_added', label: 'Recent' }, { value: 'ranking', label: 'Ranking' }, { value: 'title', label: 'Title' },
];

export default function MyShowsScreen() {
  const library = usePersonalLibrary();
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SavedShowSort>('recently_added');
  const visible = useMemo(() => library.items.filter((item) => filter === 'all' || item.saved.status === filter).sort((a, b) => {
    if (sort === 'ranking') return (a.ranking?.overallRank ?? Number.MAX_SAFE_INTEGER) - (b.ranking?.overallRank ?? Number.MAX_SAFE_INTEGER) || a.saved.tmdbId - b.saved.tmdbId;
    if (sort === 'title') return (a.show?.title ?? `TV show ${a.saved.tmdbId}`).localeCompare(b.show?.title ?? `TV show ${b.saved.tmdbId}`);
    return b.saved.createdAt.localeCompare(a.saved.createdAt);
  }), [filter, library.items, sort]);

  const header = <View>
    <View style={styles.header}><Text style={styles.title}>My Shows</Text><Text style={styles.subtitle}>Your personal television library</Text></View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((item) => <Chip key={item.value} label={item.label} active={filter === item.value} onPress={() => setFilter(item.value)} />)}</ScrollView>
    <View style={styles.sortRow}><Text style={styles.sortLabel}>SORT BY</Text><View style={styles.sorts}>{sorts.map((item) => <Chip key={item.value} compact label={item.label} active={sort === item.value} onPress={() => setSort(item.value)} />)}</View></View>
    {library.metadataError ? <Text style={styles.notice}>Some TMDB details couldn’t load. Your saved data remains available.</Text> : null}
  </View>;

  return <Screen>
    <FlatList
      data={library.error ? [] : visible}
      keyExtractor={(item) => String(item.saved.tmdbId)}
      renderItem={({ item }) => <SavedShowCard item={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={header}
      ListFooterComponent={<View style={styles.footer} />}
      ListEmptyComponent={library.loading
        ? <FeedbackState title="Loading your shows…" message="Opening your cloud library." loading />
        : library.error
          ? <FeedbackState title="Library unavailable" message={library.error} onRetry={library.retry} />
          : <FeedbackState title={library.items.length ? 'Nothing in this section' : 'Your library is ready'} message={library.items.length ? 'Choose another filter to see your saved shows.' : 'Search for a show, then choose Watched, Watching, or Want to Watch.'} />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  </Screen>;
}

function Chip({ label, active, compact = false, onPress }: { label: string; active: boolean; compact?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, compact && styles.chipCompact, active && styles.chipActive]}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: spacing.lg },
  header: { paddingTop: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  filters: { gap: spacing.sm, paddingVertical: spacing.lg },
  chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 15, paddingVertical: 10 },
  chipCompact: { paddingHorizontal: 10, paddingVertical: 7 },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  chipTextActive: { color: colors.black },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md },
  sortLabel: { color: colors.textDim, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  sorts: { flexDirection: 'row', gap: spacing.xs },
  notice: { color: colors.textDim, fontSize: 10, lineHeight: 15, textAlign: 'center', marginBottom: spacing.md },
  separator: { height: spacing.sm },
  footer: { height: spacing.xxl },
});
