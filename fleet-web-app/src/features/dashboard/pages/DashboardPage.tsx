import { FiTruck, FiUsers, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import { Card, Badge } from '../../../shared/components';
import DashboardLayout from '../../../shared/components/DashboardLayout';
import DashboardCard from '../components/DashboardCard';
import { useDashboard } from '../hooks/useDashboard';

const DashboardPage = () => {
  const { stats, recentVehicles, recentTrips, isLoading } = useDashboard();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">Loading...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <DashboardCard key={stat.title} {...stat} />
          ))}
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Vehicles */}
          <Card title="Recent Vehicles" subtitle="Your latest vehicle activity">
            <div className="space-y-3">
              {recentVehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FiTruck className="text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{vehicle.name}</p>
                      <p className="text-sm text-gray-500">{vehicle.plate}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={
                        vehicle.status === 'active'
                          ? 'success'
                          : vehicle.status === 'maintenance'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {vehicle.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{vehicle.driver}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Trips */}
          <Card title="Recent Trips" subtitle="Latest trip activities">
            <div className="space-y-3">
              {recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{trip.driver}</p>
                    <Badge variant={trip.status === 'ongoing' ? 'info' : 'success'}>
                      {trip.status}
                    </Badge>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <FiMapPin className="mr-1" />
                    <span>{trip.from} → {trip.to}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Vehicle: {trip.vehicle}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 text-center bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors group">
              <FiTruck className="mx-auto text-2xl text-blue-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Vehicle</p>
            </button>
            <button className="p-4 text-center bg-green-50 hover:bg-green-100 rounded-lg transition-colors group">
              <FiUsers className="mx-auto text-2xl text-green-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">Add Driver</p>
            </button>
            <button className="p-4 text-center bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors group">
              <FiMapPin className="mx-auto text-2xl text-purple-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">New Trip</p>
            </button>
            <button className="p-4 text-center bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors group">
              <FiTrendingUp className="mx-auto text-2xl text-orange-600 mb-2" />
              <p className="text-sm font-medium text-gray-900">View Reports</p>
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;
