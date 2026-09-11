import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { LibraryProvider, useLibrary } from '@/contexts/LibraryContext';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: colors.accent,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  return (
    <LibraryProvider>
      <ThemeProvider value={navigationTheme}>
        <ServiceWorkerRegistration />
        <AuthGate />
      </ThemeProvider>
    </LibraryProvider>
  );
}

function AuthGate() {
  const library = useLibrary();
  if (library.loading && !library.user) {
    return <View style={styles.gate}><ActivityIndicator color={colors.accent} /><Text style={styles.copy}>Opening your TVBeli library…</Text></View>;
  }
  if (!library.user) {
    return <View style={styles.gate}><Text style={styles.brand}>TVBeli</Text><Text style={styles.title}>Your definitive TV ranking.</Text><Text style={styles.copy}>{library.error ?? 'Sign in with your private Google account to open your cloud library.'}</Text><Pressable accessibilityRole="button" onPress={() => void library.signIn().catch(() => undefined)} style={styles.signIn}><Text style={styles.signInText}>Continue with Google</Text></Pressable></View>;
  }
  return <Stack screenOptions={{ contentStyle: { backgroundColor: colors.background } }}>
    <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    <Stack.Screen name="show/[id]" options={{ headerShown: false }} />
    <Stack.Screen name="rate/[id]" options={{ headerShown: false, presentation: 'modal' }} />
    <Stack.Screen name="review/[id]" options={{ headerShown: false, presentation: 'modal' }} />
    <Stack.Screen name="rankings" options={{ headerShown: false }} />
  </Stack>;
}

const styles = StyleSheet.create({
  gate: { flex: 1, minHeight: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: 28 },
  brand: { color: colors.accent, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 34, lineHeight: 39, fontWeight: '900', textAlign: 'center', marginTop: 12 },
  copy: { color: colors.textMuted, fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 390, marginTop: 12 },
  signIn: { minWidth: 230, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: colors.accent, marginTop: 24 },
  signInText: { color: colors.black, fontSize: 15, fontWeight: '900' },
});
