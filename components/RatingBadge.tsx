import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { colors, radii } from '@/constants/theme';

type Props = {
  rating: number;
  large?: boolean;
};

export function RatingBadge({ rating, large = false }: Props) {
  return (
    <View style={[styles.badge, large && styles.badgeLarge]}>
      <AppIcon name={{ ios: 'star.fill', android: 'star', web: 'star' }} color={colors.black} size={large ? 15 : 11} />
      <Text style={[styles.text, large && styles.textLarge]}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  badgeLarge: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 4,
  },
  text: {
    color: colors.black,
    fontSize: 11,
    fontWeight: '900',
  },
  textLarge: { fontSize: 14 },
});
