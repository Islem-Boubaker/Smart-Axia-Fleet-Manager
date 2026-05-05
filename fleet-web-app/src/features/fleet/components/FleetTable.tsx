import { memo } from 'react';
import { AppDataTable, AppTd, AppTr } from '../../../shared/components';

interface FleetTableProps {
  data: any[];
  dark?: boolean;
}

const FleetTable = memo(({ data, dark = false }: FleetTableProps) => {
  return (
    <AppDataTable
      columns={['Name', 'Description', 'Vehicles', 'Actions']}
      totalResults={data.length}
      dark={dark}
      ariaLabel="Fleet table"
      title="Fleet"
    >
      {data.map((item) => (
        <AppTr key={item.id}>
          <AppTd className={dark ? 'text-slate-100' : 'text-slate-950'}>{item.name}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-700'}>{item.description}</AppTd>
          <AppTd className={dark ? 'text-slate-300' : 'text-slate-700'}>{item.vehicleCount}</AppTd>
          <AppTd>
            <button className="rounded-full px-3 py-1.5 text-sm font-bold text-sky-600 transition-colors hover:bg-white/70 hover:text-sky-700 dark:text-cyan-200 dark:hover:bg-cyan-300/10">
              Edit
            </button>
          </AppTd>
        </AppTr>
      ))}
    </AppDataTable>
  );
});

FleetTable.displayName = 'FleetTable';

export default FleetTable;
