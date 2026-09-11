import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/components/AppIcon';
import { colors, radii, spacing } from '@/constants/theme';
import { useLibrary } from '@/contexts/LibraryContext';
import { showMessage } from '@/utils/dialogs';

export default function ReviewEditorScreen() {
  const library = useLibrary();
  const router = useRouter();
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>();
  const tmdbId = Number(id);
  const validId = Number.isSafeInteger(tmdbId) && tmdbId > 0;
  const [draftReview, setDraftReview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const loading = validId && !library.state;
  const review = draftReview ?? library.state?.savedShows[String(tmdbId)]?.review ?? '';

  const handleSave = async () => {
    if (!validId || saving) return;
    setSaving(true);
    try {
      await library.saveReview(tmdbId, review);
      router.back();
    } catch (error) {
      showMessage('Couldn’t save your note', error instanceof Error ? error.message : 'Please try again.');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.topBar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.iconButton}><AppIcon name={{ ios: 'xmark', android: 'close', web: 'close' }} color={colors.text} size={20} /></Pressable>
          <Text style={styles.topTitle}>Personal note</Text><View style={styles.spacer} />
        </View>
        <View style={styles.content}>
          <Text style={styles.eyebrow}>YOUR REVIEW</Text>
          <Text numberOfLines={2} style={styles.title}>{title ?? 'TV show'}</Text>
          <View style={styles.inputHeader}><Text style={styles.prompt}>What do you want to remember?</Text><Text style={styles.counter}>{review.length}/500</Text></View>
          <TextInput
            accessibilityLabel="Personal review"
            autoFocus={!loading}
            editable={!loading && !saving}
            value={review}
            onChangeText={setDraftReview}
            maxLength={500}
            multiline
            textAlignVertical="top"
            placeholder={loading ? 'Loading…' : 'Write a short review or note…'}
            placeholderTextColor={colors.textDim}
            style={styles.input}
          />
          <Text style={styles.note}>Your note is saved securely with your cloud library and is independent of your TVBeli ranking.</Text>
        </View>
        <View style={styles.footer}><Pressable accessibilityRole="button" disabled={loading || saving} onPress={handleSave} style={[styles.save, (loading || saving) && styles.disabled]}><Text style={styles.saveText}>{saving ? 'Saving…' : 'Save note'}</Text></Pressable></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  topBar: { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md },
  iconButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceRaised },
  spacer: { width: 42 },
  topTitle: { color: colors.text, fontSize: 15, fontWeight: '800' },
  content: { flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  eyebrow: { color: colors.accent, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.text, fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -1, marginTop: spacing.xs },
  inputHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacing.xl, marginBottom: spacing.sm },
  prompt: { color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  counter: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
  input: { minHeight: 180, color: colors.text, fontSize: 16, lineHeight: 24, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, padding: spacing.md },
  note: { color: colors.textDim, fontSize: 11, lineHeight: 16, marginTop: spacing.sm },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, padding: spacing.md },
  save: { height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.accent },
  disabled: { opacity: 0.5 },
  saveText: { color: colors.black, fontSize: 15, fontWeight: '900' },
});
