import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { Artwork } from '@/components/Artwork';
import { RatingBadge } from '@/components/RatingBadge';
import { colors, radii, spacing } from '@/constants/theme';
import { getShow } from '@/data/shows';
import { WatchStatus } from '@/types/show';

const statusOptions: { value: WatchStatus; label: string; icon: Parameters<typeof AppIcon>[0]['name'] }[] = [
  { value: 'watched', label: 'Watched', icon: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } },
  { value: 'watching', label: 'Watching', icon: { ios: 'play.circle.fill', android: 'play_circle', web: 'play_circle' } },
  { value: 'watchlist', label: 'Want to Watch', icon: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' } },
];

export default function ShowDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const show = getShow(id);
  const [status, setStatus] = useState<WatchStatus | undefined>(show?.status);

  if (!show) {
    return (
      <SafeAreaView style={styles.notFound}>
        <View style={styles.notFoundIcon}>
          <AppIcon name={{ ios: 'tv.slash', android: 'tv_off', web: 'tv_off' }} color={colors.textMuted} size={32} />
        </View>
        <Text style={styles.notFoundTitle}>Show not found</Text>
        <Text style={styles.notFoundCopy}>This title isn’t in the mock catalog.</Text>
        <Pressable onPress={() => router.back()} style={styles.backToApp}><Text style={styles.backToAppText}>Go back</Text></Pressable>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Artwork uri={show.backdropUrl} title={show.title} accentColor={show.accentColor} blurRadius={2} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(8,9,12,0.05)', 'rgba(8,9,12,0.35)', colors.background]} locations={[0, 0.56, 1]} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
              <AppIcon name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' }} color={colors.white} size={20} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="More options" style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
              <AppIcon name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} color={colors.white} size={23} />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroInfo}>
            <RatingBadge rating={show.rating} large />
            <Text style={styles.title}>{show.title}</Text>
            <Text style={styles.metadata}>{show.year}  ·  {show.seasons} {show.seasons === 1 ? 'Season' : 'Seasons'}</Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.genres}>{show.genres.map((genre) => <View key={genre} style={styles.genre}><Text style={styles.genreText}>{genre}</Text></View>)}</View>
          <Text style={styles.description}>{show.description}</Text>
          <Text style={styles.sectionLabel}>ADD TO YOUR SHOWS</Text>
          <View style={styles.statusGrid}>
            {statusOptions.map((option) => {
              const active = status === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setStatus(active ? undefined : option.value)}
                  style={({ pressed }) => [styles.statusButton, active && styles.statusButtonActive, pressed && styles.pressed]}>
                  <AppIcon name={option.icon} color={active ? colors.black : colors.textMuted} size={21} />
                  <Text numberOfLines={2} style={[styles.statusText, active && styles.statusTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.navigate({ pathname: '/rate', params: { showId: show.id } })}
            style={({ pressed }) => [styles.rateButton, pressed && styles.rateButtonPressed]}>
            <AppIcon name={{ ios: 'star.fill', android: 'star', web: 'star' }} color={colors.black} size={22} />
            <Text style={styles.rateButtonText}>Rate {show.title}</Text>
            <AppIcon name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} color={colors.black} size={20} />
          </Pressable>
          <View style={styles.noteCard}>
            <View style={styles.noteIcon}><AppIcon name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} color={colors.lavender} size={19} /></View>
            <Text style={styles.noteText}>Your rating will eventually help place this show in your personal ranking.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  hero: { height: 500, justifyContent: 'flex-end', backgroundColor: colors.surface },
  heroSafeArea: { position: 'absolute', left: spacing.md, right: spacing.md, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  roundButton: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,9,12,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  heroInfo: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1.7, marginTop: spacing.sm },
  metadata: { color: colors.textMuted, fontSize: 14, fontWeight: '600', marginTop: spacing.xs },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  genre: { backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 7 },
  genreText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  description: { color: '#C4C7CE', fontSize: 15, lineHeight: 23, marginTop: spacing.lg },
  sectionLabel: { color: colors.textDim, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: spacing.xl, marginBottom: spacing.sm },
  statusGrid: { flexDirection: 'row', gap: spacing.xs },
  statusButton: { flex: 1, height: 82, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statusButtonActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  statusText: { color: colors.textMuted, fontSize: 10, lineHeight: 13, fontWeight: '700', textAlign: 'center', paddingHorizontal: 2 },
  statusTextActive: { color: colors.black, fontWeight: '900' },
  rateButton: { height: 57, borderRadius: radii.md, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, paddingHorizontal: spacing.md },
  rateButtonText: { flex: 1, color: colors.black, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  rateButtonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  noteCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md, borderRadius: radii.md, backgroundColor: '#161321', padding: spacing.md },
  noteIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#29203D' },
  noteText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  pressed: { opacity: 0.62 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl },
  notFoundIcon: { width: 68, height: 68, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised, marginBottom: spacing.md },
  notFoundTitle: { color: colors.text, fontSize: 23, fontWeight: '900' },
  notFoundCopy: { color: colors.textMuted, fontSize: 14, marginTop: spacing.xs },
  backToApp: { backgroundColor: colors.accent, borderRadius: radii.pill, marginTop: spacing.lg, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  backToAppText: { color: colors.black, fontSize: 14, fontWeight: '900' },
});
