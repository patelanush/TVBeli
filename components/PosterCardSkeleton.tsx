import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/constants/theme';

export function PosterCardSkeleton({ width = 148 }: { width?: number }) {
  return (
    <View style={{ width }}>
      <View style={[styles.poster, { height: width * 1.48 }]} />
      <View style={[styles.title, { width: width * 0.76 }]} />
      <View style={[styles.meta, { width: width * 0.52 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  poster: { borderRadius: radii.md, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  title: { height: 14, borderRadius: 7, backgroundColor: colors.surfaceRaised, marginTop: 10 },
  meta: { height: 10, borderRadius: 5, backgroundColor: colors.surfaceRaised, marginTop: 7 },
});
