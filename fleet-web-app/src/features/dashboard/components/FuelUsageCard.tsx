import { FUEL_PRICE_TND } from '../../../utils/constants';
import type { DashboardFuelDay } from '../hooks/useDashboard';

interface FuelUsageCardProps {
  fuelByDay: DashboardFuelDay[];
  activeVehicles: number;
}

const FuelUsageCard = ({ fuelByDay, activeVehicles }: FuelUsageCardProps) => {
  const maxLiters = Math.max(1, ...fuelByDay.map((d) => d.liters));
  const total = fuelByDay.reduce((sum, d) => sum + d.liters, 0);
  const avgPerVehicle = activeVehicles > 0 ? total / activeVehicles : 0;
  const cost = total * FUEL_PRICE_TND;

  return (
    <div className="learning-card p-5">
      <h2 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-3">Fuel usage — last 7 days</h2>

      <div className="flex items-end gap-1 h-14 mb-1 rounded-lg bg-gray-50 dark:bg-gray-800/60 px-2 pt-2">
        {fuelByDay.map((item, index) => {
          const heightPercent = (item.liters / maxLiters) * 100;
          const isToday = index === fuelByDay.length - 1;
          return (
            <div
              key={`${item.day}-${index}`}
              className={`flex-1 rounded-t-sm transition-all duration-300 ${isToday ? 'bg-blue-500' : 'bg-blue-200 dark:bg-blue-900/80'}`}
              style={{ height: `${Math.max(4, heightPercent)}%` }}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-[10px] text-gray-400 mb-3">
        {fuelByDay.map((item, index) => (
          <span key={`${item.day}-label-${index}`}>{item.day}</span>
        ))}
      </div>

      <div className="flex justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-800">
        <span className="text-gray-700 dark:text-gray-300">Total this week</span>
        <span className="text-gray-900 dark:text-white font-semibold">{total.toFixed(1)} L</span>
      </div>
      <div className="flex justify-between text-sm py-1.5 border-b border-gray-100 dark:border-gray-800">
        <span className="text-gray-700 dark:text-gray-300">Avg per vehicle</span>
        <span className="text-gray-900 dark:text-white font-semibold">{avgPerVehicle.toFixed(1)} L</span>
      </div>
      <div className="flex justify-between text-sm py-1.5">
        <span className="text-gray-700 dark:text-gray-300">Cost</span>
        <span className="text-gray-900 dark:text-white font-semibold">{Math.round(cost).toLocaleString('en-TN')} TND</span>
      </div>
    </div>
  );
};

export default FuelUsageCard;
