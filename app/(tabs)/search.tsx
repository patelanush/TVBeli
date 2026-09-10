import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';

import { AppIcon } from '@/components/AppIcon';
import { FeedbackState } from '@/components/FeedbackState';
import { PosterCard } from '@/components/PosterCard';
import { Screen } from '@/components/Screen';
import { colors, radii, spacing } from '@/constants/theme';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { searchTv } from '@/services/tmdb';
import { TVShow } from '@/types/show';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TVShow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [settledRequest, setSettledRequest] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const searchTerm = query.trim();
  const debouncedQuery = useDebouncedValue(searchTerm, 400);
  const requestKey = debouncedQuery ? `${debouncedQuery}:${retryKey}` : '';
  const loading = Boolean(searchTerm) && (debouncedQuery !== searchTerm || settledRequest !== requestKey);
  const { width } = useWindowDimensions();
  const posterWidth = Math.min(164, (width - spacing.md * 3) / 2);

  useEffect(() => {
    const controller = new AbortController();

    if (!debouncedQuery || debouncedQuery !== searchTerm) return () => controller.abort();

    searchTv(debouncedQuery, controller.signal)
      .then((shows) => {
        setResults(shows);
        setError(null);
        setSettledRequest(requestKey);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== 'AbortError') {
          setResults([]);
          setError(requestError.message);
          setSettledRequest(requestKey);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery, requestKey, searchTerm]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (!value.trim()) {
      setResults([]);
      setError(null);
      setSettledRequest('');
    }
  };

  const handleRetry = () => {
    setError(null);
    setRetryKey((key) => key + 1);
  };

  const renderEmptyState = () => {
    if (!query.trim()) {
      return <FeedbackState title="Search all of television" message="Enter a show name to find it on TMDB." />;
    }
    if (loading) return <FeedbackState title="Searching…" message={`Looking for “${debouncedQuery || query.trim()}”`} loading />;
    if (error) return <FeedbackState title="Search unavailable" message={error} onRetry={handleRetry} />;
    return <FeedbackState title="No shows found" message={`Try another name or check the spelling of “${debouncedQuery}”.`} />;
  };

  return (
    <Screen>
      <View style={styles.heading}>
        <Text style={styles.title}>Find your next obsession.</Text>
        <Text style={styles.subtitle}>Search real TV shows from TMDB</Text>
      </View>
      <View style={styles.searchBox}>
        <AppIcon name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }} color={colors.textMuted} size={21} />
        <TextInput
          value={query}
          onChangeText={handleQueryChange}
          placeholder="Try “Severance” or “The Bear”"
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          style={styles.input}
          accessibilityLabel="Search TV shows"
        />
        {loading && results.length > 0 ? <ActivityIndicator color={colors.accent} size="small" /> : null}
        {query ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => handleQueryChange('')}>
            <AppIcon name={{ ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' }} color={colors.textDim} size={20} />
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => String(item.id)}
        numColumns={2}
        columnWrapperStyle={results.length > 0 ? styles.columns : undefined}
        contentContainerStyle={[styles.grid, !results.length && styles.emptyGrid]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        renderItem={({ item }) => <View style={styles.gridItem}><PosterCard show={item} width={posterWidth} /></View>}
        ListEmptyComponent={renderEmptyState}
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
});
