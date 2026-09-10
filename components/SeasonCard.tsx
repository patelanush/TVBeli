import { StyleSheet, Text, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { colors, radii, spacing } from '@/constants/theme';
import { TVSeason } from '@/types/show';

export function SeasonCard({ season }: { season: TVSeason }) {
  return (
    <View style={styles.card}>
      <Artwork uri={season.posterUrl} title={season.name} accentColor={colors.surfaceRaised} style={styles.poster} />
      <Text numberOfLines={1} style={styles.name}>{season.name}</Text>
      <Text numberOfLines={1} style={styles.meta}>
        {season.airYear ?? 'TBA'} · {season.episodeCount} {season.episodeCount === 1 ? 'episode' : 'episodes'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 126 },
  poster: { width: 126, height: 178, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  name: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: spacing.sm },
  meta: { color: colors.textMuted, fontSize: 10, marginTop: 3 },
});
