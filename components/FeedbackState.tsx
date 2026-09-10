import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { colors, radii, spacing } from '@/constants/theme';

type Props = {
  title: string;
  message: string;
  loading?: boolean;
  onRetry?: () => void;
};

export function FeedbackState({ title, message, loading = false, onRetry }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        {loading ? <ActivityIndicator color={colors.accent} /> : (
          <AppIcon name={{ ios: 'wifi.exclamationmark', android: 'wifi_off', web: 'wifi_off' }} color={colors.accent} size={27} />
        )}
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry ? (
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 280, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  icon: { width: 58, height: 58, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1C2112', marginBottom: spacing.md },
  title: { color: colors.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  message: { color: colors.textMuted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: spacing.xs, maxWidth: 310 },
  button: { marginTop: spacing.md, borderRadius: radii.pill, backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingVertical: 11 },
  buttonText: { color: colors.black, fontSize: 13, fontWeight: '900' },
  pressed: { opacity: 0.7 },
});
