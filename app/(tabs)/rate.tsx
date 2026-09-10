import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { FeedbackState } from '@/components/FeedbackState';
import { SavedShowCard } from '@/components/SavedShowCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, radii, spacing } from '@/constants/theme';
import { hydrateSavedShows } from '@/services/library';
import { getHighestRatedShows, getRecentlyRatedShows } from '@/services/savedShows';
import { SavedShowWithMetadata } from '@/types/savedShow';

export default function RateScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [recent, setRecent] = useState<SavedShowWithMetadata[]>([]);
  const [highest, setHighest] = useState<SavedShowWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let active = true;
    setLoading(true);
    Promise.all([getRecentlyRatedShows(db, 5), getHighestRatedShows(db, 5)])
      .then(async ([recentRows, highestRows]) => Promise.all([hydrateSavedShows(recentRows), hydrateSavedShows(highestRows)]))
      .then(([recentItems, highestItems]) => { if (active) { setRecent(recentItems); setHighest(highestItems); } })
      .catch(() => { if (active) { setRecent([]); setHighest([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [db]));

  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>YOUR TASTE</Text>
          <Text style={styles.title}>Rate what you watch.</Text>
          <Text style={styles.subtitle}>Build the foundation for your personal ranking, one show at a time.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/search')} style={({ pressed }) => [styles.searchCta, pressed && styles.pressed]}>
          <View style={styles.searchIcon}><AppIcon name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} color={colors.black} size={23} /></View>
          <View style={styles.searchCopy}><Text style={styles.searchTitle}>Find a show to rate</Text><Text style={styles.searchSubtitle}>Search all TV shows on TMDB</Text></View>
          <AppIcon name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} color={colors.textMuted} size={20} />
        </Pressable>
        {loading ? <FeedbackState title="Loading your ratings…" message="Finding your latest favorites." loading /> : null}
        {!loading && recent.length === 0 ? <FeedbackState title="No ratings yet" message="Search for a show and add your first personal rating." /> : null}
        {!loading && recent.length ? <View style={styles.section}><SectionHeader title="Recently Rated" /><View style={styles.list}>{recent.map((item) => <SavedShowCard key={item.saved.tmdbId} item={item} />)}</View></View> : null}
        {!loading && highest.length ? <View style={styles.section}><SectionHeader title="Highest Rated" /><View style={styles.list}>{highest.map((item, index) => <SavedShowCard key={item.saved.tmdbId} item={item} rank={index + 1} />)}</View></View> : null}
        <View style={styles.futureCard}>
          <View style={styles.futureIcon}><AppIcon name={{ ios: 'arrow.up.arrow.down', android: 'swap_vert', web: 'swap_vert' }} color={colors.accent} size={23} /></View>
          <View style={styles.futureBody}><Text style={styles.futureTitle}>Pairwise ranking comes next</Text><Text style={styles.futureCopy}>Soon, quick head-to-head choices will turn these ratings into your definitive ranking.</Text></View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -1.2, marginTop: spacing.xs },
  subtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm, maxWidth: 340 },
  searchCta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: '#39451C', backgroundColor: '#151A0D' },
  searchIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  searchCopy: { flex: 1 },
  searchTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  searchSubtitle: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
  section: { marginTop: spacing.xl },
  list: { gap: spacing.sm, paddingHorizontal: spacing.lg },
  futureCard: { flexDirection: 'row', gap: spacing.md, marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  futureIcon: { width: 45, height: 45, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#252D13' },
  futureBody: { flex: 1 },
  futureTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  futureCopy: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
