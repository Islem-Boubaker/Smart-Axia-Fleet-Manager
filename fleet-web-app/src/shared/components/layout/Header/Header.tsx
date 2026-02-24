import { memo } from 'react';
import { FiMenu } from 'react-icons/fi';
import type { HeaderProps } from '../../types/types';
import { HeaderSearch } from './HeaderSearch';
import { HeaderNotifications } from './HeaderNotifications';
import  HeaderUser from '../../ui/UserAvatar';

export const Header = memo(({ toggleSidebar }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-4">

        {/* Left */}
        <div className="flex items-center space-x-4 flex-1">
          <button
            onClick={toggleSidebar}
            className="text-gray-500 hover:text-gray-700 lg:hidden"
          >
            <FiMenu className="text-2xl" />
          </button>

          <HeaderSearch />
        </div>

        {/* Right */}
        <div className="flex items-center space-x-4">
          <HeaderNotifications />
          <HeaderUser />
        </div>

      </div>
    </header>
  );
});