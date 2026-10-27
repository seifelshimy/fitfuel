// Pure cart pricing rules: quantity limits, promo codes, delivery fee and totals.
// Kept free of React and storage so they can be unit tested directly.

import type { CartItem, CartTotals, PromoCodeRule } from '@/models/order';

export const PROMO_CODES: Record<string, PromoCodeRule> = {
  FITFUEL10: {
    code: 'FITFUEL10',
    discountPercent: 10,
    minSubtotal: 500,
    isActive: true,
    description: '10% off orders from EGP 500',
  },
  GAINZ20: {
    code: 'GAINZ20',
    discountPercent: 20,
    minSubtotal: 1500,
    isActive: true,
    description: '20% off orders from EGP 1,500',
  },
  EXPIRED50: {
    code: 'EXPIRED50',
    discountPercent: 50,
    minSubtotal: 200,
    isActive: false,
    description: 'Expired launch offer',
  },
};

export const STANDARD_DELIVERY_FEE = 50;
export const FREE_DELIVERY_THRESHOLD = 2000;

/** Keeps a quantity between 1 and the available stock (and returns 0 when out of stock). */
export function clampQuantity(quantity: number, stock: number): number {
  const safeStock = Number.isFinite(stock) ? Math.max(0, Math.floor(stock)) : 0;
  if (safeStock === 0) {
    return 0;
  }
  const safeQuantity = Number.isFinite(quantity) ? Math.floor(quantity) : 1;
  return Math.min(Math.max(safeQuantity, 1), safeStock);
}

export function validatePromoCode(
  rawCode: string,
  subtotal: number,
): { valid: boolean; rule?: PromoCodeRule; error?: string } {
  const code = rawCode.trim().toUpperCase();

  if (code.length === 0) {
    return { valid: false, error: 'Enter a promo code.' };
  }

  if (!/^[A-Z0-9]{3,20}$/.test(code)) {
    return { valid: false, error: 'Promo codes use 3–20 letters or numbers only.' };
  }

  const rule = PROMO_CODES[code];
  if (!rule) {
    return { valid: false, error: `"${code}" is not a valid promo code.` };
  }

  if (!rule.isActive) {
    return { valid: false, rule, error: `"${code}" has expired.` };
  }

  if (subtotal < rule.minSubtotal) {
    return {
      valid: false,
      rule,
      error: `"${code}" needs a subtotal of at least EGP ${rule.minSubtotal.toLocaleString('en-US')}.`,
    };
  }

  return { valid: true, rule };
}

export function calculateCartTotals(items: CartItem[], promoCode?: string | null): CartTotals {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;
  let appliedPromoCode: string | null = null;

  if (promoCode) {
    const result = validatePromoCode(promoCode, subtotal);
    if (result.valid && result.rule) {
      discountAmount = Math.round((subtotal * result.rule.discountPercent) / 100);
      appliedPromoCode = result.rule.code;
    }
  }

  // Free delivery is based on the subtotal before discount; an empty cart has no fee.
  const deliveryFee = subtotal === 0 || subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : STANDARD_DELIVERY_FEE;
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  return { subtotal, discountAmount, deliveryFee, total, appliedPromoCode };
}
