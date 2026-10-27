// Mohamed Salim: async boundary around the pure recommendation engine.

import { FitnessGoal, FitnessProfile, SupplementRecommendation } from '@/models/fitness';
import { generateRecommendations } from '@/utils/recommendationEngine';

export async function getRecommendationsForProfile(
  profile: FitnessProfile,
  selectedGoal?: FitnessGoal,
): Promise<SupplementRecommendation[]> {
  try {
    return generateRecommendations(profile, selectedGoal);
  } catch {
    throw new Error('Unable to build supplement recommendations for your profile.');
  }
}
