import { memo } from 'react';
import { FiSearch } from 'react-icons/fi';

export const HeaderSearch = memo(() => {
  return (
    <div className="hidden md:flex items-center flex-1 max-w-md">
      <div className="relative w-full">
        <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search vehicles, drivers, trips..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
});