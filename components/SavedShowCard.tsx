import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Artwork } from '@/components/Artwork';
import { PersonalRatingBadge } from '@/components/PersonalRatingBadge';
import { StatusPill } from '@/components/StatusPill';
import { colors, radii, spacing } from '@/constants/theme';
import { SavedShowWithMetadata } from '@/types/savedShow';

export function SavedShowCard({ item, rank }: { item: SavedShowWithMetadata; rank?: number }) {
  const router = useRouter();
  const { saved, show } = item;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${show?.title ?? `TV show ${saved.tmdbId}`}`}
      onPress={() => router.push({ pathname: '/show/[id]', params: { id: saved.tmdbId } })}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {rank ? <Text style={[styles.rank, rank === 1 && styles.first]}>{rank}</Text> : null}
      <Artwork uri={show?.posterUrl ?? null} title={show?.title ?? 'TV show'} accentColor={show?.accentColor ?? colors.surfaceRaised} style={styles.poster} />
      <View style={styles.body}>
        <Text numberOfLines={2} style={styles.title}>{show?.title ?? `TV show #${saved.tmdbId}`}</Text>
        <Text numberOfLines={1} style={styles.meta}>{show ? (show.year ?? 'Year unavailable') : 'Metadata unavailable'}</Text>
        <StatusPill status={saved.status} />
      </View>
      <View style={styles.trailing}>
        {saved.personalRating !== null ? <PersonalRatingBadge rating={saved.personalRating} /> : null}
        <AppIcon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.textDim} size={17} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { minHeight: 100, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.sm },
  rank: { width: 23, color: colors.textMuted, fontSize: 19, fontWeight: '900', fontStyle: 'italic', textAlign: 'center' },
  first: { color: colors.accent },
  poster: { width: 58, height: 82, borderRadius: radii.sm },
  body: { flex: 1, alignSelf: 'stretch', justifyContent: 'center' },
  title: { color: colors.text, fontSize: 16, lineHeight: 20, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 11, marginTop: 3, marginBottom: 7 },
  trailing: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 5 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
});
