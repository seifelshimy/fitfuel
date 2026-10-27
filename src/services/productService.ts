// Model layer: the only place that knows where product data comes from.
// Phase 1 returns the mock catalog after a short delay so loading states are visible.
// Phase 2: replace MockProductRepository with a Firestore-backed class that
// implements the same ProductRepository interface. No screen has to change.

import { Product } from '@/models/product';
import { MOCK_PRODUCTS } from './mockProducts';

export interface ProductRepository {
  getAll(): Promise<Product[]>;
  getById(id: string): Promise<Product>;
}

export class ProductNotFoundError extends Error {
  constructor(id: string) {
    super(`We couldn't find this product (id: ${id}). It may have been removed.`);
    this.name = 'ProductNotFoundError';
  }
}

const NETWORK_DELAY_MS = 600;

// Flip this to true during the demo to show the error state on every screen.
let simulateNetworkErrors = false;
export function setSimulateNetworkErrors(value: boolean) {
  simulateNetworkErrors = value;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MockProductRepository implements ProductRepository {
  private async request<T>(work: () => T): Promise<T> {
    await wait(NETWORK_DELAY_MS);
    if (simulateNetworkErrors) {
      throw new Error('No connection. Check your internet and try again.');
    }
    return work();
  }

  getAll(): Promise<Product[]> {
    return this.request(() => [...MOCK_PRODUCTS]);
  }

  getById(id: string): Promise<Product> {
    return this.request(() => {
      const product = MOCK_PRODUCTS.find((p) => p.id === id);
      if (!product) throw new ProductNotFoundError(id);
      return product;
    });
  }
}

export const productRepository: ProductRepository = new MockProductRepository();

/** Turns any thrown value into a message that is safe to show the user. */
export function toUserMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return 'Something went wrong. Please try again.';
}
