import type { ReactNode } from 'react';

interface DataTableProps {
  columns: string[];
  children: ReactNode;
  totalResults: number;
  dark?: boolean;
}

interface TdProps {
  children: ReactNode;
  className?: string;
}

interface TrProps {
  children: ReactNode;
}

const DataTable = ({ columns, children, totalResults, dark = false }: DataTableProps) => {
  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        dark ? 'border-slate-700/80 bg-slate-900/40' : 'border-slate-200/90 bg-white/90 shadow-glass'
      }`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm" role="table" aria-label="Vehicles table">
          <thead>
            <tr className={dark ? 'bg-slate-800/60' : 'bg-slate-100/90'}>
              {columns.map((column) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider ${
                    dark ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={dark ? 'divide-y divide-slate-800' : 'divide-y divide-slate-200'}>{children}</tbody>
        </table>
      </div>

      <div
        className={`flex items-center justify-between border-t px-5 py-3 text-xs ${
          dark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <span>Showing {totalResults} result{totalResults === 1 ? '' : 's'}</span>
      </div>
    </div>
  );
};

export const Td = ({ children, className = '' }: TdProps) => (
  <td className={`px-5 py-3.5 align-middle ${className}`}>{children}</td>
);

export const Tr = ({ children }: TrProps) => (
  <tr className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/45">{children}</tr>
);

export default DataTable;
