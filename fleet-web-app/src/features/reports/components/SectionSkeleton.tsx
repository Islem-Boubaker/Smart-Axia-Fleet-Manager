interface SectionSkeletonProps {
  dark: boolean;
  cols?: number;
  rows?: number;
}

const SectionSkeleton = ({
  dark,
  cols = 4,
  rows = 1,
}: SectionSkeletonProps) => (
  <div className="space-y-3 animate-pulse">
    <div
      className={`h-5 w-40 rounded-full ${dark ? "bg-slate-700" : "bg-slate-200"}`}
    />
    <div
      className={`grid gap-3`}
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className={`h-20 rounded-xl ${dark ? "bg-slate-800" : "bg-slate-100"}`}
        />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div
        key={i}
        className={`h-32 rounded-xl ${dark ? "bg-slate-800" : "bg-slate-100"}`}
      />
    ))}
  </div>
);

export default SectionSkeleton;
