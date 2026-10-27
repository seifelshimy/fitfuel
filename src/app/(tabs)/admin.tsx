// View: Admin panel (Seif Elshimy).
// For the store owner: add, edit and delete products, mark stock,
// and change order status.

import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Chip } from '@/components/Chip';
import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { EmptyState, ErrorState, LoadingState } from '@/components/StateViews';
import { AdminOrder, ORDER_STATUSES } from '@/models/admin';
import { CATEGORIES, Product, startingPrice } from '@/models/product';
import { colors, radius, spacing, typography } from '@/theme';
import { formatPrice } from '@/utils/format';
import { AdminViewModel, useAdminViewModel } from '@/viewmodels/useAdminViewModel';

export default function AdminScreen() {
  const vm = useAdminViewModel();

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Text style={typography.display}>Admin panel</Text>
        <Text style={[typography.caption, styles.subtitle]}>Store owner tools</Text>
        <View style={styles.switcher}>
          <Chip
            label={`Products${vm.soldOutCount ? ` · ${vm.soldOutCount} sold out` : ''}`}
            selected={vm.section === 'products'}
            onPress={() => vm.setSection('products')}
          />
          <Chip
            label={`Orders${vm.openOrderCount ? ` · ${vm.openOrderCount} open` : ''}`}
            selected={vm.section === 'orders'}
            onPress={() => vm.setSection('orders')}
          />
        </View>
      </View>

      {vm.actionError && !vm.formOpen ? <Text style={styles.banner}>{vm.actionError}</Text> : null}

      {vm.section === 'products' ? <ProductsSection vm={vm} /> : <OrdersSection vm={vm} />}
      <ProductForm vm={vm} />
    </SafeAreaView>
  );
}

function ProductsSection({ vm }: { vm: AdminViewModel }) {
  if (vm.productsStatus === 'loading') return <LoadingState message="Loading products…" />;
  if (vm.productsStatus === 'error') return <ErrorState message={vm.productsError ?? ''} onRetry={vm.retryProducts} />;

  return (
    <FlatList
      data={vm.products}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListHeaderComponent={<PrimaryButton label="Add product" icon="add" variant="accent" onPress={vm.openCreate} />}
      ListEmptyComponent={<EmptyState icon="cube-outline" title="No products yet" message="Add your first product." />}
      renderItem={({ item }) => (
        <ProductRow
          product={item}
          busy={vm.busyId === item.id}
          onEdit={() => vm.openEdit(item)}
          onToggleStock={() => vm.toggleStock(item)}
        />
      )}
    />
  );
}

function ProductRow(props: { product: Product; busy: boolean; onEdit: () => void; onToggleStock: () => void }) {
  const { product, busy } = props;
  const category = CATEGORIES.find((c) => c.id === product.category)?.label ?? product.category;
  return (
    <View style={[styles.card, styles.productCard]}>
      <View style={styles.productTop}>
        <View style={styles.cardBody}>
          <Text style={typography.label}>{product.brand}</Text>
          <Text style={typography.subtitle} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={typography.caption}>
            {formatPrice(startingPrice(product))} · {category}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: product.inStock ? '#E3F3E8' : colors.dangerSoft }]}>
          <Text style={[styles.badgeText, { color: product.inStock ? colors.success : colors.danger }]}>
            {product.inStock ? 'In stock' : 'Sold out'}
          </Text>
        </View>
      </View>

      <View style={styles.rowButtons}>
        <SmallButton icon="create-outline" label="Edit" onPress={props.onEdit} disabled={busy} />
        <SmallButton
          icon={product.inStock ? 'remove-circle-outline' : 'add-circle-outline'}
          label={busy ? 'Saving…' : product.inStock ? 'Mark sold out' : 'Restock'}
          onPress={props.onToggleStock}
          disabled={busy}
        />
      </View>
    </View>
  );
}

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function SmallButton(props: { icon: IconName; label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={props.onPress}
      disabled={props.disabled}
      accessibilityRole="button"
      accessibilityLabel={props.label}
      style={({ pressed }) => [styles.smallButton, (pressed || props.disabled) && { opacity: 0.5 }]}
    >
      <Ionicons name={props.icon} size={15} color={colors.ink} />
      <Text style={styles.smallButtonText}>{props.label}</Text>
    </Pressable>
  );
}

function OrdersSection({ vm }: { vm: AdminViewModel }) {
  if (vm.ordersStatus === 'loading') return <LoadingState message="Loading orders…" />;
  if (vm.ordersStatus === 'error') return <ErrorState message={vm.ordersError ?? ''} onRetry={vm.retryOrders} />;

  return (
    <FlatList
      data={vm.orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<EmptyState icon="receipt-outline" title="No orders yet" message="New orders will appear here." />}
      renderItem={({ item }) => <OrderCard order={item} busy={vm.busyId === item.id} vm={vm} />}
    />
  );
}

function OrderCard({ order, busy, vm }: { order: AdminOrder; busy: boolean; vm: AdminViewModel }) {
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return (
    <View style={[styles.card, styles.productCard]}>
      <View style={styles.orderTop}>
        <Text style={typography.subtitle}>{order.id}</Text>
        <Text style={typography.caption}>{busy ? 'Updating…' : date}</Text>
      </View>
      <Text style={typography.body}>
        {order.customerName} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} · {formatPrice(order.total)}
      </Text>
      <Text style={[typography.label, styles.statusLabel]}>Status</Text>
      <View style={styles.chips}>
        {ORDER_STATUSES.map((s) => (
          <Chip
            key={s.id}
            label={s.label}
            selected={order.status === s.id}
            disabled={busy}
            onPress={() => vm.setOrderStatus(order, s.id)}
          />
        ))}
      </View>
    </View>
  );
}

function ProductForm({ vm }: { vm: AdminViewModel }) {
  return (
    <Modal visible={vm.formOpen} animationType="slide" transparent onRequestClose={vm.closeForm}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={vm.closeForm} accessibilityLabel="Close form" />
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.sheetHeader}>
              <Text style={typography.title}>{vm.isEditing ? 'Edit product' : 'Add product'}</Text>
              <Pressable onPress={vm.closeForm} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
                <Ionicons name="close" size={24} color={colors.ink} />
              </Pressable>
            </View>

            <FormField
              label="Product name"
              value={vm.draft.name}
              onChangeText={(text) => vm.updateDraft({ name: text })}
              placeholder="e.g. Gold Whey Isolate"
              maxLength={60}
              error={vm.errors.name}
            />
            <FormField
              label="Brand"
              value={vm.draft.brand}
              onChangeText={(text) => vm.updateDraft({ brand: text })}
              placeholder="e.g. IronCore"
              maxLength={40}
              error={vm.errors.brand}
            />

            <Text style={[typography.label, styles.fieldLabel]}>Category</Text>
            <View style={styles.chips}>
              {CATEGORIES.map((c) => (
                <Chip
                  key={c.id}
                  label={c.label}
                  selected={vm.draft.category === c.id}
                  onPress={() => vm.updateDraft({ category: c.id })}
                />
              ))}
            </View>
            {vm.errors.category ? <Text style={styles.error}>{vm.errors.category}</Text> : null}

            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <FormField
                  label="Price (EGP)"
                  value={vm.draft.price}
                  onChangeText={(text) => vm.updateDraft({ price: text })}
                  placeholder="3150"
                  keyboardType="number-pad"
                  maxLength={6}
                  error={vm.errors.price}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Size"
                  value={vm.draft.sizeLabel}
                  onChangeText={(text) => vm.updateDraft({ sizeLabel: text })}
                  placeholder="2 lb"
                  maxLength={15}
                  error={vm.errors.sizeLabel}
                />
              </View>
            </View>

            <FormField
              label="Description"
              value={vm.draft.description}
              onChangeText={(text) => vm.updateDraft({ description: text })}
              placeholder="What is it and who is it for?"
              multiline
              maxLength={300}
              error={vm.errors.description}
            />
            
            <Text style={[typography.subtitle, styles.sectionTitle]}>Nutrition facts (per serving)</Text>
            <FormField
              label="Serving size"
              value={vm.draft.nutrition.servingSize}
              onChangeText={(text) => vm.updateNutrition({ servingSize: text })}
              placeholder="e.g. 1 scoop (31 g)"
              maxLength={30}
              error={vm.errors.nutrition?.servingSize}
            />
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <FormField
                  label="Calories (kcal)"
                  value={vm.draft.nutrition.calories}
                  onChangeText={(text) => vm.updateNutrition({ calories: text })}
                  placeholder="120"
                  keyboardType="decimal-pad"
                  maxLength={6}
                  error={vm.errors.nutrition?.calories}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Protein (g)"
                  value={vm.draft.nutrition.protein}
                  onChangeText={(text) => vm.updateNutrition({ protein: text })}
                  placeholder="27"
                  keyboardType="decimal-pad"
                  maxLength={6}
                  error={vm.errors.nutrition?.protein}
                />
              </View>
            </View>
            <View style={styles.twoColumns}>
              <View style={styles.column}>
                <FormField
                  label="Carbs (g)"
                  value={vm.draft.nutrition.carbs}
                  onChangeText={(text) => vm.updateNutrition({ carbs: text })}
                  placeholder="1"
                  keyboardType="decimal-pad"
                  maxLength={6}
                  error={vm.errors.nutrition?.carbs}
                />
              </View>
              <View style={styles.column}>
                <FormField
                  label="Sugar (g)"
                  value={vm.draft.nutrition.sugar}
                  onChangeText={(text) => vm.updateNutrition({ sugar: text })}
                  placeholder="0.5"
                  keyboardType="decimal-pad"
                  maxLength={6}
                  error={vm.errors.nutrition?.sugar}
                />
              </View>
            </View>
            <FormField
              label="Fat (g)"
              value={vm.draft.nutrition.fat}
              onChangeText={(text) => vm.updateNutrition({ fat: text })}
              placeholder="0.5"
              keyboardType="decimal-pad"
              maxLength={6}
              error={vm.errors.nutrition?.fat}
            />

            {vm.actionError ? <Text style={styles.error}>{vm.actionError}</Text> : null}

            <View style={styles.formButtons}>
              <PrimaryButton
                label={vm.saving ? 'Saving…' : vm.isEditing ? 'Save changes' : 'Save product'}
                onPress={vm.saveProduct}
                variant="accent"
                disabled={vm.saving}
              />
            </View>

            {vm.isEditing ? (
              <Pressable
                onPress={vm.deleteEditing}
                disabled={vm.saving}
                accessibilityRole="button"
                style={({ pressed }) => [styles.deleteButton, (pressed || vm.saving) && { opacity: 0.5 }]}
              >
                <Ionicons name="trash-outline" size={16} color={colors.danger} />
                <Text style={styles.deleteText}>{vm.confirmDelete ? 'Tap again to delete' : 'Delete product'}</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  subtitle: { marginTop: spacing.xs },
  switcher: { flexDirection: 'row', marginTop: spacing.md },
  banner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    color: colors.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  productCard: { gap: spacing.sm },
  productTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardBody: { flex: 1, gap: 2 },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.sm },
  badgeText: { fontSize: 12, fontWeight: '700' },
  rowButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  smallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallButtonText: { fontSize: 13, fontWeight: '700', color: colors.ink },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusLabel: { marginTop: spacing.sm, marginBottom: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    maxHeight: '92%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
sectionTitle: { marginTop: spacing.xxl },
  fieldLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  twoColumns: { flexDirection: 'row', gap: spacing.md },
  column: { flex: 1 },
  error: { color: colors.danger, fontSize: 13, fontWeight: '600', marginTop: spacing.xs },
  formButtons: { marginTop: spacing.xl },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  deleteText: { color: colors.danger, fontWeight: '700', fontSize: 14 },
});