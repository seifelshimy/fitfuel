import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import {
  ORDER_STATUS_FLOW,
  ORDER_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type Order,
  type OrderStatus,
} from '@/models/order';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  order: Order;
  isUpdating?: boolean;
  isHighlighted?: boolean;
  onAdvanceStatus: () => void;
  onViewReceipt: () => void;
}

const STATUS_BADGE: Record<OrderStatus, { bg: string; fg: string }> = {
  pending: { bg: colors.surfaceMuted, fg: colors.inkSoft },
  confirmed: { bg: '#DCE8FF', fg: '#1F3F7A' },
  out_for_delivery: { bg: '#FFE3D3', fg: '#8A3B12' },
  delivered: { bg: '#E2F6D5', fg: colors.success },
};

function formatOrderDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OrderStatusCard({ order, isUpdating, isHighlighted, onAdvanceStatus, onViewReceipt }: Props) {
  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const isDelivered = order.status === 'delivered';
  const badge = STATUS_BADGE[order.status];
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={[styles.card, isHighlighted && styles.highlighted]}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={typography.subtitle}>Order {order.id}</Text>
          <Text style={typography.caption}>{formatOrderDate(order.createdAt)}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]}>{ORDER_STATUS_LABELS[order.status]}</Text>
        </View>
      </View>

      <View style={styles.progress} accessibilityLabel={`Step ${stepIndex + 1} of ${ORDER_STATUS_FLOW.length}`}>
        {ORDER_STATUS_FLOW.map((status, index) => (
          <View key={status} style={styles.progressStep}>
            <View style={[styles.progressBar, index <= stepIndex && styles.progressBarActive]} />
            <Text
              style={[styles.progressLabel, index <= stepIndex && styles.progressLabelActive]}
              numberOfLines={1}
            >
              {ORDER_STATUS_LABELS[status]}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={16} color={colors.muted} />
        <Text style={[typography.body, styles.detailText]} numberOfLines={2}>
          {order.deliveryLocation.formattedAddress}
        </Text>
      </View>
      <View style={styles.detailRow}>
        <Ionicons name="cube-outline" size={16} color={colors.muted} />
        <Text style={[typography.body, styles.detailText]}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View style={styles.totalRow}>
        <View style={styles.paymentBadge}>
          <Ionicons
            name={order.paymentMethod === 'cod' ? 'cash-outline' : 'card-outline'}
            size={14}
            color={colors.inkSoft}
          />
          <Text style={styles.paymentText}>
            {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {order.paymentStatus === 'paid' ? 'Paid' : 'Pay on delivery'}
          </Text>
        </View>
        <Text style={styles.total}>{formatPrice(order.totals.total)}</Text>
      </View>

      <View style={styles.actions}>
        {!isDelivered ? (
          <View style={styles.action}>
            <PrimaryButton
              label={isUpdating ? 'Updating…' : 'Simulate next status'}
              icon="play-forward-outline"
              variant="secondary"
              onPress={onAdvanceStatus}
              disabled={isUpdating}
            />
          </View>
        ) : null}
        <View style={styles.action}>
          <PrimaryButton label="View receipt" icon="receipt-outline" onPress={onViewReceipt} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.md,
  },
  highlighted: {
    borderColor: colors.ink,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progress: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  progressStep: {
    flex: 1,
    gap: spacing.xs,
  },
  progressBar: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
  },
  progressBarActive: {
    backgroundColor: colors.accent,
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.muted,
  },
  progressLabelActive: {
    color: colors.ink,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  detailText: {
    flex: 1,
    fontSize: 14,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  paymentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    gap: spacing.xs,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
    flexShrink: 1,
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.ink,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  action: {
    flexGrow: 1,
    minWidth: 140,
  },
});
