// Cart persistence. The only code that knows the cart lives in AsyncStorage.

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '@/models/order';

const CART_ITEMS_KEY = '@fitfuel_cart_items_v1';
const CART_PROMO_KEY = '@fitfuel_cart_promo_v1';

// Seeded on first launch so the Cart, Checkout and Orders flow can be tested
// before the product screens are connected.
export const SAMPLE_CART_ITEMS: CartItem[] = [
  {
    id: 'on-gold-whey-double-rich-chocolate-2lb',
    productId: 'on-gold-standard-whey',
    name: 'Gold Standard 100% Whey',
    brand: 'Optimum Nutrition',
    flavor: 'Double Rich Chocolate',
    weight: '2 lb (907 g)',
    price: 1850,
    quantity: 1,
    stock: 12,
  },
  {
    id: 'muscleadd-micronized-creatine-unflavored-300g',
    productId: 'muscleadd-micronized-creatine',
    name: 'Micronized Creatine Monohydrate',
    brand: 'MuscleAdd',
    flavor: 'Unflavored',
    weight: '300 g',
    price: 950,
    quantity: 1,
    stock: 20,
  },
];

function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const item = value as Partial<CartItem>;
  return (
    typeof item.id === 'string' &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    typeof item.quantity === 'number' &&
    typeof item.stock === 'number'
  );
}

export async function getStoredCartItems(): Promise<CartItem[]> {
  try {
    const raw = await AsyncStorage.getItem(CART_ITEMS_KEY);

    // Nothing stored yet: first launch, so seed the sample items.
    if (raw === null) {
      await AsyncStorage.setItem(CART_ITEMS_KEY, JSON.stringify(SAMPLE_CART_ITEMS));
      return SAMPLE_CART_ITEMS.map((item) => ({ ...item }));
    }

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCartItem) : [];
  } catch {
    throw new Error('We couldn’t load your cart. Please try again.');
  }
}

export async function saveCartItems(items: CartItem[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CART_ITEMS_KEY, JSON.stringify(items));
  } catch {
    throw new Error('We couldn’t save your cart changes. Please try again.');
  }
}

export async function clearStoredCart(): Promise<void> {
  try {
    await AsyncStorage.setItem(CART_ITEMS_KEY, JSON.stringify([]));
    await AsyncStorage.removeItem(CART_PROMO_KEY);
  } catch {
    throw new Error('We couldn’t clear your cart. Please try again.');
  }
}

export async function restoreSampleCartItems(): Promise<CartItem[]> {
  const items = SAMPLE_CART_ITEMS.map((item) => ({ ...item }));
  await saveCartItems(items);
  return items;
}

export async function getStoredPromoCode(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CART_PROMO_KEY);
  } catch {
    throw new Error('We couldn’t load your promo code. Please try again.');
  }
}

export async function savePromoCode(code: string | null): Promise<void> {
  try {
    if (code) {
      await AsyncStorage.setItem(CART_PROMO_KEY, code);
    } else {
      await AsyncStorage.removeItem(CART_PROMO_KEY);
    }
  } catch {
    throw new Error('We couldn’t save your promo code. Please try again.');
  }
}
