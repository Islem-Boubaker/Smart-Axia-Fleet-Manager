import { useMemo } from 'react';
import {
  FiArrowDown,
  FiArrowUp,
  FiArrowUpRight,
  FiChevronDown,
  FiCompass,
  FiGift,
  FiPhone,
  FiTruck,
} from 'react-icons/fi';
import { MapArea, MiniBar, Ring, SparkDots } from './ui/DashboardVisuals';

interface DashboardOverviewProps {
  dark: boolean;
}

const DashboardOverview = ({ dark }: DashboardOverviewProps) => {
  const panel = dark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-gray-100 text-gray-900';
  const sub = dark ? 'text-gray-400' : 'text-gray-500';

  const topStats = useMemo(
    () => [
      {
        label: 'This month order',
        value: '132',
        unit: '',
        delta: '25%',
        trend: 'up' as const,
        data: [60, 75, 55, 80, 90, 85, 132],
        icon: <FiGift className="w-5 h-5" />,
      },
      {
        label: 'Average weight',
        value: '32',
        unit: 'lbs',
        delta: '12%',
        trend: 'down' as const,
        data: [30, 28, 35, 25, 32, 30, 32],
        icon: <FiTruck className="w-5 h-5" />,
      },
      {
        label: 'Average distance',
        value: '872',
        unit: 'mi',
        delta: '',
        trend: 'up' as const,
        data: [700, 800, 750, 900, 820, 880, 872],
        icon: <FiCompass className="w-5 h-5" />,
      },
    ],
    [],
  );

  return (
    <div className={`rounded-3xl border p-6 ${panel}`}>
      <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 mb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Welcome back, Bedis!</h1>
          <p className={`text-sm mt-1 ${sub}`}>You have 1 new delivered parcels.</p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors shadow-md shadow-violet-200/50">
            Create new order
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {topStats.map((stat, i) => (
          <div key={stat.label} className={`col-span-12 md:col-span-6 xl:col-span-4 rounded-2xl border p-5 flex items-center justify-between gap-4 ${panel}`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${dark ? 'bg-gray-900 text-white' : 'bg-blue-50 text-blue-600'}`}>
                {stat.icon}
              </div>

              <div>
                <div className={`text-xs font-medium ${sub} mb-0.5`}>{stat.label}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-black">{stat.value}</span>
                  {stat.unit && <span className={`text-sm font-semibold ${sub}`}>{stat.unit}</span>}
                  {stat.delta && (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${stat.trend === 'up' ? 'text-violet-500' : 'text-amber-500'}`}>
                      {stat.trend === 'up' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />}
                      {stat.delta}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {i === 2 ? <SparkDots data={stat.data} /> : <MiniBar data={stat.data} />}
          </div>
        ))}

        <div className={`col-span-12 lg:col-span-5 xl:col-span-3 rounded-2xl border p-5 ${panel}`}>
          <div className="font-bold text-base mb-1">Package Details</div>
          <div className={`text-xs ${sub} mb-4 flex items-center gap-2`}>
            <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full text-[10px] font-semibold">Electronics</span>
            <span className="text-amber-500 font-medium">In progress</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              ['28 lbs', 'Weight'],
              ['10.2 lbs', 'Width'],
              ['8.5 lbs', 'Length'],
            ].map(([value, label]) => (
              <div key={label} className={`rounded-xl p-2 text-center ${dark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                <div className="font-bold text-sm">{value}</div>
                <div className={`text-[10px] ${sub} mt-0.5`}>{label}</div>
              </div>
            ))}
          </div>

          <div className={`text-xs font-semibold ${sub} mb-2`}>Receiver</div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
              MM
            </div>
            <div>
              <div className="text-sm font-semibold">Mike Miles</div>
              <div className={`text-xs ${sub}`}>+1 800 456 2456</div>
            </div>
            <button className="ml-auto w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-600 hover:bg-violet-200 transition-colors">
              <FiPhone className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className={`col-span-12 lg:col-span-7 xl:col-span-5 rounded-2xl border p-5 ${panel}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="font-bold text-base">Order Info</div>
            <button className={`text-xs font-medium ${sub} hover:text-violet-600 flex items-center gap-1`}>
              View more <FiArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="bg-gradient-to-r from-violet-500 to-violet-400 rounded-xl p-4 text-white mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl font-black">NYC</span>
              <div className="flex flex-col items-center gap-1">
                <FiTruck className="w-8 h-6" />
                <div className="w-16 h-1 rounded-full bg-white/30 relative">
                  <div className="absolute left-1/2 -top-1.5 w-3 h-3 rounded-full bg-white border-2 border-violet-400" />
                </div>
                <div className="text-[10px] text-white/70">1 of 40</div>
              </div>
              <span className="text-2xl font-black">PHI</span>
            </div>

            <div className="flex items-center justify-between text-xs text-white/80">
              <div>
                <div className="text-[10px] uppercase tracking-wide opacity-60">Dispatch</div>
                <div className="font-bold">14:35PM</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase tracking-wide opacity-60">Arriving</div>
                <div className="font-bold">16:13PM</div>
              </div>
            </div>
          </div>

          <div>
            <div className="font-bold text-sm mb-2">#PTRG4523</div>
            {[
              ['Receipt', '10:07AM', false],
              ['Preparation', '13:18PM', false],
              ['Dispatch', '14:33PM', true],
              ['Receiving', '16:13PM', false],
            ].map(([step, time, active]) => (
              <div key={String(step)} className="flex items-center gap-2 mb-1.5">
                <div
                  className={`w-3 h-3 rounded-full border-2 ${
                    active ? 'border-violet-600 bg-violet-600' : dark ? 'border-gray-600' : 'border-gray-300'
                  }`}
                />
                <span className={`text-xs ${active ? 'font-semibold text-violet-600' : sub}`}>{step}</span>
                <span className={`ml-auto text-xs font-medium ${active ? (dark ? 'text-white' : 'text-gray-900') : sub}`}>{time}</span>
              </div>
            ))}
          </div>

          <div className={`mt-3 flex items-center gap-3 pt-3 border-t ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
            <Ring pct={60} size={32} stroke={4} color="#8b5cf6" />
            <span className="text-sm font-semibold">60% Completed</span>
            <div className={`ml-auto flex items-center gap-1 text-xs font-medium ${sub}`}>
              Deliveries
              <FiChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className={`col-span-12 xl:col-span-4 rounded-2xl border p-5 ${panel} xl:row-span-2`}>
          <div className="font-bold text-base mb-3">Map Overview</div>
          <div className="h-[340px]">
            <MapArea />
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
