import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SetupScreen } from '../../src/components/SetupScreen';
import { colors, layout } from '../../src/constants/theme';
import {
  fetchAnalyticsSummary,
  fetchResults,
  sortResults,
  yesRate,
} from '../../src/lib/api';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import type { ItemResult, ResultsSort } from '../../src/lib/types';

const SORTS: { key: ResultsSort; label: string }[] = [
  { key: 'most_loved', label: 'Most loved' },
  { key: 'most_divisive', label: 'Most divisive' },
  { key: 'most_skipped', label: 'Fewest votes' },
];

const POLL_MS = 5000;

export default function ResultsScreen() {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<ItemResult[]>([]);
  const [sort, setSort] = useState<ResultsSort>('most_loved');
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError('Configure Supabase in .env');
      setLoading(false);
      return;
    }
    try {
      const [data, summary] = await Promise.all([
        fetchResults(),
        fetchAnalyticsSummary(),
      ]);
      setResults(data);
      setAnalytics(
        `${summary.totalSwipes} swipes · ${summary.sessions} sessions` +
          (summary.avgDecisionMs ? ` · ~${summary.avgDecisionMs}ms avg` : '')
      );
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const sorted = useMemo(() => sortResults(results, sort), [results, sort]);

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.subtitle}>Community votes (includes demo voters)</Text>
      {analytics ? <Text style={styles.analytics}>{analytics}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.chips}>
        {SORTS.map((s) => (
          <Pressable
            key={s.key}
            style={[styles.chip, sort === s.key && styles.chipActive]}
            onPress={() => setSort(s.key)}
          >
            <Text style={[styles.chipText, sort === s.key && styles.chipTextActive]}>
              {s.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item, index }) => {
          const rate = yesRate(item);
          const pct = Math.round(rate * 100);
          return (
            <View style={styles.row}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <Image source={{ uri: item.image_url }} style={styles.thumb} />
              <View style={styles.rowBody}>
                <Text style={styles.label} numberOfLines={1}>
                  {item.label}
                </Text>
                <Text style={styles.stats}>
                  {pct}% yes · {item.yes_count}Y / {item.no_count}N · {item.total_votes} votes
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${pct}%` }]} />
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No data yet. Run npm run seed and npm run seed-demo-votes.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: layout.horizontalPad,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 4,
    marginBottom: 4,
  },
  analytics: {
    color: colors.accent,
    fontSize: 12,
    marginBottom: 8,
  },
  error: {
    color: '#fecaca',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(56,189,248,0.15)',
  },
  chipText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.text,
  },
  list: {
    paddingBottom: 24,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
  },
  rank: {
    color: colors.muted,
    fontWeight: '700',
    width: 28,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.border,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  stats: {
    color: colors.muted,
    fontSize: 12,
  },
  barTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.yes,
    borderRadius: 3,
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    marginTop: 40,
    lineHeight: 22,
  },
});
