import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Artwork } from '@/components/Artwork';
import { ReactionBadge } from '@/components/ReactionBadge';
import { StatusPill } from '@/components/StatusPill';
import { TVBeliScoreBadge } from '@/components/TVBeliScoreBadge';
import { colors, radii, spacing } from '@/constants/theme';
import { SavedShowWithMetadata } from '@/types/savedShow';

export function SavedShowCard({ item, rank, rankAction = false }: { item: SavedShowWithMetadata; rank?: number; rankAction?: boolean }) {
  const router = useRouter();
  const { saved, show } = item;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${show?.title ?? `TV show ${saved.tmdbId}`}`}
      onPress={() => rankAction
        ? router.push({ pathname: '/rate/[id]', params: { id: saved.tmdbId, mode: 'new' } })
        : router.push({ pathname: '/show/[id]', params: { id: saved.tmdbId } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {(rank ?? item.ranking?.overallRank) ? <Text style={[styles.rank, (rank ?? item.ranking?.overallRank) === 1 && styles.first]}>#{rank ?? item.ranking?.overallRank}</Text> : null}
      <Artwork uri={show?.posterUrl ?? null} title={show?.title ?? 'TV show'} accentColor={show?.accentColor ?? colors.surfaceRaised} style={styles.poster} />
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>{show?.title ?? `TV show #${saved.tmdbId}`}</Text>
        <Text numberOfLines={1} style={styles.meta}>{show ? (show.year ?? 'Year unavailable') : 'Metadata unavailable'}{item.ranking?.tieSize && item.ranking.tieSize > 1 ? ' · True tie' : ''}</Text>
        {item.ranking ? <ReactionBadge reaction={item.ranking.reaction} /> : <StatusPill status={saved.status} />}
      </View>
      <View style={styles.trailing}>
        {item.ranking ? <TVBeliScoreBadge scoreTenths={item.ranking.scoreTenths} /> : saved.status === 'watched' ? <Text style={styles.unranked}>Unranked</Text> : null}
        <AppIcon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.textDim} size={17} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm },
  rank: { width: 34, color: colors.textMuted, fontSize: 15, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' },
  first: { color: colors.accent },
  poster: { width: 58, height: 82, borderRadius: radii.sm },
  body: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 16, lineHeight: 20, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 3, marginBottom: 7 },
  trailing: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 5 },
  unranked: { color: colors.accent, fontSize: 10, fontWeight: '900' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
