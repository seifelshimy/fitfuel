// Mohamed Salim: Goal Recommendations screen state.

import { useCallback, useEffect, useState } from 'react';
import { useFitnessProfile } from '@/context/FitnessProfileContext';
import { FitnessGoal, SupplementRecommendation } from '@/models/fitness';
import { getRecommendationsForProfile } from '@/services/recommendationService';

/** 'profile' means "use the goal saved in the fitness profile". */
export type GoalFilter = FitnessGoal | 'profile';

export const GOAL_FILTERS: GoalFilter[] = [
  'profile',
  'muscle_gain',
  'fat_loss',
  'endurance',
  'general_health',
];

export function useRecommendationsViewModel() {
  const {
    profile,
    isLoading: isProfileLoading,
    error: profileError,
    reloadProfile,
  } = useFitnessProfile();

  const [goalFilter, setGoalFilter] = useState<GoalFilter>('profile');
  const [recommendations, setRecommendations] = useState<SupplementRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeGoal: FitnessGoal | null =
    goalFilter === 'profile' ? (profile?.goal ?? null) : goalFilter;

  const load = useCallback(async () => {
    if (!profile) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const overrideGoal = goalFilter === 'profile' ? undefined : goalFilter;
      setRecommendations(await getRecommendationsForProfile(profile, overrideGoal));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load recommendations.');
    } finally {
      setIsLoading(false);
    }
  }, [profile, goalFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const reload = useCallback(async () => {
    if (profileError || !profile) {
      await reloadProfile();
      return;
    }
    await load();
  }, [profile, profileError, reloadProfile, load]);

  const resetFilter = useCallback(() => setGoalFilter('profile'), []);

  const loading = isProfileLoading || (Boolean(profile) && isLoading);
  const combinedError = profileError ?? error;

  return {
    profile,
    goalFilter,
    activeGoal,
    recommendations,
    isLoading: loading,
    error: combinedError,
    isEmpty: !loading && !combinedError && recommendations.length === 0,
    setGoalFilter,
    resetFilter,
    reload,
  };
}
