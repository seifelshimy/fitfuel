// Device location and reverse geocoding for the checkout delivery pin.
// Tries Google Maps Geocoding first, then the device geocoder, then a
// readable Cairo fallback, so checkout works online, offline and on web.

import { Platform } from 'react-native';
import * as Location from 'expo-location';
import type { DeliveryLocation } from '@/models/order';

export const CAIRO_DEFAULT_COORDS = { latitude: 30.0444, longitude: 31.2357 };

export interface AreaPreset {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
}

export const CAIRO_AREA_PRESETS: AreaPreset[] = [
  { id: 'new-cairo', label: 'New Cairo / Fifth Settlement', latitude: 30.0074, longitude: 31.4913 },
  { id: 'nasr-city', label: 'Nasr City', latitude: 30.0511, longitude: 31.3656 },
  { id: 'maadi', label: 'Maadi', latitude: 29.9602, longitude: 31.2569 },
  { id: 'zamalek', label: 'Zamalek', latitude: 30.0609, longitude: 31.2197 },
  { id: 'heliopolis', label: 'Heliopolis', latitude: 30.0911, longitude: 31.3227 },
  { id: 'sheikh-zayed', label: 'Sheikh Zayed', latitude: 30.0444, longitude: 30.9763 },
];

export interface DeviceCoordinatesResult {
  latitude: number;
  longitude: number;
  /** True when we could not read the device and used central Cairo instead. */
  isFallback: boolean;
  notice?: string;
}

const GPS_TIMEOUT_MS = 12000;
const GEOCODE_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function fallbackCoordinates(notice: string): DeviceCoordinatesResult {
  return { ...CAIRO_DEFAULT_COORDS, isFallback: true, notice };
}

export async function getCurrentDeviceCoordinates(): Promise<DeviceCoordinatesResult> {
  try {
    const permission = await Location.requestForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      return fallbackCoordinates(
        'Location permission was denied, so we placed the pin in central Cairo. Move it to your address.',
      );
    }

    const position = await withTimeout(
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      GPS_TIMEOUT_MS,
      'GPS timed out',
    );

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      isFallback: false,
    };
  } catch {
    const where = Platform.OS === 'web' ? 'your browser' : 'your device';
    return fallbackCoordinates(
      `We couldn’t read GPS from ${where}, so we placed the pin in central Cairo. Move it to your address.`,
    );
  }
}

interface GoogleAddressComponent {
  long_name: string;
  types: string[];
}

interface GoogleGeocodeResponse {
  status: string;
  error_message?: string;
  results: { formatted_address: string; address_components: GoogleAddressComponent[] }[];
}

async function reverseGeocodeWithGoogle(
  latitude: number,
  longitude: number,
  apiKey: string,
): Promise<DeliveryLocation | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`;

  const response = await withTimeout(fetch(url), GEOCODE_TIMEOUT_MS, 'Google geocoding timed out');
  if (!response.ok) {
    throw new Error(`Google geocoding failed with HTTP ${response.status}`);
  }

  const data = (await response.json()) as GoogleGeocodeResponse;
  if (data.status !== 'OK' || data.results.length === 0) {
    return null;
  }

  const best = data.results[0];
  const find = (...types: string[]) =>
    best.address_components.find((component) => types.some((type) => component.types.includes(type)))
      ?.long_name;

  const route = find('route');
  const streetNumber = find('street_number');

  return {
    latitude,
    longitude,
    formattedAddress: best.formatted_address,
    street: route ? [streetNumber, route].filter(Boolean).join(' ') : undefined,
    area: find('sublocality', 'sublocality_level_1', 'neighborhood', 'administrative_area_level_2'),
    city: find('locality', 'administrative_area_level_1'),
  };
}

async function reverseGeocodeWithDevice(latitude: number, longitude: number): Promise<DeliveryLocation | null> {
  const [address] = await withTimeout(
    Location.reverseGeocodeAsync({ latitude, longitude }),
    GEOCODE_TIMEOUT_MS,
    'Device geocoding timed out',
  );
  if (!address) {
    return null;
  }

  const street = [address.streetNumber, address.street].filter(Boolean).join(' ') || undefined;
  const area = address.district ?? address.subregion ?? undefined;
  const city = address.city ?? address.region ?? undefined;
  const formattedAddress =
    address.formattedAddress ?? [street ?? address.name, area, city, address.country].filter(Boolean).join(', ');

  if (formattedAddress.trim().length < 5) {
    return null;
  }

  return { latitude, longitude, formattedAddress, street, area, city };
}

function nearestPreset(latitude: number, longitude: number): AreaPreset {
  return CAIRO_AREA_PRESETS.reduce((best, preset) => {
    const distance = (preset.latitude - latitude) ** 2 + (preset.longitude - longitude) ** 2;
    const bestDistance = (best.latitude - latitude) ** 2 + (best.longitude - longitude) ** 2;
    return distance < bestDistance ? preset : best;
  });
}

function coordinateFallback(latitude: number, longitude: number): DeliveryLocation {
  const area = nearestPreset(latitude, longitude).label;
  return {
    latitude,
    longitude,
    formattedAddress: `Pinned location near ${area}, Cairo, Egypt (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`,
    area,
    city: 'Cairo',
  };
}

export async function reverseGeocodeCoordinates(latitude: number, longitude: number): Promise<DeliveryLocation> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('That map position is not valid. Please pick your location again.');
  }

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (apiKey) {
    try {
      const googleResult = await reverseGeocodeWithGoogle(latitude, longitude, apiKey);
      if (googleResult) {
        return googleResult;
      }
    } catch (error) {
      console.warn('[locationService] Google geocoding unavailable, falling back.', error);
    }
  }

  try {
    const deviceResult = await reverseGeocodeWithDevice(latitude, longitude);
    if (deviceResult) {
      return deviceResult;
    }
  } catch {
    // The device geocoder is not available on web or offline; use the fallback below.
  }

  return coordinateFallback(latitude, longitude);
}
