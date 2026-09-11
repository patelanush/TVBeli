import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';

export function TVBeliScoreBadge({ scoreTenths, large = false }: { scoreTenths: number; large?: boolean }) {
  const score = (scoreTenths / 10).toFixed(1);
  return (
    <View accessibilityLabel={`TVBeli score ${score}`} style={[styles.badge, large && styles.large]}>
      <Text style={[styles.value, large && styles.largeValue]}>{score}</Text>
      {large ? <Text style={styles.label}>TVBeli Score</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start', borderRadius: radii.sm, backgroundColor: colors.accent, minWidth: 42, paddingHorizontal: 8, paddingVertical: 6 },
  large: { borderRadius: radii.md, minWidth: 100, paddingHorizontal: 17, paddingVertical: 12 },
  value: { color: colors.black, fontSize: 14, fontWeight: '900', fontVariant: ['tabular-nums'] },
  largeValue: { fontSize: 35, letterSpacing: -1.5 },
  label: { color: '#34420A', fontSize: 9, fontWeight: '800', marginTop: 2 },
});
