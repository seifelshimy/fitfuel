import { describe, expect, it } from '@jest/globals';
import type { CartItem } from '@/models/order';
import {
  FREE_DELIVERY_THRESHOLD,
  PROMO_CODES,
  STANDARD_DELIVERY_FEE,
  calculateCartTotals,
  clampQuantity,
  validatePromoCode,
} from '@/utils/cartPricing';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: 'whey-choc-2lb',
    productId: 'whey',
    name: 'Gold Standard 100% Whey',
    brand: 'Optimum Nutrition',
    flavor: 'Double Rich Chocolate',
    weight: '2 lb',
    price: 1000,
    quantity: 1,
    stock: 10,
    ...overrides,
  };
}

describe('clampQuantity', () => {
  it('keeps a valid quantity unchanged', () => {
    expect(clampQuantity(3, 10)).toBe(3);
  });

  it('never goes below 1 while in stock', () => {
    expect(clampQuantity(0, 10)).toBe(1);
    expect(clampQuantity(-5, 10)).toBe(1);
  });

  it('never exceeds the available stock', () => {
    expect(clampQuantity(25, 4)).toBe(4);
  });

  it('returns 0 when the product is out of stock', () => {
    expect(clampQuantity(2, 0)).toBe(0);
  });

  it('rounds fractional quantities down and handles NaN', () => {
    expect(clampQuantity(2.9, 10)).toBe(2);
    expect(clampQuantity(Number.NaN, 10)).toBe(1);
  });
});

describe('validatePromoCode', () => {
  it('accepts FITFUEL10 at or above its EGP 500 minimum', () => {
    const result = validatePromoCode('FITFUEL10', 500);
    expect(result.valid).toBe(true);
    expect(result.rule).toEqual(PROMO_CODES.FITFUEL10);
  });

  it('is case-insensitive and trims spaces', () => {
    expect(validatePromoCode('  gainz20 ', 1500).valid).toBe(true);
  });

  it('rejects FITFUEL10 below the minimum subtotal', () => {
    const result = validatePromoCode('FITFUEL10', 499);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/at least EGP 500/);
  });

  it('accepts GAINZ20 only from EGP 1,500', () => {
    expect(validatePromoCode('GAINZ20', 1499).valid).toBe(false);
    expect(validatePromoCode('GAINZ20', 1500).valid).toBe(true);
  });

  it('rejects the inactive EXPIRED50 code even above its minimum', () => {
    const result = validatePromoCode('EXPIRED50', 10000);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/expired/);
  });

  it('rejects unknown, empty and malformed codes', () => {
    expect(validatePromoCode('FREESTUFF', 5000).error).toMatch(/not a valid promo code/);
    expect(validatePromoCode('   ', 5000).error).toBe('Enter a promo code.');
    expect(validatePromoCode('<script>', 5000).error).toMatch(/letters or numbers/);
  });
});

describe('calculateCartTotals', () => {
  it('returns zeros and no delivery fee for an empty cart', () => {
    expect(calculateCartTotals([])).toEqual({
      subtotal: 0,
      discountAmount: 0,
      deliveryFee: 0,
      total: 0,
      appliedPromoCode: null,
    });
  });

  it('uses a 50 EGP delivery fee and a 2,000 EGP free-delivery threshold', () => {
    expect(STANDARD_DELIVERY_FEE).toBe(50);
    expect(FREE_DELIVERY_THRESHOLD).toBe(2000);
  });

  it('adds price x quantity and the standard delivery fee below the threshold', () => {
    const totals = calculateCartTotals([makeItem({ price: 400, quantity: 2 }), makeItem({ id: 'b', price: 150 })]);
    expect(totals.subtotal).toBe(950);
    expect(totals.deliveryFee).toBe(STANDARD_DELIVERY_FEE);
    expect(totals.total).toBe(950 + STANDARD_DELIVERY_FEE);
  });

  it('gives free delivery at exactly the EGP 2,000 threshold', () => {
    const totals = calculateCartTotals([makeItem({ price: FREE_DELIVERY_THRESHOLD })]);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.total).toBe(2000);
  });

  it('charges delivery just under the threshold', () => {
    expect(calculateCartTotals([makeItem({ price: 1999 })]).deliveryFee).toBe(STANDARD_DELIVERY_FEE);
  });

  it('applies a 10% FITFUEL10 discount', () => {
    const totals = calculateCartTotals([makeItem({ price: 1000 })], 'FITFUEL10');
    expect(totals.discountAmount).toBe(100);
    expect(totals.appliedPromoCode).toBe('FITFUEL10');
    expect(totals.total).toBe(1000 - 100 + STANDARD_DELIVERY_FEE);
  });

  it('applies GAINZ20 and keeps free delivery based on the pre-discount subtotal', () => {
    // Sample cart: EGP 1,850 whey + EGP 950 creatine.
    const totals = calculateCartTotals(
      [makeItem({ price: 1850 }), makeItem({ id: 'creatine', price: 950 })],
      'GAINZ20',
    );
    expect(totals.subtotal).toBe(2800);
    expect(totals.discountAmount).toBe(560);
    expect(totals.deliveryFee).toBe(0);
    expect(totals.total).toBe(2240);
  });

  it('ignores a promo code the cart no longer qualifies for', () => {
    const totals = calculateCartTotals([makeItem({ price: 300 })], 'FITFUEL10');
    expect(totals.discountAmount).toBe(0);
    expect(totals.appliedPromoCode).toBeNull();
  });

  it('ignores expired codes', () => {
    const totals = calculateCartTotals([makeItem({ price: 1000 })], 'EXPIRED50');
    expect(totals.discountAmount).toBe(0);
    expect(totals.appliedPromoCode).toBeNull();
  });
});
