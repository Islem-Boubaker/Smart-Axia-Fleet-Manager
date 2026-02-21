import { useState } from 'react';
import { FiDownload, FiTrendingDown, FiDollarSign, FiTruck, FiMapPin } from 'react-icons/fi';
import { Card, Button } from '../../../shared/components';
import DashboardLayout from '../../../shared/components/DashboardLayout';
import ReportCard from '../components/ReportCard';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('overview');
  const [dateRange, setDateRange] = useState('month');

  const overviewStats = [
    {
      title: 'Total Revenue',
      value: '68,450 TND',
      change: '+12.5%',
      trend: 'up',
      icon: FiDollarSign,
      color: 'green',
    },
    {
      title: 'Total Distance',
      value: '125,430 km',
      change: '+8.2%',
      trend: 'up',
      icon: FiMapPin,
      color: 'blue',
    },
    {
      title: 'Fuel Costs',
      value: '17,380 TND',
      change: '-5.3%',
      trend: 'down',
      icon: FiTrendingDown,
      color: 'orange',
    },
    {
      title: 'Maintenance Costs',
      value: '12,340 TND',
      change: '+15.8%',
      trend: 'up',
      icon: FiTruck,
      color: 'purple',
    },
  ];

  const vehiclePerformance = [
    { vehicle: 'Toyota Camry (123 TU 4567)', trips: 145, distance: '18,540 km', fuel: '4,020 TND', efficiency: '7.8 L/100km', revenue: '12,960 TND' },
    { vehicle: 'Ford F-150 (234 TU 8912)', trips: 98, distance: '15,230 km', fuel: '4,400 TND', efficiency: '11.2 L/100km', revenue: '10,980 TND' },
    { vehicle: 'Honda Accord (167 TU 2389)', trips: 87, distance: '12,890 km', fuel: '3,300 TND', efficiency: '8.1 L/100km', revenue: '9,150 TND' },
    { vehicle: 'Chevrolet Malibu (156 TU 3421)', trips: 76, distance: '9,850 km', fuel: '2,790 TND', efficiency: '8.5 L/100km', revenue: '7,320 TND' },
    { vehicle: 'Tesla Model 3 (189 TU 6754)', trips: 52, distance: '6,920 km', fuel: '590 TND', efficiency: '16 kWh/100km', revenue: '6,760 TND' },
  ];

  const fuelAnalysis = [
    { type: 'Essence', vehicles: 25, consumption: '8,450 L', cost: '11,560 TND', percentage: 45 },
    { type: 'Diesel', vehicles: 15, consumption: '5,230 L', cost: '6,830 TND', percentage: 30 },
    { type: 'Hybride', vehicles: 5, consumption: '1,850 L', cost: '2,700 TND', percentage: 15 },
    { type: 'Électrique', vehicles: 3, consumption: '2,450 kWh', cost: '870 TND', percentage: 10 },
  ];

  const maintenanceSummary = [
    { category: 'Vidange', count: 18, cost: '2,160 TND', avgCost: '120 TND' },
    { category: 'Pneus', count: 12, cost: '4,050 TND', avgCost: '338 TND' },
    { category: 'Freinage', count: 8, cost: '3,940 TND', avgCost: '493 TND' },
    { category: 'Moteur', count: 5, cost: '2,170 TND', avgCost: '434 TND' },
  ];

  const monthlyTrends = [
    { month: 'Jan', trips: 420, revenue: 59200, distance: 52000 },
    { month: 'Feb', trips: 468, revenue: 68450, distance: 58400 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600 mt-1">View fleet analytics and reports</p>
          </div>
          <Button>
            <FiDownload className="mr-2" />
            Export Report
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="overview">Overview</option>
              <option value="vehicles">Vehicle Performance</option>
              <option value="fuel">Fuel Analysis</option>
              <option value="maintenance">Maintenance</option>
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last Year</option>
            </select>
          </div>
        </Card>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {overviewStats.map((stat) => (
            <Card key={stat.title} padding="md">
              <ReportCard {...stat} trend={stat.trend as any} />
            </Card>
          ))}
        </div>

        {/* Vehicle Performance Table */}
        <Card title="Vehicle Performance" subtitle="Top performing vehicles this month">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-600">Vehicle</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Trips</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Distance</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Fuel Cost</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Efficiency</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-600">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {vehiclePerformance.map((vehicle, index) => (
                  <tr key={index} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm font-medium text-gray-900">{vehicle.vehicle}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{vehicle.trips}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{vehicle.distance}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{vehicle.fuel}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{vehicle.efficiency}</td>
                    <td className="py-3 px-4 text-sm font-semibold text-green-600 text-right">{vehicle.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Fuel Analysis */}
          <Card title="Fuel Analysis" subtitle="Breakdown by fuel type">
            <div className="space-y-4">
              {fuelAnalysis.map((fuel) => (
                <div key={fuel.type}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{fuel.type}</span>
                      <span className="text-sm text-gray-500">({fuel.vehicles} vehicles)</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{fuel.cost}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${fuel.percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600 w-12">{fuel.percentage}%</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Consumption: {fuel.consumption}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Maintenance Summary */}
          <Card title="Maintenance Summary" subtitle="Service breakdown">
            <div className="space-y-3">
              {maintenanceSummary.map((item) => (
                <div key={item.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{item.category}</p>
                    <p className="text-sm text-gray-600">{item.count} services • Avg: {item.avgCost}</p>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">{item.cost}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Monthly Trends */}
        <Card title="Monthly Trends" subtitle="Performance over time">
          <div className="space-y-4">
            {monthlyTrends.map((trend) => (
              <div key={trend.month} className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Month</p>
                  <p className="text-lg font-semibold text-gray-900">{trend.month}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Trips</p>
                  <p className="text-lg font-semibold text-gray-900">{trend.trips}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Distance</p>
                  <p className="text-lg font-semibold text-gray-900">{trend.distance.toLocaleString()} km</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Revenue</p>
                  <p className="text-lg font-semibold text-green-600">{trend.revenue.toLocaleString()} TND</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
