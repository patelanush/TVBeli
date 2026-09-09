import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Artwork } from '@/components/Artwork';
import { RatingBadge } from '@/components/RatingBadge';
import { colors, radii, spacing } from '@/constants/theme';
import { TVShow } from '@/types/show';

export function ShowCard({ show }: { show: TVShow }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/show/[id]', params: { id: show.id } })}
      style={({ pressed }) => [styles.container, pressed && styles.pressed]}>
      <Artwork uri={show.posterUrl} title={show.title} accentColor={show.accentColor} style={styles.poster} />
      <View style={styles.content}>
        <View>
          <Text numberOfLines={1} style={styles.title}>{show.title}</Text>
          <Text style={styles.meta}>{show.year} · {show.genres.slice(0, 2).join(', ')}</Text>
        </View>
        <RatingBadge rating={show.rating} />
      </View>
      <AppIcon name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} color={colors.textDim} size={17} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  poster: { width: 58, height: 82, borderRadius: radii.sm },
  content: { flex: 1, justifyContent: 'space-between', alignSelf: 'stretch', paddingVertical: 4 },
  title: { color: colors.text, fontSize: 17, fontWeight: '800', letterSpacing: -0.35 },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.99 }] },
});
