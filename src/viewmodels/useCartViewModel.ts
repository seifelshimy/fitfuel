// Cart screen ViewModel: the shared cart plus the promo code input state.

import { useCallback, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { FREE_DELIVERY_THRESHOLD } from '@/utils/cartPricing';

const MAX_PROMO_LENGTH = 20;

export function useCartViewModel() {
  const cart = useCart();
  const [promoInput, setPromoInputState] = useState('');

  const setPromoInput = useCallback((text: string) => {
    setPromoInputState(text.replace(/\s/g, '').toUpperCase().slice(0, MAX_PROMO_LENGTH));
  }, []);

  const submitPromo = useCallback(() => {
    if (cart.applyPromo(promoInput)) {
      setPromoInputState('');
    }
  }, [cart, promoInput]);

  const clearPromo = useCallback(() => {
    setPromoInputState('');
    cart.removePromo();
  }, [cart]);

  return {
    ...cart,
    isEmpty: !cart.isLoading && cart.items.length === 0,
    amountToFreeDelivery: Math.max(0, FREE_DELIVERY_THRESHOLD - cart.totals.subtotal),
    promoInput,
    setPromoInput,
    submitPromo,
    clearPromo,
  };
}
