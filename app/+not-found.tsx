import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radii, spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Not found', headerStyle: { backgroundColor: colors.background }, headerTintColor: colors.text }} />
      <Text style={styles.title}>Nothing queued here.</Text>
      <Text style={styles.copy}>The screen you’re looking for doesn’t exist.</Text>
      <Link href="/" style={styles.link}>Back to TVBeli</Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.xl },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  copy: { color: colors.textMuted, fontSize: 14, marginTop: spacing.xs },
  link: { color: colors.black, backgroundColor: colors.accent, borderRadius: radii.pill, paddingHorizontal: spacing.lg, paddingVertical: 12, marginTop: spacing.lg, fontWeight: '900', overflow: 'hidden' },
});
