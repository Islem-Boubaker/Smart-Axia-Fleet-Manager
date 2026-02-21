import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for handling filter functionality
 * @template T - The type of items being filtered
 * @param items - Array of items to filter
 * @param filterFn - Function that determines if an item matches the filter
 * @returns Object containing filter state and filtered items
 */
export function useFilter<T>(
  items: T[],
  filterFn: (item: T, filterValue: string) => boolean
) {
  const [filterValue, setFilterValue] = useState<string>('all');

  const filteredItems = useMemo(() => {
    if (filterValue === 'all') {
      return items;
    }
    return items.filter((item) => filterFn(item, filterValue));
  }, [items, filterValue, filterFn]);

  const handleFilterChange = useCallback((value: string) => {
    setFilterValue(value);
  }, []);

  return {
    filterValue,
    setFilterValue: handleFilterChange,
    filteredItems,
  };
}
