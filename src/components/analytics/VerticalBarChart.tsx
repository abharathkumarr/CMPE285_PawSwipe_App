import { StyleSheet, Text, View } from 'react-native';
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg';
import { colors } from '../../constants/theme';
import type { BarDatum } from './HorizontalBarChart';

const CHART_HEIGHT = 180;
const PADDING_LEFT = 12;
const PADDING_BOTTOM = 32;
const PADDING_TOP = 16;

type Props = {
  title: string;
  data: BarDatum[];
  emptyLabel?: string;
};

/** Vertical column bar chart (SVG). */
export function VerticalBarChart({ title, data, emptyLabel = 'No data yet' }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const max = Math.max(...data.map((d) => d.value), 1);
  const barCount = Math.max(data.length, 1);
  const gap = 16;
  const barWidth = 44;
  const chartWidth = PADDING_LEFT + barCount * barWidth + (barCount - 1) * gap + 12;
  const plotHeight = CHART_HEIGHT - PADDING_BOTTOM - PADDING_TOP;

  const bucketColors = [colors.accent, '#a78bfa', '#fbbf24', colors.no];

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {total === 0 ? (
        <Text style={styles.empty}>{emptyLabel}</Text>
      ) : (
        <View style={styles.chartScroll}>
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Line
              x1={PADDING_LEFT}
              y1={PADDING_TOP + plotHeight}
              x2={chartWidth - 8}
              y2={PADDING_TOP + plotHeight}
              stroke={colors.border}
              strokeWidth={1.5}
            />
            {data.map((d, i) => {
              const barH = Math.max((d.value / max) * plotHeight, d.value > 0 ? 4 : 0);
              const x = PADDING_LEFT + i * (barWidth + gap);
              const y = PADDING_TOP + plotHeight - barH;
              const fill = d.color ?? bucketColors[i % bucketColors.length];
              return (
                <G key={d.label}>
                  <Rect x={x} y={y} width={barWidth} height={barH} fill={fill} rx={6} ry={6} />
                  <SvgText
                    x={x + barWidth / 2}
                    y={PADDING_TOP + plotHeight + 20}
                    fill={colors.muted}
                    fontSize={11}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {d.label}
                  </SvgText>
                  {d.value > 0 ? (
                    <SvgText
                      x={x + barWidth / 2}
                      y={y - 6}
                      fill={colors.text}
                      fontSize={11}
                      fontWeight="700"
                      textAnchor="middle"
                    >
                      {String(d.value)}
                    </SvgText>
                  ) : null}
                </G>
              );
            })}
          </Svg>
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
  chartScroll: {
    alignItems: 'center',
  },
});
