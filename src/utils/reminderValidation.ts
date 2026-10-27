// Validation (Seif Elshimy): checks the reminder form before saving.
// Pure functions with no React code, so they are easy to unit test in Phase 2.

import { ReminderDraft } from '@/models/reminder';

export const MAX_NAME_LENGTH = 40;
export const MAX_DOSE_LENGTH = 30;

// 00:00 to 23:59. Two digits for the hour, a colon, two digits for the minutes.
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export interface ReminderErrors {
  supplementName?: string;
  dose?: string;
  time?: string;
  days?: string;
}

export function validateReminder(draft: ReminderDraft): ReminderErrors {
  const errors: ReminderErrors = {};
  const name = draft.supplementName.trim();
  const dose = draft.dose.trim();

  if (name.length === 0) errors.supplementName = 'Enter the supplement name.';
  else if (name.length > MAX_NAME_LENGTH) errors.supplementName = `Use ${MAX_NAME_LENGTH} characters or fewer.`;

  if (dose.length === 0) errors.dose = 'Enter the dose, e.g. 1 scoop or 5 g.';
  else if (dose.length > MAX_DOSE_LENGTH) errors.dose = `Use ${MAX_DOSE_LENGTH} characters or fewer.`;

  if (!TIME_PATTERN.test(draft.time.trim())) errors.time = 'Use 24-hour time, e.g. 08:30 or 21:00.';

  if (draft.days.length === 0) errors.days = 'Choose at least one day.';

  return errors;
}

export function hasErrors(errors: ReminderErrors): boolean {
  return Object.values(errors).some(Boolean);
}