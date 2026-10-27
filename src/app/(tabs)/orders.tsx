// Screen 3 (Saif): Orders. Order history with status tracking and receipts.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OrderStatusCard } from '@/components/OrderStatusCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { colors, radius, spacing, typography } from '@/theme';
import { useOrdersViewModel } from '@/viewmodels/useOrdersViewModel';

const MONOSPACE = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

export default function OrdersScreen() {
  const vm = useOrdersViewModel();

  let body: React.ReactNode;

  if (vm.isLoading && vm.orders.length === 0) {
    body = <LoadingState message="Loading your orders…" />;
  } else if (vm.error) {
    body = <ErrorState message={vm.error} onRetry={vm.reloadOrders} />;
  } else if (vm.isEmpty) {
    body = (
      <EmptyState
        icon="receipt-outline"
        title="No orders yet"
        message="Orders you place at checkout will appear here so you can track them."
        actionLabel="Refresh"
        onAction={vm.reloadOrders}
      />
    );
  } else {
    body = (
      <FlatList
        data={vm.orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={styles.content}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={vm.isLoading} onRefresh={vm.reloadOrders} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={typography.display}>Your orders</Text>
            <Text style={typography.caption}>Track deliveries and open your receipts.</Text>
            {vm.placedOrderId ? (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={styles.successText}>Order {vm.placedOrderId} placed. Thank you!</Text>
              </View>
            ) : null}
            {vm.actionError ? (
              <View style={styles.errorBanner} accessibilityRole="alert">
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.errorText}>{vm.actionError}</Text>
              </View>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <OrderStatusCard
            order={item}
            isUpdating={vm.updatingOrderId === item.id}
            isHighlighted={vm.placedOrderId === item.id}
            onAdvanceStatus={() => vm.stepOrderStatus(item.id)}
            onViewReceipt={() => vm.openReceipt(item)}
          />
        )}
      />
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {body}

      <Modal
        visible={vm.isReceiptVisible}
        animationType="slide"
        transparent
        onRequestClose={vm.closeReceipt}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={typography.title}>Receipt</Text>
              <Pressable
                onPress={vm.closeReceipt}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel="Close receipt"
              >
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>

            {vm.isReceiptLoading ? (
              <View style={styles.receiptState}>
                <ActivityIndicator color={colors.ink} />
              </View>
            ) : vm.receiptError ? (
              <View style={styles.receiptState}>
                <Text style={[typography.body, styles.errorText]}>{vm.receiptError}</Text>
              </View>
            ) : (
              <ScrollView style={styles.receiptScroll} contentContainerStyle={styles.receiptPaper}>
                <Text style={styles.receiptText} selectable>
                  {vm.receiptText}
                </Text>
              </ScrollView>
            )}

            <PrimaryButton label="Done" onPress={vm.closeReceipt} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  separator: {
    height: spacing.md,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#E2F6D5',
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  successText: {
    flex: 1,
    color: colors.success,
    fontSize: 14,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  errorText: {
    flex: 1,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(21, 23, 27, 0.45)',
  },
  sheet: {
    maxHeight: '85%',
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  receiptState: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
  },
  receiptScroll: {
    flexGrow: 0,
  },
  receiptPaper: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  receiptText: {
    fontFamily: MONOSPACE,
    fontSize: 12,
    lineHeight: 18,
    color: colors.ink,
  },
});
