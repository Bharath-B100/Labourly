import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function WorkerLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0066cc' }}>
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Opportunities',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'My Quotes',
          tabBarIcon: ({ color }) => (
            <Ionicons name="send" size={24} color={color} />
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
      <Tabs.Screen
        name="opportunity/[id]"
        options={{ href: null, title: 'Opportunity Details' }}
      />
    </Tabs>
  );
}
