// Model layer (Seif Elshimy): data used by the store owner's Admin panel.

import { Category, NutritionFacts } from '@/models/product';

// Same values as Saif's OrderStatus (src/models/order.ts on his branch).
// After the branches are merged, import his type instead of this copy.
export type OrderStatus = 'pending' | 'confirmed' | 'out_for_delivery' | 'delivered' | 'cancelled';

export const ORDER_STATUSES: { id: OrderStatus; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'out_for_delivery', label: 'Out for delivery' },
  { id: 'delivered', label: 'Delivered' },
  { id: 'cancelled', label: 'Cancelled' },
];

/** An order as the store owner sees it in the list. */
export interface AdminOrder {
  id: string;
  customerName: string;
  itemCount: number;
  total: number;     // EGP
  createdAt: string; // ISO date
  status: OrderStatus;
}

/** A product after the form has been validated (numbers are real numbers now). */
export interface NewProductInput {
  name: string;
  brand: string;
  category: Category;
  price: number;
  sizeLabel: string;
  description: string;
  nutrition: NutritionFacts; // Ahmed's type from product.ts, so the shapes always match
}