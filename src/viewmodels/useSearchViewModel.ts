// ViewModel for the Search & filter screen (Ahmed Mohamed).
// Keeps the search text, the filter form and the applied filters,
// validates input and returns the matching products.

import { useEffect, useMemo, useState } from 'react';
import { Category, EMPTY_FILTERS, Goal, ProductFilters, SortOption } from '@/models/product';
import { productRepository } from '@/services/productService';
import {
  availableFlavors,
  countActiveFilters,
  filterProducts,
  validatePriceRange,
  validateQuery,
} from '@/utils/productFilters';
import { useAsyncData } from './useAsyncData';

const SEARCH_DEBOUNCE_MS = 300;

/** The filter form the user edits before pressing "Apply". */
export interface FilterDraft {
  category: Category | null;
  goal: Goal | null;
  flavor: string | null;
  minPrice: string;
  maxPrice: string;
  sort: SortOption;
}

function draftFrom(filters: ProductFilters): FilterDraft {
  return {
    category: filters.category,
    goal: filters.goal,
    flavor: filters.flavor,
    minPrice: filters.minPrice?.toString() ?? '',
    maxPrice: filters.maxPrice?.toString() ?? '',
    sort: filters.sort,
  };
}

export function useSearchViewModel(initialCategory: Category | null) {
  const catalog = useAsyncData(() => productRepository.getAll(), []);
  const products = catalog.data ?? [];

  const [queryText, setQueryText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [filters, setFilters] = useState<ProductFilters>({ ...EMPTY_FILTERS, category: initialCategory });
  const [draft, setDraft] = useState<FilterDraft>(draftFrom(filters));
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [priceError, setPriceError] = useState<string | null>(null);

  // A category tapped on the Home screen arrives as a route parameter.
  useEffect(() => {
    setFilters((f) => ({ ...f, category: initialCategory }));
  }, [initialCategory]);

  // Wait until the user stops typing before filtering.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(queryText), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [queryText]);

  const queryError = validateQuery(queryText);

  const results = useMemo(() => {
    if (validateQuery(debouncedQuery)) return [];
    return filterProducts(products, { ...filters, query: debouncedQuery });
  }, [products, filters, debouncedQuery]);

  const flavors = useMemo(() => availableFlavors(products), [products]);

  const openFilters = () => {
    setDraft(draftFrom(filters));
    setPriceError(null);
    setFiltersOpen(true);
  };

  const updateDraft = (changes: Partial<FilterDraft>) => {
    setDraft((d) => ({ ...d, ...changes }));
    if ('minPrice' in changes || 'maxPrice' in changes) setPriceError(null);
  };

  /** Validates the form; only closes the panel when the input is valid. */
  const applyFilters = () => {
    const price = validatePriceRange(draft.minPrice, draft.maxPrice);
    if (price.error) {
      setPriceError(price.error);
      return;
    }
    setFilters((f) => ({
      ...f,
      category: draft.category,
      goal: draft.goal,
      flavor: draft.flavor,
      minPrice: price.min,
      maxPrice: price.max,
      sort: draft.sort,
    }));
    setFiltersOpen(false);
  };

  const resetDraft = () => {
    setDraft(draftFrom(EMPTY_FILTERS));
    setPriceError(null);
  };

  const clearAll = () => {
    setQueryText('');
    setDebouncedQuery('');
    setFilters(EMPTY_FILTERS);
  };

  const removeFilter = (key: keyof ProductFilters) => {
    setFilters((f) => ({ ...f, [key]: key === 'sort' ? 'relevance' : null }));
  };

  const hasCriteria = debouncedQuery.trim() !== '' || countActiveFilters(filters) > 0;

  return {
    status: catalog.status,
    error: catalog.error,
    retry: catalog.reload,
    queryText,
    setQueryText,
    queryError,
    isTyping: queryText !== debouncedQuery,
    results,
    filters,
    activeFilterCount: countActiveFilters(filters),
    hasCriteria,
    flavors,
    filtersOpen,
    openFilters,
    closeFilters: () => setFiltersOpen(false),
    draft,
    updateDraft,
    priceError,
    applyFilters,
    resetDraft,
    clearAll,
    removeFilter,
  };
}
