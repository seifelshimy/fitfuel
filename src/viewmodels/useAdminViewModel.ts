// ViewModel for the Admin panel (Seif Elshimy).
// Two sections (products and orders), one form to add and edit products
// (including nutrition facts), delete with confirmation, and the stock /
// order status updates.

import { useState } from 'react';
import { AdminOrder, OrderStatus } from '@/models/admin';
import { Product } from '@/models/product';
import { adminRepository } from '@/services/adminService';
import { productRepository, toUserMessage } from '@/services/productService';
import {
  EMPTY_PRODUCT_DRAFT,
  hasProductErrors,
  NewProductDraft,
  NutritionDraft,
  ProductErrors,
  validateNewProduct,
} from '@/utils/productValidation';
import { useAsyncData } from './useAsyncData';
import { useRefreshOnFocus } from './useRefreshOnFocus';

export type AdminSection = 'products' | 'orders';

export function useAdminViewModel() {
  const [section, setSection] = useState<AdminSection>('products');
  const products = useAsyncData(() => productRepository.getAll(), []);
  const orders = useAsyncData(() => adminRepository.getOrders(), []);
  useRefreshOnFocus(products.refresh); // stock may change on other screens later

  const [busyId, setBusyId] = useState<string | null>(null); // the row being updated
  const [actionError, setActionError] = useState<string | null>(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null); // null = adding a new product
  const [draft, setDraft] = useState<NewProductDraft>(EMPTY_PRODUCT_DRAFT);
  const [errors, setErrors] = useState<ProductErrors>({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Run one update, show which row is busy, then reload that list.
  const runAction = async (id: string, work: () => Promise<unknown>, reload: () => void) => {
    setBusyId(id);
    setActionError(null);
    try {
      await work();
      reload();
    } catch (e) {
      setActionError(toUserMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  const toggleStock = (p: Product) =>
    runAction(p.id, () => adminRepository.setInStock(p.id, !p.inStock), products.refresh);

  const setOrderStatus = (o: AdminOrder, status: OrderStatus) => {
    if (o.status === status) return; // nothing to change
    runAction(o.id, () => adminRepository.updateOrderStatus(o.id, status), orders.refresh);
  };

  // One form for both adding and editing, like the Reminders screen.
  const openFormWith = (id: string | null, values: NewProductDraft) => {
    setEditingId(id);
    setDraft(values);
    setErrors({});
    setActionError(null);
    setConfirmDelete(false);
    setFormOpen(true);
  };

  const openCreate = () => openFormWith(null, EMPTY_PRODUCT_DRAFT);

  const openEdit = (p: Product) =>
    openFormWith(p.id, {
      name: p.name,
      brand: p.brand,
      category: p.category,
      price: String(p.sizes[0]?.price ?? ''), // the form works with text
      sizeLabel: p.sizes[0]?.label ?? '',
      description: p.description,
      nutrition: {
        servingSize: p.nutrition.servingSize,
        calories: String(p.nutrition.calories),
        protein: String(p.nutrition.protein),
        carbs: String(p.nutrition.carbs),
        fat: String(p.nutrition.fat),
        sugar: String(p.nutrition.sugar),
      },
    });

  const closeForm = () => setFormOpen(false);

  const updateDraft = (changes: Partial<Omit<NewProductDraft, 'nutrition'>>) => {
    setDraft((d) => ({ ...d, ...changes }));
    setConfirmDelete(false);
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(changes) as (keyof ProductErrors)[]) delete next[key];
      return next;
    });
  };

  // Nutrition fields live one level down, so they get their own update function.
  const updateNutrition = (changes: Partial<NutritionDraft>) => {
    setDraft((d) => ({ ...d, nutrition: { ...d.nutrition, ...changes } }));
    setConfirmDelete(false);
    setErrors((e) => {
      if (!e.nutrition) return e;
      const nutrition = { ...e.nutrition };
      for (const key of Object.keys(changes) as (keyof NutritionDraft)[]) delete nutrition[key];
      // Changing carbs can fix the "sugar more than carbs" error, so clear that too.
      if ('carbs' in changes) delete nutrition.sugar;
      return { ...e, nutrition: Object.keys(nutrition).length > 0 ? nutrition : undefined };
    });
  };

  const saveProduct = async () => {
    const found = validateNewProduct(draft);
    setErrors(found);
    if (hasProductErrors(found) || !draft.category) return;

    const n = draft.nutrition;
    const input = {
      name: draft.name.trim(),
      brand: draft.brand.trim(),
      category: draft.category,
      price: Number(draft.price.trim()),
      sizeLabel: draft.sizeLabel.trim(),
      description: draft.description.trim(),
      nutrition: {
        servingSize: n.servingSize.trim(),
        calories: Number(n.calories),
        protein: Number(n.protein),
        carbs: Number(n.carbs),
        fat: Number(n.fat),
        sugar: Number(n.sugar),
      },
    };

    setSaving(true);
    setActionError(null);
    try {
      if (editingId) await adminRepository.updateProduct(editingId, input);
      else await adminRepository.addProduct(input);
      setFormOpen(false);
      products.refresh();
    } catch (e) {
      setActionError(toUserMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // First tap asks for confirmation, second tap deletes.
  const deleteEditing = async () => {
    if (!editingId) return;
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    setActionError(null);
    try {
      await adminRepository.deleteProduct(editingId);
      setFormOpen(false);
      products.refresh();
    } catch (e) {
      setActionError(toUserMessage(e));
    } finally {
      setSaving(false);
      setConfirmDelete(false);
    }
  };

  const productList = products.data ?? [];
  const orderList = orders.data ?? [];

  return {
    section,
    setSection,
    busyId,
    actionError,

    productsStatus: products.status,
    productsError: products.error,
    retryProducts: products.reload,
    products: productList,
    soldOutCount: productList.filter((p) => !p.inStock).length,
    toggleStock,

    ordersStatus: orders.status,
    ordersError: orders.error,
    retryOrders: orders.reload,
    orders: orderList,
    openOrderCount: orderList.filter((o) => o.status !== 'delivered' && o.status !== 'cancelled').length,
    setOrderStatus,

    formOpen,
    isEditing: editingId !== null,
    openCreate,
    openEdit,
    closeForm,
    draft,
    updateDraft,
    updateNutrition,
    errors,
    saving,
    saveProduct,
    confirmDelete,
    deleteEditing,
  };
}

export type AdminViewModel = ReturnType<typeof useAdminViewModel>;