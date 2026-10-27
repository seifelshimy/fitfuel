// Model layer: plain TypeScript types that describe FitFuel's data.
// Views and ViewModels depend on these types, never on where data comes from.

export type Category = 'protein' | 'creatine' | 'vitamins' | 'pre-workout' | 'snacks';

export type Goal = 'build-muscle' | 'lose-weight' | 'stay-healthy';

export interface NutritionFacts {
  servingSize: string;
  calories: number;
  protein: number; // grams per serving
  carbs: number; // grams per serving
  fat: number; // grams per serving
  sugar: number; // grams per serving
}

export interface ProductSize {
  label: string; // e.g. "2 lb"
  price: number; // EGP
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: Category;
  description: string;
  goals: Goal[];
  flavors: string[];
  sizes: ProductSize[];
  nutrition: NutritionFacts;
  rating: number; // 0 to 5
  reviewCount: number;
  inStock: boolean;
  featured: boolean;
}

export type SortOption = 'relevance' | 'price-asc' | 'price-desc' | 'rating';

export interface ProductFilters {
  query: string;
  category: Category | null;
  goal: Goal | null;
  flavor: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortOption;
}

export const EMPTY_FILTERS: ProductFilters = {
  query: '',
  category: null,
  goal: null,
  flavor: null,
  minPrice: null,
  maxPrice: null,
  sort: 'relevance',
};

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'protein', label: 'Protein', icon: 'barbell-outline' },
  { id: 'creatine', label: 'Creatine', icon: 'flash-outline' },
  { id: 'vitamins', label: 'Vitamins', icon: 'leaf-outline' },
  { id: 'pre-workout', label: 'Pre-workout', icon: 'rocket-outline' },
  { id: 'snacks', label: 'Snacks', icon: 'nutrition-outline' },
];

export const GOALS: { id: Goal; label: string }[] = [
  { id: 'build-muscle', label: 'Build muscle' },
  { id: 'lose-weight', label: 'Lose weight' },
  { id: 'stay-healthy', label: 'Stay healthy' },
];

export const SORT_OPTIONS: { id: SortOption; label: string }[] = [
  { id: 'relevance', label: 'Relevance' },
  { id: 'price-asc', label: 'Price: low to high' },
  { id: 'price-desc', label: 'Price: high to low' },
  { id: 'rating', label: 'Top rated' },
];

/** The lowest price across a product's sizes, used for cards and sorting. */
export function startingPrice(product: Product): number {
  return Math.min(...product.sizes.map((s) => s.price));
}
