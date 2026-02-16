import { useState } from 'react';
import { FiPlus, FiTool, FiCalendar, FiDollarSign, FiTruck, FiSearch, FiAlertCircle } from 'react-icons/fi';
import { Card, Button, Badge, Input } from '../components/ui';
import DashboardLayout from '../components/layout/DashboardLayout';

const Maintenance = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const maintenanceRecords = [
    {
      id: '1',
      vehicle: 'Toyota Camry (123 TU 4567)',
      type: 'Vidange',
      description: 'Changement huile moteur et filtre',
      scheduledDate: '2026-02-20',
      completedDate: null,
      status: 'scheduled',
      mileage: 45230,
      cost: '120 TND',
      technician: 'Hichem Mechichi',
      priority: 'medium',
    },
    {
      id: '2',
      vehicle: 'Honda Accord (167 TU 2389)',
      type: 'Freins',
      description: 'Inspection système de freinage complet et remplacement plaquettes',
      scheduledDate: '2026-02-16',
      completedDate: null,
      status: 'in-progress',
      mileage: 58920,
      cost: '450 TND',
      technician: 'Salah Gharbi',
      priority: 'high',
    },
    {
      id: '3',
      vehicle: 'Ford F-150 (234 TU 8912)',
      type: 'Permutation Pneus',
      description: 'Rotation des pneus et parallélisme',
      scheduledDate: '2026-02-10',
      completedDate: '2026-02-10',
      status: 'completed',
      mileage: 12450,
      cost: '150 TND',
      technician: 'Hichem Mechichi',
      priority: 'low',
    },
    {
      id: '4',
      vehicle: 'Chevrolet Malibu (156 TU 3421)',
      type: 'Diagnostic Moteur',
      description: 'Diagnostic voyant moteur et réparation',
      scheduledDate: '2026-02-15',
      completedDate: '2026-02-15',
      status: 'completed',
      mileage: 32100,
      cost: '380 TND',
      technician: 'Youssef Mechanic',
      priority: 'high',
    },
    {
      id: '5',
      vehicle: 'Tesla Model 3 (189 TU 6754)',
      type: 'Contrôle Batterie',
      description: 'Inspection santé batterie et mise à jour logicielle',
      scheduledDate: '2026-02-12',
      completedDate: '2026-02-12',
      status: 'completed',
      mileage: 8750,
      cost: '0 TND',
      technician: 'Tesla Service',
      priority: 'medium',
    },
    {
      id: '6',
      vehicle: 'Toyota Camry (123 TU 4567)',
      type: 'Visite Technique',
      description: 'Contrôle technique annuel',
      scheduledDate: '2026-02-25',
      completedDate: null,
      status: 'scheduled',
      mileage: 45230,
      cost: '60 TND',
      technician: 'TBD',
      priority: 'high',
    },
  ];

  const filteredRecords = maintenanceRecords.filter((record) => {
    const matchesSearch = `${record.vehicle} ${record.type} ${record.description}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'warning';
      case 'scheduled':
        return 'info';
      case 'overdue':
        return 'error';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maintenance</h1>
            <p className="text-gray-600 mt-1">Manage vehicle maintenance</p>
          </div>
          <Button>
            <FiPlus className="mr-2" />
            Schedule Maintenance
          </Button>
        </div>

        {/* Search and Filters */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search maintenance records..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </Card>

        {/* Maintenance Records */}
        <div className="grid gap-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} padding="lg">
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Main Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{record.type}</h3>
                        <Badge variant={getStatusColor(record.status)}>{record.status}</Badge>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getPriorityColor(record.priority)}`}>
                          {record.priority} priority
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{record.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FiTruck className="mr-2 flex-shrink-0" />
                      <span className="truncate">{record.vehicle}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiCalendar className="mr-2 flex-shrink-0" />
                      <span>{record.scheduledDate}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiTool className="mr-2 flex-shrink-0" />
                      <span>{record.technician}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <FiDollarSign className="mr-2 flex-shrink-0" />
                      <span>{record.cost}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Mileage: {record.mileage.toLocaleString()} km</span>
                    {record.completedDate && (
                      <span>Completed: {record.completedDate}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex lg:flex-col gap-2">
                  <Button variant="outline" size="sm" className="flex-1 lg:flex-none">
                    View Details
                  </Button>
                  {record.status !== 'completed' && (
                    <Button variant="outline" size="sm" className="flex-1 lg:flex-none">
                      Update Status
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredRecords.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <p className="text-gray-500">No maintenance records found</p>
            </div>
          </Card>
        )}

        {/* Upcoming Maintenance Alert */}
        <Card>
          <div className="flex items-start gap-3 text-amber-800 bg-amber-50 p-4 rounded-lg">
            <FiAlertCircle className="flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">Upcoming Maintenance</h4>
              <p className="text-sm">2 vehicles have maintenance scheduled within the next 7 days.</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Maintenance;
