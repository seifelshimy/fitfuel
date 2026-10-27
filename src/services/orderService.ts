// Orders: local history in AsyncStorage, simulated Stripe test payments,
// receipt export, and an optional sync to Cloud Firestore over REST.

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ORDER_STATUS_FLOW,
  type CartItem,
  type CartTotals,
  type DeliveryLocation,
  type Order,
  type PaymentMethod,
} from '@/models/order';
import { exportOrderReceipt } from './receiptService';

const ORDERS_KEY = '@fitfuel_orders_v1';
const GUEST_USER_ID = 'guest-user';
const STRIPE_TEST_DELAY_MS = 900;
// Mirrors Stripe's test decline card so the payment error path can be demoed.
const STRIPE_TEST_DECLINE_LAST4 = '0002';

export interface CreateOrderParams {
  items: CartItem[];
  totals: CartTotals;
  customerName: string;
  customerPhone: string;
  buildingNotes: string;
  deliveryLocation: DeliveryLocation;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
}

function buildSampleOrder(): Order {
  const createdAt = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  return {
    id: 'FF-SAMPLE1',
    userId: GUEST_USER_ID,
    items: [
      {
        id: 'dymatize-iso100-gourmet-vanilla-1-6lb',
        productId: 'dymatize-iso100',
        name: 'ISO100 Hydrolyzed Whey Isolate',
        brand: 'Dymatize',
        flavor: 'Gourmet Vanilla',
        weight: '1.6 lb (725 g)',
        price: 2400,
        quantity: 1,
        stock: 8,
      },
    ],
    totals: {
      subtotal: 2400,
      discountAmount: 240,
      deliveryFee: 0,
      total: 2160,
      appliedPromoCode: 'FITFUEL10',
    },
    customerName: 'Saif Nasr',
    customerPhone: '01012345678',
    buildingNotes: 'Building 12, 3rd floor, apartment 7',
    deliveryLocation: {
      latitude: 30.0074,
      longitude: 31.4913,
      formattedAddress: 'South 90th Street, New Cairo / Fifth Settlement, Cairo, Egypt',
      street: 'South 90th Street',
      area: 'New Cairo / Fifth Settlement',
      city: 'Cairo',
    },
    paymentMethod: 'cod',
    paymentStatus: 'pending_cod',
    status: 'out_for_delivery',
    createdAt,
  };
}

async function readOrders(): Promise<Order[] | null> {
  const raw = await AsyncStorage.getItem(ORDERS_KEY);
  if (raw === null) {
    return null;
  }
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? (parsed as Order[]) : [];
}

async function writeOrders(orders: Order[]): Promise<void> {
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function sortNewestFirst(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrders(): Promise<Order[]> {
  try {
    const stored = await readOrders();
    if (stored !== null) {
      return sortNewestFirst(stored);
    }

    // First launch: seed one historical order so the Orders screen has content.
    const sample = buildSampleOrder();
    try {
      sample.receiptFileName = await exportOrderReceipt(sample);
    } catch {
      // The sample is still useful without a receipt.
    }
    await writeOrders([sample]);
    return [sample];
  } catch {
    throw new Error('We couldn’t load your orders. Please try again.');
  }
}

async function simulateStripeTestPayment(cardLast4: string | undefined, amount: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, STRIPE_TEST_DELAY_MS));

  if (!cardLast4 || !/^\d{4}$/.test(cardLast4)) {
    throw new Error('Card details are incomplete. Enter the last 4 digits of your card.');
  }
  if (cardLast4 === STRIPE_TEST_DECLINE_LAST4) {
    throw new Error('Your card was declined (Stripe test mode). Try another card or pay cash on delivery.');
  }
  if (amount <= 0) {
    throw new Error('The order total must be greater than zero.');
  }
}

type FirestoreValue =
  | { nullValue: null }
  | { booleanValue: boolean }
  | { integerValue: string }
  | { doubleValue: number }
  | { stringValue: string }
  | { arrayValue: { values: FirestoreValue[] } }
  | { mapValue: { fields: Record<string, FirestoreValue> } };

function toFirestoreValue(value: unknown): FirestoreValue {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toFirestoreValue) } };
  }
  return { mapValue: { fields: toFirestoreFields(value as Record<string, unknown>) } };
}

function toFirestoreFields(record: Record<string, unknown>): Record<string, FirestoreValue> {
  const fields: Record<string, FirestoreValue> = {};
  for (const [key, value] of Object.entries(record)) {
    if (value !== undefined) {
      fields[key] = toFirestoreValue(value);
    }
  }
  return fields;
}

/** Returns true when the order reached Firestore. Never throws: the local copy is the source of truth. */
async function syncOrderToFirestore(order: Order): Promise<boolean> {
  const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
  if (!projectId) {
    return false;
  }

  try {
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/orders`;
    const url = apiKey ? `${baseUrl}?key=${apiKey}` : baseUrl;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: toFirestoreFields(order as unknown as Record<string, unknown>) }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return true;
  } catch (error) {
    console.warn('[orderService] Order saved locally but Firestore sync failed.', error);
    return false;
  }
}

export async function createOrder(params: CreateOrderParams): Promise<Order> {
  if (params.items.length === 0) {
    throw new Error('Your cart is empty. Add a product before placing an order.');
  }

  if (params.paymentMethod === 'stripe_card') {
    await simulateStripeTestPayment(params.cardLast4, params.totals.total);
  }

  const order: Order = {
    id: `FF-${Date.now().toString(36).toUpperCase()}`,
    userId: GUEST_USER_ID,
    items: params.items.map((item) => ({ ...item })),
    totals: { ...params.totals },
    customerName: params.customerName.trim(),
    customerPhone: params.customerPhone.replace(/[\s-]/g, ''),
    buildingNotes: params.buildingNotes.trim(),
    deliveryLocation: { ...params.deliveryLocation },
    paymentMethod: params.paymentMethod,
    paymentStatus: params.paymentMethod === 'stripe_card' ? 'paid' : 'pending_cod',
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  try {
    order.receiptFileName = await exportOrderReceipt(order);
  } catch (error) {
    // A missing receipt must not lose a paid order.
    console.warn('[orderService] Receipt export failed.', error);
  }

  try {
    const existing = (await readOrders()) ?? [];
    await writeOrders([order, ...existing]);
  } catch {
    throw new Error('Your order couldn’t be saved on this device. Please try again.');
  }

  await syncOrderToFirestore(order);
  return order;
}

export async function advanceOrderStatus(orderId: string): Promise<Order[]> {
  let orders: Order[];
  try {
    orders = (await readOrders()) ?? [];
  } catch {
    throw new Error('We couldn’t load your orders. Please try again.');
  }

  const target = orders.find((order) => order.id === orderId);
  if (!target) {
    throw new Error('That order no longer exists.');
  }

  const currentIndex = ORDER_STATUS_FLOW.indexOf(target.status);
  if (currentIndex >= ORDER_STATUS_FLOW.length - 1) {
    return sortNewestFirst(orders);
  }

  const updated = orders.map((order) =>
    order.id === orderId ? { ...order, status: ORDER_STATUS_FLOW[currentIndex + 1] } : order,
  );

  try {
    await writeOrders(updated);
  } catch {
    throw new Error('We couldn’t update the order status. Please try again.');
  }
  return sortNewestFirst(updated);
}
