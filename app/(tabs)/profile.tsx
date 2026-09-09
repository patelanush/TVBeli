import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Artwork } from '@/components/Artwork';
import { RatingBadge } from '@/components/RatingBadge';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radii, spacing } from '@/constants/theme';
import { topShows } from '@/data/shows';

const stats = [
  { value: '128', label: 'Watched' },
  { value: '4', label: 'Watching' },
  { value: '36', label: 'Watchlist' },
];

export default function ProfileScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Text style={styles.pageTitle}>Profile</Text>
          <AppIcon name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }} color={colors.textMuted} size={23} />
        </View>
        <View style={styles.identity}>
          <View style={styles.avatarOuter}><View style={styles.avatar}><Text style={styles.avatarText}>AP</Text></View></View>
          <Text style={styles.name}>Anush Patel</Text>
          <Text style={styles.handle}>@anushwatches</Text>
          <View style={styles.tasteBadge}>
            <AppIcon name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} color={colors.accent} size={14} />
            <Text style={styles.tasteText}>Taste explorer</Text>
          </View>
        </View>
        <View style={styles.stats}>
          {stats.map((stat, index) => (
            <View key={stat.label} style={[styles.stat, index < stats.length - 1 && styles.statBorder]}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.ranking}>
          <SectionHeader title="Top Shows" actionLabel="View all" />
          <View style={styles.rankingList}>
            {topShows.map((show, index) => (
              <View key={show.id} style={styles.rankRow}>
                <Text style={[styles.rankNumber, index === 0 && styles.firstRank]}>{index + 1}</Text>
                <Artwork uri={show.posterUrl} title={show.title} accentColor={show.accentColor} style={styles.poster} />
                <View style={styles.rankInfo}>
                  <Text style={styles.showTitle}>{show.title}</Text>
                  <Text style={styles.showMeta}>{show.year} · {show.genres[0]}</Text>
                </View>
                <RatingBadge rating={show.rating} />
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  pageTitle: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2 },
  identity: { alignItems: 'center', paddingTop: spacing.lg },
  avatarOuter: { width: 92, height: 92, borderRadius: 46, borderWidth: 2, borderColor: colors.accent, padding: 4 },
  avatar: { flex: 1, borderRadius: 42, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 25, fontWeight: '900' },
  name: { color: colors.text, fontSize: 24, fontWeight: '900', letterSpacing: -0.7, marginTop: spacing.md },
  handle: { color: colors.textMuted, fontSize: 13, marginTop: 3 },
  tasteBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1C2112', borderRadius: radii.pill, paddingHorizontal: 11, paddingVertical: 7, marginTop: spacing.md },
  tasteText: { color: colors.accent, fontSize: 11, fontWeight: '800' },
  stats: { flexDirection: 'row', marginHorizontal: spacing.lg, marginTop: spacing.xl, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, paddingVertical: spacing.md },
  stat: { flex: 1, alignItems: 'center' },
  statBorder: { borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: colors.border },
  statValue: { color: colors.text, fontSize: 21, fontWeight: '900' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 4, fontWeight: '600' },
  ranking: { marginTop: spacing.xl },
  rankingList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 73, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  rankNumber: { width: 25, color: colors.textMuted, fontSize: 20, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' },
  firstRank: { color: colors.accent },
  poster: { width: 46, height: 63, borderRadius: 8 },
  rankInfo: { flex: 1 },
  showTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  showMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
