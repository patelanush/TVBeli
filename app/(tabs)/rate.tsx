import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { FeedbackState } from '@/components/FeedbackState';
import { SavedShowCard } from '@/components/SavedShowCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radii, spacing } from '@/constants/theme';
import { usePersonalLibrary } from '@/hooks/usePersonalLibrary';

export default function RateScreen() {
  const router = useRouter();
  const library = usePersonalLibrary();
  const unranked = library.items.filter((item) => item.saved.status === 'watched' && !item.ranking);
  const ranked = library.items.filter((item) => item.ranking);
  const recent = ranked.slice().sort((a, b) => b.ranking!.rankedAt.localeCompare(a.ranking!.rankedAt)).slice(0, 5);
  const top = ranked.slice().sort((a, b) => a.ranking!.overallRank - b.ranking!.overallRank || a.saved.tmdbId - b.saved.tmdbId).slice(0, 5);

  return (
    <Screen>
      <LinearGradient colors={['#151A0D', colors.background]} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}><Text style={styles.eyebrow}>YOUR TASTE</Text><Text style={styles.title}>Rate. Compare. Rank.</Text><Text style={styles.subtitle}>Turn what you watched into a ranking that gets sharper over time.</Text></View>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => router.navigate('/search')} style={({ pressed }) => [styles.primaryAction, pressed && styles.pressed]}><AppIcon name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} color={colors.black} size={22} /><View style={styles.actionCopy}><Text style={styles.primaryTitle}>Find a show</Text><Text style={styles.primaryCopy}>Search TV shows to add</Text></View></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.push('/rankings' as Href)} style={({ pressed }) => [styles.allAction, pressed && styles.pressed]}><AppIcon name={{ ios: 'list.number', android: 'format_list_numbered', web: 'format_list_numbered' }} color={colors.accent} size={22} /><Text style={styles.allText}>All Rankings</Text></Pressable>
        </View>
        {library.loading ? <FeedbackState title="Loading your ranking…" message="Syncing your cloud library." loading /> : null}
        {!library.loading && library.error ? <FeedbackState title="Ranking unavailable" message={library.error} onRetry={library.retry} /> : null}
        {!library.loading && !library.error ? (
          <>
            <View style={styles.section}><SectionHeader title="Rate & Rank" />{unranked.length ? <View style={styles.list}>{unranked.slice(0, 6).map((item) => <SavedShowCard key={item.saved.tmdbId} item={item} rankAction />)}</View> : <EmptyCard title="You’re caught up" copy="Watched shows that still need ranking will appear here." />}</View>
            {recent.length ? <View style={styles.section}><SectionHeader title="Recently Rated" /><View style={styles.list}>{recent.map((item) => <SavedShowCard key={item.saved.tmdbId} item={item} />)}</View></View> : null}
            {top.length ? <View style={styles.section}><SectionHeader title="Top Shows" actionLabel="View all" onPress={() => router.push('/rankings' as Href)} /><View style={styles.list}>{top.map((item) => <SavedShowCard key={item.saved.tmdbId} item={item} />)}</View></View> : null}
            {!ranked.length && !unranked.length ? <EmptyCard title="Your ranking starts here" copy="Mark a show Watched, then choose your reaction and compare it with your favorites." /> : null}
          </>
        ) : null}
        {library.metadataError ? <Text style={styles.metadataNotice}>Some show artwork is unavailable. Your cloud ranking is still safe.</Text> : null}
      </ScrollView>
    </Screen>
  );
}

function EmptyCard({ title, copy }: { title: string; copy: string }) {
  return <View style={styles.empty}><Text style={styles.emptyTitle}>{title}</Text><Text style={styles.emptyCopy}>{copy}</Text></View>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -1.2, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, maxWidth: 345 },
  actions: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  primaryAction: { flex: 1, minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.lg, backgroundColor: colors.accent, padding: spacing.md },
  actionCopy: { flex: 1 },
  primaryTitle: { color: colors.black, fontSize: 15, fontWeight: '900' },
  primaryCopy: { color: '#40500D', fontSize: 10, fontWeight: '700', marginTop: 3 },
  allAction: { width: 105, minHeight: 67, alignItems: 'center', justifyContent: 'center', gap: 4, borderRadius: radii.lg, borderWidth: 1, borderColor: '#39451C', backgroundColor: '#151A0D' },
  allText: { color: colors.text, fontSize: 11, fontWeight: '800' },
  section: { marginTop: spacing.xl },
  list: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  empty: { marginHorizontal: spacing.lg, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  emptyCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.xs },
  metadataNotice: { color: colors.textDim, fontSize: 10, lineHeight: 15, textAlign: 'center', marginHorizontal: spacing.xl, marginTop: spacing.lg },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
});
