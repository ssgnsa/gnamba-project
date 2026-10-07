interface MonthData {
  month: string;
  recettes: number;
  depenses: number;
}

interface RevenueChartProps {
  data: MonthData[];
}

function formatAmount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return n.toFixed(0);
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data.length) return null;

  const W = 560;
  const H = 220;
  const padLeft = 52;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 40;
  const chartW = W - padLeft - padRight;
  const chartH = H - padTop - padBottom;

  const maxVal = Math.max(...data.flatMap((d) => [d.recettes, d.depenses]), 1);
  const barGroupW = chartW / data.length;
  const barW = Math.min(barGroupW * 0.32, 28);
  const gap = 4;

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: padTop + chartH * (1 - t),
    label: formatAmount(maxVal * t),
  }));

  const toY = (v: number) => padTop + chartH * (1 - v / maxVal);

  const linePoints = data
    .map((d, i) => {
      const cx = padLeft + barGroupW * i + barGroupW / 2;
      return `${cx},${toY(d.recettes)}`;
    })
    .join(" ");

  const areaPoints = [
    `${padLeft + barGroupW * 0 + barGroupW / 2},${padTop + chartH}`,
    ...data.map((d, i) => {
      const cx = padLeft + barGroupW * i + barGroupW / 2;
      return `${cx},${toY(d.recettes)}`;
    }),
    `${padLeft + barGroupW * (data.length - 1) + barGroupW / 2},${padTop + chartH}`,
  ].join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ minWidth: 320 }}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={padLeft}
              y1={t.y}
              x2={W - padRight}
              y2={t.y}
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={i === 0 ? "0" : "4,3"}
            />
            <text
              x={padLeft - 6}
              y={t.y + 4}
              textAnchor="end"
              fontSize="9"
              fill="#94a3b8"
            >
              {t.label}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = padLeft + barGroupW * i + barGroupW / 2;
          const recX = cx - gap / 2 - barW;
          const depX = cx + gap / 2;
          const recH = Math.max((d.recettes / maxVal) * chartH, 2);
          const depH = Math.max((d.depenses / maxVal) * chartH, 2);
          return (
            <g key={i}>
              <rect
                x={recX}
                y={toY(d.recettes)}
                width={barW}
                height={recH}
                rx="3"
                fill="#14b8a6"
                opacity="0.85"
              />
              <rect
                x={depX}
                y={toY(d.depenses)}
                width={barW}
                height={depH}
                rx="3"
                fill="#f87171"
                opacity="0.75"
              />
              <text
                x={cx}
                y={H - padBottom + 14}
                textAnchor="middle"
                fontSize="9"
                fill="#94a3b8"
              >
                {d.month}
              </text>
            </g>
          );
        })}

        <polygon points={areaPoints} fill="url(#areaGrad)" />
        <polyline
          points={linePoints}
          fill="none"
          stroke="#14b8a6"
          strokeWidth="2.5"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map((d, i) => {
          const cx = padLeft + barGroupW * i + barGroupW / 2;
          return (
            <circle
              key={i}
              cx={cx}
              cy={toY(d.recettes)}
              r="3.5"
              fill="white"
              stroke="#14b8a6"
              strokeWidth="2"
            />
          );
        })}
      </svg>

      <div className="flex items-center gap-5 mt-3 px-2">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-teal-400 inline-block" />
          <span className="text-xs text-slate-500">Recettes</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-400 inline-block" />
          <span className="text-xs text-slate-500">Dépenses</span>
        </div>
      </div>
    </div>
  );
}
