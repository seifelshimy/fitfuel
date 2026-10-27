// Mohamed Salim: barcode lookup (verified partners + OpenFoodFacts) and scan history.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScannedSupplement } from '@/models/fitness';
import { isValidBarcodeFormat } from '@/utils/recommendationEngine';

const HISTORY_KEY = '@fitfuel_scan_history_v1';
const MAX_HISTORY = 20;

type VerifiedEntry = Omit<ScannedSupplement, 'barcode' | 'scannedAt'>;

export const VERIFIED_BARCODE_DATABASE: Record<string, VerifiedEntry> = {
  '0748927028669': {
    name: 'Gold Standard 100% Whey',
    brand: 'Optimum Nutrition',
    category: 'protein',
    caloriesPerServing: 120,
    proteinGrams: 24,
    carbsGrams: 3,
    fatGrams: 1.5,
    isAuthenticFitFuelPartner: true,
  },
  '0705016353103': {
    name: 'ISO100 Hydrolyzed Whey Isolate',
    brand: 'Dymatize',
    category: 'protein',
    caloriesPerServing: 110,
    proteinGrams: 25,
    carbsGrams: 1,
    fatGrams: 0.5,
    isAuthenticFitFuelPartner: true,
  },
  '6224001234567': {
    name: 'Micronized Creatine Monohydrate',
    brand: 'MuscleAdd',
    category: 'creatine',
    caloriesPerServing: 0,
    proteinGrams: 0,
    carbsGrams: 0,
    fatGrams: 0,
    isAuthenticFitFuelPartner: true,
  },
};

interface OpenFoodFactsResponse {
  status?: number;
  product?: {
    product_name?: string;
    brands?: string;
    categories?: string;
    nutriments?: Record<string, number | string | undefined>;
  };
}

function readNutriment(
  nutriments: Record<string, number | string | undefined> | undefined,
  key: string,
): number {
  const value = Number(nutriments?.[`${key}_serving`] ?? nutriments?.[`${key}_100g`] ?? 0);
  return Number.isFinite(value) ? Math.round(value * 10) / 10 : 0;
}

async function fetchFromOpenFoodFacts(barcode: string): Promise<ScannedSupplement> {
  let data: OpenFoodFactsResponse;
  try {
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    if (!response.ok && response.status !== 404) {
      throw new Error();
    }
    data = (await response.json()) as OpenFoodFactsResponse;
  } catch {
    throw new Error('Could not reach the product database. Check your connection and try again.');
  }

  if (data.status !== 1 || !data.product) {
    throw new Error(`No supplement found for barcode ${barcode}.`);
  }

  const { product } = data;
  return {
    barcode,
    name: product.product_name?.trim() || 'Unnamed product',
    brand: product.brands?.split(',')[0]?.trim() || 'Unknown brand',
    category: product.categories?.split(',')[0]?.trim() || 'supplement',
    caloriesPerServing: readNutriment(product.nutriments, 'energy-kcal'),
    proteinGrams: readNutriment(product.nutriments, 'proteins'),
    carbsGrams: readNutriment(product.nutriments, 'carbohydrates'),
    fatGrams: readNutriment(product.nutriments, 'fat'),
    isAuthenticFitFuelPartner: false,
    scannedAt: new Date().toISOString(),
  };
}

export async function getScanHistory(): Promise<ScannedSupplement[]> {
  try {
    const raw = await AsyncStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as ScannedSupplement[]) : [];
  } catch {
    throw new Error('Unable to load your scan history.');
  }
}

export async function saveScanToHistory(scan: ScannedSupplement): Promise<ScannedSupplement[]> {
  try {
    const history = await getScanHistory();
    const next = [scan, ...history.filter((item) => item.barcode !== scan.barcode)].slice(
      0,
      MAX_HISTORY,
    );
    await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    return next;
  } catch {
    throw new Error('Unable to save this scan to your history.');
  }
}

export async function clearScanHistory(): Promise<void> {
  try {
    await AsyncStorage.removeItem(HISTORY_KEY);
  } catch {
    throw new Error('Unable to clear your scan history.');
  }
}

export async function lookupSupplementBarcode(rawBarcode: string): Promise<ScannedSupplement> {
  const barcode = rawBarcode.trim();
  if (!isValidBarcodeFormat(barcode)) {
    throw new Error('Enter a valid EAN/UPC barcode (8 to 14 digits).');
  }

  try {
    const verified = VERIFIED_BARCODE_DATABASE[barcode];
    const scan: ScannedSupplement = verified
      ? { ...verified, barcode, scannedAt: new Date().toISOString() }
      : await fetchFromOpenFoodFacts(barcode);

    await saveScanToHistory(scan);
    return scan;
  } catch (error) {
    throw error instanceof Error ? error : new Error('Unable to look up this barcode.');
  }
}
