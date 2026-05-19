import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '../../constants/theme';
import { type ChartSegment, donutSlicePath, polarToCartesian } from './chartUtils';

type Props = {
  title: string;
  segments: ChartSegment[];
  size?: number;
};

/** Full pie chart (no hole) for activity breakdown. */
export function PieChart({ title, segments, size = 140 }: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 6;

  let angle = 0;
  const slices: { d: string; color: string }[] = [];

  if (total > 0) {
    for (const seg of segments) {
      if (seg.value <= 0) continue;
      const sweep = (seg.value / total) * 360;
      const end = angle + sweep;
      const start = polarToCartesian(cx, cy, r, angle);
      const endPt = polarToCartesian(cx, cy, r, end);
      const large = sweep > 180 ? 1 : 0;
      const d = [
        `M ${cx} ${cy}`,
        `L ${start.x} ${start.y}`,
        `A ${r} ${r} 0 ${large} 1 ${endPt.x} ${endPt.y}`,
        'Z',
      ].join(' ');
      slices.push({ d, color: seg.color });
      angle = end;
    }
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {total === 0 ? (
        <Text style={styles.empty}>No data yet</Text>
      ) : (
        <View style={styles.row}>
          <Svg width={size} height={size}>
            <G>
              {slices.map((sl, i) => (
                <Path key={i} d={sl.d} fill={sl.color} />
              ))}
            </G>
          </Svg>
          <View style={styles.legend}>
            {segments.map((seg) => {
              const pct = Math.round((seg.value / total) * 100);
              return (
                <View key={seg.label} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: seg.color }]} />
                  <Text style={styles.legendLabel}>{seg.label}</Text>
                  <Text style={styles.legendValue}>{pct}%</Text>
                </View>
              );
            })}
          </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  legend: {
    flex: 1,
    gap: 10,
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
    fontWeight: '700',
  },
});
