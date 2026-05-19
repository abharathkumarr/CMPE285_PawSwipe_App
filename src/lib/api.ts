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

export type AnalyticsDashboard = {
  totalSwipes: number;
  sessions: number;
  avgDecisionMs: number | null;
  undoCount: number;
  totalCommunityVotes: number;
  communityYes: number;
  communityNo: number;
  swipeYes: number;
  swipeNo: number;
  totalItems: number;
  uniqueVoters: number;
  decisionBuckets: { label: string; count: number }[];
};

function bucketDecisionMs(ms: number): string {
  if (ms < 1000) return 'Under 1s';
  if (ms < 3000) return '1–3s';
  if (ms < 5000) return '3–5s';
  return '5s+';
}

const EMPTY_ANALYTICS: AnalyticsDashboard = {
  totalSwipes: 0,
  sessions: 0,
  avgDecisionMs: null,
  undoCount: 0,
  totalCommunityVotes: 0,
  communityYes: 0,
  communityNo: 0,
  swipeYes: 0,
  swipeNo: 0,
  totalItems: 0,
  uniqueVoters: 0,
  decisionBuckets: [
    { label: 'Under 1s', count: 0 },
    { label: '1–3s', count: 0 },
    { label: '3–5s', count: 0 },
    { label: '5s+', count: 0 },
  ],
};

/** Basic analytics for the Analytics tab. */
export async function fetchAnalyticsDashboard(): Promise<AnalyticsDashboard> {
  if (!isSupabaseConfigured) return { ...EMPTY_ANALYTICS };

  const sb = getSupabase();

  const [
    swipeRes,
    sessionRes,
    undoRes,
    swipeEventsRes,
    votesRes,
    resultsRes,
    itemsRes,
  ] = await Promise.all([
    sb
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'swipe'),
    sb.from('analytics_events').select('session_id').eq('event_type', 'session_start'),
    sb
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'undo'),
    sb.from('analytics_events').select('payload').eq('event_type', 'swipe'),
    sb.from('votes').select('decision_ms, user_id, session_id'),
    sb.from('item_results').select('yes_count, no_count, total_votes'),
    sb.from('items').select('id', { count: 'exact', head: true }),
  ]);

  const sessions = new Set((sessionRes.data ?? []).map((s) => s.session_id)).size;

  let swipeYes = 0;
  let swipeNo = 0;
  for (const row of swipeEventsRes.data ?? []) {
    const choice = (row.payload as { choice?: string } | null)?.choice;
    if (choice === 'yes') swipeYes += 1;
    else if (choice === 'no') swipeNo += 1;
  }

  let communityYes = 0;
  let communityNo = 0;
  let totalCommunityVotes = 0;
  for (const r of resultsRes.data ?? []) {
    communityYes += r.yes_count ?? 0;
    communityNo += r.no_count ?? 0;
    totalCommunityVotes += r.total_votes ?? 0;
  }

  const bucketMap = new Map<string, number>(
    EMPTY_ANALYTICS.decisionBuckets.map((b) => [b.label, 0])
  );
  const voterIds = new Set<string>();
  const times: number[] = [];

  for (const v of votesRes.data ?? []) {
    if (v.user_id) voterIds.add(`u:${v.user_id}`);
    else if (v.session_id) voterIds.add(`s:${v.session_id}`);
    const ms = v.decision_ms as number | null;
    if (ms != null && ms > 0) {
      times.push(ms);
      const label = bucketDecisionMs(ms);
      bucketMap.set(label, (bucketMap.get(label) ?? 0) + 1);
    }
  }

  const avgDecisionMs = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : null;

  return {
    totalSwipes: swipeRes.count ?? 0,
    sessions,
    avgDecisionMs,
    undoCount: undoRes.count ?? 0,
    totalCommunityVotes,
    communityYes,
    communityNo,
    swipeYes,
    swipeNo,
    totalItems: itemsRes.count ?? 0,
    uniqueVoters: voterIds.size,
    decisionBuckets: EMPTY_ANALYTICS.decisionBuckets.map((b) => ({
      label: b.label,
      count: bucketMap.get(b.label) ?? 0,
    })),
  };
}
