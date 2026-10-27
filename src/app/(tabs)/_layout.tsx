// Bottom tab bar. Each member's tabs are kept exactly as they wrote them:
// Ahmed Mohamed: Home, Search
// Mohamed Salim: Fitness Profile, Goals & Recs, Barcode Scan
// Saif Nasr: Cart (with a live item count badge), Orders
// Seif Elshimy's Wishlist, Reminders and Admin screens are picked up by Expo Router
// automatically, because his branch did not include tab settings for them.

import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';
import { useCartViewModel } from '@/viewmodels/useCartViewModel';

export default function TabsLayout() {
  const { itemCount } = useCartViewModel();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Fitness Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="body-outline" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="recommendations"
        options={{
          title: 'Goals & Recs',
          tabBarIcon: ({ color }) => (
            <Ionicons name="flame-outline" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Barcode Scan',
          tabBarIcon: ({ color }) => (
            <Ionicons name="barcode-outline" size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cart',
          tabBarBadge: itemCount > 0 ? (itemCount > 99 ? '99+' : itemCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.accent, color: colors.accentInk, fontWeight: '700' },
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cart' : 'cart-outline'} size={22} color={color as string} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={color as string} />
          ),
        }}
      />
    </Tabs>
  );
}
