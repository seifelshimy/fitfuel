import { describe, expect, it } from '@jest/globals';
import type { CheckoutFormInput, DeliveryLocation } from '@/models/order';
import {
  isValidDeliveryLocation,
  isValidEgyptianPhone,
  validateCheckoutForm,
} from '@/utils/checkoutValidation';

const validLocation: DeliveryLocation = {
  latitude: 30.0074,
  longitude: 31.4913,
  formattedAddress: 'South 90th Street, New Cairo, Cairo, Egypt',
};

function makeInput(overrides: Partial<CheckoutFormInput> = {}): CheckoutFormInput {
  return {
    fullName: 'Saif Nasr',
    phone: '01012345678',
    buildingNotes: 'Building 12, 3rd floor',
    paymentMethod: 'cod',
    location: validLocation,
    ...overrides,
  };
}

describe('isValidEgyptianPhone', () => {
  it.each(['01012345678', '01112345678', '01212345678', '01512345678', '+201012345678', '+201112345678', '1012345678'])(
    'accepts %s',
    (phone) => {
      expect(isValidEgyptianPhone(phone)).toBe(true);
    },
  );

  it('ignores spaces and dashes', () => {
    expect(isValidEgyptianPhone('010 1234 5678')).toBe(true);
    expect(isValidEgyptianPhone('010-1234-5678')).toBe(true);
  });

  it.each(['01312345678', '0101234567', '010123456789', '0201012345678', '+441012345678', 'abcdefghijk', ''])(
    'rejects %s',
    (phone) => {
      expect(isValidEgyptianPhone(phone)).toBe(false);
    },
  );
});

describe('isValidDeliveryLocation', () => {
  it('accepts a pinned location with an address', () => {
    expect(isValidDeliveryLocation(validLocation)).toBe(true);
  });

  it('rejects a missing pin', () => {
    expect(isValidDeliveryLocation(null)).toBe(false);
    expect(isValidDeliveryLocation(undefined)).toBe(false);
  });

  it('rejects non-finite or out-of-range coordinates', () => {
    expect(isValidDeliveryLocation({ ...validLocation, latitude: Number.NaN })).toBe(false);
    expect(isValidDeliveryLocation({ ...validLocation, longitude: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isValidDeliveryLocation({ ...validLocation, latitude: 95 })).toBe(false);
  });

  it('rejects an address shorter than 5 characters', () => {
    expect(isValidDeliveryLocation({ ...validLocation, formattedAddress: 'Egy' })).toBe(false);
    expect(isValidDeliveryLocation({ ...validLocation, formattedAddress: '       ' })).toBe(false);
    expect(isValidDeliveryLocation({ ...validLocation, formattedAddress: '' })).toBe(false);
  });

  it('accepts an address of exactly 5 characters', () => {
    expect(isValidDeliveryLocation({ ...validLocation, formattedAddress: 'Maadi' })).toBe(true);
  });
});

describe('validateCheckoutForm', () => {
  it('passes a complete cash-on-delivery form', () => {
    expect(validateCheckoutForm(makeInput(), 2)).toEqual({ isValid: true, errors: {} });
  });

  it('flags an empty cart', () => {
    const result = validateCheckoutForm(makeInput(), 0);
    expect(result.isValid).toBe(false);
    expect(result.errors.cart).toBeDefined();
  });

  it('flags a name shorter than 3 characters', () => {
    const result = validateCheckoutForm(makeInput({ fullName: ' Sa ' }), 1);
    expect(result.errors.fullName).toBeDefined();
  });

  it('flags an invalid phone number', () => {
    const result = validateCheckoutForm(makeInput({ phone: '0123' }), 1);
    expect(result.isValid).toBe(false);
    expect(result.errors.phone).toMatch(/Egyptian mobile/);
  });

  it('flags a missing map pin', () => {
    const result = validateCheckoutForm(makeInput({ location: null }), 1);
    expect(result.isValid).toBe(false);
    expect(result.errors.location).toBeDefined();
  });

  it('requires 4 card digits for Stripe card payments', () => {
    expect(validateCheckoutForm(makeInput({ paymentMethod: 'stripe_card' }), 1).errors.cardLast4).toBeDefined();
    expect(
      validateCheckoutForm(makeInput({ paymentMethod: 'stripe_card', cardLast4: '42a2' }), 1).errors.cardLast4,
    ).toBeDefined();
    expect(validateCheckoutForm(makeInput({ paymentMethod: 'stripe_card', cardLast4: '4242' }), 1).isValid).toBe(
      true,
    );
  });

  it('does not ask for card digits with cash on delivery', () => {
    expect(validateCheckoutForm(makeInput({ cardLast4: '' }), 1).errors.cardLast4).toBeUndefined();
  });

  it('reports every invalid field at once', () => {
    const result = validateCheckoutForm(
      makeInput({ fullName: '', phone: '', location: null, paymentMethod: 'stripe_card', cardLast4: '' }),
      0,
    );
    expect(Object.keys(result.errors).sort()).toEqual(['cardLast4', 'cart', 'fullName', 'location', 'phone']);
  });
});
