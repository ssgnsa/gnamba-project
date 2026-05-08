interface CategoryData {
  label: string;
  value: number;
  color: string;
}

interface CategoryDonutChartProps {
  data: CategoryData[];
  total: number;
  title: string;
}

function formatCFA(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return n.toFixed(0);
}

export default function CategoryDonutChart({
  data,
  total,
  title,
}: CategoryDonutChartProps) {
  const size = 140;
  const cx = size / 2;
  const cy = size / 2;
  const r = 52;
  const ir = 34;

  let cumAngle = -Math.PI / 2;

  const slices = data.map((d) => {
    const angle = (d.value / (total || 1)) * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    const end = cumAngle;
    const x1 = cx + r * Math.cos(start);
    const y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy + r * Math.sin(end);
    const xi1 = cx + ir * Math.cos(end);
    const yi1 = cy + ir * Math.sin(end);
    const xi2 = cx + ir * Math.cos(start);
    const yi2 = cy + ir * Math.sin(start);
    const large = angle > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${large} 0 ${xi2} ${yi2} Z`;
    return { ...d, path, angle };
  });

  if (!data.length || total === 0) {
    return (
      <div className="flex items-center justify-center h-36 text-slate-400 text-sm">
        Aucune donnée
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {slices.map((s, i) => (
            <path
              key={i}
              d={s.path}
              fill={s.color}
              stroke="white"
              strokeWidth="1.5"
            />
          ))}
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fontSize="11"
            fill="#64748b"
            fontWeight="500"
          >
            {title}
          </text>
          <text
            x={cx}
            y={cy + 9}
            textAnchor="middle"
            fontSize="13"
            fill="#1e293b"
            fontWeight="700"
          >
            {formatCFA(total)}
          </text>
        </svg>
      </div>
      <div className="w-full space-y-2">
        {data.slice(0, 5).map((d, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-slate-600 truncate">{d.label}</span>
            </div>
            <span className="text-slate-800 font-semibold ml-2 flex-shrink-0">
              {total > 0 ? ((d.value / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
