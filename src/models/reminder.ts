// Model layer (Seif Elshimy): the shape of one supplement reminder.

export type Weekday = 'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri';

// The week starts on Saturday, as in Egypt.
export const WEEKDAYS: { id: Weekday; label: string }[] = [
  { id: 'sat', label: 'Sat' },
  { id: 'sun', label: 'Sun' },
  { id: 'mon', label: 'Mon' },
  { id: 'tue', label: 'Tue' },
  { id: 'wed', label: 'Wed' },
  { id: 'thu', label: 'Thu' },
  { id: 'fri', label: 'Fri' },
];

export interface Reminder {
  id: string;
  supplementName: string; // e.g. "Creatine"
  dose: string;           // e.g. "5 g" or "1 scoop"
  time: string;           // 24-hour "HH:MM", e.g. "08:30"
  days: Weekday[];        // which days it repeats
  enabled: boolean;       // the on/off switch
}

/** What the user fills in on the form. The id and on/off state are added by the app. */
export type ReminderDraft = Omit<Reminder, 'id' | 'enabled'>;

/** "Every day", or the chosen days in week order, e.g. "Sat, Mon, Wed". */
export function formatDays(days: Weekday[]): string {
  if (days.length === WEEKDAYS.length) return 'Every day';
  return WEEKDAYS.filter((w) => days.includes(w.id))
    .map((w) => w.label)
    .join(', ');
}