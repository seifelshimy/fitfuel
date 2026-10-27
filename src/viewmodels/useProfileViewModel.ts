// Mohamed Salim: Fitness Profile screen state, validation and live targets.

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFitnessProfile } from '@/context/FitnessProfileContext';
import {
  ActivityLevel,
  DailyTargets,
  DietaryRestriction,
  FitnessGoal,
  FitnessProfile,
  FitnessProfileFormInput,
  ProfileValidationResult,
} from '@/models/fitness';
import { calculateDailyTargets, validateProfileForm } from '@/utils/fitnessCalculator';

function toFormInput(profile: FitnessProfile): FitnessProfileFormInput {
  return {
    fullName: profile.fullName,
    age: String(profile.age),
    weightKg: String(profile.weightKg),
    heightCm: String(profile.heightCm),
    goal: profile.goal,
    activityLevel: profile.activityLevel,
    dietaryRestrictions: profile.dietaryRestrictions,
  };
}

export function useProfileViewModel() {
  const { profile, targets: savedTargets, isLoading, error, updateProfile, reloadProfile } =
    useFitnessProfile();

  const [form, setForm] = useState<FitnessProfileFormInput | null>(null);
  const [errors, setErrors] = useState<ProfileValidationResult['errors']>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm(toFormInput(profile));
    }
  }, [profile]);

  const updateField = useCallback(
    <K extends keyof FitnessProfileFormInput>(field: K, value: FitnessProfileFormInput[K]) => {
      setForm((current) => (current ? { ...current, [field]: value } : current));
      setErrors((current) => ({ ...current, [field]: undefined }));
      setConfirmation(null);
    },
    [],
  );

  const setGoal = useCallback((goal: FitnessGoal) => updateField('goal', goal), [updateField]);

  const setActivityLevel = useCallback(
    (level: ActivityLevel) => updateField('activityLevel', level),
    [updateField],
  );

  const toggleRestriction = useCallback(
    (restriction: DietaryRestriction) => {
      if (!form) {
        return;
      }
      if (restriction === 'none') {
        updateField('dietaryRestrictions', []);
        return;
      }
      const current = form.dietaryRestrictions.filter((item) => item !== 'none');
      const next = current.includes(restriction)
        ? current.filter((item) => item !== restriction)
        : [...current, restriction];
      updateField('dietaryRestrictions', next);
    },
    [form, updateField],
  );

  // Live preview: recalculate while typing, fall back to saved targets if input is invalid.
  const targets: DailyTargets | null = useMemo(() => {
    if (!form) {
      return savedTargets;
    }
    if (!validateProfileForm(form).isValid) {
      return savedTargets;
    }
    return calculateDailyTargets(
      Number(form.weightKg),
      Number(form.heightCm),
      Number(form.age),
      form.activityLevel,
      form.goal,
    );
  }, [form, savedTargets]);

  const save = useCallback(async () => {
    if (!form || !profile) {
      return;
    }

    const result = validateProfileForm(form);
    setErrors(result.errors);
    setConfirmation(null);
    if (!result.isValid) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await updateProfile({
        ...profile,
        fullName: form.fullName.trim(),
        age: Number(form.age),
        weightKg: Number(form.weightKg),
        heightCm: Number(form.heightCm),
        goal: form.goal,
        activityLevel: form.activityLevel,
        dietaryRestrictions: form.dietaryRestrictions,
      });
      setConfirmation('Profile saved. Your targets and recommendations are updated.');
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Unable to save your fitness profile.');
    } finally {
      setIsSaving(false);
    }
  }, [form, profile, updateProfile]);

  return {
    form,
    errors,
    targets,
    isLoading,
    error,
    isEmpty: !isLoading && !error && !profile,
    isSaving,
    saveError,
    confirmation,
    updateField,
    setGoal,
    setActivityLevel,
    toggleRestriction,
    save,
    reload: reloadProfile,
  };
}
