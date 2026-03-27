import { memo } from 'react';
import { FiTruck, FiCalendar, FiTool, FiDollarSign} from 'react-icons/fi';
import { Badge } from '../../../shared/components';
import type { Maintenance } from '../../../types';
import { maintenanceService } from '../services/maintenance.service';
interface MaintenanceTableProps {
  data: Maintenance[];
}

const MaintenanceTable = memo(({ data }: MaintenanceTableProps) => {
  const records = data ?? [];

  type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'default';

  const getStatusColor = (status: string): BadgeVariant => {
    const normalized = String(status).replace(/_/g, '-');
    switch (normalized) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'info';
      case 'scheduled':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getPriorityColor = (priority: string): BadgeVariant => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'default';
    }
  };
  const handleUpdateStatus = async (id: string) => {
    try {
      const updatedRecord = await maintenanceService.updateStatus(id, 'completed');
      console.log('Status updated:', updatedRecord);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  return (
    <div className="space-y-4">
  
      {/* Maintenance Cards Grid */}
      <div className="space-y-4">
        {records.map((record: Maintenance) => (
          <div
            key={record.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              {/* Type heading */}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {record.type}
                </h3>
                <div className="flex gap-2">
                  <Badge variant={getStatusColor(record.status)}>
                    {record.status}
                  </Badge>
                  <Badge variant={getPriorityColor(record.priority)}>
                    {record.priority} priority
                  </Badge>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 ml-4">
                <button className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                  View Details
                </button>
                <button  onClick={() => handleUpdateStatus(record.id)} className="px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                  Update Status
                </button>
              </div>
            </div>

            {/* 4-column info grid */}
            <div className="grid grid-cols-4 gap-6 mb-3">
              <div className="flex items-center">
                <FiTruck className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Vehicle</p>
                  <p className="text-sm font-medium text-gray-900">{record.vehicle || '—'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FiCalendar className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Scheduled Date</p>
                  <p className="text-sm font-medium text-gray-900">{record.scheduledDate}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FiTool className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Technician</p>
                  <p className="text-sm font-medium text-gray-900">{record.technician || 'TBD'}</p>
                </div>
              </div>
              <div className="flex items-center">
                <FiDollarSign className="text-gray-400 mr-3" />
                <div>
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="text-sm font-medium text-gray-900">{record.cost}</p>
                </div>
              </div>
            </div>

            {/* Additional info */}
            <div className="flex gap-4 text-xs text-gray-500">
              <span>Mileage: {record.mileage || 'N/A'}</span>
              {record.completedDate && (
                <span>Completed: {record.completedDate}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});



export default MaintenanceTable;
