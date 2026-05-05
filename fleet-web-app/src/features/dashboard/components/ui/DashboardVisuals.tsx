import { useTranslation } from 'react-i18next';

interface DataVizProps {
  data: number[];
  color?: string;
}

interface RingProps {
  pct?: number;
  size?: number;
  stroke?: number;
  color?: string;
}

interface SpeedometerProps {
  value?: number;
  max?: number;
}

export function MiniBar({ data, color = '#8b5cf6' }: DataVizProps) {
  const max = Math.max(...data, 1);

  return (
    <svg viewBox={`0 0 ${data.length * 10} 40`} className="w-24 h-8" preserveAspectRatio="none">
      {data.map((v, i) => (
        <rect
          key={`${v}-${i}`}
          x={i * 10 + 1}
          y={40 - (v / max) * 36}
          width={7}
          height={(v / max) * 36}
          rx={2}
          fill={color}
          opacity={i === data.length - 1 ? 1 : 0.45}
        />
      ))}
    </svg>
  );
}

export function SparkDots({ data, color = '#8b5cf6' }: DataVizProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const width = 80;
  const height = 36;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1 || 1)) * width;
      const y = height - ((v - min) / (max - min || 1)) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-20 h-8">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      {data.map((v, i) => {
        const x = (i / (data.length - 1 || 1)) * width;
        const y = height - ((v - min) / (max - min || 1)) * height;

        return <circle key={`${v}-${i}`} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

export function Ring({ pct = 60, size = 36, stroke = 4, color = '#8b5cf6' }: RingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - pct / 100)}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function Speedometer({ value = 65, max = 120 }: SpeedometerProps) {
  const { t } = useTranslation();
  const ratio = value / max;
  const totalArcs = 32;

  return (
    <div className="relative flex flex-col items-center justify-center mt-2">
      <svg viewBox="0 0 200 120" className="w-52 h-32">
        {Array.from({ length: totalArcs }).map((_, i) => {
          const angle = -180 + (i * 180) / (totalArcs - 1);
          const rad = (angle * Math.PI) / 180;
          const r = 80;
          const x = 100 + r * Math.cos(rad);
          const y = 100 + r * Math.sin(rad);
          const filled = i / totalArcs < ratio;

          return (
            <rect
              key={i}
              x={x - 3}
              y={y - 3}
              width={6}
              height={6}
              rx={1}
              fill={filled ? '#8b5cf6' : '#e5e7eb'}
              transform={`rotate(${angle + 90}, ${x}, ${y})`}
            />
          );
        })}
      </svg>

      <div className="absolute bottom-0 text-center">
        <div className="text-3xl font-extrabold text-gray-900">{value}</div>
        <div className="text-xs text-gray-400 font-medium">{t('dashboard.visuals.milesPerHour')}</div>
      </div>
    </div>
  );
}

export function MapArea() {
  return (
    <div className="relative w-full h-full bg-gray-100 rounded-2xl overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-40">
        <defs>
          <pattern id="map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#map-grid)" />
      </svg>

      <svg className="absolute inset-0 w-full h-full">
        <path d="M 320 60 Q 260 200 200 300 Q 160 360 140 420" stroke="#111827" strokeWidth="2" fill="none" strokeDasharray="6 3" />
        <circle cx="320" cy="60" r="6" fill="#111827" />
        <circle cx="320" cy="60" r="10" fill="#111827" fillOpacity="0.15" />
        <circle cx="140" cy="420" r="6" fill="#94a3b8" />
        <circle cx="140" cy="420" r="10" fill="#94a3b8" fillOpacity="0.25" />
        <circle cx="220" cy="270" r="8" fill="#8b5cf6" />
        <text x="308" y="54" fontSize="11" fontWeight="700" fill="#111827">NYC</text>
        <text x="128" y="446" fontSize="11" fontWeight="700" fill="#64748b">PHI</text>
      </svg>

      <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700 shadow-sm">
        44.7 / 93.9 mi
      </div>

      <div className="absolute bottom-3 right-3 flex flex-col gap-1">
        <button className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-base">
          +
        </button>
        <button className="w-7 h-7 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-600 hover:bg-gray-50 font-bold text-base">
          -
        </button>
      </div>
    </div>
  );
}
