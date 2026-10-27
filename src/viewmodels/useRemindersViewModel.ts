// ViewModel for the Reminders screen (Seif Elshimy).
// Holds the list, the create/edit form, validation, and the delete confirmation.

import { useState } from 'react';
import { Reminder, ReminderDraft, Weekday, WEEKDAYS } from '@/models/reminder';
import { reminderRepository } from '@/services/reminderService';
import { toUserMessage } from '@/services/productService';
import { hasErrors, ReminderErrors, validateReminder } from '@/utils/reminderValidation';
import { useAsyncData } from './useAsyncData';

const EMPTY_DRAFT: ReminderDraft = { supplementName: '', dose: '', time: '', days: [] };

export function useRemindersViewModel() {
  const list = useAsyncData(() => reminderRepository.getAll(), []);
  const reminders = list.data ?? [];

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = creating a new one
  const [draft, setDraft] = useState<ReminderDraft>(EMPTY_DRAFT);
  const [errors, setErrors] = useState<ReminderErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const resetForm = (id: string | null, values: ReminderDraft) => {
    setEditingId(id);
    setDraft(values);
    setErrors({});
    setConfirmDelete(false);
    setActionError(null);
    setFormOpen(true);
  };

  const openCreate = () => resetForm(null, EMPTY_DRAFT);
  const openEdit = (r: Reminder) =>
    resetForm(r.id, { supplementName: r.supplementName, dose: r.dose, time: r.time, days: r.days });
  const closeForm = () => setFormOpen(false);

  // Changing a field clears that field's error.
  const updateDraft = (changes: Partial<ReminderDraft>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(changes) as (keyof ReminderDraft)[]) delete next[key];
      return next;
    });
  };

  // Add or remove a day, and keep the days in week order.
  const toggleDay = (day: Weekday) => {
    const picked = draft.days.includes(day) ? draft.days.filter((d) => d !== day) : [...draft.days, day];
    updateDraft({ days: WEEKDAYS.map((w) => w.id).filter((id) => picked.includes(id)) });
  };

  const save = async () => {
    const clean: ReminderDraft = {
      supplementName: draft.supplementName.trim(),
      dose: draft.dose.trim(),
      time: draft.time.trim(),
      days: draft.days,
    };
    const found = validateReminder(clean);
    setErrors(found);
    if (hasErrors(found)) return;

    setSaving(true);
    setActionError(null);
    try {
      if (editingId) await reminderRepository.update(editingId, clean);
      else await reminderRepository.add(clean);
      setFormOpen(false);
      list.refresh();
    } catch (e) {
      setActionError(toUserMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // Used by the switch and by delete: run the change, then reload the list.
  const runAction = async (work: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await work();
      list.refresh();
    } catch (e) {
      setActionError(toUserMessage(e));
    }
  };

  const toggleEnabled = (r: Reminder) => runAction(() => reminderRepository.update(r.id, { enabled: !r.enabled }));

  // First tap asks for confirmation, second tap deletes.
  const deleteEditing = () => {
    if (!editingId) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    const id = editingId;
    setFormOpen(false);
    runAction(() => reminderRepository.remove(id));
  };

  const activeCount = reminders.filter((r) => r.enabled).length;

  return {
    status: list.status,
    error: list.error,
    retry: list.reload,
    reminders,
    activeLabel: `${activeCount} of ${reminders.length} on`,
    toggleEnabled,
    actionError,

    formOpen,
    isEditing: editingId !== null,
    openCreate,
    openEdit,
    closeForm,
    draft,
    updateDraft,
    toggleDay,
    errors,
    saving,
    save,
    confirmDelete,
    deleteEditing,
  };
}

export type RemindersViewModel = ReturnType<typeof useRemindersViewModel>;