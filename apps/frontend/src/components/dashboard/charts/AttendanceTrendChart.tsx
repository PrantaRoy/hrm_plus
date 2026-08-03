import { useMemo, useState } from "react";
import { DashboardTrendPointDto } from "@hrm-plus/shared";
import { Button, Table, TableCell, TableHead, TableHeaderCell, TableRow } from "@hrm-plus/ui";
import { chartColors } from "./chartTheme";
import { ChartLegend, ChartTooltip } from "./ChartPrimitives";

const WIDTH = 680;
const HEIGHT = 220;
const PADDING = { top: 12, right: 12, bottom: 24, left: 32 };
const INNER_WIDTH = WIDTH - PADDING.left - PADDING.right;
const INNER_HEIGHT = HEIGHT - PADDING.top - PADDING.bottom;

function formatShortDate(iso: string): string {
  return new Date(`${iso}T00:00:00.000Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function buildPath(values: number[], maxY: number): string {
  if (values.length === 0) return "";
  const stepX = values.length > 1 ? INNER_WIDTH / (values.length - 1) : 0;
  return values
    .map((v, i) => {
      const x = PADDING.left + i * stepX;
      const y = PADDING.top + INNER_HEIGHT - (maxY > 0 ? (v / maxY) * INNER_HEIGHT : 0);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export interface AttendanceTrendChartProps {
  points: DashboardTrendPointDto[];
}

export function AttendanceTrendChart({ points }: AttendanceTrendChartProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showTable, setShowTable] = useState(false);

  const maxY = useMemo(() => Math.max(1, ...points.map((p) => Math.max(p.present, p.absent, p.late))), [points]);

  const presentPath = useMemo(() => buildPath(points.map((p) => p.present), maxY), [points, maxY]);
  const absentPath = useMemo(() => buildPath(points.map((p) => p.absent), maxY), [points, maxY]);
  const latePath = useMemo(() => buildPath(points.map((p) => p.late), maxY), [points, maxY]);

  const stepX = points.length > 1 ? INNER_WIDTH / (points.length - 1) : 0;
  const gridlineCount = 4;
  const gridlines = Array.from({ length: gridlineCount + 1 }, (_, i) => i / gridlineCount);

  // Show at most ~6 x-axis labels regardless of 7 vs 30 day range, to avoid overlap.
  const labelEvery = Math.max(1, Math.ceil(points.length / 6));

  function handleMove(evt: React.MouseEvent<SVGRectElement>) {
    const rect = evt.currentTarget.getBoundingClientRect();
    const ratio = (evt.clientX - rect.left) / rect.width;
    const idx = Math.round(ratio * (points.length - 1));
    setHoverIndex(Math.min(points.length - 1, Math.max(0, idx)));
  }

  const hovered = hoverIndex !== null ? points[hoverIndex] : null;
  const hoverX = hoverIndex !== null ? PADDING.left + hoverIndex * stepX : 0;

  if (points.length === 0) {
    return <p className="text-sm text-slate-400">No attendance data for this range yet.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <ChartLegend
          items={[
            { label: "Present", color: chartColors.good },
            { label: "Absent", color: chartColors.critical },
            { label: "Late (subset of present)", color: chartColors.warning },
          ]}
        />
        <Button variant="secondary" size="sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "View chart" : "View as table"}
        </Button>
      </div>

      {showTable ? (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Date</TableHeaderCell>
              <TableHeaderCell>Duty Assigned</TableHeaderCell>
              <TableHeaderCell>Present</TableHeaderCell>
              <TableHeaderCell>Absent</TableHeaderCell>
              <TableHeaderCell>Late</TableHeaderCell>
              <TableHeaderCell>On Leave</TableHeaderCell>
            </TableRow>
          </TableHead>
          <tbody>
            {points.map((p) => (
              <TableRow key={p.date}>
                <TableCell>{formatShortDate(p.date)}</TableCell>
                <TableCell>{p.dutyAssigned}</TableCell>
                <TableCell>{p.present}</TableCell>
                <TableCell>{p.absent}</TableCell>
                <TableCell>{p.late}</TableCell>
                <TableCell>{p.onLeave}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      ) : (
        <div className="relative" onMouseLeave={() => setHoverIndex(null)}>
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} preserveAspectRatio="none" className="h-56 w-full">
            {gridlines.map((g) => {
              const y = PADDING.top + INNER_HEIGHT * (1 - g);
              return (
                <line
                  key={g}
                  x1={PADDING.left}
                  x2={WIDTH - PADDING.right}
                  y1={y}
                  y2={y}
                  stroke={chartColors.gridline}
                  strokeWidth={1}
                />
              );
            })}
            <line
              x1={PADDING.left}
              x2={WIDTH - PADDING.right}
              y1={PADDING.top + INNER_HEIGHT}
              y2={PADDING.top + INNER_HEIGHT}
              stroke={chartColors.axis}
              strokeWidth={1}
            />

            {points.map((p, i) =>
              i % labelEvery === 0 ? (
                <text
                  key={p.date}
                  x={PADDING.left + i * stepX}
                  y={HEIGHT - 6}
                  textAnchor="middle"
                  fontSize={9}
                  fill={chartColors.textSecondary}
                >
                  {formatShortDate(p.date)}
                </text>
              ) : null
            )}

            {hoverIndex !== null && (
              <line
                x1={hoverX}
                x2={hoverX}
                y1={PADDING.top}
                y2={PADDING.top + INNER_HEIGHT}
                stroke={chartColors.axis}
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            )}

            <path d={absentPath} fill="none" stroke={chartColors.critical} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={presentPath} fill="none" stroke={chartColors.good} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <path d={latePath} fill="none" stroke={chartColors.warning} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />

            {hoverIndex !== null && hovered && (
              <>
                <circle
                  cx={hoverX}
                  cy={PADDING.top + INNER_HEIGHT - (hovered.present / maxY) * INNER_HEIGHT}
                  r={4}
                  fill={chartColors.good}
                />
                <circle
                  cx={hoverX}
                  cy={PADDING.top + INNER_HEIGHT - (hovered.absent / maxY) * INNER_HEIGHT}
                  r={4}
                  fill={chartColors.critical}
                />
                <circle
                  cx={hoverX}
                  cy={PADDING.top + INNER_HEIGHT - (hovered.late / maxY) * INNER_HEIGHT}
                  r={4}
                  fill={chartColors.warning}
                />
              </>
            )}

            <rect
              x={PADDING.left}
              y={PADDING.top}
              width={INNER_WIDTH}
              height={INNER_HEIGHT}
              fill="transparent"
              onMouseMove={handleMove}
            />
          </svg>

          {hoverIndex !== null && hovered && (
            <ChartTooltip leftPct={(hoverX / WIDTH) * 100} topPct={(PADDING.top / HEIGHT) * 100}>
              <p className="font-medium text-slate-900">{formatShortDate(hovered.date)}</p>
              <p className="text-slate-600">Present: {hovered.present}</p>
              <p className="text-slate-600">Absent: {hovered.absent}</p>
              <p className="text-slate-600">Late (subset of present): {hovered.late}</p>
              <p className="text-slate-600">On leave: {hovered.onLeave}</p>
            </ChartTooltip>
          )}
        </div>
      )}
    </div>
  );
}
