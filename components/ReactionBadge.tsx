import { StyleSheet, Text, View } from 'react-native';

import { REACTIONS } from '@/constants/reactions';
import { radii } from '@/constants/theme';
import type { Reaction } from '@/types/ranking';

export function ReactionBadge({ reaction }: { reaction: Reaction }) {
  const config = REACTIONS[reaction];
  return (
    <View style={[styles.badge, { borderColor: `${config.color}45`, backgroundColor: `${config.color}14` }]}>
      <Text style={[styles.label, { color: config.color }]}>{config.emoji} {config.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 4 },
  label: { fontSize: 10, fontWeight: '800' },
});
