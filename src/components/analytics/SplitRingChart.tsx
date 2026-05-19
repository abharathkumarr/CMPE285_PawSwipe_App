import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

type Segment = {
  label: string;
  value: number;
  color: string;
};

type Props = {
  title: string;
  segments: Segment[];
  subtitle?: string;
};

/** Stacked bar + legend — reads like a pie chart without extra dependencies. */
export function SplitRingChart({ title, segments, subtitle }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {total === 0 ? (
        <Text style={styles.empty}>No votes recorded yet</Text>
      ) : (
        <>
          <View style={styles.stackedBar}>
            {segments.map((seg) => {
              const flex = seg.value / total;
              if (flex <= 0) return null;
              return (
                <View
                  key={seg.label}
                  style={[styles.slice, { flex, backgroundColor: seg.color }]}
                />
              );
            })}
          </View>
          <View style={styles.legend}>
            {segments.map((seg) => {
              const pct = Math.round((seg.value / total) * 100);
              return (
                <View key={seg.label} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: seg.color }]} />
                  <Text style={styles.legendLabel}>{seg.label}</Text>
                  <Text style={styles.legendValue}>
                    {seg.value} ({pct}%)
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: -4,
  },
  empty: {
    color: colors.muted,
    fontSize: 14,
  },
  stackedBar: {
    flexDirection: 'row',
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  slice: {
    height: '100%',
  },
  legend: {
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  legendValue: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
});
