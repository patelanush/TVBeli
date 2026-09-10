import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { RatingBadge } from '@/components/RatingBadge';
import { colors, radii, spacing } from '@/constants/theme';
import { TVShow } from '@/types/show';

type Props = {
  show: TVShow;
  width?: number;
};

export function PosterCard({ show, width = 148 }: Props) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open ${show.title}`}
      onPress={() => router.push({ pathname: '/show/[id]', params: { id: show.id } })}
      style={({ pressed }) => [styles.container, { width }, pressed && styles.pressed]}>
      <View style={[styles.posterFrame, { height: width * 1.48 }]}>
        <Artwork uri={show.posterUrl} title={show.title} accentColor={show.accentColor} style={styles.artwork} />
        {show.rating !== null ? <View style={styles.badge}><RatingBadge rating={show.rating} /></View> : null}
      </View>
      <Text numberOfLines={1} style={styles.title}>{show.title}</Text>
      <Text numberOfLines={1} style={styles.meta}>
        {show.year ?? 'TBA'}{show.genres[0] ? ` · ${show.genres[0]}` : ''}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 5 },
  posterFrame: {
    borderRadius: radii.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  artwork: { flex: 1 },
  badge: { position: 'absolute', right: spacing.sm, bottom: spacing.sm },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', letterSpacing: -0.25 },
  meta: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
