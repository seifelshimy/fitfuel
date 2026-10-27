// Cart, checkout and order types (Saif's part). Pure TypeScript only:
// no React, no storage, no network.

export type PaymentMethod = 'cod' | 'stripe_card';

export type OrderStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  flavor: string;
  weight: string;
  price: number;
  quantity: number;
  stock: number;
  imageUrl?: string;
}

export interface PromoCodeRule {
  code: string;
  discountPercent: number;
  minSubtotal: number;
  isActive: boolean;
  description: string;
}

export interface CartTotals {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  total: number;
  appliedPromoCode: string | null;
}

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  street?: string;
  area?: string;
  city?: string;
}

export interface CheckoutFormInput {
  fullName: string;
  phone: string;
  buildingNotes: string;
  paymentMethod: PaymentMethod;
  cardLast4?: string;
  location: DeliveryLocation | null;
}

export type CheckoutField = 'fullName' | 'phone' | 'location' | 'cardLast4' | 'cart';

export interface CheckoutValidationResult {
  isValid: boolean;
  errors: Partial<Record<CheckoutField, string>>;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totals: CartTotals;
  customerName: string;
  customerPhone: string;
  buildingNotes: string;
  deliveryLocation: DeliveryLocation;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'pending_cod';
  status: OrderStatus;
  createdAt: string;
  receiptFileName?: string;
}

/** The order lifecycle, in sequence. Used by the progress bar and status stepper. */
export const ORDER_STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'out_for_delivery', 'delivered'];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on delivery',
  stripe_card: 'Card (Stripe test)',
};
