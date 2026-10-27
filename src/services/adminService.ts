// Model layer (Seif Elshimy): the store owner's write operations.
// Phase 1 changes the shared mock catalog in memory, so new products, edits,
// deletions and stock changes also appear on the Home and Search screens.
// Phase 2: replace MockAdminRepository with Firestore writes (same interface).

import { AdminOrder, NewProductInput, OrderStatus } from '@/models/admin';
import { Product } from '@/models/product';
import { MOCK_PRODUCTS } from './mockProducts';

export interface AdminRepository {
  addProduct(input: NewProductInput): Promise<Product>;
  updateProduct(productId: string, input: NewProductInput): Promise<Product>;
  deleteProduct(productId: string): Promise<void>;
  setInStock(productId: string, inStock: boolean): Promise<Product>;
  getOrders(): Promise<AdminOrder[]>;
  updateOrderStatus(orderId: string, status: OrderStatus): Promise<AdminOrder>;
}

const NETWORK_DELAY_MS = 400;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Finds a product's position in the catalog, or throws a clear error. */
function findProductIndex(productId: string): number {
  const index = MOCK_PRODUCTS.findIndex((p) => p.id === productId);
  if (index === -1) throw new Error('This product no longer exists.');
  return index;
}

class MockAdminRepository implements AdminRepository {
  private orders: AdminOrder[] = [
    { id: 'FF-1042', customerName: 'Mariam Hassan', itemCount: 2, total: 6300, createdAt: '2026-10-26T19:10:00Z', status: 'pending' },
    { id: 'FF-1041', customerName: 'Karim Adel', itemCount: 1, total: 1200, createdAt: '2026-10-26T11:45:00Z', status: 'confirmed' },
    { id: 'FF-1039', customerName: 'Salma Fathy', itemCount: 3, total: 4580, createdAt: '2026-10-25T16:20:00Z', status: 'out_for_delivery' },
    { id: 'FF-1036', customerName: 'Hany Samir', itemCount: 1, total: 3150, createdAt: '2026-10-24T09:05:00Z', status: 'delivered' },
  ];

  async addProduct(input: NewProductInput): Promise<Product> {
    await wait(NETWORK_DELAY_MS);
    const product: Product = {
      id: `p${Date.now()}`,
      name: input.name,
      brand: input.brand,
      category: input.category,
      description: input.description,
      goals: [],
      flavors: [],
      sizes: [{ label: input.sizeLabel, price: input.price }],
      nutrition: input.nutrition,
      rating: 0,
      reviewCount: 0,
      inStock: true,
      featured: false,
    };
    MOCK_PRODUCTS.push(product);
    return product;
  }

  async updateProduct(productId: string, input: NewProductInput): Promise<Product> {
    await wait(NETWORK_DELAY_MS);
    const index = findProductIndex(productId);
    const current = MOCK_PRODUCTS[index];
    // The form edits the first size only; any other sizes are kept as they are.
    const [, ...otherSizes] = current.sizes;
    MOCK_PRODUCTS[index] = {
      ...current,
      name: input.name,
      brand: input.brand,
      category: input.category,
      description: input.description,
      sizes: [{ label: input.sizeLabel, price: input.price }, ...otherSizes],
      nutrition: input.nutrition,
    };
    return MOCK_PRODUCTS[index];
  }

  async deleteProduct(productId: string): Promise<void> {
    await wait(NETWORK_DELAY_MS);
    const index = findProductIndex(productId);
    MOCK_PRODUCTS.splice(index, 1); // remove 1 item at that position
  }

  async setInStock(productId: string, inStock: boolean): Promise<Product> {
    await wait(NETWORK_DELAY_MS);
    const index = findProductIndex(productId);
    MOCK_PRODUCTS[index] = { ...MOCK_PRODUCTS[index], inStock };
    return MOCK_PRODUCTS[index];
  }

  async getOrders(): Promise<AdminOrder[]> {
    await wait(NETWORK_DELAY_MS);
    return [...this.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)); // newest first
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<AdminOrder> {
    await wait(NETWORK_DELAY_MS);
    const existing = this.orders.find((o) => o.id === orderId);
    if (!existing) throw new Error('This order no longer exists.');
    const updated = { ...existing, status };
    this.orders = this.orders.map((o) => (o.id === orderId ? updated : o));
    return updated;
  }
}

export const adminRepository: AdminRepository = new MockAdminRepository();