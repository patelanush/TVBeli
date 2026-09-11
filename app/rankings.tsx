import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { FeedbackState } from '@/components/FeedbackState';
import { SavedShowCard } from '@/components/SavedShowCard';
import { REACTIONS } from '@/constants/reactions';
import { colors, radii, spacing } from '@/constants/theme';
import { usePersonalLibrary } from '@/hooks/usePersonalLibrary';
import type { Reaction } from '@/types/ranking';

type Filter = 'ALL' | Reaction;
const filters: Filter[] = ['ALL', 'LOVE', 'LIKE', 'MID', 'DISLIKE'];

export default function AllRankingsScreen() {
  const router = useRouter();
  const library = usePersonalLibrary();
  const [filter, setFilter] = useState<Filter>('ALL');
  const items = useMemo(() => library.items.filter((item) => item.ranking && (filter === 'ALL' || item.ranking.reaction === filter)).sort((a, b) => a.ranking!.overallRank - b.ranking!.overallRank || a.saved.tmdbId - b.saved.tmdbId), [filter, library.items]);

  return <SafeAreaView style={styles.screen} edges={['top']}>
    <FlatList
      data={library.error ? [] : items}
      keyExtractor={(item) => String(item.saved.tmdbId)}
      renderItem={({ item }) => <SavedShowCard item={item} />}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListHeaderComponent={<View>
        <View style={styles.topBar}><Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.back}><AppIcon name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} color={colors.text} size={20} /></Pressable><Text style={styles.topTitle}>All Rankings</Text><View style={styles.spacer} /></View>
        <View style={styles.heading}><Text style={styles.title}>Your definitive list.</Text><Text style={styles.subtitle}>Preference order decides rank. TVBeli scores give the shape of your taste.</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>{filters.map((value) => <Pressable key={value} accessibilityRole="button" accessibilityState={{ selected: filter === value }} onPress={() => setFilter(value)} style={[styles.chip, filter === value && styles.chipActive]}><Text style={[styles.chipText, filter === value && styles.chipTextActive]}>{value === 'ALL' ? 'All' : `${REACTIONS[value].emoji} ${REACTIONS[value].shortLabel}`}</Text></Pressable>)}</ScrollView>
        {library.metadataError ? <Text style={styles.notice}>Some TMDB details couldn’t load. Rank numbers and scores remain available.</Text> : null}
      </View>}
      ListEmptyComponent={library.loading ? <FeedbackState title="Loading your rankings…" message="Reading your preference groups." loading /> : library.error ? <FeedbackState title="Rankings unavailable" message={library.error} onRetry={library.retry} /> : <FeedbackState title={filter === 'ALL' ? 'No rankings yet' : `No ${REACTIONS[filter].shortLabel.toLowerCase()} shows yet`} message="Rank watched shows from the Rate tab to build this list." />}
      ListFooterComponent={<View style={styles.footer} />}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  spacer: { width: 42 },
  topTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  heading: { paddingTop: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: spacing.xs, maxWidth: 345 },
  filters: { gap: spacing.sm, paddingVertical: spacing.lg },
  chip: { borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingHorizontal: 14, paddingVertical: 9 },
  chipActive: { borderColor: colors.accent, backgroundColor: colors.accent },
  chipText: { color: colors.textMuted, fontSize: 11, fontWeight: '800' },
  chipTextActive: { color: colors.black },
  notice: { color: colors.textDim, fontSize: 10, textAlign: 'center', marginBottom: spacing.md },
  separator: { height: spacing.sm },
  footer: { height: spacing.xxl },
});
