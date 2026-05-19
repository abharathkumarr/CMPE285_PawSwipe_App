import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '../../constants/theme';
import { type ChartSegment, donutSlicePath } from './chartUtils';

type Props = {
  title: string;
  subtitle?: string;
  segments: ChartSegment[];
  size?: number;
  centerLabel?: string;
  centerSub?: string;
};

/** Circular donut (pie) chart with legend. */
export function DonutChart({
  title,
  subtitle,
  segments,
  size = 168,
  centerLabel,
  centerSub = 'yes',
}: Props) {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 4;
  const innerR = outerR * 0.58;

  let angle = 0;
  const slices: { path: string; color: string; label: string; value: number }[] = [];

  if (total > 0) {
    for (const seg of segments) {
      if (seg.value <= 0) continue;
      const sweep = (seg.value / total) * 360;
      const end = angle + sweep;
      slices.push({
        path: donutSlicePath(cx, cy, outerR, innerR, angle, end),
        color: seg.color,
        label: seg.label,
        value: seg.value,
      });
      angle = end;
    }
  }

  const yesSeg = segments.find((s) => s.label.toLowerCase().includes('yes'));
  const mainPct =
    total > 0 && yesSeg
      ? Math.round((yesSeg.value / total) * 100)
      : total > 0 && segments[0]
        ? Math.round((segments[0].value / total) * 100)
        : 0;
  const centerText = centerLabel ?? `${mainPct}%`;

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

      {total === 0 ? (
        <Text style={styles.empty}>No data yet</Text>
      ) : (
        <View style={styles.body}>
          <View style={[styles.chartBox, { width: size, height: size }]}>
            <Svg width={size} height={size}>
              <G>
                {slices.map((sl, i) => (
                  <Path key={`${sl.label}-${i}`} d={sl.path} fill={sl.color} />
                ))}
                {slices.length === 0 ? (
                  <Path
                    d={donutSlicePath(cx, cy, outerR, innerR, 0, 359.99)}
                    fill={colors.border}
                  />
                ) : null}
              </G>
            </Svg>
            <View style={styles.centerLabel} pointerEvents="none">
              <Text style={styles.centerValue}>{centerText}</Text>
              <Text style={styles.centerSub}>{centerSub}</Text>
            </View>
          </View>

          <View style={styles.legend}>
            {segments.map((seg) => {
              const pct = Math.round((seg.value / total) * 100);
              return (
                <View key={seg.label} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: seg.color }]} />
                  <Text style={styles.legendLabel} numberOfLines={1}>
                    {seg.label}
                  </Text>
                  <Text style={styles.legendValue}>
                    {seg.value} ({pct}%)
                  </Text>
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
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: -4,
  },
  empty: {
    color: colors.muted,
    fontSize: 13,
    paddingVertical: 24,
    textAlign: 'center',
  },
  body: {
    alignItems: 'center',
    gap: 12,
  },
  chartBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerValue: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  centerSub: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
  },
  legend: {
    alignSelf: 'stretch',
    gap: 6,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  legendValue: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
  },
});
