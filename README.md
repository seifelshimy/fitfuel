# FitFuel

A supplement store mobile app built with React Native, Expo (SDK 58), Expo Router and TypeScript, using the MVVM pattern.
Course project for Mobile Application Development (25CSCI38H).

## Team

| Member | ID | Branch | Screens |
| --- | --- | --- | --- |
| Ahmed Mohamed | 234808 | `ahmed_234808` | Home, Product details, Search & filter, plus the shared project base |
| Mohamed Salim | 245657 | `mohamed_245657` | Fitness profile, Goals & recommendations, Barcode scanner |
| Saif Nasr | 242769 | `saif_242769` | Cart, Checkout, Orders |
| Seif Elshimy | 221856 | `seifelshimy_221856` | Wishlist & reviews, Reminders, Admin panel |

Each member works on their own branch. Work reaches `develop` through pull requests, and `develop` is merged into `main` at the end of each phase.

## Run it

```bash
npm install
cp .env.example .env     # optional: add the Google Maps / Firebase keys
npx expo start           # scan the QR code with Expo Go, or press w for web
```

| Command | What it does |
| --- | --- |
| `npx expo start` | Start the dev server (Expo Go, Android, iOS, web) |
| `npm run typecheck` | Type check (`tsc --noEmit`) |
| `npm test` | Run all 90 unit tests (`jest`) |

Never commit `.env`. It is in `.gitignore`; commit `.env.example` instead.

## Ahmed Mohamed

### Screens and shared base

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

## Mohamed Salim

### Assigned screens

- **Fitness Profile** (`src/app/(tabs)/profile.tsx`): enter full name, age, weight and height,
  pick a fitness goal, activity level and dietary restrictions, and see live BMI, daily calories,
  protein, creatine and water targets. Inputs are validated before saving.
- **Goal Recommendations** (`src/app/(tabs)/recommendations.tsx`): supplements matched to your
  goal and dietary restrictions, with a match score, EGP price, weight-personalised dosage and
  the reason for each pick. Goal filter chips let you explore other goals.
- **Barcode Scanner** (`src/app/(tabs)/scanner.tsx`): verify a supplement by EAN/UPC barcode
  using one-tap verified samples or manual entry. Verified FitFuel partner products are checked
  locally first, then OpenFoodFacts is used as a fallback. Recent scans are saved on the device.

The scanner does not import any native camera module, so it runs on web
(`npx expo start --web`), Expo Go and native builds without crashing.

### Architecture

The app follows strict MVVM separation:

| Layer | Location | Responsibility |
| --- | --- | --- |
| Models | `src/models/fitness.ts` | TypeScript types for profiles, targets, recommendations and scans |
| Utils | `src/utils/fitnessCalculator.ts`, `src/utils/recommendationEngine.ts` | Pure validation, BMI / Mifflin-St Jeor calculations, dietary filtering and recommendation scoring |
| Services | `src/services/` | AsyncStorage persistence, Cloud Firestore REST sync with offline fallback, OpenFoodFacts lookups |
| Context | `src/context/FitnessProfileContext.tsx` | Shares the profile and its daily targets across tabs |
| ViewModels | `src/viewmodels/` | `useProfileViewModel`, `useRecommendationsViewModel`, `useScannerViewModel`: screen state, validation, loading and errors |
| Views | `src/app/`, `src/components/` | Render ViewModel state; screens never import services directly |

Reusable components: `MacroTargetCard`, `RecommendationCard`, `ScannedProductCard`,
`SelectChip`, plus the shared `PrimaryButton` and `StateViews` (loading, empty, error).

### Tech stack

React Native, Expo, TypeScript (strict), Expo Router, AsyncStorage, Cloud Firestore REST API
and the OpenFoodFacts API.

### Environment variables

Copy `.env.example` to `.env`. Profile sync to Firestore uses:

```text
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
```

When it is empty or the network is unavailable, the app keeps working from AsyncStorage.
Never commit `.env`.

### Commands

```bash
npm install
npm start          # npx expo start
npm run web        # npx expo start --web
npm run typecheck  # npx tsc --noEmit
npm test           # npx jest
```

Unit tests live in `__tests__/fitnessCalculator.test.ts` and
`__tests__/recommendationEngine.test.ts`.

## Saif Nasr

### Run it

```bash
npm install
cp .env.example .env     # optional: add the Google Maps / Firebase keys
npx expo start           # scan the QR code with Expo Go, or press w for web
```

| Command | What it does |
| --- | --- |
| `npx expo start` | Start the dev server (Expo Go, Android, iOS, web) |
| `npx expo start --web` | Run in the browser |
| `npx tsc --noEmit` / `npm run typecheck` | Type check |
| `npx jest` / `npm test` | Run the unit tests |

The app opens on the Cart tab (`/` redirects to `/(tabs)/cart`). The first launch seeds two sample cart items and one past order, so every screen can be tested right away.

#### Environment variables (all optional)

| Variable | Used for | Without it |
| --- | --- | --- |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Turning the delivery pin into a street address (Google Geocoding API) | Falls back to the device geocoder, then a readable "near <area>, Cairo" address |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Syncing new orders to Cloud Firestore over REST | Orders are kept on the device only |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Sent as `?key=` with the Firestore request | The request is sent without a key |

Never commit `.env`. It is already in `.gitignore`; commit `.env.example` instead.

### Saif's screens

#### 1. Cart: `src/app/(tabs)/cart.tsx`

- Cart items with brand, name, flavor, size, price, a quantity stepper (limited to 1 through the stock) and a remove button
- Promo codes: `FITFUEL10` (10% off from EGP 500) and `GAINZ20` (20% off from EGP 1,500). `EXPIRED50` shows the "expired" error.
- Order summary with subtotal, discount, delivery (EGP 50, or free from EGP 2,000) and total
- The tab icon shows a live item count badge
- Loading, empty (with "Restore sample items") and error states

#### 2. Checkout: `src/app/checkout.tsx`

- **Delivery location**
  - On iOS and Android, an interactive map from `react-native-maps`: tap to drop the pin, or drag it
  - On every platform, the "Delivery Pin & Coordinates Selector" card, with:
    - Quick Cairo areas: New Cairo / Fifth Settlement, Nasr City, Maadi, Zamalek, Heliopolis, Sheikh Zayed
    - Latitude and longitude buttons that move the pin about 110 m per tap
    - A "Use My Current GPS Location" button
  - A banner that shows the resolved street address
- **Recipient details:** full name, Egyptian mobile number, and building/floor notes
- **Payment:** cash on delivery, or card in Stripe test mode. Card payments ask for the last 4 digits; `0002` simulates a declined card.
- Errors appear next to each field, and an empty-cart state is shown when there is nothing to check out
- "Confirm Order" places the order, clears the cart and opens the Orders tab with a confirmation banner

#### 3. Orders: `src/app/(tabs)/orders.tsx`

- Each order card shows:
  - Order ID, date and a status badge
  - A 4-step progress bar: Pending, Confirmed, Out for delivery, Delivered
  - Delivery address, payment method and total
- "Simulate next status" moves an order to the next step
- "View receipt" opens a modal with the exported text receipt
- Pull to refresh, plus loading, empty and error states

### Architecture (MVVM)

| Layer | Files | Job |
| --- | --- | --- |
| Model | `src/models/order.ts` | Types: `CartItem`, `PromoCodeRule`, `CartTotals`, `DeliveryLocation`, `CheckoutFormInput`, `Order`, … |
| Pure logic | `src/utils/cartPricing.ts`, `src/utils/checkoutValidation.ts` | Promo rules, totals, quantity limits and form validation. No React, so they are unit tested. |
| Services | `src/services/cartService.ts`, `locationService.ts`, `orderService.ts`, `receiptService.ts` | The only code that touches AsyncStorage, `expo-location`, `expo-file-system`, Google Geocoding and Firestore. Every call is wrapped in `try/catch` and throws a readable `Error`. |
| Shared state | `src/context/CartContext.tsx` | `CartProvider` / `useCart()`: items, totals, promo code and cart actions for every screen |
| ViewModel | `src/viewmodels/useCartViewModel.ts`, `useCheckoutViewModel.ts`, `useOrdersViewModel.ts` | One hook per screen: UI state, validation, and calls into services |
| View | `src/app/…`, `src/components/CartItemCard.tsx`, `OrderStatusCard.tsx`, `LocationPicker.tsx`, `DeliveryMap(.native).tsx` | Render ViewModel output only |

Screens never import from `src/services/`. For example, the Orders screen opens a receipt through `vm.getReceipt(fileName)`, and only the ViewModel calls `readOrderReceipt`.

```
src/
  app/
    _layout.tsx         # Stack inside CartProvider: (tabs) + checkout
    index.tsx           # Redirects / to /(tabs)/cart
    checkout.tsx        # Screen 2
    (tabs)/
      _layout.tsx       # Cart (with badge) and Orders tabs
      cart.tsx          # Screen 1
      orders.tsx        # Screen 3
  components/           # CartItemCard, OrderStatusCard, LocationPicker, DeliveryMap, shared base
  context/              # CartContext
  viewmodels/           # one hook per screen
  models/               # order.ts
  services/             # storage, location, orders, receipts
  utils/                # cartPricing, checkoutValidation, format
  theme/                # colors, spacing, typography, radius
__tests__/              # cartPricing.test.ts, checkoutValidation.test.ts
```

#### Keeping the map safe on web and Expo Go

`react-native-maps` has no web support. The map is split by platform:

- `DeliveryMap.native.tsx` is bundled for iOS and Android only. It wraps the map in an error boundary, so if the native map module is missing the screen still works through the selector card.
- `DeliveryMap.tsx` is the web version. It never imports `react-native-maps`.

The checkout screen also only renders the map when `Platform.OS !== 'web'`. A web export was checked to make sure it contains no map code.

### Storage keys

| Key | Contents |
| --- | --- |
| `@fitfuel_cart_items_v1` | Cart items |
| `@fitfuel_cart_promo_v1` | Applied promo code |
| `@fitfuel_orders_v1` | Order history |
| `@fitfuel_receipt_v1_<file>` | Receipt text on web. Native devices write `receipt-<orderId>.txt` to the document directory. |

To reset the demo data, clear the app's storage (or site data on web).

### Tests

Saif's two test files hold 48 of the project's 90 unit tests (config in `jest.config.js`):

- **`__tests__/cartPricing.test.ts`**
  - `clampQuantity`
  - `validatePromoCode`: `FITFUEL10`, `GAINZ20`, `EXPIRED50`, minimum subtotals, unknown and malformed codes
  - `calculateCartTotals`: subtotal, discount, and the EGP 2,000 free-delivery threshold
- **`__tests__/checkoutValidation.test.ts`**
  - `isValidEgyptianPhone`
  - `isValidDeliveryLocation`
  - `validateCheckoutForm`: empty cart, invalid phone, missing map pin, Stripe card digits

### Git workflow

Work is committed on the `saif_242769` branch from Saif's own GitHub account, then merged into `develop` through a pull request.
