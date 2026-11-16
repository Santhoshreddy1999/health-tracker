import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../theme';
import { shortDay } from '../utils';

const H = 170;
const PAD = { l: 34, r: 10, t: 12, b: 22 };

function useWidth() {
  const [w, setW] = useState(0);
  return [w, (e: any) => setW(e.nativeEvent.layout.width)] as const;
}

export function LineChart({
  points,
  target,
  color,
  unit = '',
}: {
  points: { x: string; y: number }[];
  target?: number;
  color: string;
  unit?: string;
}) {
  const t = useTheme();
  const [w, onLayout] = useWidth();
  if (points.length === 0)
    return <Text style={{ color: t.sub, textAlign: 'center', paddingVertical: 20 }}>Add entries to see your trend.</Text>;
  const ys = points.map((p) => p.y).concat(target ? [target] : []);
  let min = Math.min(...ys);
  let max = Math.max(...ys);
  if (max - min < 1) {
    min -= 1;
    max += 1;
  }
  const span = max - min;
  min -= span * 0.1;
  max += span * 0.1;
  const iw = Math.max(1, w - PAD.l - PAD.r);
  const ih = H - PAD.t - PAD.b;
  const x = (i: number) => PAD.l + (points.length === 1 ? iw / 2 : (i / (points.length - 1)) * iw);
  const y = (v: number) => PAD.t + ih - ((v - min) / (max - min)) * ih;
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.y).toFixed(1)}`).join(' ');
  const area = `${d} L${x(points.length - 1)},${PAD.t + ih} L${x(0)},${PAD.t + ih} Z`;
  const ticks = [min + (max - min) * 0.1, (min + max) / 2, max - (max - min) * 0.1];
  const labelEvery = Math.ceil(points.length / 6);
  return (
    <View onLayout={onLayout} style={{ height: H }}>
      {w > 0 && (
        <Svg width={w} height={H}>
          {ticks.map((v, i) => (
            <React.Fragment key={i}>
              <Line x1={PAD.l} x2={w - PAD.r} y1={y(v)} y2={y(v)} stroke={t.border} strokeWidth={1} />
              <SvgText x={PAD.l - 6} y={y(v) + 4} fontSize={10} fill={t.sub} textAnchor="end">
                {v.toFixed(v < 10 ? 1 : 0)}
              </SvgText>
            </React.Fragment>
          ))}
          {target ? (
            <>
              <Line x1={PAD.l} x2={w - PAD.r} y1={y(target)} y2={y(target)} stroke={t.success} strokeDasharray="5 4" strokeWidth={1.5} />
              <SvgText x={w - PAD.r} y={y(target) - 4} fontSize={10} fill={t.success} textAnchor="end">
                target {target}
                {unit}
              </SvgText>
            </>
          ) : null}
          <Path d={area} fill={color} opacity={0.12} />
          <Path d={d} stroke={color} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
          {points.map((p, i) => (
            <React.Fragment key={i}>
              <Circle cx={x(i)} cy={y(p.y)} r={3.5} fill={t.card} stroke={color} strokeWidth={2} />
              {i % labelEvery === 0 || i === points.length - 1 ? (
                <SvgText x={x(i)} y={H - 6} fontSize={10} fill={t.sub} textAnchor="middle">
                  {p.x.slice(5)}
                </SvgText>
              ) : null}
            </React.Fragment>
          ))}
        </Svg>
      )}
    </View>
  );
}

export function BarChart({
  data,
  target,
  color,
}: {
  data: { date: string; value: number }[];
  target?: number;
  color: string;
}) {
  const t = useTheme();
  const [w, onLayout] = useWidth();
  const max = Math.max(1, target ?? 0, ...data.map((d) => d.value)) * 1.1;
  const iw = Math.max(1, w - PAD.l - PAD.r);
  const ih = H - PAD.t - PAD.b;
  const bw = (iw / data.length) * 0.6;
  const y = (v: number) => PAD.t + ih - (v / max) * ih;
  const fmt = (v: number) => (v >= 1000 ? `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k` : `${Math.round(v)}`);
  return (
    <View onLayout={onLayout} style={{ height: H }}>
      {w > 0 && (
        <Svg width={w} height={H}>
          {[0.5, 1].map((f) => (
            <React.Fragment key={f}>
              <Line x1={PAD.l} x2={w - PAD.r} y1={y(max * f / 1.1)} y2={y(max * f / 1.1)} stroke={t.border} />
              <SvgText x={PAD.l - 6} y={y(max * f / 1.1) + 4} fontSize={10} fill={t.sub} textAnchor="end">
                {fmt((max * f) / 1.1)}
              </SvgText>
            </React.Fragment>
          ))}
          {data.map((d, i) => {
            const cx = PAD.l + (i + 0.5) * (iw / data.length);
            const hit = target ? d.value >= target : false;
            return (
              <React.Fragment key={d.date}>
                <Rect
                  x={cx - bw / 2}
                  y={y(d.value)}
                  width={bw}
                  height={Math.max(0, PAD.t + ih - y(d.value))}
                  rx={5}
                  fill={color}
                  opacity={hit ? 1 : 0.55}
                />
                <SvgText x={cx} y={H - 6} fontSize={10} fill={t.sub} textAnchor="middle">
                  {shortDay(d.date)}
                </SvgText>
              </React.Fragment>
            );
          })}
          {target ? (
            <Line x1={PAD.l} x2={w - PAD.r} y1={y(target)} y2={y(target)} stroke={t.success} strokeDasharray="5 4" strokeWidth={1.5} />
          ) : null}
        </Svg>
      )}
    </View>
  );
}
