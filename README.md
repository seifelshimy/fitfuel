# FitFuel Supplement Store

FitFuel is a React Native and Expo supplement store app. This branch (`mohamed`) contains the
deliverables of **Mohamed Salim**.

## Assigned screens

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

## Architecture

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

## Tech stack

React Native, Expo, TypeScript (strict), Expo Router, AsyncStorage, Cloud Firestore REST API
and the OpenFoodFacts API.

## Environment variables

Copy `.env.example` to `.env`. Profile sync to Firestore uses:

```text
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
```

When it is empty or the network is unavailable, the app keeps working from AsyncStorage.
Never commit `.env`.

## Commands

```bash
npm install
npm start          # npx expo start
npm run web        # npx expo start --web
npm run typecheck  # npx tsc --noEmit
npm test           # npx jest
```

Unit tests live in `__tests__/fitnessCalculator.test.ts` and
`__tests__/recommendationEngine.test.ts`.
