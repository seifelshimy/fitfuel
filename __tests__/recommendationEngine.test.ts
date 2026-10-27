import { FitnessProfile } from '@/models/fitness';
import {
  generateRecommendations,
  isValidBarcodeFormat,
  PRIMARY_MATCH_SCORE,
  SECONDARY_MATCH_SCORE,
  SUPPLEMENT_CATALOG,
} from '@/utils/recommendationEngine';

const baseProfile: FitnessProfile = {
  userId: 'mohamed-salim',
  fullName: 'Mohamed Salim',
  age: 21,
  weightKg: 78,
  heightCm: 178,
  goal: 'muscle_gain',
  activityLevel: 'active',
  dietaryRestrictions: [],
  updatedAt: '2026-10-27T00:00:00.000Z',
};

describe('generateRecommendations', () => {
  it('only returns supplements that target the active goal', () => {
    const results = generateRecommendations(baseProfile);

    expect(results.length).toBeGreaterThan(0);
    results.forEach((item) => expect(item.targetGoals).toContain('muscle_gain'));
  });

  it('uses the override goal instead of the profile goal', () => {
    const results = generateRecommendations(baseProfile, 'fat_loss');
    const ids = results.map((item) => item.id);

    expect(ids).toContain('biotech-l-carnitine-3000');
    results.forEach((item) => expect(item.targetGoals).toContain('fat_loss'));
  });

  it('excludes lactose products for lactose_free profiles', () => {
    const results = generateRecommendations({
      ...baseProfile,
      dietaryRestrictions: ['lactose_free'],
    });
    const ids = results.map((item) => item.id);

    expect(ids).not.toContain('on-gold-standard-whey');
    expect(ids).toContain('dymatize-iso100');
    results.forEach((item) => expect(item.containsLactose).toBe(false));
  });

  it('excludes animal products for vegan profiles', () => {
    const results = generateRecommendations({ ...baseProfile, dietaryRestrictions: ['vegan'] });
    const ids = results.map((item) => item.id);

    expect(ids).not.toContain('dymatize-iso100');
    expect(ids).not.toContain('on-gold-standard-whey');
    expect(ids).toContain('orgain-plant-protein');
    results.forEach((item) => expect(item.containsAnimalProducts).toBe(false));
  });

  it('excludes caffeinated products for caffeine_free profiles', () => {
    const results = generateRecommendations({
      ...baseProfile,
      dietaryRestrictions: ['caffeine_free'],
    });

    expect(results.map((item) => item.id)).not.toContain('cellucor-c4-preworkout');
  });

  it('scores primary goal matches above secondary matches and sorts descending', () => {
    const results = generateRecommendations(baseProfile);
    const scores = results.map((item) => item.matchScore);

    expect(scores).toEqual([...scores].sort((a, b) => b - a));
    expect(results.find((item) => item.id === 'muscleadd-creatine')?.matchScore).toBe(
      PRIMARY_MATCH_SCORE,
    );
    expect(results.find((item) => item.id === 'orgain-plant-protein')?.matchScore).toBe(
      SECONDARY_MATCH_SCORE,
    );
  });

  it('personalises dosage by body weight', () => {
    const light = generateRecommendations({ ...baseProfile, weightKg: 60 });
    const heavy = generateRecommendations({ ...baseProfile, weightKg: 100 });

    const creatine = (list: typeof light) =>
      list.find((item) => item.id === 'muscleadd-creatine')?.recommendedDosage;

    expect(creatine(generateRecommendations(baseProfile))).toBe('3.9 g daily');
    expect(creatine(light)).toBe('3 g daily');
    expect(creatine(heavy)).toBe('5 g daily');
  });

  it('works with a custom catalog', () => {
    const results = generateRecommendations(baseProfile, undefined, SUPPLEMENT_CATALOG.slice(0, 1));

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('dymatize-iso100');
  });
});

describe('isValidBarcodeFormat', () => {
  it.each(['12345678', '0748927028669', '6224001234567', '12345678901234'])(
    'accepts valid barcode %s',
    (barcode) => {
      expect(isValidBarcodeFormat(barcode)).toBe(true);
    },
  );

  it.each(['1234567', '123456789012345', 'ABC12345678', '0748-927028669', ''])(
    'rejects invalid barcode "%s"',
    (barcode) => {
      expect(isValidBarcodeFormat(barcode)).toBe(false);
    },
  );
});
