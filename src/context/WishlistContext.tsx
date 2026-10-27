// Shared state (Seif Elshimy): the wishlist.
// Product details adds to it and the Wishlist tab reads it, so it lives
// above both screens in a Context (same pattern as Lab 02's favourites).

import { createContext, PropsWithChildren, useContext, useState } from 'react';

type WishlistValue = {
  wishlistIds: string[];
  toggleWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
};

const WishlistContext = createContext<WishlistValue | null>(null);

export function WishlistProvider({ children }: PropsWithChildren) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);

  // Add the id if it is missing, remove it if it is already saved.
  // Always build a new array so React notices the change.
  const toggleWishlist = (id: string) =>
    setWishlistIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );

  const isInWishlist = (id: string) => wishlistIds.includes(id);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isInWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const value = useContext(WishlistContext);
  if (!value) throw new Error('useWishlist must be inside WishlistProvider');
  return value;
}