import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FeedbackState } from '@/components/FeedbackState';
import { PosterCard } from '@/components/PosterCard';
import { PosterCardSkeleton } from '@/components/PosterCardSkeleton';
import { Screen } from '@/components/Screen';
import { SectionHeader } from '@/components/SectionHeader';
import { colors, spacing } from '@/constants/theme';
import { getPopularTv, getTopRatedTv, getTrendingTv } from '@/services/tmdb';
import { TVShow } from '@/types/show';

type HomeData = {
  trending: TVShow[];
  popular: TVShow[];
  topRated: TVShow[];
};

const emptyData: HomeData = { trending: [], popular: [], topRated: [] };

async function fetchHomeData(signal?: AbortSignal): Promise<HomeData> {
  const [trending, popular, topRated] = await Promise.all([
    getTrendingTv(signal),
    getPopularTv(signal),
    getTopRatedTv(signal),
  ]);
  return {
    trending: trending.slice(0, 12),
    popular: popular.slice(0, 12),
    topRated: topRated.slice(0, 12),
  };
}

function ShowRail({ title, shows, loading }: { title: string; shows: TVShow[]; loading?: boolean }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.posterRow}>
        {loading
          ? Array.from({ length: 4 }, (_, index) => <PosterCardSkeleton key={index} />)
          : shows.map((show) => <PosterCard key={show.id} show={show} />)}
      </ScrollView>
    </View>
  );
}

export default function HomeScreen() {
  const [data, setData] = useState<HomeData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    fetchHomeData(controller.signal)
      .then(setData)
      .catch((requestError: unknown) => {
        if (requestError instanceof Error && requestError.name !== 'AbortError') setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [retryKey]);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      setData(await fetchHomeData());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Unable to refresh shows.');
    } finally {
      setRefreshing(false);
    }
  };

  const hasContent = data.trending.length + data.popular.length + data.topRated.length > 0;
  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setRetryKey((key) => key + 1);
  };

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} />}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>YOUR TV, RANKED</Text>
            <Text style={styles.logo}>TV<Text style={styles.logoAccent}>Beli</Text></Text>
          </View>
          <View style={styles.avatar}><Text style={styles.avatarText}>AP</Text></View>
        </View>

        <View style={styles.intro}>
          <Text style={styles.introTitle}>What are we watching?</Text>
          <Text style={styles.introCopy}>Discover the stories everyone is talking about.</Text>
        </View>

        {error && !hasContent ? (
          <FeedbackState title="Couldn’t load shows" message={error} onRetry={handleRetry} />
        ) : (
          <>
            {error ? (
              <View style={styles.refreshError}>
                <Text style={styles.refreshErrorText}>{error}</Text>
              </View>
            ) : null}
            <ShowRail title="Trending This Week" shows={data.trending} loading={loading && !hasContent} />
            <ShowRail title="Popular Shows" shows={data.popular} loading={loading && !hasContent} />
            <ShowRail title="Top Rated" shows={data.topRated} loading={loading && !hasContent} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, paddingBottom: spacing.xxl },
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
  refreshError: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, borderRadius: 12, backgroundColor: '#2A1719', padding: spacing.sm },
  refreshErrorText: { color: '#FFB4B4', fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
