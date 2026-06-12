'use client';

import { useRef, useState, useEffect } from 'react';
import type { ProgressPoint } from '@/lib/types';

const MONTHS_SHORT = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function epley1RM(w: number, r: number): number {
  return r > 1 ? w * (1 + r / 30) : w;
}

interface ProgressChartProps {
  points: ProgressPoint[];
  prSet: ProgressPoint | null;
}

export default function ProgressChart({ points, prSet }: ProgressChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setWidth(el.offsetWidth || 320);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const W = width;
  const H = 150;
  const PAD = { top: 22, right: 14, bottom: 32, left: 44 };

  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const validPoints = points.filter(
    (p) => p.weight_kg != null && p.weight_kg > 0
  );

  const renderEmpty = validPoints.length === 0;

  // Compute 1RM values for each valid point
  const values = validPoints.map((p) =>
    epley1RM(p.weight_kg!, p.reps ?? 1)
  );

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = maxVal - minVal || 1;

  // For PR detection: match by date
  const isPR = (p: ProgressPoint) =>
    prSet != null &&
    p.year === prSet.year &&
    p.month === prSet.month &&
    p.day === prSet.day;

  // x/y mapping
  const n = validPoints.length;
  const xPos = (i: number) =>
    n === 1 ? PAD.left + chartW / 2 : PAD.left + (i / (n - 1)) * chartW;
  const yPos = (val: number) =>
    PAD.top + chartH - ((val - minVal) / valRange) * chartH;

  // Date label: show at first, last, and every nth
  const labelStep = Math.max(1, Math.floor(n / 4));
  const showLabel = (i: number) =>
    i === 0 || i === n - 1 || i % labelStep === 0;

  const formatDate = (p: ProgressPoint) =>
    `${p.day} ${MONTHS_SHORT[p.month - 1]}`;

  // Y-axis gridlines
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const val = minVal + (valRange * i) / gridCount;
    const y = yPos(val);
    return { y, val };
  });

  // Build SVG path
  const points2D = validPoints.map((p, i) => ({
    x: xPos(i),
    y: yPos(values[i]),
    point: p,
    val: values[i],
  }));

  let linePath = '';
  let areaPath = '';
  if (n >= 2) {
    linePath = points2D
      .map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt.x},${pt.y}`)
      .join(' ');
    areaPath =
      `M${points2D[0].x},${H - PAD.bottom} ` +
      points2D.map((pt) => `L${pt.x},${pt.y}`).join(' ') +
      ` L${points2D[n - 1].x},${H - PAD.bottom} Z`;
  }

  const gradientId = 'progress-area-gradient';

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width={W}
        height={H}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7dff9b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#7dff9b" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridLines.map(({ y, val }, i) => (
          <g key={i}>
            <line
              x1={PAD.left}
              y1={y}
              x2={W - PAD.right}
              y2={y}
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 6}
              y={y + 4}
              textAnchor="end"
              fontSize={9}
              fill="rgba(255,255,255,0.35)"
            >
              {val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}
            </text>
          </g>
        ))}

        {/* Area fill */}
        {n >= 2 && (
          <path d={areaPath} fill={`url(#${gradientId})`} />
        )}

        {/* Line */}
        {n >= 2 && (
          <path
            d={linePath}
            fill="none"
            stroke="#7dff9b"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* Single-point centered dot */}
        {n === 1 && (
          <circle
            cx={xPos(0)}
            cy={yPos(values[0])}
            r={5}
            fill={isPR(validPoints[0]) ? '#ffd93d' : '#7dff9b'}
          />
        )}

        {/* Dots */}
        {n >= 2 &&
          points2D.map((pt, i) => {
            const pr = isPR(pt.point);
            return (
              <circle
                key={i}
                cx={pt.x}
                cy={pt.y}
                r={pr ? 5 : 3.5}
                fill={pr ? '#ffd93d' : '#7dff9b'}
                stroke={pr ? '#ffd93d' : 'none'}
                strokeWidth={pr ? 2 : 0}
                style={{ filter: pr ? 'drop-shadow(0 0 4px #ffd93d88)' : undefined }}
              />
            );
          })}

        {/* Date labels */}
        {points2D.map((pt, i) =>
          showLabel(i) ? (
            <text
              key={i}
              x={pt.x}
              y={H - PAD.bottom + 14}
              textAnchor={
                i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'
              }
              fontSize={9}
              fill="rgba(255,255,255,0.35)"
            >
              {formatDate(pt.point)}
            </text>
          ) : null
        )}

        {renderEmpty && (
          <text
            x={W / 2}
            y={H / 2}
            textAnchor="middle"
            fontSize={12}
            fill="rgba(255,255,255,0.25)"
          >
            Sin datos
          </text>
        )}
      </svg>
    </div>
  );
}
