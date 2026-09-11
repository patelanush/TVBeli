import { LinearGradient } from 'expo-linear-gradient';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { ComparisonCard } from '@/components/ComparisonCard';
import { FeedbackState } from '@/components/FeedbackState';
import { ReactionBadge } from '@/components/ReactionBadge';
import { ReactionPicker } from '@/components/ReactionPicker';
import { TVBeliScoreBadge } from '@/components/TVBeliScoreBadge';
import { colors, radii, spacing } from '@/constants/theme';
import { useRankingSession, type RankingMode } from '@/hooks/useRankingSession';
import { buildRankings } from '@/ranking/order';
import { getTvSummary } from '@/services/tmdb';
import type { TVShow } from '@/types/show';

export default function RankShowScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string; mode?: RankingMode }>();
  const tmdbId = Number(params.id);
  const mode: RankingMode = params.mode === 'rerank' || params.mode === 'change' ? params.mode : 'new';
  const flow = useRankingSession(tmdbId, mode);
  const [candidateResult, setCandidateResult] = useState<{ id: number; show: TVShow } | null>(null);
  const [candidateErrorResult, setCandidateErrorResult] = useState<{ id: number; retryKey: number; message: string } | null>(null);
  const [candidateRetryKey, setCandidateRetryKey] = useState(0);
  const [opponentResult, setOpponentResult] = useState<{ id: number; show: TVShow } | null>(null);
  const [opponentErrorResult, setOpponentErrorResult] = useState<{ id: number; retryKey: number; message: string } | null>(null);
  const [opponentRetryKey, setOpponentRetryKey] = useState(0);
  const [contextShows, setContextShows] = useState<Map<number, TVShow>>(new Map());
  const representativeId = flow.opponentGroup?.members[0]?.tmdbId ?? null;
  const candidate = candidateResult?.id === tmdbId ? candidateResult.show : null;
  const opponent = opponentResult?.id === representativeId ? opponentResult.show : null;
  const candidateError = candidateErrorResult?.id === tmdbId && candidateErrorResult.retryKey === candidateRetryKey ? candidateErrorResult.message : null;
  const opponentError = opponentErrorResult?.id === representativeId && opponentErrorResult.retryKey === opponentRetryKey ? opponentErrorResult.message : null;

  useEffect(() => {
    const controller = new AbortController();
    if (Number.isSafeInteger(tmdbId) && tmdbId > 0) {
      getTvSummary(tmdbId, controller.signal).then((show) => setCandidateResult({ id: tmdbId, show })).catch((error: unknown) => {
        if (error instanceof Error && error.name !== 'AbortError') setCandidateErrorResult({ id: tmdbId, retryKey: candidateRetryKey, message: 'This show’s TMDB details could not be loaded.' });
      });
    }
    return () => controller.abort();
  }, [candidateRetryKey, tmdbId]);

  useEffect(() => {
    const controller = new AbortController();
    if (representativeId) getTvSummary(representativeId, controller.signal).then((show) => setOpponentResult({ id: representativeId, show })).catch((error: unknown) => {
      if (error instanceof Error && error.name !== 'AbortError') setOpponentErrorResult({ id: representativeId, retryKey: opponentRetryKey, message: 'The comparison show’s TMDB details could not be loaded.' });
    });
    return () => controller.abort();
  }, [opponentRetryKey, representativeId]);

  const rankings = useMemo(() => flow.result ? buildRankings(flow.result.groups) : [], [flow.result]);
  const resultInfo = rankings.find((ranking) => ranking.tmdbId === tmdbId) ?? null;
  const nearby = useMemo(() => {
    if (!resultInfo) return [];
    const groupIndex = flow.result!.groups.findIndex((group) => group.id === resultInfo.groupId);
    return flow.result!.groups.slice(Math.max(0, groupIndex - 2), groupIndex + 3)
      .flatMap((group) => group.members.map((member) => rankings.find((rank) => rank.tmdbId === member.tmdbId)!));
  }, [flow.result, rankings, resultInfo]);

  useEffect(() => {
    let active = true;
    if (!nearby.length) return () => { active = false; };
    Promise.allSettled(nearby.map((item) => getTvSummary(item.tmdbId))).then((results) => {
      if (!active) return;
      const map = new Map<number, TVShow>();
      results.forEach((result, index) => { if (result.status === 'fulfilled') map.set(nearby[index].tmdbId, result.value); });
      setContextShows(map);
    });
    return () => { active = false; };
  }, [nearby]);

  const close = () => router.back();
  const canAnswer = Boolean(candidate && opponent && !flow.saving);

  if (flow.loading) return <SafeAreaView style={styles.screen}><FeedbackState title="Preparing your ranking…" message="Loading your personal preference groups." loading /></SafeAreaView>;
  if (flow.loadError) return <SafeAreaView style={styles.screen}><FeedbackState title="Can’t start ranking" message={flow.loadError} onRetry={flow.restart} /><Pressable onPress={close} style={styles.bottomLink}><Text style={styles.bottomLinkText}>Close</Text></Pressable></SafeAreaView>;

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <LinearGradient colors={['#171D0C', colors.background]} style={StyleSheet.absoluteFill} />
      <View style={styles.topBar}>
        <Pressable accessibilityRole="button" accessibilityLabel={flow.session ? 'Go back one step' : 'Cancel ranking'} disabled={flow.saving} onPress={flow.session ? flow.back : close} style={styles.iconButton}>
          <AppIcon name={flow.session ? { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' } : { ios: 'xmark', android: 'close', web: 'close' }} color={colors.text} size={20} />
        </Pressable>
        <Text style={styles.topTitle}>{flow.result ? 'Ranked' : flow.session ? 'Compare' : 'Your reaction'}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Cancel ranking" disabled={flow.saving} onPress={close} style={styles.cancel}><Text style={styles.cancelText}>Cancel</Text></Pressable>
      </View>

      {flow.result && resultInfo ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.resultContent}>
          <Text style={styles.sparkle}>✦</Text>
          <Text style={styles.resultEyebrow}>RANKING COMPLETE</Text>
          <Text style={styles.resultTitle}>{candidate?.title ?? 'This show'} is now your #{resultInfo.overallRank} show.</Text>
          <View style={styles.resultBadges}><ReactionBadge reaction={resultInfo.reaction} /><TVBeliScoreBadge scoreTenths={resultInfo.scoreTenths} large /></View>
          <View style={styles.contextCard}>
            <Text style={styles.contextTitle}>Nearby in your ranking</Text>
            {nearby.map((item) => <View key={item.tmdbId} style={[styles.contextRow, item.tmdbId === tmdbId && styles.contextActive]}><Text style={styles.contextRank}>#{item.overallRank}</Text><Text numberOfLines={1} style={styles.contextName}>{contextShows.get(item.tmdbId)?.title ?? `TV show #${item.tmdbId}`}</Text><Text style={styles.contextScore}>{(item.scoreTenths / 10).toFixed(1)}</Text></View>)}
          </View>
          <Pressable accessibilityRole="button" onPress={close} style={styles.done}><Text style={styles.doneText}>Done</Text></Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/rankings' as Href)} style={styles.viewAll}><Text style={styles.viewAllText}>View all rankings</Text></Pressable>
        </ScrollView>
      ) : flow.session && flow.opponentGroup ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.compareContent}>
          <Text style={styles.step}>COMPARISON {flow.session.comparisons + 1}</Text>
          <Text style={styles.question}>Which did you prefer?</Text>
          <Text style={styles.hint}>Choose honestly. Equal creates a true tie.</Text>
          <View style={styles.cards}>
            <ComparisonCard label="NEW SHOW" show={candidate} disabled={!canAnswer} onPress={() => flow.answer('candidate', flow.opponentGroup!.id)} />
            <View style={styles.vs}><Text style={styles.vsText}>VS</Text></View>
            <ComparisonCard label="CURRENT SHOW" show={opponent} tieSize={flow.opponentGroup.members.length} disabled={!canAnswer} onPress={() => flow.answer('existing', flow.opponentGroup!.id)} />
          </View>
          {candidateError || opponentError
            ? <ErrorBox message={candidateError ?? opponentError!} onRetry={() => candidateError ? setCandidateRetryKey((value) => value + 1) : setOpponentRetryKey((value) => value + 1)} />
            : !candidate || !opponent ? <ActivityIndicator color={colors.accent} style={styles.loadingShows} /> : null}
          <Pressable accessibilityRole="button" disabled={!canAnswer} onPress={() => flow.answer('equal', flow.opponentGroup!.id)} style={({ pressed }) => [styles.equal, (!canAnswer || pressed) && styles.equalPressed]}>
            <AppIcon name={{ ios: 'equal.circle.fill', android: 'drag_handle', web: 'drag_handle' }} color={colors.lavender} size={22} />
            <View><Text style={styles.equalTitle}>Equal / Can’t choose</Text><Text style={styles.equalCopy}>Place them in the same true preference group</Text></View>
          </Pressable>
          <View style={styles.progress}><View style={[styles.progressFill, { width: `${Math.min(92, 18 + flow.session.comparisons * 15)}%` }]} /></View>
          {flow.saving ? <Text style={styles.saving}>Saving your final ranking…</Text> : null}
          {flow.saveError ? <ErrorBox message={flow.saveError} onRetry={flow.retrySave} /> : null}
        </ScrollView>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.reactionContent}>
          <Text style={styles.step}>STEP 1 OF 3</Text>
          <Text style={styles.question}>How did you feel about it?</Text>
          <Text numberOfLines={2} style={styles.showName}>{candidate?.title ?? 'Loading show…'}</Text>
          {candidateError
            ? <ErrorBox message={candidateError} onRetry={() => setCandidateRetryKey((value) => value + 1)} />
            : <ReactionPicker disabled={!candidate} onSelect={flow.chooseReaction} />}
          {flow.saving ? <Text style={styles.saving}>Saving your ranking…</Text> : null}
          {flow.saveError ? <ErrorBox message={flow.saveError} onRetry={flow.retrySave} /> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function ErrorBox({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <View style={styles.error}><Text style={styles.errorText}>{message}</Text><Pressable onPress={onRetry}><Text style={styles.retry}>Try again</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(24,27,34,0.9)' },
  topTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  cancel: { minWidth: 54, alignItems: 'flex-end', paddingVertical: spacing.sm },
  cancelText: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  reactionContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  compareContent: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  step: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  question: { color: colors.text, fontSize: 30, lineHeight: 35, fontWeight: '900', letterSpacing: -1.1, textAlign: 'center', marginTop: spacing.xs },
  hint: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.xs },
  showName: { color: colors.textMuted, fontSize: 16, lineHeight: 22, fontWeight: '700', textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  cards: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.lg },
  vs: { width: 34, height: 34, zIndex: 2, marginHorizontal: -13, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderWidth: 3, borderColor: colors.background },
  vsText: { color: colors.black, fontSize: 9, fontWeight: '900', fontStyle: 'italic' },
  loadingShows: { marginTop: spacing.sm },
  equal: { minHeight: 66, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: '#554787', backgroundColor: '#1D192B', marginTop: spacing.md, padding: spacing.sm },
  equalTitle: { color: colors.text, fontSize: 14, fontWeight: '900' },
  equalCopy: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
  equalPressed: { opacity: 0.45 },
  progress: { height: 4, backgroundColor: colors.surfaceRaised, borderRadius: 2, marginHorizontal: spacing.lg, marginTop: spacing.lg, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.accent, borderRadius: 2 },
  saving: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: spacing.md },
  error: { borderRadius: radii.md, backgroundColor: '#2A1719', padding: spacing.md, marginTop: spacing.md },
  errorText: { color: '#FFB4B4', fontSize: 12, lineHeight: 17, textAlign: 'center' },
  retry: { color: colors.accent, fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: spacing.sm },
  resultContent: { alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xxl },
  sparkle: { color: colors.accent, fontSize: 58 },
  resultEyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2, marginTop: spacing.sm },
  resultTitle: { color: colors.text, fontSize: 28, lineHeight: 34, fontWeight: '900', letterSpacing: -1, textAlign: 'center', marginTop: spacing.sm },
  resultBadges: { alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  contextCard: { alignSelf: 'stretch', borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md, marginTop: spacing.xl },
  contextTitle: { color: colors.text, fontSize: 15, fontWeight: '900', marginBottom: spacing.sm },
  contextRow: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: 10, paddingHorizontal: spacing.sm },
  contextActive: { backgroundColor: '#252D13' },
  contextRank: { width: 33, color: colors.textMuted, fontSize: 12, fontWeight: '900' },
  contextName: { flex: 1, color: colors.text, fontSize: 13, fontWeight: '700' },
  contextScore: { color: colors.accent, fontSize: 12, fontWeight: '900', fontVariant: ['tabular-nums'] },
  done: { alignSelf: 'stretch', height: 54, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, marginTop: spacing.lg },
  doneText: { color: colors.black, fontSize: 15, fontWeight: '900' },
  viewAll: { paddingVertical: spacing.md },
  viewAllText: { color: colors.textMuted, fontSize: 13, fontWeight: '800' },
  bottomLink: { alignItems: 'center', padding: spacing.md },
  bottomLinkText: { color: colors.textMuted, fontWeight: '800' },
});
