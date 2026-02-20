import { memo } from 'react';
import { FiMail, FiPhone, FiEdit2, FiTrash2, FiUser } from 'react-icons/fi';
import { Badge } from '../../../shared/components';

interface DriverCardProps {
  driver: any;
  onEdit?: (driver: any) => void;
  onDelete?: (id: string) => void;
}

const DriverCard = memo(({ driver, onEdit, onDelete }: DriverCardProps) => {
  return (
    <div className="space-y-4">
      {/* Header with avatar and rating */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
            <FiUser className="text-white text-2xl" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{driver.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-sm font-medium bg-yellow-100 text-yellow-800">
                ⭐ {driver.rating || '4.8'}
              </span>
            </div>
          </div>
        </div>
        <Badge variant={driver.status === 'active' ? 'success' : 'default'}>
          {driver.status}
        </Badge>
      </div>

      {/* Contact Information */}
      <div className="space-y-2">
        <div className="flex items-center text-gray-600">
          <FiMail className="mr-2 text-gray-400" />
          <span className="text-sm">{driver.email}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <FiPhone className="mr-2 text-gray-400" />
          <span className="text-sm">{driver.phone}</span>
        </div>
      </div>

      {/* Details Section with border */}
      <div className="pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 block">License</span>
            <span className="font-medium text-gray-900">{driver.licenseNumber}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Expires</span>
            <span className="font-medium text-gray-900">
              {driver.licenseExpiry || '2026-12-31'}
            </span>
          </div>
          <div>
            <span className="text-gray-500 block">Total Trips</span>
            <span className="font-medium text-gray-900">{driver.totalTrips || '142'}</span>
          </div>
          <div>
            <span className="text-gray-500 block">Vehicle</span>
            <span className="font-medium text-gray-900">
              {driver.assignedVehicle || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t border-gray-200 pt-4">
        <button
          onClick={() => onEdit?.(driver)}
          className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <FiEdit2 />
          Edit
        </button>
        <button
          onClick={() => onDelete?.(driver.id)}
          className="flex-1 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
        >
          <FiTrash2 />
          Delete
        </button>
      </div>
    </div>
  );
});

DriverCard.displayName = 'DriverCard';

export default DriverCard;
