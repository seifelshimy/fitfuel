// Mohamed Salim: pure biometric validation and daily target calculations.

import {
  ActivityLevel,
  BmiCategory,
  DailyTargets,
  FitnessGoal,
  FitnessProfileFormInput,
  ProfileValidationResult,
} from '@/models/fitness';

const NUMERIC_PATTERN = /^\d+(\.\d+)?$/;

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  moderate: 1.55,
  active: 1.725,
  athlete: 1.9,
};

const GOAL_CALORIE_ADJUSTMENTS: Record<FitnessGoal, number> = {
  muscle_gain: 300,
  fat_loss: -500,
  endurance: 200,
  general_health: 0,
};

const PROTEIN_GRAMS_PER_KG: Record<FitnessGoal, number> = {
  muscle_gain: 2.0,
  fat_loss: 2.2,
  endurance: 1.6,
  general_health: 1.2,
};

const WATER_ACTIVITY_BONUS_LITERS: Record<ActivityLevel, number> = {
  sedentary: 0,
  moderate: 0.35,
  active: 0.5,
  athlete: 0.75,
};

// The profile has no sex field, so we use the midpoint of the male (+5)
// and female (-161) Mifflin-St Jeor constants.
const MIFFLIN_SEX_NEUTRAL_CONSTANT = -78;

function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Parses a strictly positive decimal string; returns null for anything else. */
function parsePositiveNumber(raw: string): number | null {
  const trimmed = raw.trim();
  if (!NUMERIC_PATTERN.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  return Number.isFinite(value) && value > 0 ? value : null;
}

export function validateProfileForm(input: FitnessProfileFormInput): ProfileValidationResult {
  const errors: ProfileValidationResult['errors'] = {};

  if (input.fullName.trim().length < 3) {
    errors.fullName = 'Full name must be at least 3 characters.';
  }

  const age = parsePositiveNumber(input.age);
  if (age === null || !Number.isInteger(age) || age < 16 || age > 90) {
    errors.age = 'Age must be a whole number between 16 and 90.';
  }

  const weight = parsePositiveNumber(input.weightKg);
  if (weight === null || weight < 35 || weight > 250) {
    errors.weightKg = 'Weight must be a number between 35 and 250 kg.';
  }

  const height = parsePositiveNumber(input.heightCm);
  if (height === null || height < 120 || height > 230) {
    errors.heightCm = 'Height must be a number between 120 and 230 cm.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getBmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) {
    return 'Underweight';
  }
  if (bmi < 25) {
    return 'Normal';
  }
  if (bmi < 30) {
    return 'Overweight';
  }
  return 'Obese';
}

export function calculateDailyTargets(
  weightKg: number,
  heightCm: number,
  age: number,
  activityLevel: ActivityLevel,
  goal: FitnessGoal,
): DailyTargets {
  const heightM = heightCm / 100;
  const bmi = roundTo(weightKg / (heightM * heightM), 1);

  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + MIFFLIN_SEX_NEUTRAL_CONSTANT;
  const maintenance = bmr * ACTIVITY_MULTIPLIERS[activityLevel];
  const dailyCalories = Math.round(maintenance + GOAL_CALORIE_ADJUSTMENTS[goal]);

  return {
    bmi,
    bmiCategory: getBmiCategory(bmi),
    dailyCalories,
    proteinGrams: Math.round(weightKg * PROTEIN_GRAMS_PER_KG[goal]),
    creatineGrams: roundTo(weightKg * 0.05, 1),
    waterLiters: roundTo(weightKg * 0.035 + WATER_ACTIVITY_BONUS_LITERS[activityLevel], 1),
  };
}
