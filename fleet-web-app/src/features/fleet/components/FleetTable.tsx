import { memo } from 'react';

interface FleetTableProps {
  data: any[];
  dark?: boolean;
}

const FleetTable = memo(({ data, dark = false }: FleetTableProps) => {
  return (
    <div className="overflow-x-auto rounded-xl">
      <table className={`min-w-full divide-y ${dark ? 'divide-slate-700' : 'divide-gray-200'}`}>
        <thead className={dark ? 'bg-slate-800/60' : 'bg-gray-50'}>
          <tr>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Name
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Description
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Vehicles
            </th>
            <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Actions
            </th>
          </tr>
        </thead>
        <tbody className={`${dark ? 'bg-slate-900/30 divide-slate-800 text-slate-200' : 'bg-white divide-gray-200 text-slate-800'} divide-y`}>
          {data.map((item) => (
            <tr key={item.id} className={dark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50'}>
              <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.description}</td>
              <td className="px-6 py-4 whitespace-nowrap">{item.vehicleCount}</td>
              <td className="px-6 py-4 whitespace-nowrap">
                <button className="text-blue-600 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200 font-medium">Edit</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

FleetTable.displayName = 'FleetTable';

export default FleetTable;
