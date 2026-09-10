import { StyleSheet, Text, View } from 'react-native';

import { colors, radii } from '@/constants/theme';
import { SavedShowStatus } from '@/types/savedShow';

export const statusLabels: Record<SavedShowStatus, string> = {
  watched: 'Watched',
  watching: 'Watching',
  want_to_watch: 'Want to Watch',
};

export function StatusPill({ status }: { status: SavedShowStatus }) {
  return <View style={styles.pill}><Text style={styles.text}>{statusLabels[status]}</Text></View>;
}

const styles = StyleSheet.create({
  pill: { alignSelf: 'flex-start', borderRadius: radii.pill, borderWidth: 1, borderColor: '#39451C', backgroundColor: '#1C2112', paddingHorizontal: 8, paddingVertical: 4 },
  text: { color: colors.accent, fontSize: 9, fontWeight: '800' },
});
