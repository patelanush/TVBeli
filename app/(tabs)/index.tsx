import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { PosterCard } from '@/components/PosterCard';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { ShowCard } from '@/components/ShowCard';
import { colors, spacing } from '@/constants/theme';
import { popularShows, recentlyWatched } from '@/data/shows';

export default function HomeScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR TV, RANKED</Text>
            <Text style={styles.logo}>TV<Text style={styles.logoAccent}>Beli</Text></Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>AP</Text></View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introTitle}>What are we watching?</Text>
          <Text style={styles.introCopy}>Keep track of the stories worth talking about.</Text>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Popular Shows" actionLabel="Explore" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.posterRow}>
            {popularShows.map((show) => <PosterCard key={show.id} show={show} />)}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <SectionHeader title="Recently Watched" />
          <View style={styles.recentList}>
            {recentlyWatched.map((show) => <ShowCard key={show.id} show={show} />)}
          </View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  eyebrow: { color: colors.textMuted, fontSize: 9, fontWeight: '800', letterSpacing: 1.8, marginBottom: 2 },
  logo: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.8 },
  logoAccent: { color: colors.accent },
  avatar: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.lavender, borderWidth: 2, borderColor: '#C4B5FD' },
  avatarText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  intro: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  introTitle: { color: colors.text, fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -1.1 },
  introCopy: { color: colors.textMuted, fontSize: 15, lineHeight: 21, marginTop: spacing.xs },
  section: { marginBottom: spacing.xl },
  posterRow: { gap: spacing.md, paddingHorizontal: spacing.lg },
  recentList: { gap: spacing.sm, paddingHorizontal: spacing.lg },
});
