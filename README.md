# FitFuel

A supplement store app built with React Native, Expo and TypeScript, using the MVVM pattern.

## Run it

```bash
npm install
cp .env.example .env     # fill in keys later (Phase 2)
npx expo start           # scan the QR code with Expo Go, or press w for web
```

Typecheck with `npm run typecheck`.

## Architecture (MVVM)

| Layer | Folder | Job |
| --- | --- | --- |
| Model | `src/models`, `src/services` | Types, and the only code that knows where data comes from |
| ViewModel | `src/viewmodels` | One hook per screen: state, validation, loading/error handling |
| View | `src/app`, `src/components` | Screens and UI parts that only render ViewModel output |

```
src/
  app/            # Expo Router screens (Views)
    (tabs)/       # bottom tab screens
    product/      # stacked screens
  components/     # shared UI: buttons, chips, cards, loading/empty/error states
  viewmodels/     # one hook per screen
  models/         # TypeScript types
  services/       # data access (mock in Phase 1, Firestore in Phase 2)
  utils/          # pure helpers: filtering, validation, formatting
  theme/          # colors, spacing, typography
```

Screens never import from `services/` directly. They call their ViewModel hook, so Phase 2 can swap the mock data for Firestore by changing only `src/services/productService.ts`.

## Screens and owners

| Member | Screens | Status |
| --- | --- | --- |
| Ahmed Mohamed | Home, Product details, Search & filter | Phase 1 UI done |
| Mohamed Salim | Fitness profile, Recommendations, Barcode scanner | To do |
| Saif Nasr | Cart, Checkout, Orders | To do |
| Seif Elshimy | Wishlist & reviews, Reminders, Admin panel | To do |

### Ahmed's part

- `src/app/(tabs)/index.tsx`: Home, with categories, featured products, category rows and pull-to-refresh
- `src/app/product/[id].tsx`: Product details, with flavor, size, quantity, nutrition facts and add to cart
- `src/app/(tabs)/search.tsx`: Search & filter, with debounced search and a filter sheet (category, goal, flavor, price range, sort)
- ViewModels: `useHomeViewModel`, `useProductDetailsViewModel`, `useSearchViewModel`, `useAsyncData`
- Model and services: `models/product.ts`, `services/productService.ts`, `services/mockProducts.ts`
- Utils: `utils/productFilters.ts` (filtering and validation), `utils/format.ts`
- Shared base used by the whole team: `theme/`, `components/`

Validation and error handling in this part:

- The search box rejects text over 50 characters and the characters `< > { }`.
- The price filter accepts whole numbers only, up to 100,000, and the minimum must not exceed the maximum. The sheet stays open and shows the error until the input is fixed.
- Add to cart checks stock, flavor, size and quantity (1 to 10) before accepting.
- Every screen shows a loading state, an empty state and an error state with "Try again".
- To demo the error state, call `setSimulateNetworkErrors(true)` from `src/services/productService.ts`.

### Notes for teammates

- **Saif (Cart)**: `useProductDetailsViewModel.ts` has a `TODO` where Add to cart should call your `CartContext`.
- **Everyone**: add your tab to `src/app/(tabs)/_layout.tsx` and stacked screens to `src/app/_layout.tsx`. Reuse `components/` and `theme/` so the styling stays consistent.
- **Unit test candidates** (Phase 2): `filterProducts`, `validatePriceRange` and `validateQuery` in `utils/productFilters.ts` are pure functions and easy to test.

## Git workflow

Each member commits from their own GitHub account on their own branch (`ahmed`, `mohamed`, `saif`, `seif`), then opens a pull request into `develop`. `develop` is merged into `main` at each phase.

Never commit `.env`. It is already in `.gitignore`; commit `.env.example` instead.
