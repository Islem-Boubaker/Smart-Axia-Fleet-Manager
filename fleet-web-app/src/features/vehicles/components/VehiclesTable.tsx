import { memo } from 'react';
import { Badge } from '../../../shared/components';
import { FiTruck, FiEdit2, FiTrash2 } from 'react-icons/fi';
import type { Vehicle } from '../../../types';

interface VehiclesTableProps {
  data: Vehicle[];
  onEdit?: (vehicle: Vehicle) => void;
  onDelete?: (id: string) => void;
}

const VehiclesTable = memo(({ data, onEdit, onDelete }: VehiclesTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
        <thead className="bg-gray-50 dark:bg-slate-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Vehicle</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Plaque</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Mileage</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-700">
          {data.map((vehicle) => (
            <tr key={vehicle.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FiTruck className="text-blue-600 mr-2" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-slate-100">{vehicle.name}</div>
                    <div className="text-sm text-gray-500 dark:text-slate-400">{vehicle.Vehicle_Model}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-slate-100">
                {vehicle.plaque_immatriculation || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <Badge variant={vehicle.Active ? 'success' : 'default'}>
                  {vehicle.Active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                {vehicle.Mileage?.toLocaleString()} km
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400 capitalize">
                {vehicle.type}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onClick={() => onEdit?.(vehicle)} className="text-blue-600 hover:text-blue-900 mr-3">
                  <FiEdit2 />
                </button>
                <button onClick={() => onDelete?.(vehicle.id)} className="text-red-600 hover:text-red-900">
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
