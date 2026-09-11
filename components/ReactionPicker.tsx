import { Pressable, StyleSheet, Text, View } from 'react-native';

import { REACTION_ORDER, REACTIONS } from '@/constants/reactions';
import { colors, radii, spacing } from '@/constants/theme';
import type { Reaction } from '@/types/ranking';

export function ReactionPicker({ disabled = false, onSelect }: { disabled?: boolean; onSelect: (reaction: Reaction) => void }) {
  return (
    <View style={styles.options}>
      {REACTION_ORDER.map((reaction) => {
        const config = REACTIONS[reaction];
        return (
          <Pressable
            key={reaction}
            accessibilityRole="button"
            accessibilityLabel={config.label}
            accessibilityState={{ disabled }}
            disabled={disabled}
            onPress={() => onSelect(reaction)}
            style={({ pressed }) => [styles.option, disabled && styles.disabled, pressed && styles.pressed]}>
            <View style={[styles.emojiWrap, { backgroundColor: `${config.color}20` }]}><Text style={styles.emoji}>{config.emoji}</Text></View>
            <Text style={styles.label}>{config.label}</Text>
            <Text style={[styles.arrow, { color: config.color }]}>›</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  options: { gap: spacing.sm },
  option: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, minHeight: 82, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  emojiWrap: { width: 49, height: 49, borderRadius: 17, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 27 },
  label: { flex: 1, color: colors.text, fontSize: 19, fontWeight: '800', letterSpacing: -0.3 },
  arrow: { fontSize: 29, fontWeight: '600' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.45 },
});
