import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { DonutChart } from '../../src/components/analytics/DonutChart';
import { HorizontalBarChart } from '../../src/components/analytics/HorizontalBarChart';
import { PieChart } from '../../src/components/analytics/PieChart';
import { StatCard } from '../../src/components/analytics/StatCard';
import { VerticalBarChart } from '../../src/components/analytics/VerticalBarChart';
import { SetupScreen } from '../../src/components/SetupScreen';
import { colors, layout } from '../../src/constants/theme';
import { fetchAnalyticsDashboard, type AnalyticsDashboard } from '../../src/lib/api';
import { isSupabaseConfigured } from '../../src/lib/supabase';

const POLL_MS = 5000;

function formatMs(ms: number | null): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export default function AnalyticsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<AnalyticsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    try {
      const dashboard = await fetchAnalyticsDashboard();
      setData(dashboard);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(() => load(), POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  const communityYesPct = useMemo(() => {
    if (!data) return 0;
    const t = data.communityYes + data.communityNo;
    return t ? Math.round((data.communityYes / t) * 100) : 0;
  }, [data]);

  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  if (loading && !data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.subtitle}>{error ?? 'No analytics data'}</Text>
      </View>
    );
  }

  const d = data;
  const bucketColors = [colors.accent, '#a78bfa', '#fbbf24', '#f472b6'];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          tintColor={colors.accent}
        />
      }
    >
      <Text style={styles.subtitle}>
        Charts & metrics · refreshes every 5s
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.statGrid}>
        <StatCard
          label="Total swipes"
          value={String(d.totalSwipes)}
          hint="Logged swipe events"
          accent={colors.accent}
        />
        <StatCard
          label="Sessions"
          value={String(d.sessions)}
          hint="App opens"
          accent="#a78bfa"
        />
        <StatCard
          label="Avg decision"
          value={formatMs(d.avgDecisionMs)}
          hint="Time before vote"
          accent={colors.yes}
        />
        <StatCard
          label="Undos"
          value={String(d.undoCount)}
          hint="Take-backs"
          accent="#fbbf24"
        />
      </View>

      <Text style={styles.sectionTitle}>Donut charts (vote split)</Text>
      <View style={styles.chartRow}>
        <DonutChart
          title="Community votes"
          subtitle={`${communityYesPct}% yes`}
          segments={[
            { label: 'Yes', value: d.communityYes, color: colors.yes },
            { label: 'No', value: d.communityNo, color: colors.no },
          ]}
        />
        <DonutChart
          title="Swipe events"
          subtitle="Analytics log"
          segments={[
            { label: 'Yes', value: d.swipeYes, color: colors.yes },
            { label: 'No', value: d.swipeNo, color: colors.no },
          ]}
        />
      </View>

      <Text style={styles.sectionTitle}>Pie chart (activity mix)</Text>
      <PieChart
        title="What happened in the app?"
        segments={[
          { label: 'Swipes', value: d.totalSwipes, color: colors.accent },
          { label: 'Sessions', value: d.sessions, color: '#a78bfa' },
          { label: 'Undos', value: d.undoCount, color: '#fbbf24' },
        ]}
      />

      <Text style={styles.sectionTitle}>Bar charts (decision time)</Text>
      <VerticalBarChart
        title="Decision time — column chart"
        data={d.decisionBuckets.map((b, i) => ({
          label: b.label,
          value: b.count,
          color: bucketColors[i % bucketColors.length],
        }))}
        emptyLabel="Swipe on pets to collect timing data"
      />

      <HorizontalBarChart
        title="Decision time — horizontal bars"
        data={d.decisionBuckets.map((b, i) => ({
          label: b.label,
          value: b.count,
          color: bucketColors[i % bucketColors.length],
        }))}
        emptyLabel="Swipe on pets to collect timing data"
      />

      <View style={styles.footnote}>
        <Text style={styles.footnoteText}>
          Run npm run seed-demo-votes for fuller donut and bar charts during your demo.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: layout.horizontalPad,
    paddingBottom: 32,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 4,
  },
  error: {
    color: '#fecaca',
    fontSize: 14,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chartRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  footnote: {
    paddingVertical: 8,
  },
  footnoteText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});
