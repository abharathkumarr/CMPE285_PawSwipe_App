import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { SetupScreen } from '../../src/components/SetupScreen';
import { colors, layout } from '../../src/constants/theme';
import { fetchResults, fetchUserVotes, yesRate } from '../../src/lib/api';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import type { ItemResult } from '../../src/lib/types';

const MATCH_THRESHOLD = 0.6;

type LikedPet = ItemResult & { communityPct: number; isMatch: boolean };

export default function MatchesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [matches, setMatches] = useState<ItemResult[]>([]);
  const [likedPets, setLikedPets] = useState<LikedPet[]>([]);
  const [yesCount, setYesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !user?.id) {
      setLoading(false);
      return;
    }
    try {
      const [results, userVotes] = await Promise.all([
        fetchResults(),
        fetchUserVotes(user.id),
      ]);

      const yesIds = Object.entries(userVotes)
        .filter(([, c]) => c === 'yes')
        .map(([id]) => id);
      setYesCount(yesIds.length);

      const liked: LikedPet[] = results
        .filter((r) => userVotes[r.id] === 'yes')
        .map((r) => {
          const communityPct = Math.round(yesRate(r) * 100);
          return {
            ...r,
            communityPct,
            isMatch: yesRate(r) >= MATCH_THRESHOLD && r.total_votes > 0,
          };
        })
        .sort((a, b) => b.communityPct - a.communityPct);

      setLikedPets(liked);
      setMatches(liked.filter((p) => p.isMatch));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load matches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const subtitle = useMemo(
    () =>
      `Pets you liked with ≥${Math.round(MATCH_THRESHOLD * 100)}% community yes rate`,
    []
  );

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
      <Text style={styles.subtitle}>{subtitle}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          matches.length > 0 ? (
            <Text style={styles.matchCount}>
              {matches.length} match{matches.length === 1 ? '' : 'es'}
            </Text>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.image_url }} style={styles.image} />
            <View style={styles.body}>
              <Text style={styles.label}>{item.label}</Text>
              <Text style={styles.meta}>
                {Math.round(yesRate(item) * 100)}% community yes · Match!
              </Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.empty}>
              {yesCount === 0
                ? 'Go to Vote and swipe right (♥) on pets you love. Pets #1–25 have the highest demo yes rates.'
                : `You liked ${yesCount} pet${yesCount === 1 ? '' : 's'}, but none hit ${Math.round(MATCH_THRESHOLD * 100)}%+ community yes yet. Try swiping right on earlier pets in the deck.`}
            </Text>

            {likedPets.length > 0 ? (
              <View style={styles.nearSection}>
                <Text style={styles.nearTitle}>Your yes votes & community %</Text>
                {likedPets.slice(0, 8).map((p) => (
                  <View key={p.id} style={styles.nearRow}>
                    <Text style={styles.nearLabel} numberOfLines={1}>
                      {p.label}
                    </Text>
                    <Text
                      style={[
                        styles.nearPct,
                        p.isMatch ? styles.nearPctMatch : styles.nearPctLow,
                      ]}
                    >
                      {p.communityPct}%
                    </Text>
                  </View>
                ))}
              </View>
            ) : null}

            <Pressable
              style={styles.refreshBtn}
              onPress={() => {
                setRefreshing(true);
                load();
              }}
            >
              <Text style={styles.refreshText}>Refresh</Text>
            </Pressable>
          </View>
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
    marginVertical: 8,
  },
  error: {
    color: '#fecaca',
    marginBottom: 8,
  },
  matchCount: {
    color: colors.accent,
    fontWeight: '700',
    marginBottom: 12,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: 96,
    height: 96,
  },
  body: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
  },
  meta: {
    color: colors.yes,
    fontWeight: '600',
  },
  emptyWrap: {
    paddingTop: 24,
    gap: 12,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  empty: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  nearSection: {
    marginTop: 8,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  nearTitle: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 4,
  },
  nearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  nearLabel: {
    color: colors.muted,
    flex: 1,
    fontSize: 14,
  },
  nearPct: {
    fontWeight: '700',
    fontSize: 14,
  },
  nearPctMatch: {
    color: colors.yes,
  },
  nearPctLow: {
    color: colors.muted,
  },
  refreshBtn: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  refreshText: {
    color: colors.accent,
    fontWeight: '700',
  },
});
