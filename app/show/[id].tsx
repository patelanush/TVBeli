import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { Artwork } from '@/components/Artwork';
import { CastCard } from '@/components/CastCard';
import { FeedbackState } from '@/components/FeedbackState';
import { RatingBadge } from '@/components/RatingBadge';
import { ReactionBadge } from '@/components/ReactionBadge';
import { SeasonCard } from '@/components/SeasonCard';
import { TVBeliScoreBadge } from '@/components/TVBeliScoreBadge';
import { colors, radii, spacing } from '@/constants/theme';
import { NeedsUnrankConfirmationError } from '@/cloud/errors';
import { useLibrary } from '@/contexts/LibraryContext';
import { buildRankings } from '@/ranking/order';
import { getTvDetails } from '@/services/tmdb';
import type { RankingInfo } from '@/types/ranking';
import { SavedShow } from '@/types/savedShow';
import { TVShowDetails, WatchStatus } from '@/types/show';
import { confirmAction, showMessage } from '@/utils/dialogs';

const statusOptions: { value: WatchStatus; label: string; icon: Parameters<typeof AppIcon>[0]['name'] }[] = [
  { value: 'watched', label: 'Watched', icon: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } },
  { value: 'watching', label: 'Watching', icon: { ios: 'play.circle.fill', android: 'play_circle', web: 'play_circle' } },
  { value: 'want_to_watch', label: 'Want to Watch', icon: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' } },
];

function DetailSkeleton() {
  return (
    <View style={styles.skeletonScreen}>
      <View style={styles.skeletonHero} />
      <View style={styles.skeletonSummary}>
        <View style={styles.skeletonPoster} />
        <View style={styles.skeletonText}>
          <View style={[styles.skeletonLine, { width: '84%', height: 25 }]} />
          <View style={[styles.skeletonLine, { width: '58%' }]} />
          <View style={[styles.skeletonLine, { width: '42%' }]} />
        </View>
      </View>
      <View style={styles.skeletonBody}>
        <View style={[styles.skeletonLine, { width: '100%' }]} />
        <View style={[styles.skeletonLine, { width: '92%' }]} />
        <View style={[styles.skeletonLine, { width: '70%' }]} />
      </View>
    </View>
  );
}

export default function ShowDetailScreen() {
  const library = useLibrary();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const seriesId = Number(id);
  const validId = Number.isInteger(seriesId) && seriesId > 0;
  const [show, setShow] = useState<TVShowDetails | null>(null);
  const [loading, setLoading] = useState(validId);
  const [error, setError] = useState<string | null>(validId ? null : 'This TV show ID is invalid.');
  const [retryKey, setRetryKey] = useState(0);
  const [watchStatus, setWatchStatus] = useState<WatchStatus | undefined>();
  const [savedShow, setSavedShow] = useState<SavedShow | null>(null);
  const [ranking, setRanking] = useState<RankingInfo | null>(null);
  const [personalLoading, setPersonalLoading] = useState(validId);
  const [savingStatus, setSavingStatus] = useState(false);

  useFocusEffect(useCallback(() => {
    if (!validId || !library.state) return;
    const saved = library.state.savedShows[String(seriesId)] ?? null;
    setSavedShow(saved);
    setWatchStatus(saved?.status);
    setRanking(buildRankings(library.state.rankingGroups).find((item) => item.tmdbId === seriesId) ?? null);
    setPersonalLoading(false);
  }, [library.state, seriesId, validId]));

  const persistStatus = async (status: WatchStatus, confirmUnrank = false) => {
    if (savingStatus || status === watchStatus) return;
    setSavingStatus(true);
    try {
      const next = await library.saveStatus(seriesId, status, { confirmUnrank });
      setSavedShow(next.savedShows[String(seriesId)] ?? null);
      setWatchStatus(status);
      if (status !== 'watched') setRanking(null);
    } catch (error) {
      if (error instanceof NeedsUnrankConfirmationError && !confirmUnrank) {
        if (confirmAction('Remove from your ranking?', error.message)) {
          try {
            const next = await library.saveStatus(seriesId, status, { confirmUnrank: true });
            setSavedShow(next.savedShows[String(seriesId)] ?? null);
            setWatchStatus(status);
            setRanking(null);
          } catch (retryError) {
            showMessage('Couldn’t save', retryError instanceof Error ? retryError.message : 'Your show status was not changed. Please try again.');
          }
        }
      } else {
        showMessage('Couldn’t save', error instanceof Error ? error.message : 'Your show status was not changed. Please try again.');
      }
    } finally {
      setSavingStatus(false);
    }
  };

  const handleStatus = (status: WatchStatus) => {
    if (ranking && status !== 'watched') {
      const confirmed = confirmAction(
        'Remove from your ranking?',
        `Changing this show to ${status === 'watching' ? 'Watching' : 'Want to Watch'} removes its active TVBeli ranking. Your review will be kept.`,
      );
      if (confirmed) void persistStatus(status, true);
      return;
    }
    void persistStatus(status);
  };

  const handleRemove = () => {
    if (confirmAction('Remove from My Shows?', 'This will delete the saved status, review, and active ranking for this show.')) {
      void (async () => {
        try { await library.deleteShow(seriesId); setSavedShow(null); setWatchStatus(undefined); setRanking(null); }
        catch (error) { showMessage('Couldn’t remove show', error instanceof Error ? error.message : 'Please try again.'); }
      })();
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryKey((key) => key + 1);
  };

  useEffect(() => {
    if (!validId) return;
    const controller = new AbortController();

    getTvDetails(seriesId, controller.signal)
      .then(setShow)
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retryKey, seriesId, validId]);

  if (loading && !show) return <DetailSkeleton />;

  if (error || !show) {
    return (
      <SafeAreaView style={styles.feedbackScreen}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.feedbackBack}>
          <AppIcon name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' }} color={colors.text} size={20} />
        </Pressable>
        <FeedbackState
          title="Couldn’t load this show"
          message={error ?? 'TMDB did not return details for this show.'}
          onRetry={validId ? handleRetry : undefined}
        />
      </SafeAreaView>
    );
  }

  const creators = show.creators.map((creator) => creator.name).join(', ');

  return (
    <View style={styles.screen}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Artwork uri={show.backdropUrl} title={show.title} accentColor={show.accentColor} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={['rgba(8,9,12,0.04)', 'rgba(8,9,12,0.28)', colors.background]} locations={[0, 0.63, 1]} style={StyleSheet.absoluteFill} />
          <SafeAreaView edges={['top']} style={styles.heroSafeArea}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
              <AppIcon name={{ ios: 'chevron.left', android: 'arrow_back_ios_new', web: 'arrow_back_ios_new' }} color={colors.white} size={20} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="More options" style={({ pressed }) => [styles.roundButton, pressed && styles.pressed]}>
              <AppIcon name={{ ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' }} color={colors.white} size={23} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.body}>
          <View style={styles.summary}>
            <Artwork uri={show.posterUrl} title={show.title} accentColor={show.accentColor} style={styles.poster} />
            <View style={styles.titleBlock}>
              {show.rating !== null ? <RatingBadge rating={show.rating} large /> : null}
              <Text numberOfLines={3} adjustsFontSizeToFit minimumFontScale={0.78} style={styles.title}>{show.title}</Text>
              <Text numberOfLines={2} style={styles.metadata}>
                {show.year ?? 'TBA'}  ·  {show.productionStatus}
              </Text>
            </View>
          </View>

          <View style={styles.genres}>{show.genres.map((genre) => <View key={genre} style={styles.genre}><Text style={styles.genreText}>{genre}</Text></View>)}</View>

          <View style={styles.factRow}>
            <View style={styles.fact}><Text style={styles.factValue}>{show.seasons ?? '—'}</Text><Text style={styles.factLabel}>Seasons</Text></View>
            <View style={styles.factDivider} />
            <View style={styles.fact}><Text style={styles.factValue}>{show.episodeCount || '—'}</Text><Text style={styles.factLabel}>Episodes</Text></View>
            <View style={styles.factDivider} />
            <View style={styles.fact}><Text numberOfLines={1} adjustsFontSizeToFit style={styles.factValueSmall}>{show.productionStatus}</Text><Text style={styles.factLabel}>Status</Text></View>
          </View>

          {creators ? <Text style={styles.createdBy}>Created by <Text style={styles.createdByNames}>{creators}</Text></Text> : null}
          <Text style={styles.description}>{show.description || 'TMDB does not have an overview for this series yet.'}</Text>

          {show.networks.length ? (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Networks</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.networkRow}>
                {show.networks.map((network) => (
                  <View key={network.id} style={styles.networkCard}>
                    {network.logoUrl ? <Image source={network.logoUrl} contentFit="contain" style={styles.networkLogo} accessibilityLabel={`${network.name} logo`} /> : null}
                    <Text numberOfLines={1} style={styles.networkName}>{network.name}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>ADD TO YOUR SHOWS</Text>
          <View style={styles.statusGrid}>
            {statusOptions.map((option) => {
              const active = watchStatus === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  disabled={savingStatus}
                  onPress={() => handleStatus(option.value)}
                  style={({ pressed }) => [styles.statusButton, active && styles.statusButtonActive, pressed && styles.pressed]}>
                  <AppIcon name={option.icon} color={active ? colors.black : colors.textMuted} size={21} />
                  <Text numberOfLines={2} style={[styles.statusText, active && styles.statusTextActive]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>

          {ranking ? (
            <View style={styles.rankingCard}>
              <View style={styles.rankingTop}><View><Text style={styles.yourTakeTitle}>Your TVBeli ranking</Text><ReactionBadge reaction={ranking.reaction} /></View><TVBeliScoreBadge scoreTenths={ranking.scoreTenths} large /></View>
              <Text style={styles.overallRank}>#{ranking.overallRank} <Text style={styles.overallLabel}>Overall</Text></Text>
              {ranking.tieSize > 1 ? <Text style={styles.tieCopy}>True tie with {ranking.tieSize - 1} other {ranking.tieSize === 2 ? 'show' : 'shows'}</Text> : null}
              <View style={styles.rankingActions}>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/rate/[id]', params: { id: seriesId, mode: 'rerank' } })} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Re-rank</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/rate/[id]', params: { id: seriesId, mode: 'change' } })} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Change reaction</Text></Pressable>
              </View>
            </View>
          ) : watchStatus === 'watched' && !personalLoading ? (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/rate/[id]', params: { id: seriesId, mode: 'new' } })} style={({ pressed }) => [styles.rateButton, pressed && styles.rateButtonPressed]}>
              <AppIcon name={{ ios: 'arrow.up.arrow.down', android: 'swap_vert', web: 'swap_vert' }} color={colors.black} size={22} />
              <Text numberOfLines={1} style={styles.rateButtonText}>Rate & Rank</Text>
              <AppIcon name={{ ios: 'arrow.right', android: 'arrow_forward', web: 'arrow_forward' }} color={colors.black} size={20} />
            </Pressable>
          ) : !personalLoading ? <Text style={styles.rankHint}>Mark this show Watched to rate and rank it.</Text> : null}

          {savedShow ? (
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/review/[id]', params: { id: seriesId, title: show.title } } as unknown as Href)} style={styles.yourTake}>
              <View style={styles.yourTakeHeader}><Text style={styles.yourTakeTitle}>Personal note</Text><Text style={styles.editTake}>{savedShow.review ? 'Edit' : 'Add'}</Text></View>
              <Text style={savedShow.review ? styles.review : styles.emptyReview} numberOfLines={4}>{savedShow.review || 'Write something you want to remember about this show.'}</Text>
            </Pressable>
          ) : null}

          {savedShow ? <Pressable accessibilityRole="button" onPress={handleRemove} style={styles.removeButton}><Text style={styles.removeText}>Remove from My Shows</Text></Pressable> : null}

          {show.cast.length ? (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Top Cast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.castRow}>
                {show.cast.map((member) => <CastCard key={member.id} member={member} />)}
              </ScrollView>
            </View>
          ) : null}

          {show.seasonList.length ? (
            <View style={styles.detailSection}>
              <Text style={styles.sectionTitle}>Seasons</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonRow}>
                {show.seasonList.map((season) => <SeasonCard key={season.id} season={season} />)}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  hero: { height: 390, backgroundColor: colors.surface },
  heroSafeArea: { position: 'absolute', left: spacing.md, right: spacing.md, top: 0, flexDirection: 'row', justifyContent: 'space-between' },
  roundButton: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,9,12,0.72)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  body: { paddingHorizontal: spacing.lg },
  summary: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.md, marginTop: -94, minHeight: 172 },
  poster: { width: 112, height: 168, borderRadius: radii.md, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', backgroundColor: colors.surfaceRaised },
  titleBlock: { flex: 1, paddingBottom: 8, alignItems: 'flex-start' },
  title: { color: colors.text, fontSize: 32, lineHeight: 35, fontWeight: '900', letterSpacing: -1.35, marginTop: spacing.sm },
  metadata: { color: colors.textMuted, fontSize: 12, lineHeight: 17, fontWeight: '600', marginTop: spacing.xs },
  genres: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.lg },
  genre: { backgroundColor: colors.surfaceRaised, borderRadius: radii.pill, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 11, paddingVertical: 7 },
  genreText: { color: colors.textMuted, fontSize: 11, fontWeight: '700' },
  factRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.lg, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, paddingVertical: 13 },
  fact: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  factDivider: { height: 28, width: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  factValue: { color: colors.text, fontSize: 17, fontWeight: '900' },
  factValueSmall: { color: colors.text, fontSize: 13, fontWeight: '800', width: '100%', textAlign: 'center' },
  factLabel: { color: colors.textDim, fontSize: 9, fontWeight: '700', marginTop: 3 },
  createdBy: { color: colors.textMuted, fontSize: 12, lineHeight: 18, marginTop: spacing.lg },
  createdByNames: { color: colors.text, fontWeight: '700' },
  description: { color: '#C4C7CE', fontSize: 15, lineHeight: 23, marginTop: spacing.sm },
  sectionLabel: { color: colors.textDim, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', letterSpacing: -0.4, marginBottom: spacing.md },
  detailSection: { marginTop: spacing.xl },
  networkRow: { gap: spacing.sm, paddingRight: spacing.lg },
  networkCard: { width: 132, height: 72, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: '#F4F5F6', padding: spacing.sm },
  networkLogo: { width: 90, height: 32 },
  networkName: { color: '#282B31', fontSize: 9, fontWeight: '800', marginTop: 4, maxWidth: 112 },
  statusGrid: { flexDirection: 'row', gap: spacing.xs },
  statusButton: { flex: 1, height: 82, alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  statusButtonActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  statusText: { color: colors.textMuted, fontSize: 10, lineHeight: 13, fontWeight: '700', textAlign: 'center', paddingHorizontal: 2 },
  statusTextActive: { color: colors.black, fontWeight: '900' },
  rateButton: { height: 57, borderRadius: radii.md, backgroundColor: colors.accent, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.md, paddingHorizontal: spacing.md },
  rateButtonText: { flex: 1, color: colors.black, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  rateButtonPressed: { opacity: 0.82, transform: [{ scale: 0.99 }] },
  rankHint: { color: colors.textDim, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing.md },
  rankingCard: { marginTop: spacing.md, borderRadius: radii.lg, borderWidth: 1, borderColor: '#39451C', backgroundColor: '#151A0D', padding: spacing.md },
  rankingTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  overallRank: { color: colors.text, fontSize: 27, fontWeight: '900', letterSpacing: -0.8, marginTop: spacing.md },
  overallLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 0 },
  tieCopy: { color: colors.lavender, fontSize: 11, fontWeight: '700', marginTop: 3 },
  rankingActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  secondaryAction: { flex: 1, minHeight: 43, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, paddingHorizontal: spacing.xs },
  secondaryActionText: { color: colors.text, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  yourTake: { marginTop: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  yourTakeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  yourTakeTitle: { color: colors.text, fontSize: 17, fontWeight: '900' },
  review: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: spacing.sm },
  emptyReview: { color: colors.textDim, fontSize: 13, lineHeight: 19, marginTop: spacing.sm },
  editTake: { color: colors.accent, fontSize: 11, fontWeight: '800', marginTop: spacing.sm },
  removeButton: { alignItems: 'center', paddingVertical: spacing.md, marginTop: spacing.xs },
  removeText: { color: colors.coral, fontSize: 12, fontWeight: '800' },
  castRow: { gap: spacing.sm, paddingRight: spacing.lg },
  seasonRow: { gap: spacing.md, paddingRight: spacing.lg },
  pressed: { opacity: 0.62 },
  feedbackScreen: { flex: 1, backgroundColor: colors.background },
  feedbackBack: { width: 43, height: 43, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginLeft: spacing.md, backgroundColor: colors.surfaceRaised },
  skeletonScreen: { flex: 1, backgroundColor: colors.background },
  skeletonHero: { height: 390, backgroundColor: colors.surfaceRaised },
  skeletonSummary: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: spacing.lg, marginTop: -94 },
  skeletonPoster: { width: 112, height: 168, borderRadius: radii.md, backgroundColor: '#22252C' },
  skeletonText: { flex: 1, gap: spacing.sm, paddingTop: 66 },
  skeletonLine: { height: 13, borderRadius: 7, backgroundColor: colors.surfaceRaised },
  skeletonBody: { gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.lg },
});
