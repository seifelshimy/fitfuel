// ViewModel for the Home screen (Ahmed Mohamed).
// Loads the catalog and prepares exactly what the screen shows.

import { useMemo } from 'react';
import { CATEGORIES, Category, Product } from '@/models/product';
import { productRepository } from '@/services/productService';
import { useAsyncData } from './useAsyncData';

export interface CategorySection {
  id: Category;
  label: string;
  products: Product[];
}

export function useHomeViewModel() {
  const catalog = useAsyncData(() => productRepository.getAll(), []);
  const products = catalog.data ?? [];

  const featured = useMemo(() => products.filter((p) => p.featured && p.inStock), [products]);

  const sections: CategorySection[] = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        id: c.id,
        label: c.label,
        products: products.filter((p) => p.category === c.id),
      })).filter((s) => s.products.length > 0),
    [products],
  );

  return {
    status: catalog.status,
    error: catalog.error,
    refreshing: catalog.refreshing,
    isEmpty: catalog.status === 'success' && products.length === 0,
    categories: CATEGORIES,
    featured,
    sections,
    retry: catalog.reload,
    refresh: catalog.refresh,
  };
}
