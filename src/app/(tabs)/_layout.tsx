// Mohamed Salim: Fitness Profile, Goals & Recs, and Barcode Scan tabs.

import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { colors } from '@/theme';

export default function TabsLayout() {
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
    </Tabs>
  );
}
