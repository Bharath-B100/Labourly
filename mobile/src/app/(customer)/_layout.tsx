import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CustomerLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0066cc' }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Find Workers',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requirements"
        options={{
          title: 'My Requirements',
          tabBarIcon: ({ color }) => (
            <Ionicons name="list" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'Post',
          tabBarIcon: ({ color }) => (
            <Ionicons name="add-circle" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen name="bookings" options={{ href: null }} />
      <Tabs.Screen
        name="worker/[id]"
        options={{ href: null, title: 'Worker Details' }}
      />
      <Tabs.Screen
        name="requirement/[id]"
        options={{ href: null, title: 'Requirement Details' }}
      />
    </Tabs>
  );
}
