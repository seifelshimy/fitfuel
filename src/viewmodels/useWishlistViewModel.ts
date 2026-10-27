// ViewModel for the Wishlist screen (Seif Elshimy).
// Turns the saved ids from WishlistContext into full products for the screen.

import { useMemo } from 'react';
import { useWishlist } from '@/context/WishlistContext';
import { Product } from '@/models/product';
import { productRepository } from '@/services/productService';
import { useAsyncData } from './useAsyncData';
import { useRefreshOnFocus } from './useRefreshOnFocus';

export function useWishlistViewModel() {
  const { wishlistIds, toggleWishlist } = useWishlist();
  const catalog = useAsyncData(() => productRepository.getAll(), []);
  useRefreshOnFocus(catalog.refresh); // drop products the Admin deleted

  // Keep the order the user saved them in, and skip ids that no longer exist.
  const items = useMemo(() => {
    const products = catalog.data ?? [];
    return wishlistIds
      .map((id) => products.find((p) => p.id === id))
      .filter((p): p is Product => p !== undefined);
  }, [catalog.data, wishlistIds]);

  const count = items.length;

  return {
    status: catalog.status,
    error: catalog.error,
    retry: catalog.reload,
    items,
    countLabel: `${count} ${count === 1 ? 'product' : 'products'} saved`,
    remove: toggleWishlist,
  };
}