// Checkout ViewModel: recipient form, delivery pin, payment method,
// validation and placing the order.

import { useCallback, useRef, useState } from 'react';
import { router } from 'expo-router';
import { useCart } from '@/context/CartContext';
import type { CheckoutField, CheckoutValidationResult, DeliveryLocation, PaymentMethod } from '@/models/order';
import { validateCheckoutForm } from '@/utils/checkoutValidation';
import {
  CAIRO_AREA_PRESETS,
  CAIRO_DEFAULT_COORDS,
  getCurrentDeviceCoordinates,
  reverseGeocodeCoordinates,
} from '@/services/locationService';
import { createOrder } from '@/services/orderService';

export function useCheckoutViewModel() {
  const cart = useCart();

  const [fullName, setFullNameState] = useState('');
  const [phone, setPhoneState] = useState('');
  const [buildingNotes, setBuildingNotes] = useState('');
  const [paymentMethod, setPaymentMethodState] = useState<PaymentMethod>('cod');
  const [cardLast4, setCardLast4State] = useState('');
  const [location, setLocation] = useState<DeliveryLocation | null>(null);
  const [locationNotice, setLocationNotice] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<CheckoutValidationResult['errors']>({});

  // Only the latest pin request may update the address, even if older lookups finish later.
  const locateRequestId = useRef(0);

  const clearFieldError = useCallback((field: CheckoutField) => {
    setValidationErrors((current) => {
      if (!current[field]) {
        return current;
      }
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const setFullName = useCallback(
    (text: string) => {
      setFullNameState(text.slice(0, 60));
      clearFieldError('fullName');
    },
    [clearFieldError],
  );

  const setPhone = useCallback(
    (text: string) => {
      setPhoneState(text.replace(/[^\d+\s-]/g, '').slice(0, 16));
      clearFieldError('phone');
    },
    [clearFieldError],
  );

  const setCardLast4 = useCallback(
    (text: string) => {
      setCardLast4State(text.replace(/\D/g, '').slice(0, 4));
      clearFieldError('cardLast4');
    },
    [clearFieldError],
  );

  const setPaymentMethod = useCallback(
    (method: PaymentMethod) => {
      setPaymentMethodState(method);
      clearFieldError('cardLast4');
      setError(null);
    },
    [clearFieldError],
  );

  const selectMapCoordinate = useCallback(
    async (latitude: number, longitude: number) => {
      const requestId = ++locateRequestId.current;
      setIsLocating(true);
      setError(null);
      clearFieldError('location');

      // Move the pin immediately; the readable address follows once geocoding finishes.
      setLocation({
        latitude,
        longitude,
        formattedAddress: `Finding address for ${latitude.toFixed(4)}, ${longitude.toFixed(4)}…`,
      });

      try {
        const resolved = await reverseGeocodeCoordinates(latitude, longitude);
        if (requestId === locateRequestId.current) {
          setLocation(resolved);
        }
      } catch (geocodeError) {
        if (requestId === locateRequestId.current) {
          setLocation(null);
          setError(geocodeError instanceof Error ? geocodeError.message : 'We couldn’t find that address.');
        }
      } finally {
        if (requestId === locateRequestId.current) {
          setIsLocating(false);
        }
      }
    },
    [clearFieldError],
  );

  const detectCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationNotice(null);
    const coords = await getCurrentDeviceCoordinates();
    setLocationNotice(coords.notice ?? null);
    await selectMapCoordinate(coords.latitude, coords.longitude);
  }, [selectMapCoordinate]);

  const submitOrder = useCallback(async () => {
    if (isSubmitting) {
      return;
    }
    setError(null);

    const result = validateCheckoutForm(
      { fullName, phone, buildingNotes, paymentMethod, cardLast4, location },
      cart.items.length,
    );
    setValidationErrors(result.errors);
    if (!result.isValid || !location) {
      setError('Please fix the highlighted fields.');
      return;
    }
    if (isLocating) {
      setError('Wait for the delivery address to finish loading.');
      return;
    }

    setIsSubmitting(true);
    try {
      const order = await createOrder({
        items: cart.items,
        totals: cart.totals,
        customerName: fullName,
        customerPhone: phone,
        buildingNotes,
        deliveryLocation: location,
        paymentMethod,
        cardLast4: paymentMethod === 'stripe_card' ? cardLast4 : undefined,
      });
      // Leave checkout first so it never flashes its empty-cart state.
      router.dismissTo({ pathname: '/(tabs)/orders', params: { placed: order.id } });
      await cart.clearCart();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'We couldn’t place your order.');
    } finally {
      setIsSubmitting(false);
    }
  }, [buildingNotes, cardLast4, cart, fullName, isLocating, isSubmitting, location, paymentMethod, phone]);

  return {
    items: cart.items,
    totals: cart.totals,
    isCartLoading: cart.isLoading,
    isCartEmpty: !cart.isLoading && cart.items.length === 0,
    fullName,
    setFullName,
    phone,
    setPhone,
    buildingNotes,
    setBuildingNotes,
    paymentMethod,
    setPaymentMethod,
    cardLast4,
    setCardLast4,
    location,
    locationNotice,
    areaPresets: CAIRO_AREA_PRESETS,
    defaultCoordinates: CAIRO_DEFAULT_COORDS,
    isLocating,
    isSubmitting,
    error,
    validationErrors,
    detectCurrentLocation,
    selectMapCoordinate,
    submitOrder,
  };
}
