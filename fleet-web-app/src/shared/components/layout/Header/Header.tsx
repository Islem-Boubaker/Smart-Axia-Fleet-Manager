import { memo } from 'react';
import type { HeaderProps } from '../../types/types';
import { HeaderFeatureNav } from './HeaderFeatureNav';

export const Header = memo(({ dark, setDark }: HeaderProps) => {
  return (
    <header className={`border-b sticky top-0 z-10 ${dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
      <div className="flex items-center justify-between gap-4 px-6 py-4">

        {/* Left */}
        <div className="flex items-center flex-1 min-w-0">
          <h1 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Smart AXIA Fleet</h1>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end flex-1 min-w-0">
          <HeaderFeatureNav dark={dark} setDark={setDark} />
        </div>

      </div>
    </header>
  );
});