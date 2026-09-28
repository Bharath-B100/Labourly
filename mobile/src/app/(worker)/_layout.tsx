import { Tabs } from 'expo-router';
export default function WorkerLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="opportunities" options={{ title: 'Opportunities' }} />
      <Tabs.Screen name="schedule" options={{ title: 'My schedule' }} />
    </Tabs>
  );
}
