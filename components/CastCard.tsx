import { StyleSheet, Text, View } from 'react-native';

import { Artwork } from '@/components/Artwork';
import { colors, radii, spacing } from '@/constants/theme';
import { TVCastMember } from '@/types/show';

export function CastCard({ member }: { member: TVCastMember }) {
  return (
    <View style={styles.card}>
      <Artwork
        uri={member.profileUrl}
        title={member.name}
        accentColor={colors.surfaceRaised}
        fallbackMark={member.name.slice(0, 1).toUpperCase()}
        style={styles.photo}
      />
      <Text numberOfLines={2} style={styles.name}>{member.name}</Text>
      {member.character ? <Text numberOfLines={2} style={styles.character}>{member.character}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 96 },
  photo: { width: 96, height: 122, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  name: { color: colors.text, fontSize: 12, lineHeight: 16, fontWeight: '800', marginTop: spacing.sm },
  character: { color: colors.textMuted, fontSize: 10, lineHeight: 14, marginTop: 2 },
});
