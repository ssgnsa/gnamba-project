interface BadgeProps {
  label: string;
  color: "green" | "red" | "orange" | "blue" | "gray" | "yellow";
}

const colorMap = {
  green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  red: "bg-rose-50 text-rose-700 border border-rose-200",
  orange: "bg-amber-50 text-amber-700 border border-amber-200",
  blue: "bg-sky-50 text-sky-700 border border-sky-200",
  gray: "bg-slate-100 text-slate-600 border border-slate-200",
  yellow: "bg-yellow-50 text-yellow-700 border border-yellow-200",
};

export default function Badge({ label, color }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${colorMap[color]}`}
    >
      {label}
    </span>
  );
}
