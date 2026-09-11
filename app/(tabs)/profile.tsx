import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { FeedbackState } from '@/components/FeedbackState';
import { SavedShowCard } from '@/components/SavedShowCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { TmdbAttribution } from '@/components/TmdbAttribution';
import { REACTION_ORDER, REACTIONS } from '@/constants/reactions';
import { colors, radii, spacing } from '@/constants/theme';
import { usePersonalLibrary } from '@/hooks/usePersonalLibrary';
import { useLibrary } from '@/contexts/LibraryContext';

export default function ProfileScreen() {
  const library = usePersonalLibrary();
  const cloud = useLibrary();
  const top = library.items.filter((item) => item.ranking).sort((a, b) => a.ranking!.overallRank - b.ranking!.overallRank || a.saved.tmdbId - b.saved.tmdbId).slice(0, 10);
  const stats = library.stats;

  return <Screen><ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={styles.title}>Your TV stats</Text><Text style={styles.subtitle}>Built from your synced TVBeli ranking</Text></View><View style={styles.icon}><AppIcon name={{ ios: 'chart.bar.fill', android: 'bar_chart', web: 'bar_chart' }} color={colors.accent} size={23} /></View></View>
    {!cloud.online ? <Text style={styles.syncNotice}>Offline · viewing cached data</Text> : cloud.fromCache ? <Text style={styles.syncNotice}>Syncing cloud changes…</Text> : null}
    {library.loading ? <FeedbackState title="Calculating your stats…" message="Reading your cloud library." loading /> : null}
    {!library.loading && library.error ? <FeedbackState title="Stats unavailable" message={library.error} onRetry={library.retry} /> : null}
    {!library.loading && !library.error && stats ? <>
      <View style={styles.stats}>
        <Stat value={stats.watched} label="Watched" border /><Stat value={stats.totalRanked} label="Ranked" border /><Stat value={stats.watching} label="Watching" border /><Stat value={stats.wantToWatch} label="Watchlist" />
      </View>
      <View style={styles.average}><View><Text style={styles.averageLabel}>AVERAGE TVBELI SCORE</Text><Text style={styles.averageCopy}>{stats.totalRanked ? `Across ${stats.totalRanked} ranked ${stats.totalRanked === 1 ? 'show' : 'shows'}` : 'Rank a watched show to get started'}</Text></View><View style={styles.averageValue}><Text style={styles.averageNumber}>{stats.averageScore === null ? '—' : stats.averageScore.toFixed(1)}</Text></View></View>
      <View style={styles.reactions}>{REACTION_ORDER.map((reaction) => <View key={reaction} style={styles.reactionStat}><Text style={styles.reactionEmoji}>{REACTIONS[reaction].emoji}</Text><Text style={styles.reactionValue}>{stats.counts[reaction]}</Text><Text style={styles.reactionLabel}>{REACTIONS[reaction].shortLabel}</Text></View>)}</View>
      <View style={styles.ranking}><SectionHeader title="Top Shows" />{top.length ? <View style={styles.list}>{top.map((item) => <SavedShowCard key={item.saved.tmdbId} item={item} />)}</View> : <FeedbackState title="Your Top Shows will live here" message="Rate and compare watched shows to build your ranking." />}</View>
      {library.metadataError ? <Text style={styles.notice}>Some TMDB artwork is temporarily unavailable. Your cloud ranking is still safe.</Text> : null}
      <TmdbAttribution />
      <Pressable accessibilityRole="button" onPress={() => void cloud.signOut()} style={styles.signOut}><Text style={styles.signOutText}>Sign out</Text></Pressable>
    </> : null}
  </ScrollView></Screen>;
}

function Stat({ value, label, border = false }: { value: number; label: string; border?: boolean }) {
  return <View style={[styles.stat, border && styles.statBorder]}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
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
  statValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 9, fontWeight: '700', marginTop: 4 },
  average: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: '#39451C', backgroundColor: '#151A0D' },
  averageLabel: { color: colors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  averageCopy: { color: colors.textMuted, fontSize: 11, marginTop: 5 },
  averageValue: { minWidth: 70, alignItems: 'center', borderRadius: radii.md, backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 10 },
  averageNumber: { color: colors.black, fontSize: 20, fontWeight: '900' },
  reactions: { flexDirection: 'row', gap: spacing.xs, paddingHorizontal: spacing.lg, marginTop: spacing.md },
  reactionStat: { flex: 1, alignItems: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: spacing.sm },
  reactionEmoji: { fontSize: 18 },
  reactionValue: { color: colors.text, fontSize: 16, fontWeight: '900', marginTop: 3 },
  reactionLabel: { color: colors.textMuted, fontSize: 8, fontWeight: '700', marginTop: 2 },
  ranking: { marginTop: spacing.xl },
  list: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  notice: { color: colors.textDim, fontSize: 10, lineHeight: 15, textAlign: 'center', marginHorizontal: spacing.xl, marginTop: spacing.lg },
  syncNotice: { color: colors.accent, fontSize: 10, fontWeight: '800', textAlign: 'center', marginTop: spacing.md },
  signOut: { alignSelf: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, marginTop: spacing.md },
  signOutText: { color: colors.textMuted, fontSize: 12, fontWeight: '800' },
});
