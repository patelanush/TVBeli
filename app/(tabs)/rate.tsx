import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Artwork } from '@/components/Artwork';
import { Screen } from '@/components/Screen';
import { colors, radii, spacing } from '@/constants/theme';
import { getShow, shows } from '@/data/shows';

export default function RateScreen() {
  const { showId } = useLocalSearchParams<{ showId?: string }>();
  const selectedShow = getShow(showId) ?? shows[0];
  const opponent = selectedShow.id === shows[1].id ? shows[2] : shows[1];

  return (
    <Screen style={styles.screen}>
      <LinearGradient colors={['#1C220F', colors.background]} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>COMING SOON</Text>
          <Text style={styles.title}>Build your perfect ranking.</Text>
          <Text style={styles.copy}>Quick head-to-head choices will place every show exactly where it belongs.</Text>
        </View>
        <View style={styles.arena}>
          <View style={[styles.posterShell, styles.posterLeft]}>
            <Artwork uri={selectedShow.posterUrl} title={selectedShow.title} accentColor={selectedShow.accentColor} style={styles.poster} />
            <Text numberOfLines={1} style={styles.posterTitle}>{selectedShow.title}</Text>
          </View>
          <View style={styles.versus}><Text style={styles.versusText}>VS</Text></View>
          <View style={[styles.posterShell, styles.posterRight]}>
            <Artwork uri={opponent.posterUrl} title={opponent.title} accentColor={opponent.accentColor} style={styles.poster} />
            <Text numberOfLines={1} style={styles.posterTitle}>{opponent.title}</Text>
          </View>
        </View>
        <View style={styles.explainer}>
          <View style={styles.explainerIcon}>
            <AppIcon name={{ ios: 'arrow.up.arrow.down', android: 'swap_vert', web: 'swap_vert' }} color={colors.accent} size={25} />
          </View>
          <View style={styles.explainerText}>
            <Text style={styles.explainerTitle}>Pairwise ranking</Text>
            <Text style={styles.explainerCopy}>Choose your favorite of two. We’ll handle the rest.</Text>
          </View>
        </View>
        <View style={styles.progress}><View style={styles.progressFill} /></View>
        <Text style={styles.progressLabel}>A preview of what’s next</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: spacing.lg, overflow: 'hidden' },
  content: { paddingBottom: spacing.xl },
  header: { alignItems: 'center', paddingTop: spacing.xl },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 2.2, marginBottom: spacing.sm },
  title: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -1.2, textAlign: 'center', maxWidth: 330 },
  copy: { color: colors.textMuted, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: spacing.sm, maxWidth: 340 },
  arena: { height: 285, marginTop: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  posterShell: { position: 'absolute', width: 144, padding: 7, paddingBottom: 12, borderRadius: radii.lg, backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, shadowColor: colors.black, shadowOpacity: 0.45, shadowRadius: 16, shadowOffset: { width: 0, height: 9 } },
  posterLeft: { left: 8, transform: [{ rotate: '-6deg' }] },
  posterRight: { right: 8, transform: [{ rotate: '6deg' }] },
  poster: { width: '100%', height: 194, borderRadius: 16 },
  posterTitle: { color: colors.text, fontSize: 13, fontWeight: '800', marginTop: 9, paddingHorizontal: 3 },
  versus: { zIndex: 4, width: 51, height: 51, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent, borderWidth: 5, borderColor: colors.background },
  versusText: { color: colors.black, fontSize: 13, fontWeight: '900', fontStyle: 'italic' },
  explainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: 'rgba(24,27,34,0.88)', borderWidth: 1, borderColor: colors.border, borderRadius: radii.lg, padding: spacing.md },
  explainerIcon: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#252D13' },
  explainerText: { flex: 1 },
  explainerTitle: { color: colors.text, fontSize: 16, fontWeight: '800' },
  explainerCopy: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginTop: 3 },
  progress: { height: 4, borderRadius: 2, backgroundColor: colors.surfaceRaised, marginTop: spacing.lg, overflow: 'hidden' },
  progressFill: { width: '38%', height: '100%', borderRadius: 2, backgroundColor: colors.accent },
  progressLabel: { color: colors.textDim, textAlign: 'center', fontSize: 11, marginTop: spacing.sm, fontWeight: '600' },
});
