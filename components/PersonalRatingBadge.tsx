import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { colors, radii } from '@/constants/theme';

export function PersonalRatingBadge({ rating, large = false }: { rating: number; large?: boolean }) {
  return (
    <View style={[styles.badge, large && styles.badgeLarge]}>
      <AppIcon name={{ ios: 'star.fill', android: 'star', web: 'star' }} color={colors.black} size={large ? 16 : 12} />
      <Text style={[styles.value, large && styles.valueLarge]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', borderRadius: radii.pill, backgroundColor: colors.accent, paddingHorizontal: 7, paddingVertical: 4 },
  badgeLarge: { gap: 5, paddingHorizontal: 10, paddingVertical: 7 },
  value: { color: colors.black, fontSize: 11, fontWeight: '900' },
  valueLarge: { fontSize: 15 },
});
