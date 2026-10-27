import { FitnessProfileFormInput } from '@/models/fitness';
import {
  calculateDailyTargets,
  getBmiCategory,
  validateProfileForm,
} from '@/utils/fitnessCalculator';

const validInput: FitnessProfileFormInput = {
  fullName: 'Mohamed Salim',
  age: '21',
  weightKg: '78',
  heightCm: '178',
  goal: 'muscle_gain',
  activityLevel: 'active',
  dietaryRestrictions: ['lactose_free'],
};

describe('calculateDailyTargets', () => {
  it('calculates BMI, calories, protein, creatine and water for an active muscle-gain profile', () => {
    const targets = calculateDailyTargets(78, 178, 21, 'active', 'muscle_gain');

    expect(targets.bmi).toBe(24.6);
    expect(targets.bmiCategory).toBe('Normal');
    expect(targets.dailyCalories).toBe(3249);
    expect(targets.proteinGrams).toBe(156);
    expect(targets.creatineGrams).toBe(3.9);
    expect(targets.waterLiters).toBe(3.2);
  });

  it('applies a calorie deficit and higher protein ratio for fat loss', () => {
    const targets = calculateDailyTargets(60, 165, 30, 'sedentary', 'fat_loss');

    expect(targets.bmi).toBe(22);
    expect(targets.dailyCalories).toBe(1184);
    expect(targets.proteinGrams).toBe(132);
    expect(targets.creatineGrams).toBe(3);
  });

  it('gives more calories to more active people with the same body', () => {
    const sedentary = calculateDailyTargets(78, 178, 21, 'sedentary', 'general_health');
    const athlete = calculateDailyTargets(78, 178, 21, 'athlete', 'general_health');

    expect(athlete.dailyCalories).toBeGreaterThan(sedentary.dailyCalories);
    expect(athlete.waterLiters).toBeGreaterThan(sedentary.waterLiters);
  });

  it('maps BMI values to the correct category', () => {
    expect(getBmiCategory(17.9)).toBe('Underweight');
    expect(getBmiCategory(18.5)).toBe('Normal');
    expect(getBmiCategory(27)).toBe('Overweight');
    expect(getBmiCategory(31.2)).toBe('Obese');
  });
});

describe('validateProfileForm', () => {
  it('accepts a valid profile', () => {
    const result = validateProfileForm(validInput);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('accepts decimal weight and height', () => {
    expect(validateProfileForm({ ...validInput, weightKg: '78.5', heightCm: '177.8' }).isValid).toBe(
      true,
    );
  });

  it('rejects names shorter than 3 characters', () => {
    const result = validateProfileForm({ ...validInput, fullName: ' Mo ' });

    expect(result.isValid).toBe(false);
    expect(result.errors.fullName).toBeDefined();
  });

  it.each(['-21', '0', '15', '91', '21.5', 'abc', ''])('rejects invalid age "%s"', (age) => {
    const result = validateProfileForm({ ...validInput, age });

    expect(result.isValid).toBe(false);
    expect(result.errors.age).toBeDefined();
  });

  it.each(['-78', '0', '34', '251', '78kg', ''])('rejects invalid weight "%s"', (weightKg) => {
    const result = validateProfileForm({ ...validInput, weightKg });

    expect(result.isValid).toBe(false);
    expect(result.errors.weightKg).toBeDefined();
  });

  it.each(['-178', '0', '119', '231', 'tall'])('rejects invalid height "%s"', (heightCm) => {
    const result = validateProfileForm({ ...validInput, heightCm });

    expect(result.isValid).toBe(false);
    expect(result.errors.heightCm).toBeDefined();
  });
});
