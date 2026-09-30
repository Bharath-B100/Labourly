import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { PropsWithChildren } from 'react';

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24 }}>
        <View className="w-full max-w-2xl self-center gap-6">{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Action({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      className="min-h-12 justify-center rounded-xl bg-teal-800 px-5 py-3"
    >
      <Text className="text-center text-base font-semibold text-white">
        {label}
      </Text>
    </Pressable>
  );
}
export function Loading() {
  return <ActivityIndicator accessibilityLabel="Loading" color="#115e59" />;
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-slate-200 bg-white p-6">
      <Text
        accessibilityRole="header"
        className="text-xl font-semibold text-slate-900"
      >
        {title}
      </Text>
      <Text className="text-base leading-6 text-slate-600">{description}</Text>
    </View>
  );
}
export function Placeholder({ title }: { title: string }) {
  return (
    <Screen>
      <EmptyState
        title={title}
        description="Not implemented — this feature is planned for a later phase. No live marketplace data is available."
      />
    </Screen>
  );
}
