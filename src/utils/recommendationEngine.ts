// Mohamed Salim: pure goal-based supplement recommendation rules.

import {
  DietaryRestriction,
  FitnessGoal,
  FitnessProfile,
  GOAL_LABELS,
  RESTRICTION_LABELS,
  SupplementCatalogItem,
  SupplementRecommendation,
} from '@/models/fitness';

export const PRIMARY_MATCH_SCORE = 96;
export const SECONDARY_MATCH_SCORE = 85;

const BARCODE_PATTERN = /^\d{8,14}$/;

export const SUPPLEMENT_CATALOG: SupplementCatalogItem[] = [
  {
    id: 'dymatize-iso100',
    name: 'ISO100 Hydrolyzed Whey Isolate',
    brand: 'Dymatize',
    category: 'protein',
    price: 4850,
    targetGoals: ['muscle_gain', 'fat_loss'],
    tags: ['Whey isolate', 'Low lactose', 'Gluten-free'],
    containsLactose: false,
    containsAnimalProducts: true,
    containsGluten: false,
    containsCaffeine: false,
    baseServingNote: '1 scoop (30 g) = 25 g protein',
    dosagePerKg: 0.4,
    dosageUnit: 'g',
  },
  {
    id: 'on-gold-standard-whey',
    name: 'Gold Standard 100% Whey',
    brand: 'Optimum Nutrition',
    category: 'protein',
    price: 3950,
    targetGoals: ['muscle_gain', 'general_health'],
    tags: ['Whey blend', 'Contains milk'],
    containsLactose: true,
    containsAnimalProducts: true,
    containsGluten: false,
    containsCaffeine: false,
    baseServingNote: '1 scoop (30.4 g) = 24 g protein',
    dosagePerKg: 0.4,
    dosageUnit: 'g',
  },
  {
    id: 'orgain-plant-protein',
    name: 'Organic Plant-Based Protein Powder',
    brand: 'Orgain',
    category: 'protein',
    price: 2400,
    targetGoals: ['general_health', 'muscle_gain', 'fat_loss'],
    tags: ['Vegan', 'Dairy-free', 'Gluten-free'],
    containsLactose: false,
    containsAnimalProducts: false,
    containsGluten: false,
    containsCaffeine: false,
    baseServingNote: '2 scoops (46 g) = 21 g protein',
    dosagePerKg: 0.6,
    dosageUnit: 'g',
  },
  {
    id: 'muscleadd-creatine',
    name: 'Micronized Creatine Monohydrate',
    brand: 'MuscleAdd',
    category: 'creatine',
    price: 1150,
    targetGoals: ['muscle_gain', 'endurance'],
    tags: ['Vegan', 'Unflavoured', 'Made in Egypt'],
    containsLactose: false,
    containsAnimalProducts: false,
    containsGluten: false,
    containsCaffeine: false,
    baseServingNote: '1 scoop = 5 g creatine monohydrate',
    dosagePerKg: 0.05,
    dosageUnit: 'g',
  },
  {
    id: 'biotech-l-carnitine-3000',
    name: 'L-Carnitine 3000 Liquid',
    brand: 'BioTechUSA',
    category: 'vitamins',
    price: 1350,
    targetGoals: ['fat_loss', 'endurance'],
    tags: ['Vegan', 'Sugar-free', 'Stimulant-free'],
    containsLactose: false,
    containsAnimalProducts: false,
    containsGluten: false,
    containsCaffeine: false,
    baseServingNote: '1 ampoule (25 ml) = 3000 mg L-carnitine',
    dosagePerKg: 38,
    dosageUnit: 'mg',
  },
  {
    id: 'cellucor-c4-preworkout',
    name: 'C4 Original Pre-Workout',
    brand: 'Cellucor',
    category: 'pre-workout',
    price: 1900,
    targetGoals: ['endurance', 'muscle_gain'],
    tags: ['150 mg caffeine', 'Beta-alanine'],
    containsLactose: false,
    containsAnimalProducts: false,
    containsGluten: false,
    containsCaffeine: true,
    baseServingNote: '1 scoop (6.5 g) = 150 mg caffeine',
    dosagePerKg: 0.08,
    dosageUnit: 'g',
  },
  {
    id: 'now-ultra-omega-3',
    name: 'Ultra Omega-3 Fish Oil',
    brand: 'NOW Foods',
    category: 'vitamins',
    price: 1250,
    targetGoals: ['general_health', 'endurance'],
    tags: ['EPA + DHA', 'Molecularly distilled'],
    containsLactose: false,
    containsAnimalProducts: true,
    containsGluten: false,
    containsCaffeine: false,
    baseServingNote: '1 softgel = 750 mg EPA + DHA',
    dosagePerKg: 13,
    dosageUnit: 'mg',
  },
];

export function isValidBarcodeFormat(barcode: string): boolean {
  return BARCODE_PATTERN.test(barcode.trim());
}

export function passesDietaryRestrictions(
  item: SupplementCatalogItem,
  restrictions: DietaryRestriction[],
): boolean {
  return restrictions.every((restriction) => {
    switch (restriction) {
      case 'lactose_free':
        return !item.containsLactose;
      case 'vegan':
        return !item.containsAnimalProducts && !item.containsLactose;
      case 'gluten_free':
        return !item.containsGluten;
      case 'caffeine_free':
        return !item.containsCaffeine;
      default:
        return true;
    }
  });
}

/** Scales the catalog dosage by body weight, e.g. 78 kg * 0.05 g/kg -> "3.9 g". */
export function calculateDosage(item: SupplementCatalogItem, weightKg: number): string {
  const amount = item.dosagePerKg * weightKg;

  if (item.dosageUnit === 'mg') {
    return `${(Math.round(amount / 10) * 10).toLocaleString('en-US')} mg daily`;
  }

  const rounded = amount < 10 ? Math.round(amount * 10) / 10 : Math.round(amount);
  return `${rounded} g daily`;
}

function buildReason(
  item: SupplementCatalogItem,
  goal: FitnessGoal,
  isPrimary: boolean,
  restrictions: DietaryRestriction[],
): string {
  const goalLabel = GOAL_LABELS[goal];
  const base = isPrimary
    ? `Primary pick for ${goalLabel}.`
    : `Supports ${goalLabel} alongside your main stack.`;

  const active = restrictions.filter((restriction) => restriction !== 'none');
  if (!active.length) {
    return base;
  }

  const fits = active.map((restriction) => RESTRICTION_LABELS[restriction].toLowerCase()).join(', ');
  return `${base} Fits your ${fits} needs.`;
}

export function generateRecommendations(
  profile: FitnessProfile,
  overrideGoal?: FitnessGoal,
  catalog: SupplementCatalogItem[] = SUPPLEMENT_CATALOG,
): SupplementRecommendation[] {
  const goal = overrideGoal ?? profile.goal;

  return catalog
    .filter((item) => passesDietaryRestrictions(item, profile.dietaryRestrictions))
    .filter((item) => item.targetGoals.includes(goal))
    .map((item) => {
      const { dosagePerKg, dosageUnit, ...rest } = item;
      const isPrimary = item.targetGoals[0] === goal;

      return {
        ...rest,
        matchScore: isPrimary ? PRIMARY_MATCH_SCORE : SECONDARY_MATCH_SCORE,
        recommendedDosage: calculateDosage(item, profile.weightKg),
        reason: buildReason(item, goal, isPrimary, profile.dietaryRestrictions),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore || a.price - b.price);
}
