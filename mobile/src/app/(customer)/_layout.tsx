import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Pressable, useWindowDimensions } from 'react-native';
import { GlassTabBackground } from '../../components/theme';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import {
  GlassTabButton,
  TabIcon,
  CustomerTabLabel,
} from '../../components/GlassTabButton';
import {
  DraftNavigationGuard,
  type DraftExitGuard,
} from '../../navigation/DraftNavigationGuard';

export default function CustomerLayout() {
  const guard: DraftExitGuard = useContext(DraftNavigationGuard);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  return (
    <DraftNavigationGuard.Provider value={guard}>
      <Tabs
        backBehavior="history"
        UNSTABLE_router={(original) => ({
          getStateForAction(state, action, options) {
            const next = original.getStateForAction(state, action, options);
            const current = state.routes[state.index ?? 0];
            const destination = next?.routes[next.index ?? 0];
            if (
              current?.name === 'post' &&
              next &&
              (destination?.key !== current.key ||
                JSON.stringify(destination?.params) !==
                  JSON.stringify(current.params)) &&
              guard.current?.(action)
            )
              return state;
            return next;
          },
        })}
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
          tabBarBackground: () => <GlassTabBackground count={5} />,
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
          name="home"
          options={{
            title: 'Home',
            tabBarAccessibilityLabel: 'Home',
            tabBarLabel: () => <CustomerTabLabel label="Home" />,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="home-outline" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="discover"
          options={{
            title: 'Workers',
            tabBarAccessibilityLabel: 'Workers',
            tabBarLabel: () => <CustomerTabLabel label="Workers" />,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="search" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="requirements"
          options={{
            title: 'My Requirements',
            tabBarAccessibilityLabel: 'My Requirements',
            tabBarLabel: () => <CustomerTabLabel label="Jobs" />,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="list" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Chat',
            tabBarLabel: () => <CustomerTabLabel label="Chat" />,
            tabBarAccessibilityLabel: 'Chat',
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name="chatbubble-outline"
                color={color}
                focused={focused}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="post"
          options={{ href: null, title: 'Post requirement' }}
        />
        <Tabs.Screen
          name="bookings"
          options={{ href: null, title: 'Bookings' }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarAccessibilityLabel: 'Profile',
            tabBarLabel: () => <CustomerTabLabel label="Profile" />,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name="person-outline" color={color} focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="worker/[id]"
          options={{
            href: null,
            headerShown: true,
            title: 'Worker Details',
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
          name="requirement/[id]"
          options={{
            href: null,
            headerShown: true,
            title: 'Requirement Details',
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
        <Tabs.Screen
          name="requirement/quotes"
          options={{
            href: null,
            headerShown: true,
            title: 'Quotes Received',
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
        <Tabs.Screen name="wallet" options={{ href: null }} />
        <Tabs.Screen name="saved-workers" options={{ href: null }} />
      </Tabs>
    </DraftNavigationGuard.Provider>
  );
}
