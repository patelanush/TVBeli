import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { PosterCard } from '@/components/PosterCard';
import { Screen } from '@/components/Screen';
import { colors, radii, spacing } from '@/constants/theme';
import { shows } from '@/data/shows';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();
  const posterWidth = Math.min(164, (width - spacing.md * 3) / 2);
  const filteredShows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return shows;
    return shows.filter((show) => `${show.title} ${show.genres.join(' ')}`.toLowerCase().includes(term));
  }, [query]);

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.title}>Find your next obsession.</Text>
        <Text style={styles.subtitle}>Search shows and genres</Text>
      </View>
      <View style={styles.searchBox}>
        <AppIcon name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} color={colors.textMuted} size={21} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Try “Drama” or “Severance”"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
          accessibilityLabel="Search shows"
        />
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')}>
            <AppIcon name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} color={colors.textDim} size={20} />
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={filteredShows}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.columns}
        contentContainerStyle={[styles.grid, !filteredShows.length && styles.emptyGrid]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => <View style={styles.gridItem}><PosterCard show={item} width={posterWidth} /></View>}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <AppIcon name={{ ios: 'sparkles', android: 'auto_awesome', web: 'auto_awesome' }} color={colors.accent} size={27} />
            </View>
            <Text style={styles.emptyTitle}>No shows found</Text>
            <Text style={styles.emptyCopy}>Try a different title or genre.</Text>
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  title: { color: colors.text, fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -1.1 },
  subtitle: { color: colors.textMuted, fontSize: 14, marginTop: 4 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, height: 52, margin: spacing.lg, paddingHorizontal: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500', paddingVertical: 0 },
  grid: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
  columns: { justifyContent: 'space-between' },
  gridItem: { marginBottom: spacing.lg },
  emptyGrid: { flexGrow: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 100 },
  emptyIcon: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1B2111', marginBottom: spacing.md },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyCopy: { color: colors.textMuted, fontSize: 14, marginTop: 5 },
});
