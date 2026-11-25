import { useEffect, useState } from "react";

export const SEARCH_DEBOUNCE_MS = 300;

export function useDebouncedSearchQuery(value: string): [query: string, isSearching: boolean] {
  const query = value.trim().toLowerCase();
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    if (!query) {
      setDebouncedQuery("");
      return;
    }

    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return [query ? debouncedQuery : "", Boolean(query && query !== debouncedQuery)];
}
