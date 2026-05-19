import { getSupabase, isSupabaseConfigured } from './supabase';
import type { Item, ItemResult, LastVote, ResultsSort, VoteChoice } from './types';

/** GET /items */
export async function fetchItems(): Promise<Item[]> {
  const { data, error } = await getSupabase()
    .from('items')
    .select('id, label, description, image_url')
    .order('id', { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** GET /results — aggregate yes/no per item */
export async function fetchResults(): Promise<ItemResult[]> {
  const { data, error } = await getSupabase().from('item_results').select('*');

  if (error) throw new Error(error.message);
  return (data ?? []) as ItemResult[];
}

/** Votes for the logged-in user (profile-linked). */
export async function fetchUserVotes(userId: string): Promise<Record<string, VoteChoice>> {
  const { data, error } = await getSupabase()
    .from('votes')
    .select('item_id, choice')
    .eq('user_id', userId);

  if (error) throw new Error(error.message);

  const map: Record<string, VoteChoice> = {};
  for (const row of data ?? []) {
    map[row.item_id] = row.choice as VoteChoice;
  }
  return map;
}

/**
 * POST /vote — idempotent per user per item.
 * UNIQUE(item_id, user_id) + upsert replaces prior choice.
 */
export async function submitVote(params: {
  itemId: string;
  choice: VoteChoice;
  userId: string;
  decisionMs?: number;
}): Promise<{ voteId: string }> {
  const { itemId, choice, userId, decisionMs } = params;

  if (!['yes', 'no'].includes(choice)) {
    throw new Error('Invalid choice');
  }
  if (!itemId || !userId) {
    throw new Error('Missing itemId or userId');
  }

  const sb = getSupabase();
  const payload = {
    item_id: itemId,
    user_id: userId,
    choice,
    decision_ms: decisionMs ?? null,
    session_id: null,
  };

  const { data: existing } = await sb
    .from('votes')
    .select('id')
    .eq('item_id', itemId)
    .eq('user_id', userId)
    .maybeSingle();

  const { data, error } = existing?.id
    ? await sb
        .from('votes')
        .update({ choice: payload.choice, decision_ms: payload.decision_ms })
        .eq('id', existing.id)
        .select('id')
        .single()
    : await sb.from('votes').insert(payload).select('id').single();

  if (error) throw new Error(error.message);

  await getSupabase().from('analytics_events').insert({
    event_type: 'swipe',
    session_id: userId,
    item_id: itemId,
    payload: { choice, decision_ms: decisionMs ?? null, user_id: userId },
  });

  return { voteId: data.id as string };
}

export async function undoVote(last: LastVote, userId: string): Promise<void> {
  const { error } = await getSupabase()
    .from('votes')
    .delete()
    .eq('id', last.voteId)
    .eq('user_id', userId)
    .eq('item_id', last.itemId);

  if (error) throw new Error(error.message);

  await getSupabase().from('analytics_events').insert({
    event_type: 'undo',
    session_id: userId,
    item_id: last.itemId,
    payload: { choice: last.choice, user_id: userId },
  });
}

export function sortResults(items: ItemResult[], sort: ResultsSort): ItemResult[] {
  const copy = [...items];

  switch (sort) {
    case 'most_loved':
      return copy.sort((a, b) => {
        const rateA = a.total_votes ? a.yes_count / a.total_votes : 0;
        const rateB = b.total_votes ? b.yes_count / b.total_votes : 0;
        if (rateB !== rateA) return rateB - rateA;
        return b.total_votes - a.total_votes;
      });
    case 'most_divisive':
      return copy.sort((a, b) => {
        const div = (x: ItemResult) => {
          if (x.total_votes < 2) return 0;
          const min = Math.min(x.yes_count, x.no_count);
          const max = Math.max(x.yes_count, x.no_count);
          return min / max;
        };
        return div(b) - div(a);
      });
    case 'most_skipped':
      return copy.sort((a, b) => a.total_votes - b.total_votes);
    default:
      return copy;
  }
}

export function yesRate(result: ItemResult): number {
  if (!result.total_votes) return 0;
  return result.yes_count / result.total_votes;
}

export async function trackSessionStart(userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await getSupabase().from('analytics_events').insert({
    event_type: 'session_start',
    session_id: userId,
    payload: { user_id: userId },
  });
}

export async function fetchAnalyticsSummary(): Promise<{
  totalSwipes: number;
  sessions: number;
  avgDecisionMs: number | null;
}> {
  if (!isSupabaseConfigured) {
    return { totalSwipes: 0, sessions: 0, avgDecisionMs: null };
  }

  const { count: swipeCount } = await getSupabase()
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'swipe');

  const { data: sessions } = await getSupabase()
    .from('analytics_events')
    .select('session_id')
    .eq('event_type', 'session_start');

  const uniqueSessions = new Set((sessions ?? []).map((s) => s.session_id)).size;

  const { data: swipes } = await getSupabase()
    .from('votes')
    .select('decision_ms')
    .not('decision_ms', 'is', null);

  const times = (swipes ?? [])
    .map((s) => s.decision_ms as number)
    .filter((n) => n > 0);
  const avgDecisionMs = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null;

  return {
    totalSwipes: swipeCount ?? 0,
    sessions: uniqueSessions,
    avgDecisionMs,
  };
}
