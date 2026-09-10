import { Image } from 'expo-image';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

const TMDB_LOGO = 'https://www.themoviedb.org/assets/v4/logos/v2/blue_square_1-5bdc75aaebeb75dc7ae79426ddd9be3b2be1e342510f8202baf6bffa71d7f5c4.svg';

export function TmdbAttribution() {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>DATA & CREDITS</Text>
      <Pressable accessibilityRole="link" onPress={() => Linking.openURL('https://www.themoviedb.org')} style={({ pressed }) => [styles.brand, pressed && styles.pressed]}>
        <Image source={TMDB_LOGO} contentFit="contain" style={styles.logo} accessibilityLabel="TMDB" />
        <Text style={styles.brandText}>Powered by TMDB</Text>
      </Pressable>
      <Text style={styles.notice}>This product uses the TMDB API but is not endorsed or certified by TMDB.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: spacing.lg, marginTop: spacing.xl, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  label: { color: colors.textDim, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  logo: { width: 38, height: 38 },
  brandText: { color: colors.text, fontSize: 14, fontWeight: '800' },
  notice: { color: colors.textMuted, fontSize: 10, lineHeight: 15, marginTop: spacing.sm },
  pressed: { opacity: 0.65 },
});
