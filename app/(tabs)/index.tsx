import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/contexts/AuthContext';
import { EmptyDatabaseScreen } from '../../src/components/EmptyDatabaseScreen';
import { SetupScreen } from '../../src/components/SetupScreen';
import { SwipeDeck } from '../../src/components/SwipeDeck';
import { colors, layout } from '../../src/constants/theme';
import {
  fetchItems,
  fetchUserVotes,
  submitVote,
  trackSessionStart,
  undoVote,
} from '../../src/lib/api';
import { isSupabaseConfigured } from '../../src/lib/supabase';
import type { Item, LastVote, VoteChoice } from '../../src/lib/types';

export default function SwipeScreen() {
  const { user, displayName, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [votedIds, setVotedIds] = useState<Set<string>>(new Set());
  const [lastVote, setLastVote] = useState<LastVote | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const userId = user?.id ?? null;

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await trackSessionStart(userId);

      const [allItems, userVotes] = await Promise.all([
        fetchItems(),
        fetchUserVotes(userId),
      ]);

      setItems(allItems);
      setVotedIds(new Set(Object.keys(userVotes)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    load();
  }, [load]);

  const queue = useMemo(
    () => items.filter((i) => !votedIds.has(i.id)),
    [items, votedIds]
  );

  const current = queue[0];
  const progress = items.length ? items.length - queue.length : 0;

  const handleVote = async (choice: VoteChoice, decisionMs: number) => {
    if (!current || !userId || submitting) return;

    setSubmitting(true);
    try {
      const { voteId } = await submitVote({
        itemId: current.id,
        choice,
        userId,
        decisionMs,
      });
      setLastVote({ itemId: current.id, choice, voteId });
      setVotedIds((prev) => new Set(prev).add(current.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Vote failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!lastVote || !userId) return;
    try {
      await undoVote(lastVote, userId);
      setVotedIds((prev) => {
        const next = new Set(prev);
        next.delete(lastVote.itemId);
        return next;
      });
      setLastVote(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Undo failed');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign out failed');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.muted}>Loading pets…</Text>
      </View>
    );
  }

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  if (error && !items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Could not load pets</Text>
        <Text style={styles.muted}>{error}</Text>
        <Pressable style={styles.retry} onPress={load}>
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <HomeTopBar displayName={displayName} onSignOut={handleSignOut} />
        <EmptyDatabaseScreen onRetry={load} />
      </SafeAreaView>
    );
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <HomeTopBar displayName={displayName} onSignOut={handleSignOut} />
        <View style={styles.endState}>
          <Text style={styles.endEmoji}>🐾</Text>
          <Text style={styles.endTitle}>You&apos;ve voted on everything!</Text>
          <Text style={styles.muted}>
            {progress} of {items.length} pets rated. See how the community voted.
          </Text>
          <Pressable style={styles.cta} onPress={() => router.push('/results')}>
            <Text style={styles.ctaText}>View Results</Text>
          </Pressable>
          <Pressable style={styles.secondary} onPress={() => router.push('/matches')}>
            <Text style={styles.secondaryText}>Your Matches</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <HomeTopBar displayName={displayName} onSignOut={handleSignOut} />

      <View style={styles.subHeader}>
        <Text style={styles.progress}>
          {progress + 1} / {items.length}
        </Text>
        <Text style={styles.hint}>Swipe ↓ for results</Text>
      </View>

      {error ? <Text style={styles.banner}>{error}</Text> : null}

      <View style={styles.deckArea}>
        <SwipeDeck
          item={current}
          onVote={handleVote}
          onSwipeDown={() => router.push('/results')}
          disabled={submitting}
        />
      </View>

      <View style={styles.footer}>
        <Pressable
          style={[styles.undoBtn, !lastVote && styles.undoDisabled]}
          onPress={handleUndo}
          disabled={!lastVote}
        >
          <Text style={styles.undoText}>Undo last swipe</Text>
        </Pressable>
        <Pressable style={styles.resultsLink} onPress={() => router.push('/results')}>
          <Text style={styles.resultsLinkText}>Results ↓</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function HomeTopBar({
  displayName,
  onSignOut,
}: {
  displayName: string;
  onSignOut: () => void;
}) {
  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.greeting}>Hi, {displayName}!</Text>
        <Text style={styles.brand}>PawSwipe</Text>
      </View>
      <Pressable style={styles.signOutBtn} onPress={onSignOut}>
        <Text style={styles.signOutText}>Sign out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: layout.horizontalPad,
    backgroundColor: colors.bg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    padding: 24,
    gap: 12,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 10,
  },
  greeting: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  brand: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 2,
  },
  signOutBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  signOutText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  subHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  progress: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    color: colors.muted,
    fontSize: 13,
  },
  banner: {
    color: '#fecaca',
    fontSize: 13,
    marginBottom: 6,
  },
  deckArea: {
    flex: 1,
    minHeight: 440,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  undoBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  undoDisabled: {
    opacity: 0.35,
  },
  undoText: {
    color: colors.accent,
    fontWeight: '600',
  },
  resultsLink: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  resultsLinkText: {
    color: colors.muted,
    fontWeight: '600',
  },
  muted: {
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  retry: {
    marginTop: 8,
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: colors.bg,
    fontWeight: '700',
  },
  endState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 12,
  },
  endEmoji: {
    fontSize: 56,
  },
  endTitle: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  cta: {
    marginTop: 16,
    backgroundColor: colors.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
  },
  ctaText: {
    color: colors.bg,
    fontWeight: '800',
    fontSize: 16,
  },
  secondary: {
    padding: 12,
  },
  secondaryText: {
    color: colors.muted,
    fontWeight: '600',
  },
});
