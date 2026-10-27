// Pure functions for searching, filtering and validating.
// They have no React or network code, so they are easy to unit test in Phase 2.

import { Product, ProductFilters, startingPrice } from '@/models/product';

export const MAX_QUERY_LENGTH = 50;
export const MAX_PRICE = 100000;

/** Applies every active filter, then sorts the result. */
export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const query = filters.query.trim().toLowerCase();

  const matches = products.filter((p) => {
    if (query && !p.name.toLowerCase().includes(query) && !p.brand.toLowerCase().includes(query)) {
      return false;
    }
    if (filters.category && p.category !== filters.category) return false;
    if (filters.goal && !p.goals.includes(filters.goal)) return false;
    if (filters.flavor && !p.flavors.includes(filters.flavor)) return false;
    const price = startingPrice(p);
    if (filters.minPrice !== null && price < filters.minPrice) return false;
    if (filters.maxPrice !== null && price > filters.maxPrice) return false;
    return true;
  });

  switch (filters.sort) {
    case 'price-asc':
      return matches.sort((a, b) => startingPrice(a) - startingPrice(b));
    case 'price-desc':
      return matches.sort((a, b) => startingPrice(b) - startingPrice(a));
    case 'rating':
      return matches.sort((a, b) => b.rating - a.rating);
    default:
      return matches;
  }
}

/** Every flavor in the catalog, alphabetically, without duplicates. */
export function availableFlavors(products: Product[]): string[] {
  return Array.from(new Set(products.flatMap((p) => p.flavors))).sort();
}

/** Number of filters the user has turned on (search text and sort not counted). */
export function countActiveFilters(filters: ProductFilters): number {
  return [filters.category, filters.goal, filters.flavor, filters.minPrice, filters.maxPrice].filter(
    (v) => v !== null,
  ).length;
}

export interface PriceRangeResult {
  min: number | null;
  max: number | null;
  error: string | null;
}

/**
 * Validates the min/max price fields from the filter form.
 * Empty fields mean "no limit".
 */
export function validatePriceRange(minText: string, maxText: string): PriceRangeResult {
  const parse = (text: string, label: string): { value: number | null; error: string | null } => {
    const trimmed = text.trim();
    if (trimmed === '') return { value: null, error: null };
    if (!/^\d+$/.test(trimmed)) return { value: null, error: `${label} price must be a whole number.` };
    const value = Number(trimmed);
    if (value > MAX_PRICE) return { value: null, error: `${label} price can't be more than ${MAX_PRICE.toLocaleString('en-US')}.` };
    return { value, error: null };
  };

  const min = parse(minText, 'Minimum');
  if (min.error) return { min: null, max: null, error: min.error };
  const max = parse(maxText, 'Maximum');
  if (max.error) return { min: null, max: null, error: max.error };

  if (min.value !== null && max.value !== null && min.value > max.value) {
    return { min: null, max: null, error: 'Minimum price must be less than maximum price.' };
  }
  return { min: min.value, max: max.value, error: null };
}

/** Validates the search box text. Returns an error message or null. */
export function validateQuery(query: string): string | null {
  if (query.length > MAX_QUERY_LENGTH) return `Search can be at most ${MAX_QUERY_LENGTH} characters.`;
  if (/[<>{}]/.test(query)) return 'Search contains characters that are not allowed.';
  return null;
}
