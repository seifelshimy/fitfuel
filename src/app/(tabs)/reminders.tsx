// View: Reminders screen (Seif Elshimy).
// List of reminders with an on/off switch; one form (in a sheet) to create and edit.

import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { formatDays, Reminder, WEEKDAYS } from '@/models/reminder';
import { colors, radius, spacing, typography } from '@/theme';
import { MAX_DOSE_LENGTH, MAX_NAME_LENGTH } from '@/utils/reminderValidation';
import { RemindersViewModel, useRemindersViewModel } from '@/viewmodels/useRemindersViewModel';

export default function RemindersScreen() {
  const vm = useRemindersViewModel();

  const renderBody = () => {
    if (vm.status === 'loading') return <LoadingState message="Loading reminders…" />;
    if (vm.status === 'error') return <ErrorState message={vm.error ?? ''} onRetry={vm.retry} />;
    if (vm.reminders.length === 0) {
      return (
        <EmptyState
          icon="alarm-outline"
          title="No reminders yet"
          message="Add a reminder so you never miss a dose."
          actionLabel="Add reminder"
          onAction={vm.openCreate}
        />
      );
    }
    return (
      <FlatList
        data={vm.reminders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <ReminderRow reminder={item} onPress={() => vm.openEdit(item)} onToggle={() => vm.toggleEnabled(item)} />
        )}
      />
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={typography.display}>Reminders</Text>
          {vm.status === 'success' && vm.reminders.length > 0 ? (
            <Text style={[typography.caption, styles.count]}>{vm.activeLabel}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={vm.openCreate}
          accessibilityRole="button"
          accessibilityLabel="Add reminder"
          style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.7 }]}
        >
          <Ionicons name="add" size={26} color={colors.accentInk} />
        </Pressable>
      </View>

      {vm.actionError && !vm.formOpen ? <Text style={[styles.error, styles.banner]}>{vm.actionError}</Text> : null}

      {renderBody()}
      <ReminderForm vm={vm} />
    </SafeAreaView>
  );
}

function ReminderRow({ reminder, onPress, onToggle }: { reminder: Reminder; onPress: () => void; onToggle: () => void }) {
  return (
    <View style={[styles.row, !reminder.enabled && styles.rowOff]}>
      {/* Tapping the left part opens the edit form. */}
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${reminder.supplementName} reminder at ${reminder.time}`}
        style={({ pressed }) => [styles.rowTap, pressed && { opacity: 0.7 }]}
      >
        <View style={styles.rowIcon}>
          <Ionicons name="alarm-outline" size={22} color={colors.ink} />
        </View>
        <View style={styles.rowBody}>
          <Text style={styles.rowTime}>{reminder.time}</Text>
          <Text style={typography.subtitle} numberOfLines={1}>
            {reminder.supplementName}
          </Text>
          <Text style={typography.caption}>
            {reminder.dose} · {formatDays(reminder.days)}
          </Text>
        </View>
      </Pressable>

      {/* The switch sits beside the tappable area, not inside it,
          so a tap on the switch only toggles it. */}
      <Switch
        value={reminder.enabled}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.surface}
        accessibilityLabel={`${reminder.supplementName} reminder ${reminder.enabled ? 'on' : 'off'}`}
      />
    </View>
  );
}

function ReminderForm({ vm }: { vm: RemindersViewModel }) {
  return (
    <Modal visible={vm.formOpen} animationType="slide" transparent onRequestClose={vm.closeForm}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={vm.closeForm} accessibilityLabel="Close form" />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={typography.title}>{vm.isEditing ? 'Edit reminder' : 'New reminder'}</Text>

            <Field
              label="Supplement"
              value={vm.draft.supplementName}
              onChangeText={(text) => vm.updateDraft({ supplementName: text })}
              placeholder="e.g. Creatine"
              maxLength={MAX_NAME_LENGTH}
              error={vm.errors.supplementName}
            />
            <Field
              label="Dose"
              value={vm.draft.dose}
              onChangeText={(text) => vm.updateDraft({ dose: text })}
              placeholder="e.g. 5 g or 1 scoop"
              maxLength={MAX_DOSE_LENGTH}
              error={vm.errors.dose}
            />
            <Field
              label="Time (24-hour)"
              value={vm.draft.time}
              onChangeText={(text) => vm.updateDraft({ time: text })}
              placeholder="08:30"
              maxLength={5}
              keyboardType="numbers-and-punctuation"
              error={vm.errors.time}
            />

            <Text style={[typography.label, styles.fieldLabel]}>Repeat on</Text>
            <View style={styles.days}>
              {WEEKDAYS.map((w) => (
                <Chip
                  key={w.id}
                  label={w.label}
                  selected={vm.draft.days.includes(w.id)}
                  onPress={() => vm.toggleDay(w.id)}
                />
              ))}
            </View>
            {vm.errors.days ? <Text style={styles.error}>{vm.errors.days}</Text> : null}

            {vm.actionError ? <Text style={styles.error}>{vm.actionError}</Text> : null}

            <View style={styles.formButtons}>
              <PrimaryButton
                label={vm.saving ? 'Saving…' : vm.isEditing ? 'Save changes' : 'Add reminder'}
                onPress={vm.save}
                variant="accent"
                disabled={vm.saving}
              />
              <PrimaryButton label="Cancel" onPress={vm.closeForm} variant="secondary" />
            </View>

            {vm.isEditing ? (
              <Pressable onPress={vm.deleteEditing} accessibilityRole="button" style={styles.deleteButton}>
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={styles.deleteText}>
                  {vm.confirmDelete ? 'Tap again to delete' : 'Delete reminder'}
                </Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  maxLength: number;
  error?: string;
  keyboardType?: 'default' | 'numbers-and-punctuation';
}) {
  return (
    <View>
      <Text style={[typography.label, styles.fieldLabel]}>{props.label}</Text>
      <TextInput
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.muted}
        maxLength={props.maxLength}
        keyboardType={props.keyboardType ?? 'default'}
        style={[styles.input, props.error ? styles.inputError : null]}
        accessibilityLabel={props.label}
      />
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerText: { flex: 1 },
  count: { marginTop: spacing.xs },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  banner: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  rowOff: { opacity: 0.55 },
  rowTap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowBody: { flex: 1, gap: 2 },
  rowTime: { fontSize: 22, fontWeight: '800', color: colors.ink, letterSpacing: -0.4 },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '90%',
  },
  fieldLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 15,
    color: colors.ink,
    backgroundColor: colors.background,
  },
  inputError: { borderColor: colors.danger },
  days: { flexDirection: 'row', flexWrap: 'wrap' },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  formButtons: { gap: spacing.sm, marginTop: spacing.xl },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
});