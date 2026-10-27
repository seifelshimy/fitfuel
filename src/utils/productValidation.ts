// Validation (Seif Elshimy): checks the Add / Edit product form before saving.
// Pure functions with no React code, so they are easy to unit test in Phase 2.

import { Category } from '@/models/product';

export const MAX_PRODUCT_PRICE = 100000; // same upper limit as Ahmed's price filter
export const MAX_CALORIES = 2000;
export const MAX_GRAMS = 300;

/** The nutrition fields as the owner types them (text until checked). */
export interface NutritionDraft {
  servingSize: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
  sugar: string;
}

/** What the form holds while the owner types. Everything is text until it is checked. */
export interface NewProductDraft {
  name: string;
  brand: string;
  category: Category | null;
  price: string;
  sizeLabel: string;
  description: string;
  nutrition: NutritionDraft;
}

export const EMPTY_NUTRITION_DRAFT: NutritionDraft = {
  servingSize: '',
  calories: '',
  protein: '',
  carbs: '',
  fat: '',
  sugar: '',
};

export const EMPTY_PRODUCT_DRAFT: NewProductDraft = {
  name: '',
  brand: '',
  category: null,
  price: '',
  sizeLabel: '',
  description: '',
  nutrition: EMPTY_NUTRITION_DRAFT,
};

export type NutritionErrors = Partial<Record<keyof NutritionDraft, string>>;

export interface ProductErrors {
  name?: string;
  brand?: string;
  category?: string;
  price?: string;
  sizeLabel?: string;
  description?: string;
  nutrition?: NutritionErrors;
}

// A number that is 0 or more, with an optional decimal part: "0", "27", "0.5".
const AMOUNT_PATTERN = /^\d+(\.\d+)?$/;

/** Checks one nutrition amount. Returns an error message, or undefined if it is fine. */
function checkAmount(value: string, max: number, unit: string): string | undefined {
  const text = value.trim();
  if (text.length === 0) return 'Required.';
  if (!AMOUNT_PATTERN.test(text)) return 'Numbers only, e.g. 27 or 0.5.';
  if (Number(text) > max) return `Max ${max} ${unit}.`;
  return undefined;
}

export function validateNutrition(draft: NutritionDraft): NutritionErrors {
  const errors: NutritionErrors = {};
  const serving = draft.servingSize.trim();

  if (serving.length === 0) errors.servingSize = 'Enter the serving size, e.g. 1 scoop (31 g).';
  else if (serving.length > 30) errors.servingSize = 'Use 30 characters or fewer.';

  const calories = checkAmount(draft.calories, MAX_CALORIES, 'kcal');
  if (calories) errors.calories = calories;

  // The four gram fields share the same rule, so check them in one loop.
  for (const key of ['protein', 'carbs', 'fat', 'sugar'] as const) {
    const message = checkAmount(draft[key], MAX_GRAMS, 'g');
    if (message) errors[key] = message;
  }

  // Sugar is part of the carbohydrates, so it cannot be more than the carbs.
  if (!errors.carbs && !errors.sugar && Number(draft.sugar) > Number(draft.carbs)) {
    errors.sugar = 'Sugar cannot be more than carbs.';
  }

  return errors;
}

export function validateNewProduct(draft: NewProductDraft): ProductErrors {
  const errors: ProductErrors = {};
  const name = draft.name.trim();
  const brand = draft.brand.trim();
  const price = draft.price.trim();
  const size = draft.sizeLabel.trim();
  const description = draft.description.trim();

  if (name.length < 2) errors.name = 'Enter a product name (at least 2 characters).';
  else if (name.length > 60) errors.name = 'Use 60 characters or fewer.';

  if (brand.length === 0) errors.brand = 'Enter the brand.';
  else if (brand.length > 40) errors.brand = 'Use 40 characters or fewer.';

  if (!draft.category) errors.category = 'Choose a category.';

  // Whole numbers only: "450" is fine, "-5", "4.5" and "abc" are not.
  if (!/^\d+$/.test(price)) errors.price = 'Enter the price as a whole number of EGP.';
  else if (Number(price) < 1 || Number(price) > MAX_PRODUCT_PRICE) {
    errors.price = `Price must be between 1 and ${MAX_PRODUCT_PRICE.toLocaleString()} EGP.`;
  }

  if (size.length === 0) errors.sizeLabel = 'Enter a size, e.g. 2 lb or 60 tablets.';
  else if (size.length > 15) errors.sizeLabel = 'Use 15 characters or fewer.';

  if (description.length < 10) errors.description = 'Write a description (at least 10 characters).';
  else if (description.length > 300) errors.description = 'Use 300 characters or fewer.';

  const nutrition = validateNutrition(draft.nutrition);
  if (Object.keys(nutrition).length > 0) errors.nutrition = nutrition;

  return errors;
}

export function hasProductErrors(errors: ProductErrors): boolean {
  return Object.values(errors).some(Boolean);
}