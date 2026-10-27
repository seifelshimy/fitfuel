// Text receipts for orders. Native devices write a .txt file to the app's
// document directory; web (no file system) keeps the text in AsyncStorage.

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, type Order } from '@/models/order';
import { formatPrice } from '@/utils/format';

const WEB_RECEIPT_PREFIX = '@fitfuel_receipt_v1_';

function canUseFileSystem(): boolean {
  return Platform.OS !== 'web' && Boolean(FileSystem.documentDirectory);
}

export function buildReceiptText(order: Order): string {
  const divider = '-'.repeat(36);
  const itemLines = order.items.map(
    (item) =>
      `${item.quantity} x ${item.brand} ${item.name}\n    ${item.flavor}, ${item.weight}\n    ${formatPrice(item.price * item.quantity)}`,
  );

  const lines = [
    'FITFUEL SUPPLEMENT STORE',
    'Order receipt',
    divider,
    `Order:    ${order.id}`,
    `Date:     ${new Date(order.createdAt).toLocaleString('en-GB')}`,
    `Status:   ${ORDER_STATUS_LABELS[order.status]}`,
    divider,
    ...itemLines,
    divider,
    `Subtotal: ${formatPrice(order.totals.subtotal)}`,
    order.totals.discountAmount > 0
      ? `Discount: -${formatPrice(order.totals.discountAmount)} (${order.totals.appliedPromoCode})`
      : null,
    `Delivery: ${order.totals.deliveryFee === 0 ? 'Free' : formatPrice(order.totals.deliveryFee)}`,
    `TOTAL:    ${formatPrice(order.totals.total)}`,
    divider,
    `Payment:  ${PAYMENT_METHOD_LABELS[order.paymentMethod]}`,
    `          ${order.paymentStatus === 'paid' ? 'Paid' : 'Pay on delivery'}`,
    divider,
    `Deliver to: ${order.customerName}`,
    `Phone:      ${order.customerPhone}`,
    `Address:    ${order.deliveryLocation.formattedAddress}`,
    order.buildingNotes ? `Notes:      ${order.buildingNotes}` : null,
    divider,
    'Thank you for training with FitFuel!',
  ];

  return lines.filter((line): line is string => line !== null).join('\n');
}

export async function exportOrderReceipt(order: Order): Promise<string> {
  const fileName = `receipt-${order.id}.txt`;
  const text = buildReceiptText(order);

  try {
    if (canUseFileSystem()) {
      await FileSystem.writeAsStringAsync(`${FileSystem.documentDirectory}${fileName}`, text);
    } else {
      await AsyncStorage.setItem(`${WEB_RECEIPT_PREFIX}${fileName}`, text);
    }
    return fileName;
  } catch {
    throw new Error('We couldn’t save the receipt for this order.');
  }
}

export async function readOrderReceipt(fileName: string): Promise<string> {
  try {
    if (canUseFileSystem()) {
      const uri = `${FileSystem.documentDirectory}${fileName}`;
      const info = await FileSystem.getInfoAsync(uri);
      if (info.exists) {
        return await FileSystem.readAsStringAsync(uri);
      }
    }

    const stored = await AsyncStorage.getItem(`${WEB_RECEIPT_PREFIX}${fileName}`);
    if (stored !== null) {
      return stored;
    }
  } catch {
    throw new Error('We couldn’t open this receipt. Please try again.');
  }

  throw new Error('This receipt could not be found on this device.');
}
