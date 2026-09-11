import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { colors, radii, spacing } from '@/constants/theme';
import type { TVShow } from '@/types/show';

export function ComparisonCard({ show, label, tieSize = 1, disabled, onPress }: {
  show: TVShow | null;
  label: string;
  tieSize?: number;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={show ? `I preferred ${show.title}` : 'Loading show'} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.posterFrame}>
        {show ? <Artwork uri={show.posterUrl} title={show.title} accentColor={show.accentColor} style={styles.poster} /> : <View style={styles.skeletonPoster} />}
        <View style={styles.label}><Text style={styles.labelText}>{label}</Text></View>
      </View>
      <Text numberOfLines={3} style={styles.title}>{show?.title ?? 'Loading…'}</Text>
      <Text style={styles.meta}>{show?.year ?? '—'}{tieSize > 1 ? ` · Tied with ${tieSize - 1} ${tieSize === 2 ? 'show' : 'shows'}` : ''}</Text>
      <View style={[styles.choose, disabled && styles.disabled]}><Text style={styles.chooseText}>Prefer this</Text></View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, minWidth: 0, borderRadius: radii.lg, padding: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  posterFrame: { aspectRatio: 0.68, borderRadius: radii.md, overflow: 'hidden', backgroundColor: colors.surfaceRaised },
  poster: { flex: 1 },
  skeletonPoster: { flex: 1, backgroundColor: colors.surfaceRaised },
  label: { position: 'absolute', left: 8, right: 8, bottom: 8, alignSelf: 'flex-start', borderRadius: radii.pill, backgroundColor: 'rgba(8,9,12,0.8)', paddingVertical: 6, paddingHorizontal: 9 },
  labelText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center' },
  title: { color: colors.text, fontSize: 16, lineHeight: 20, fontWeight: '900', marginHorizontal: 3, marginTop: spacing.sm, minHeight: 40 },
  meta: { color: colors.textMuted, fontSize: 10, lineHeight: 14, margin: 3, minHeight: 28 },
  choose: { minHeight: 44, borderRadius: 12, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm },
  chooseText: { color: colors.black, fontSize: 12, fontWeight: '900' },
  disabled: { opacity: 0.35 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.975 }] },
});
