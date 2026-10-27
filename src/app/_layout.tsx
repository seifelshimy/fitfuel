// Root navigator. The tab bar lives in (tabs)/; checkout and reviews are
// stacked on top. The providers share the fitness profile, the cart and the
// wishlist across every screen.

import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { CartProvider } from '@/context/CartContext';
import { FitnessProfileProvider } from '@/context/FitnessProfileContext';
import { WishlistProvider } from '@/context/WishlistContext';
import { colors } from '@/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FitnessProfileProvider>
        <CartProvider>
          <WishlistProvider>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerTintColor: colors.ink,
                headerStyle: { backgroundColor: colors.background },
                headerShadowVisible: false,
                headerBackButtonDisplayMode: 'minimal',
                contentStyle: { backgroundColor: colors.background },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
              <Stack.Screen name="review/[productId]" options={{ title: 'Reviews' }} />
            </Stack>
          </WishlistProvider>
        </CartProvider>
      </FitnessProfileProvider>
    </SafeAreaProvider>
  );
}
