import { Tabs } from 'expo-router';
export default function CustomerLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="discover" options={{ title: 'Find workers' }} />
      <Tabs.Screen name="bookings" options={{ title: 'My bookings' }} />
    </Tabs>
  );
}
