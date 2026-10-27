// Orders screen ViewModel: order history, simulated status updates and receipts.

import { useCallback, useState } from 'react';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import type { Order } from '@/models/order';
import { advanceOrderStatus, getOrders } from '@/services/orderService';
import { readOrderReceipt } from '@/services/receiptService';

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useOrdersViewModel() {
  const { placed } = useLocalSearchParams<{ placed?: string }>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [receiptText, setReceiptText] = useState<string | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const [isReceiptVisible, setIsReceiptVisible] = useState(false);
  const [isReceiptLoading, setIsReceiptLoading] = useState(false);

  const reloadOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setOrders(await getOrders());
    } catch (loadError) {
      setError(errorMessage(loadError, 'We couldn’t load your orders.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Reload whenever the tab gains focus so a just-placed order appears.
  useFocusEffect(
    useCallback(() => {
      void reloadOrders();
    }, [reloadOrders]),
  );

  const stepOrderStatus = useCallback(async (orderId: string) => {
    setUpdatingOrderId(orderId);
    setActionError(null);
    try {
      setOrders(await advanceOrderStatus(orderId));
    } catch (stepError) {
      setActionError(errorMessage(stepError, 'We couldn’t update this order.'));
    } finally {
      setUpdatingOrderId(null);
    }
  }, []);

  const getReceipt = useCallback((fileName: string) => readOrderReceipt(fileName), []);

  const openReceipt = useCallback(
    async (order: Order) => {
      setIsReceiptVisible(true);
      setReceiptText(null);
      setReceiptError(null);

      if (!order.receiptFileName) {
        setReceiptError('No receipt was saved for this order.');
        return;
      }

      setIsReceiptLoading(true);
      try {
        setReceiptText(await getReceipt(order.receiptFileName));
      } catch (readError) {
        setReceiptError(errorMessage(readError, 'We couldn’t open this receipt.'));
      } finally {
        setIsReceiptLoading(false);
      }
    },
    [getReceipt],
  );

  const closeReceipt = useCallback(() => {
    setIsReceiptVisible(false);
  }, []);

  return {
    orders,
    isLoading,
    error,
    actionError,
    isEmpty: !isLoading && !error && orders.length === 0,
    placedOrderId: typeof placed === 'string' ? placed : null,
    updatingOrderId,
    reloadOrders,
    stepOrderStatus,
    getReceipt,
    receiptText,
    receiptError,
    isReceiptVisible,
    isReceiptLoading,
    openReceipt,
    closeReceipt,
  };
}
