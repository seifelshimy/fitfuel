// Pure checkout form validation. The checkout ViewModel calls this before
// placing an order and shows each error next to its field.

import type {
  CheckoutFormInput,
  CheckoutValidationResult,
  DeliveryLocation,
} from '@/models/order';

const EGYPTIAN_MOBILE_REGEX = /^(\+20|0)?1[0125]\d{8}$/;
const CARD_LAST4_REGEX = /^\d{4}$/;

/** Accepts 01xxxxxxxxx, +201xxxxxxxxx or 1xxxxxxxxx (Vodafone, Etisalat, Orange, WE). Spaces and dashes are ignored. */
export function isValidEgyptianPhone(phone: string): boolean {
  const normalized = phone.replace(/[\s-]/g, '');
  return EGYPTIAN_MOBILE_REGEX.test(normalized);
}

export function isValidDeliveryLocation(location: DeliveryLocation | null | undefined): boolean {
  if (!location) {
    return false;
  }

  const { latitude, longitude, formattedAddress } = location;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
    return false;
  }

  return typeof formattedAddress === 'string' && formattedAddress.trim().length >= 5;
}

export function validateCheckoutForm(input: CheckoutFormInput, itemCount: number): CheckoutValidationResult {
  const errors: CheckoutValidationResult['errors'] = {};

  if (itemCount <= 0) {
    errors.cart = 'Your cart is empty. Add a product before checking out.';
  }

  if (input.fullName.trim().length < 3) {
    errors.fullName = 'Enter the recipient’s full name (at least 3 characters).';
  }

  if (!isValidEgyptianPhone(input.phone)) {
    errors.phone = 'Enter a valid Egyptian mobile number, e.g. 01012345678.';
  }

  if (!isValidDeliveryLocation(input.location)) {
    errors.location = 'Pick a delivery location on the map or use your current GPS location.';
  }

  if (input.paymentMethod === 'stripe_card' && !CARD_LAST4_REGEX.test((input.cardLast4 ?? '').trim())) {
    errors.cardLast4 = 'Enter the last 4 digits of your card.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
