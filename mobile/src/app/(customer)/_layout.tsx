import { GlassTabBackground } from '../../components/theme';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useContext } from 'react';
import { GlassTabButton } from '../../components/GlassTabButton';
import { Pressable } from 'react-native';
import {
  DraftNavigationGuard,
  type DraftExitGuard,
} from '../../navigation/DraftNavigationGuard';

export default function CustomerLayout() {
  const guard: DraftExitGuard = useContext(DraftNavigationGuard);
  const router = useRouter();
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
          headerStyle: { backgroundColor: '#F7F9F5' },
          headerTintColor: '#145C58',
          headerShadowVisible: false,
          tabBarActiveTintColor: '#145C58',
          tabBarInactiveTintColor: '#466E68',
          tabBarHideOnKeyboard: true,
          tabBarButton: (props) => <GlassTabButton {...props} />,
          tabBarActiveBackgroundColor: 'transparent',
          tabBarInactiveBackgroundColor: 'transparent',
          tabBarBackground: () => <GlassTabBackground count={5} />,
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
            tabBarLabel: 'My Jobs',
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
              <Ionicons name="add-outline" size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="bookings"
          options={{
            title: 'Bookings',
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
          name="worker/[id]"
          options={{
            href: null,
            headerShown: true,
            title: 'Worker Details',
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
          name="requirement/[id]"
          options={{
            href: null,
            headerShown: true,
            title: 'Requirement Details',
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
        <Tabs.Screen
          name="requirement/quotes"
          options={{
            href: null,
            headerShown: true,
            title: 'Quotes Received',
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
    </DraftNavigationGuard.Provider>
  );
}
