import { useState, useMemo, useCallback } from 'react';

/**
 * Custom hook for handling search functionality
 * @template T - The type of items being searched
 * @param items - Array of items to search through
 * @param searchFields - Function that returns searchable string from an item
 * @returns Object containing search query, filtered items, and setter
 */
export function useSearch<T>(
  items: T[],
  searchFields: (item: T) => string
) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) {
      return items;
    }

    const query = searchQuery.toLowerCase();
    return items.filter((item) =>
      searchFields(item).toLowerCase().includes(query)
    );
  }, [items, searchQuery, searchFields]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    filteredItems,
  };
}
