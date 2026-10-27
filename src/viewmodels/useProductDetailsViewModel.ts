// ViewModel for the Product details screen (Ahmed Mohamed).
// Holds the chosen flavor, size and quantity and works out the total price.

import { useEffect, useState } from 'react';
import { productRepository } from '@/services/productService';
import { useAsyncData } from './useAsyncData';

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 10;

export function useProductDetailsViewModel(id: string | undefined) {
  const product = useAsyncData(() => {
    if (!id) return Promise.reject(new Error('No product was selected.'));
    return productRepository.getById(id);
  }, [id]);

  const [flavor, setFlavor] = useState<string | null>(null);
  const [sizeIndex, setSizeIndex] = useState(0);
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Pick sensible defaults as soon as the product arrives.
  useEffect(() => {
    if (product.data) {
      setFlavor(product.data.flavors[0] ?? null);
      setSizeIndex(0);
      setQuantity(MIN_QUANTITY);
      setFeedback(null);
    }
  }, [product.data]);

  const p = product.data;
  const size = p?.sizes[sizeIndex] ?? null;
  const total = size ? size.price * quantity : 0;

  // Any change to the selection clears the old message.
  const select = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setFeedback(null);
  };
  const increase = () => {
    setQuantity((q) => Math.min(MAX_QUANTITY, q + 1));
    setFeedback(null);
  };
  const decrease = () => {
    setQuantity((q) => Math.max(MIN_QUANTITY, q - 1));
    setFeedback(null);
  };

  /** Checks the selection before it can go to the cart. Returns an error or null. */
  const validateSelection = (): string | null => {
    if (!p) return 'The product is still loading.';
    if (!p.inStock) return 'This product is out of stock right now.';
    if (p.flavors.length > 0 && !flavor) return 'Please choose a flavor.';
    if (!size) return 'Please choose a size.';
    if (quantity < MIN_QUANTITY || quantity > MAX_QUANTITY) {
      return `Quantity must be between ${MIN_QUANTITY} and ${MAX_QUANTITY}.`;
    }
    return null;
  };

  const addToCart = () => {
    const error = validateSelection();
    if (error) {
      setFeedback({ type: 'error', text: error });
      return;
    }
    // TODO (Saif Nasr, Cart screen): call the CartContext addItem function here.
    setFeedback({
      type: 'success',
      text: `Added ${quantity} × ${p!.name} (${flavor}, ${size!.label}) to your cart.`,
    });
  };

  return {
    status: product.status,
    error: product.error,
    product: p,
    flavor,
    setFlavor: select(setFlavor),
    sizeIndex,
    setSizeIndex: select(setSizeIndex),
    quantity,
    increase,
    decrease,
    canIncrease: quantity < MAX_QUANTITY,
    canDecrease: quantity > MIN_QUANTITY,
    total,
    addToCart,
    feedback,
    retry: product.reload,
  };
}
