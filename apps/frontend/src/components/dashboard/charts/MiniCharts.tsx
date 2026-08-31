import { chartColors } from "./chartTheme";

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface RingGaugeProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerValue?: string;
  centerLabel?: string;
}

/** A compact donut / ring gauge. Segments are drawn clockwise from 12 o'clock. */
export function RingGauge({ segments, size = 128, thickness = 13, centerValue, centerLabel }: RingGaugeProps) {
  const total = segments.reduce((sum, s) => sum + Math.max(0, s.value), 0);
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  let offset = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <g transform={`rotate(-90 ${center} ${center})`}>
        <circle cx={center} cy={center} r={radius} fill="none" stroke={chartColors.gridline} strokeWidth={thickness} />
        {total > 0 &&
          segments.map((seg) => {
            const frac = Math.max(0, seg.value) / total;
            const dash = frac * circumference;
            const node = (
              <circle
                key={seg.label}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return node;
          })}
      </g>
      {centerValue !== undefined && (
        <text
          x={center}
          y={centerLabel ? center - 4 : center}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.24}
          fontWeight={700}
          fill={chartColors.textPrimary}
        >
          {centerValue}
        </text>
      )}
      {centerLabel && (
        <text
          x={center}
          y={center + size * 0.14}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={size * 0.1}
          fill={chartColors.textSecondary}
        >
          {centerLabel}
        </text>
      )}
    </svg>
  );
}

export interface SparklineProps {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
}

/** A tiny area-less trend line, no axes — for at-a-glance direction. */
export function Sparkline({ values, color = chartColors.textSecondary, width = 76, height = 26 }: SparklineProps) {
  if (values.length < 2) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - 2 - ((v - min) / range) * (height - 4);
    return { x, y };
  });
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <path d={d} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r={2} fill={color} />
    </svg>
  );
}
