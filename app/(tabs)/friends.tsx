import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { Artwork } from '@/components/Artwork';
import { RatingBadge } from '@/components/RatingBadge';
import { Screen } from '@/components/Screen';
import { colors, radii, spacing } from '@/constants/theme';
import { friendActivity } from '@/data/social';
import { getShow } from '@/data/shows';

export default function FriendsScreen() {
  return (
    <Screen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Friends</Text>
            <Text style={styles.subtitle}>What your people are watching</Text>
          </View>
          <View style={styles.addButton}>
            <AppIcon name={{ ios: 'person.badge.plus', android: 'person_add', web: 'person_add' }} color={colors.accent} size={23} />
          </View>
        </View>
        <View style={styles.friendStrip}>
          {friendActivity.map((activity) => (
            <View key={activity.id} style={styles.friendBubbleWrap}>
              <View style={[styles.friendBubble, { backgroundColor: activity.avatarColor }]}><Text style={styles.friendInitials}>{activity.initials}</Text></View>
              <Text numberOfLines={1} style={styles.friendName}>{activity.name.split(' ')[0]}</Text>
            </View>
          ))}
        </View>
        <View style={styles.divider} />
        <Text style={styles.feedTitle}>Activity</Text>
        <View style={styles.feed}>
          {friendActivity.map((activity) => {
            const show = getShow(activity.showId);
            if (!show) return null;
            return (
              <View key={activity.id} style={styles.activityCard}>
                <View style={[styles.avatar, { backgroundColor: activity.avatarColor }]}><Text style={styles.avatarText}>{activity.initials}</Text></View>
                <View style={styles.activityBody}>
                  <View style={styles.activityTop}>
                    <Text style={styles.activityCopy}><Text style={styles.name}>{activity.name}</Text> {activity.action}</Text>
                    <Text style={styles.time}>{activity.timeAgo}</Text>
                  </View>
                  <View style={styles.showPreview}>
                    <Artwork uri={show.posterUrl} title={show.title} accentColor={show.accentColor} style={styles.previewPoster} />
                    <View style={styles.previewInfo}>
                      <Text style={styles.showTitle}>{show.title}</Text>
                      <Text style={styles.showMeta}>{show.year} · {show.genres[0]}</Text>
                    </View>
                    {activity.rating ? <RatingBadge rating={activity.rating} /> : (
                      <AppIcon name={{ ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' }} color={colors.lavender} size={19} />
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: spacing.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { color: colors.text, fontSize: 30, fontWeight: '900', letterSpacing: -1.2 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  addButton: { width: 43, height: 43, borderRadius: 22, backgroundColor: '#1C2112', borderWidth: 1, borderColor: '#38401E', alignItems: 'center', justifyContent: 'center' },
  friendStrip: { flexDirection: 'row', gap: spacing.lg, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  friendBubbleWrap: { width: 56, alignItems: 'center' },
  friendBubble: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.surfaceRaised },
  friendInitials: { color: colors.white, fontSize: 13, fontWeight: '900' },
  friendName: { color: colors.textMuted, fontSize: 11, marginTop: 6, width: 60, textAlign: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.xl, marginHorizontal: spacing.lg },
  feedTitle: { color: colors.text, fontSize: 21, fontWeight: '900', paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  feed: { paddingHorizontal: spacing.lg, gap: spacing.md },
  activityCard: { flexDirection: 'row', gap: spacing.sm },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  activityBody: { flex: 1 },
  activityTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.sm },
  activityCopy: { flex: 1, color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  name: { color: colors.text, fontWeight: '800' },
  time: { color: colors.textDim, fontSize: 11, paddingTop: 1 },
  showPreview: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, padding: spacing.sm },
  previewPoster: { width: 43, height: 59, borderRadius: 8 },
  previewInfo: { flex: 1 },
  showTitle: { color: colors.text, fontSize: 14, fontWeight: '800' },
  showMeta: { color: colors.textMuted, fontSize: 11, marginTop: 4 },
});
