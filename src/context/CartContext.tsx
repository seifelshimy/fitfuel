// Shares the cart, the applied promo code and the calculated totals with
// every screen (Cart, Checkout, the tab badge, and later Product details).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CartItem, CartTotals, PromoCodeRule } from '@/models/order';
import { PROMO_CODES, calculateCartTotals, clampQuantity, validatePromoCode } from '@/utils/cartPricing';
import {
  clearStoredCart,
  getStoredCartItems,
  getStoredPromoCode,
  restoreSampleCartItems,
  saveCartItems,
  savePromoCode,
} from '@/services/cartService';

export type NewCartItem = Omit<CartItem, 'quantity'> & { quantity?: number };

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totals: CartTotals;
  appliedPromo: PromoCodeRule | null;
  promoError: string | null;
  isLoading: boolean;
  error: string | null;
  addItem: (item: NewCartItem) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  applyPromo: (code: string) => boolean;
  removePromo: () => void;
  clearCart: () => Promise<void>;
  reloadCart: () => Promise<void>;
  restoreSampleItems: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mutations read the latest items from here so rapid taps never use stale state.
  const itemsRef = useRef<CartItem[]>([]);

  const commitItems = useCallback((next: CartItem[]) => {
    itemsRef.current = next;
    setItems(next);
    saveCartItems(next).catch((saveError: unknown) => {
      setError(errorMessage(saveError, 'We couldn’t save your cart changes.'));
    });
  }, []);

  const reloadCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [storedItems, storedPromo] = await Promise.all([getStoredCartItems(), getStoredPromoCode()]);
      itemsRef.current = storedItems;
      setItems(storedItems);
      setPromoCode(storedPromo);
      setApplyError(null);
    } catch (loadError) {
      setError(errorMessage(loadError, 'We couldn’t load your cart.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadCart();
  }, [reloadCart]);

  const addItem = useCallback(
    (item: NewCartItem) => {
      const current = itemsRef.current;
      const existing = current.find((entry) => entry.id === item.id);
      const requested = (existing?.quantity ?? 0) + (item.quantity ?? 1);
      const quantity = clampQuantity(requested, item.stock);
      if (quantity === 0) {
        return;
      }
      const next = existing
        ? current.map((entry) => (entry.id === item.id ? { ...entry, quantity } : entry))
        : [...current, { ...item, quantity }];
      commitItems(next);
    },
    [commitItems],
  );

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      const current = itemsRef.current;
      const target = current.find((entry) => entry.id === itemId);
      if (!target) {
        return;
      }
      const clamped = clampQuantity(quantity, target.stock);
      const next =
        clamped === 0
          ? current.filter((entry) => entry.id !== itemId)
          : current.map((entry) => (entry.id === itemId ? { ...entry, quantity: clamped } : entry));
      commitItems(next);
    },
    [commitItems],
  );

  const removeItem = useCallback(
    (itemId: string) => {
      commitItems(itemsRef.current.filter((entry) => entry.id !== itemId));
    },
    [commitItems],
  );

  const totals = useMemo(() => calculateCartTotals(items, promoCode), [items, promoCode]);

  const applyPromo = useCallback(
    (code: string) => {
      const result = validatePromoCode(code, calculateCartTotals(itemsRef.current).subtotal);
      if (!result.valid || !result.rule) {
        setApplyError(result.error ?? 'That promo code can’t be applied.');
        return false;
      }
      setApplyError(null);
      setPromoCode(result.rule.code);
      savePromoCode(result.rule.code).catch((saveError: unknown) => {
        setError(errorMessage(saveError, 'We couldn’t save your promo code.'));
      });
      return true;
    },
    [],
  );

  const removePromo = useCallback(() => {
    setApplyError(null);
    setPromoCode(null);
    savePromoCode(null).catch((saveError: unknown) => {
      setError(errorMessage(saveError, 'We couldn’t remove your promo code.'));
    });
  }, []);

  const clearCart = useCallback(async () => {
    itemsRef.current = [];
    setItems([]);
    setPromoCode(null);
    setApplyError(null);
    try {
      await clearStoredCart();
    } catch (clearError) {
      setError(errorMessage(clearError, 'We couldn’t clear your cart.'));
    }
  }, []);

  const restoreSampleItems = useCallback(async () => {
    setError(null);
    try {
      const restored = await restoreSampleCartItems();
      itemsRef.current = restored;
      setItems(restored);
    } catch (restoreError) {
      setError(errorMessage(restoreError, 'We couldn’t restore the sample items.'));
    }
  }, []);

  // A code that was valid can stop applying when the cart shrinks below its minimum.
  const appliedPromo = totals.appliedPromoCode ? PROMO_CODES[totals.appliedPromoCode] ?? null : null;
  const lapsedPromoError =
    promoCode && !totals.appliedPromoCode && items.length > 0
      ? validatePromoCode(promoCode, totals.subtotal).error ?? null
      : null;
  const promoError = applyError ?? lapsedPromoError;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      totals,
      appliedPromo,
      promoError,
      isLoading,
      error,
      addItem,
      updateQuantity,
      removeItem,
      applyPromo,
      removePromo,
      clearCart,
      reloadCart,
      restoreSampleItems,
    }),
    [
      items,
      itemCount,
      totals,
      appliedPromo,
      promoError,
      isLoading,
      error,
      addItem,
      updateQuantity,
      removeItem,
      applyPromo,
      removePromo,
      clearCart,
      reloadCart,
      restoreSampleItems,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside <CartProvider>.');
  }
  return context;
}
