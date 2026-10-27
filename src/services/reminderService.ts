// Model layer (Seif Elshimy): the only place that knows where reminders are stored.
// Phase 1 keeps them in memory. Phase 2: a Firestore/AsyncStorage version that
// implements the same ReminderRepository interface, plus expo-notifications.

import { Reminder, ReminderDraft } from '@/models/reminder';

export interface ReminderRepository {
  getAll(): Promise<Reminder[]>;
  add(draft: ReminderDraft): Promise<Reminder>;
  update(id: string, changes: Partial<Omit<Reminder, 'id'>>): Promise<Reminder>;
  remove(id: string): Promise<void>;
}

const NETWORK_DELAY_MS = 300;

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class MockReminderRepository implements ReminderRepository {
  private reminders: Reminder[] = [
    {
      id: 'rem1',
      supplementName: 'Creatine Monohydrate',
      dose: '5 g',
      time: '08:00',
      days: ['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'],
      enabled: true,
    },
    {
      id: 'rem2',
      supplementName: 'Whey Isolate',
      dose: '1 scoop',
      time: '18:30',
      days: ['sat', 'mon', 'wed'],
      enabled: false,
    },
  ];

  async getAll(): Promise<Reminder[]> {
    await wait(NETWORK_DELAY_MS);
    return [...this.reminders].sort((a, b) => a.time.localeCompare(b.time)); // earliest first
  }

  async add(draft: ReminderDraft): Promise<Reminder> {
    await wait(NETWORK_DELAY_MS);
    const reminder: Reminder = { ...draft, id: `rem${Date.now()}`, enabled: true };
    this.reminders = [...this.reminders, reminder];
    return reminder;
  }

  async update(id: string, changes: Partial<Omit<Reminder, 'id'>>): Promise<Reminder> {
    await wait(NETWORK_DELAY_MS);
    const existing = this.reminders.find((r) => r.id === id);
    if (!existing) throw new Error('This reminder no longer exists.');
    const updated = { ...existing, ...changes };
    this.reminders = this.reminders.map((r) => (r.id === id ? updated : r));
    return updated;
  }

  async remove(id: string): Promise<void> {
    await wait(NETWORK_DELAY_MS);
    this.reminders = this.reminders.filter((r) => r.id !== id);
  }
}

export const reminderRepository: ReminderRepository = new MockReminderRepository();