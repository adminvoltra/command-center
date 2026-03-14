'use client';

interface DonutChartProps {
  segments: { value: number; color: string; label: string }[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

export default function DonutChart({
  segments,
  size = 160,
  strokeWidth = 20,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  let accumulatedOffset = 0;

  return (
    <div className="donut-chart" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="donut-svg">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((segment, i) => {
          const segmentLength = total > 0 ? (segment.value / total) * circumference : 0;
          const offset = accumulatedOffset;
          accumulatedOffset += segmentLength;

          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dasharray 0.6s ease',
              }}
            />
          );
        })}
      </svg>
      {(centerLabel || centerValue) && (
        <div className="donut-center">
          {centerValue && <span className="donut-value">{centerValue}</span>}
          {centerLabel && <span className="donut-label">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}
