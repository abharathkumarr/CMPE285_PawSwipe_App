import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../../constants/theme';

export type BarDatum = {
  label: string;
  value: number;
  color?: string;
};

type Props = {
  title: string;
  data: BarDatum[];
  emptyLabel?: string;
};

export function HorizontalBarChart({ title, data, emptyLabel = 'No data yet' }: Props) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {total === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <View style={styles.bars}>
          {data.map((d) => {
            const pct = Math.round((d.value / max) * 100);
            const share = total ? Math.round((d.value / total) * 100) : 0;
            return (
              <View key={d.label} style={styles.row}>
                <View style={styles.labelRow}>
                  <View style={[styles.dot, { backgroundColor: d.color ?? colors.accent }]} />
                  <Text style={styles.label}>{d.label}</Text>
                  <Text style={styles.count}>
                    {d.value} ({share}%)
                  </Text>
                </View>
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${pct}%`,
                        backgroundColor: d.color ?? colors.accent,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
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
  empty: {
    color: colors.muted,
    fontSize: 14,
  },
  bars: {
    gap: 12,
  },
  row: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  label: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  count: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  track: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
});
