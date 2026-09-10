import Slider from '@react-native-community/slider';
import { useSQLiteContext } from 'expo-sqlite';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { colors, radii, spacing } from '@/constants/theme';
import { getSavedShow, saveRatingAndReview } from '@/services/savedShows';

export default function RatingEditorScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const tmdbId = Number(id);
  const validId = Number.isInteger(tmdbId) && tmdbId > 0;
  const [rating, setRating] = useState<number | null>(null);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(validId);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!validId) return;
    getSavedShow(db, tmdbId)
      .then((saved) => { setRating(saved?.personalRating ?? null); setReview(saved?.review ?? ''); })
      .catch(() => Alert.alert('Couldn’t load your rating', 'Please close this screen and try again.'))
      .finally(() => setLoading(false));
  }, [db, tmdbId, validId]);

  const handleSave = async () => {
    if (!validId) return;
    setSaving(true);
    try {
      await saveRatingAndReview(db, tmdbId, rating, review);
      router.back();
    } catch {
      Alert.alert('Couldn’t save', 'Your rating and note were not changed. Please try again.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.iconButton}>
            <AppIcon name={{ ios: 'xmark', android: 'close', web: 'close' }} color={colors.text} size={21} />
          </Pressable>
          <Text numberOfLines={1} style={styles.topTitle}>Your take</Text>
          <View style={styles.iconSpacer} />
        </View>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          <Text style={styles.eyebrow}>PERSONAL RATING</Text>
          <Text numberOfLines={2} style={styles.title}>{title ?? 'TV show'}</Text>
          {loading ? <Text style={styles.loading}>Loading your saved take…</Text> : (
            <>
              <View style={styles.ratingCard}>
                <View style={styles.ratingValueWrap}>
                  <AppIcon name={{ ios: 'star.fill', android: 'star', web: 'star' }} color={colors.accent} size={30} />
                  <Text style={styles.ratingValue}>{rating === null ? '—' : rating.toFixed(1)}</Text>
                  <Text style={styles.outOf}>/ 10</Text>
                </View>
                {rating === null ? (
                  <Pressable accessibilityRole="button" onPress={() => setRating(7)} style={styles.addRating}><Text style={styles.addRatingText}>Add a rating</Text></Pressable>
                ) : (
                  <>
                    <Slider
                      accessibilityLabel="Personal rating"
                      minimumValue={1}
                      maximumValue={10}
                      step={0.1}
                      value={rating}
                      onValueChange={(value) => setRating(Math.round(value * 10) / 10)}
                      minimumTrackTintColor={colors.accent}
                      maximumTrackTintColor={colors.border}
                      thumbTintColor={colors.white}
                      style={styles.slider}
                    />
                    <View style={styles.range}><Text style={styles.rangeText}>1.0</Text><Text style={styles.rangeText}>10.0</Text></View>
                    <Pressable accessibilityRole="button" onPress={() => setRating(null)}><Text style={styles.clear}>Clear rating</Text></Pressable>
                  </>
                )}
              </View>
              <View style={styles.reviewHeader}>
                <View><Text style={styles.reviewTitle}>Personal note</Text><Text style={styles.reviewSubtitle}>What did you think?</Text></View>
                <Text style={styles.counter}>{review.length}/500</Text>
              </View>
              <TextInput
                accessibilityLabel="Personal review"
                value={review}
                onChangeText={setReview}
                maxLength={500}
                multiline
                textAlignVertical="top"
                placeholder="Write a short review or something you want to remember…"
                placeholderTextColor={colors.textDim}
                style={styles.reviewInput}
              />
              <Text style={styles.note}>Saving a rating or note adds an unsaved show to Watched automatically.</Text>
            </>
          )}
        </ScrollView>
        <View style={styles.footer}>
          <Pressable accessibilityRole="button" disabled={loading || saving} onPress={handleSave} style={({ pressed }) => [styles.save, (pressed || loading || saving) && styles.savePressed]}>
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save your take'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  iconSpacer: { width: 42 },
  topTitle: { flex: 1, color: colors.text, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xl },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -1.1, marginTop: spacing.xs },
  loading: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  ratingCard: { marginTop: spacing.xl, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.lg },
  ratingValueWrap: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center', gap: spacing.sm },
  ratingValue: { color: colors.text, fontSize: 55, lineHeight: 64, fontWeight: '900', letterSpacing: -2 },
  outOf: { color: colors.textDim, fontSize: 14, fontWeight: '800' },
  slider: { width: '100%', height: 42, marginTop: spacing.md },
  range: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  rangeText: { color: colors.textDim, fontSize: 10, fontWeight: '700' },
  addRating: { alignSelf: 'center', marginTop: spacing.md, borderRadius: radii.pill, backgroundColor: colors.accent, paddingHorizontal: spacing.lg, paddingVertical: 12 },
  addRatingText: { color: colors.black, fontSize: 13, fontWeight: '900' },
  clear: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center', marginTop: spacing.md },
  reviewHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm },
  reviewTitle: { color: colors.text, fontSize: 19, fontWeight: '900' },
  reviewSubtitle: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  counter: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  reviewInput: { minHeight: 142, color: colors.text, fontSize: 15, lineHeight: 22, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  note: { color: colors.textDim, fontSize: 11, lineHeight: 16, marginTop: spacing.sm },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, padding: spacing.md },
  save: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accent },
  savePressed: { opacity: 0.65 },
  saveText: { color: colors.black, fontSize: 15, fontWeight: '900' },
});
