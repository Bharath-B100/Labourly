import { GlassTabBackground } from '../../components/theme';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassTabButton } from '../../components/GlassTabButton';
import { Pressable } from 'react-native';

export default function WorkerLayout() {
  const router = useRouter();
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#F7F9F5' },
        headerTintColor: '#145C58',
        headerShadowVisible: false,
        tabBarActiveTintColor: '#145C58',
        tabBarInactiveTintColor: '#466E68',
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => <GlassTabButton {...props} />,
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarBackground: () => <GlassTabBackground count={4} />,
        tabBarItemStyle: {
          borderRadius: 40,
          marginHorizontal: 0,
          paddingVertical: 8,
          borderWidth: 0,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 74,
          paddingTop: 0,
          paddingBottom: 0,
          marginHorizontal: 14,
          marginBottom: 20,
          borderRadius: 40,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Opportunities',
          tabBarLabel: 'Find Jobs',
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
        name="bookings"
        options={{
          title: 'My Bookings',
          tabBarIcon: ({ color }) => (
            <Ionicons name="briefcase-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="opportunity/[id]"
        options={{
          href: null,
          headerShown: true,
          title: 'Opportunity Details',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ marginLeft: 16, padding: 4 }}
            >
              <Ionicons name="arrow-back" size={24} color="#145C58" />
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="booking/[id]"
        options={{
          href: null,
          headerShown: true,
          title: 'Booking Details',
          headerLeft: () => (
            <Pressable
              onPress={() => router.back()}
              style={{ marginLeft: 16, padding: 4 }}
            >
              <Ionicons name="arrow-back" size={24} color="#145C58" />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
