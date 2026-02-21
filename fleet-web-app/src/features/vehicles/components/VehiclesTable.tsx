import { memo } from 'react';
import { Badge } from '../../../shared/components';
import { FiTruck, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface VehiclesTableProps {
  data: any[];
  onEdit?: (vehicle: any) => void;
  onDelete?: (id: string) => void;
}

const VehiclesTable = memo(({ data, onEdit, onDelete }: VehiclesTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Vehicle
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              License Plate
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Mileage
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fuel Type
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((vehicle) => (
            <tr key={vehicle.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FiTruck className="text-blue-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-500">{vehicle.year}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {vehicle.licensePlate}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={vehicle.status === 'active' ? 'success' : 'warning'}>
                  {vehicle.status}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {vehicle.mileage?.toLocaleString()} km
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {vehicle.fuelType}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  onClick={() => onEdit?.(vehicle)}
                  className="text-blue-600 hover:text-blue-900 mr-3"
                >
                  <FiEdit2 />
                </button>
                <button
                  onClick={() => onDelete?.(vehicle.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  <FiTrash2 />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

VehiclesTable.displayName = 'VehiclesTable';

export default VehiclesTable;
