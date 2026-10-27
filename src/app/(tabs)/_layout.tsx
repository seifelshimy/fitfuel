// Bottom tab bar for the whole team:
// Ahmed Mohamed: Home, Search
// Mohamed Salim: Fitness Profile, Goals & Recs, Barcode Scan
// Seif Elshimy: Wishlist, Reminders, Admin
// Saif Nasr: Cart (with a live item count badge), Orders

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';
import { useCartViewModel } from '@/viewmodels/useCartViewModel';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName, focusedName: IconName = name) {
  return ({ color, focused }: { color: unknown; focused: boolean }) => (
    <Ionicons name={focused ? focusedName : name} size={22} color={color as string} />
  );
}

export default function TabsLayout() {
  const { itemCount } = useCartViewModel();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Home', tabBarIcon: tabIcon('home-outline', 'home') }}
      />
      <Tabs.Screen
        name="search"
        options={{ title: 'Search', tabBarIcon: tabIcon('search-outline', 'search') }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Profile', tabBarIcon: tabIcon('body-outline', 'body') }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{ title: 'Goals & Recs', tabBarIcon: tabIcon('flame-outline', 'flame') }}
      />
      <Tabs.Screen
        name="scanner"
        options={{ title: 'Scan', tabBarIcon: tabIcon('barcode-outline', 'barcode') }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{ title: 'Wishlist', tabBarIcon: tabIcon('heart-outline', 'heart') }}
      />
      <Tabs.Screen
        name="reminders"
        options={{ title: 'Reminders', tabBarIcon: tabIcon('alarm-outline', 'alarm') }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: itemCount > 0 ? (itemCount > 99 ? '99+' : itemCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.accentInk, fontWeight: '700' },
          tabBarIcon: tabIcon('cart-outline', 'cart'),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{ title: 'Orders', tabBarIcon: tabIcon('receipt-outline', 'receipt') }}
      />
      <Tabs.Screen
        name="admin"
        options={{ title: 'Admin', tabBarIcon: tabIcon('construct-outline', 'construct') }}
      />
    </Tabs>
  );
}
