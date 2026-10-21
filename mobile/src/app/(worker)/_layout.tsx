import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, useWindowDimensions } from 'react-native';
import { GlassTabBackground } from '../../components/theme';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { GlassTabButton, TabIcon } from '../../components/GlassTabButton';

export default function WorkerLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <Tabs
      backBehavior="history"
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#202326',
        headerShadowVisible: false,
        tabBarActiveTintColor: '#202326',
        tabBarInactiveTintColor: '#202326',
        tabBarHideOnKeyboard: true,
        tabBarButton: (props) => <GlassTabButton {...props} />,
        tabBarActiveBackgroundColor: '#FFCC25',
        tabBarInactiveBackgroundColor: '#FFFFFF',
        tabBarBackground: () => <GlassTabBackground count={4} />,
        tabBarItemStyle: {
          borderRadius: 0,
          marginHorizontal: 0,
          paddingVertical: 8,
          borderWidth: 0,
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          height: 64 + insets.bottom + Math.max(0, fontScale - 1) * 24,
          paddingTop: 0,
          paddingBottom: insets.bottom,
          marginHorizontal: 0,
          marginBottom: 0,
          borderRadius: 0,
          elevation: 0,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="opportunities"
        options={{
          title: 'Opportunities',
          tabBarAccessibilityLabel: 'Opportunities',
          tabBarLabel: 'Find Jobs',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="search" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'My Quotes',
          tabBarLabel: 'Quotes',
          tabBarAccessibilityLabel: 'My Quotes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="send" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: 'My Bookings',
          tabBarLabel: 'Bookings',
          tabBarAccessibilityLabel: 'My Bookings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="briefcase-outline" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarAccessibilityLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="person-outline" color={color} focused={focused} />
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
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={{
                marginLeft: 8,
                padding: 12,
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#202326" />
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
              accessibilityRole="button"
              accessibilityLabel="Back"
              style={{
                marginLeft: 8,
                padding: 12,
                minWidth: 48,
                minHeight: 48,
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#202326" />
            </Pressable>
          ),
        }}
      />
    </Tabs>
  );
}
