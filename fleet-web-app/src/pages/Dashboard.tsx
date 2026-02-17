import { FiTruck, FiUsers, FiMapPin, FiTrendingUp } from 'react-icons/fi';
import { Card, Badge } from '../components/ui';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/Header';

const Dashboard = () => {
  const stats = [
    {
      title: 'Total Vehicles',
      value: '48',
      change: '+12%',
      changeType: 'increase',
      icon: FiTruck,
      color: 'blue',
    },
    {
      title: 'Active Drivers',
      value: '32',
      change: '+5%',
      changeType: 'increase',
      icon: FiUsers,
      color: 'green',
    },
    {
      title: 'Ongoing Trips',
      value: '15',
      change: '-3%',
      changeType: 'decrease',
      icon: FiMapPin,
      color: 'purple',
    },
    {
      title: 'Total Distance',
      value: '12.5K km',
      change: '+8%',
      changeType: 'increase',
      icon: FiTrendingUp,
      color: 'orange',
    },
  ];

  const recentVehicles = [
    { id: '1', name: 'Toyota Camry', plate: '123 TU 4567', status: 'active', driver: 'Mohamed Ben Salah' },
    { id: '2', name: 'Honda Accord', plate: '167 TU 2389', status: 'maintenance', driver: 'N/A' },
    { id: '3', name: 'Ford F-150', plate: '234 TU 8912', status: 'active', driver: 'Fatma Chaabani' },
    { id: '4', name: 'Chevrolet Malibu', plate: '156 TU 3421', status: 'active', driver: 'Ahmed Trabelsi' },
  ];

  const recentTrips = [
    { id: '1', driver: 'Mohamed Ben Salah', vehicle: '123 TU 4567', from: 'Tunis', to: 'Sfax', status: 'ongoing' },
    { id: '2', driver: 'Fatma Chaabani', vehicle: '234 TU 8912', from: 'Sousse', to: 'Kairouan', status: 'completed' },
    { id: '3', driver: 'Ahmed Trabelsi', vehicle: '156 TU 3421', from: 'Bizerte', to: 'Nabeul', status: 'ongoing' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
      <Header />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-100 text-blue-600',
              green: 'bg-green-100 text-green-600',
              purple: 'bg-purple-100 text-purple-600',
              orange: 'bg-orange-100 text-orange-600',
            };

            return (
              <Card key={stat.title} padding="md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className={`text-sm mt-2 ${stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[stat.color as keyof typeof colorClasses]}`}>
                    <Icon className="text-2xl" />
                  </div>
                </div>
              </Card>
            );
          })}
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

export default Dashboard;
