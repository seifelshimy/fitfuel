// Mohamed Salim: shares the fitness profile and its daily targets across tabs.

import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { DailyTargets, FitnessProfile } from '@/models/fitness';
import { getFitnessProfile, saveFitnessProfile } from '@/services/profileService';
import { calculateDailyTargets } from '@/utils/fitnessCalculator';

interface FitnessProfileContextValue {
  profile: FitnessProfile | null;
  targets: DailyTargets | null;
  isLoading: boolean;
  error: string | null;
  updateProfile: (profile: FitnessProfile) => Promise<FitnessProfile>;
  reloadProfile: () => Promise<void>;
}

const FitnessProfileContext = createContext<FitnessProfileContextValue | null>(null);

export function FitnessProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FitnessProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reloadProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setProfile(await getFitnessProfile());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load your fitness profile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (next: FitnessProfile) => {
    const saved = await saveFitnessProfile(next);
    setProfile(saved);
    return saved;
  }, []);

  useEffect(() => {
    void reloadProfile();
  }, [reloadProfile]);

  const targets = useMemo(
    () =>
      profile
        ? calculateDailyTargets(
            profile.weightKg,
            profile.heightCm,
            profile.age,
            profile.activityLevel,
            profile.goal,
          )
        : null,
    [profile],
  );

  const value = useMemo(
    () => ({ profile, targets, isLoading, error, updateProfile, reloadProfile }),
    [profile, targets, isLoading, error, updateProfile, reloadProfile],
  );

  return <FitnessProfileContext.Provider value={value}>{children}</FitnessProfileContext.Provider>;
}

export function useFitnessProfile(): FitnessProfileContextValue {
  const context = useContext(FitnessProfileContext);
  if (!context) {
    throw new Error('useFitnessProfile must be used inside FitnessProfileProvider.');
  }
  return context;
}
