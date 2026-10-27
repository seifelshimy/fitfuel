# FitFuel: Cart, Checkout & Orders

A supplement store app built with React Native, Expo (SDK 58), Expo Router and TypeScript, using the MVVM pattern.

**Member:** Saif Nasr, ID 242769. **Branch:** `saif_242769`.

This branch contains Saif's three screens (Cart, Checkout, Orders) plus the shared base files: theme, `PrimaryButton`, `StateViews` and `utils/format.ts`.

## Run it

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

### Environment variables (all optional)

| Variable | Used for | Without it |
| --- | --- | --- |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Turning the delivery pin into a street address (Google Geocoding API) | Falls back to the device geocoder, then a readable "near <area>, Cairo" address |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | Syncing new orders to Cloud Firestore over REST | Orders are kept on the device only |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | Sent as `?key=` with the Firestore request | The request is sent without a key |

Never commit `.env`. It is already in `.gitignore`; commit `.env.example` instead.

## Saif's screens

### 1. Cart: `src/app/(tabs)/cart.tsx`

- Cart items with brand, name, flavor, size, price, a quantity stepper (limited to 1 through the stock) and a remove button
- Promo codes: `FITFUEL10` (10% off from EGP 500) and `GAINZ20` (20% off from EGP 1,500). `EXPIRED50` shows the "expired" error.
- Order summary with subtotal, discount, delivery (EGP 50, or free from EGP 2,000) and total
- The tab icon shows a live item count badge
- Loading, empty (with "Restore sample items") and error states

### 2. Checkout: `src/app/checkout.tsx`

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

### 3. Orders: `src/app/(tabs)/orders.tsx`

- Each order card shows:
  - Order ID, date and a status badge
  - A 4-step progress bar: Pending, Confirmed, Out for delivery, Delivered
  - Delivery address, payment method and total
- "Simulate next status" moves an order to the next step
- "View receipt" opens a modal with the exported text receipt
- Pull to refresh, plus loading, empty and error states

## Architecture (MVVM)

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

### Keeping the map safe on web and Expo Go

`react-native-maps` has no web support. The map is split by platform:

- `DeliveryMap.native.tsx` is bundled for iOS and Android only. It wraps the map in an error boundary, so if the native map module is missing the screen still works through the selector card.
- `DeliveryMap.tsx` is the web version. It never imports `react-native-maps`.

The checkout screen also only renders the map when `Platform.OS !== 'web'`. A web export was checked to make sure it contains no map code.

## Storage keys

| Key | Contents |
| --- | --- |
| `@fitfuel_cart_items_v1` | Cart items |
| `@fitfuel_cart_promo_v1` | Applied promo code |
| `@fitfuel_orders_v1` | Order history |
| `@fitfuel_receipt_v1_<file>` | Receipt text on web. Native devices write `receipt-<orderId>.txt` to the document directory. |

To reset the demo data, clear the app's storage (or site data on web).

## Tests

`npx jest` runs 48 unit tests (config in `jest.config.js`):

- **`__tests__/cartPricing.test.ts`**
  - `clampQuantity`
  - `validatePromoCode`: `FITFUEL10`, `GAINZ20`, `EXPIRED50`, minimum subtotals, unknown and malformed codes
  - `calculateCartTotals`: subtotal, discount, and the EGP 2,000 free-delivery threshold
- **`__tests__/checkoutValidation.test.ts`**
  - `isValidEgyptianPhone`
  - `isValidDeliveryLocation`
  - `validateCheckoutForm`: empty cart, invalid phone, missing map pin, Stripe card digits

## Git workflow

Work is committed on the `saif_242769` branch from Saif's own GitHub account, then merged into `develop` through a pull request.
