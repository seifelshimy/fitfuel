// Mohamed Salim: fitness profile, daily targets, recommendations and scanner models.

export type FitnessGoal = 'muscle_gain' | 'fat_loss' | 'endurance' | 'general_health';

export type ActivityLevel = 'sedentary' | 'moderate' | 'active' | 'athlete';

export type DietaryRestriction =
  | 'none'
  | 'lactose_free'
  | 'vegan'
  | 'gluten_free'
  | 'caffeine_free';

export type BmiCategory = 'Underweight' | 'Normal' | 'Overweight' | 'Obese';

export interface FitnessProfile {
  userId: string;
  fullName: string;
  age: number;
  weightKg: number;
  heightCm: number;
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  dietaryRestrictions: DietaryRestriction[];
  updatedAt: string;
}

/** Raw form values exactly as typed by the user (numbers arrive as text). */
export interface FitnessProfileFormInput {
  fullName: string;
  age: string;
  weightKg: string;
  heightCm: string;
  goal: FitnessGoal;
  activityLevel: ActivityLevel;
  dietaryRestrictions: DietaryRestriction[];
}

export interface DailyTargets {
  bmi: number;
  bmiCategory: BmiCategory;
  dailyCalories: number;
  proteinGrams: number;
  creatineGrams: number;
  waterLiters: number;
}

export interface SupplementRecommendation {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  targetGoals: FitnessGoal[];
  tags: string[];
  containsLactose: boolean;
  containsAnimalProducts: boolean;
  containsGluten: boolean;
  containsCaffeine: boolean;
  baseServingNote: string;
  matchScore: number;
  recommendedDosage: string;
  reason: string;
}

/**
 * A catalog entry before it is personalised. `targetGoals[0]` is the primary goal;
 * dosage is scaled by body weight using `dosagePerKg` in `dosageUnit`.
 */
export type SupplementCatalogItem = Omit<
  SupplementRecommendation,
  'matchScore' | 'recommendedDosage' | 'reason'
> & {
  dosagePerKg: number;
  dosageUnit: 'g' | 'mg';
};

export interface ScannedSupplement {
  barcode: string;
  name: string;
  brand: string;
  category: string;
  caloriesPerServing: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  isAuthenticFitFuelPartner: boolean;
  scannedAt: string;
}

export type ProfileFormField = 'fullName' | 'age' | 'weightKg' | 'heightCm';

export interface ProfileValidationResult {
  isValid: boolean;
  errors: Partial<Record<ProfileFormField, string>>;
}

export const GOAL_LABELS: Record<FitnessGoal, string> = {
  muscle_gain: 'Muscle Gain',
  fat_loss: 'Fat Loss',
  endurance: 'Endurance',
  general_health: 'General Health',
};

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: 'Sedentary',
  moderate: 'Moderate',
  active: 'Active',
  athlete: 'Athlete',
};

export const RESTRICTION_LABELS: Record<DietaryRestriction, string> = {
  none: 'None',
  lactose_free: 'Lactose-free',
  vegan: 'Vegan',
  gluten_free: 'Gluten-free',
  caffeine_free: 'Caffeine-free',
};
