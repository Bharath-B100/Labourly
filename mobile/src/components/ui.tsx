import { Ionicons } from '@expo/vector-icons';
import { GlassBackdrop, Brand, glassSurface, GlassRim } from './theme';
import { GlassReveal, useGlassMotion } from './glass';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  Text,
  View,
  TextInput,
  type TextInputProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState, type PropsWithChildren } from 'react';

export function Screen({
  children,
  branded = true,
}: PropsWithChildren<{ branded?: boolean }>) {
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1, padding: branded ? 24 : 16 }}
      >
        <View
          className="w-full max-w-2xl self-center"
          style={{ gap: branded ? 24 : 16 }}
        >
          {branded && <Brand />}
          {children}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
export function Action({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  withArrow,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'quiet';
  withArrow?: boolean;
}) {
  const reduced = useGlassMotion();
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => () => scale.stopAnimation(), [scale]);
  const press = (value: number) => {
    scale.stopAnimation();
    if (reduced) {
      scale.setValue(1);
      return;
    }
    Animated.spring(scale, {
      toValue: value,
      speed: 32,
      bounciness: 3,
      useNativeDriver: true,
    }).start();
  };
  const blocked = disabled || loading;
  const background = variant === 'primary' ? '#FFCC25' : '#FFFFFF';
  const foreground = '#202326';
  const showArrow = withArrow ?? false;
  return (
    <Animated.View style={[{ transform: [{ scale }] }, { width: '100%' }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: blocked, busy: loading }}
        disabled={blocked}
        onPress={onPress}
        onPressIn={() => press(0.975)}
        onPressOut={() => press(1)}
        className="active:opacity-80"
        style={{
          ...glassSurface,
          width: '100%',
          minHeight: variant === 'quiet' ? 44 : 52,
          borderRadius: 12,
          paddingHorizontal: 20,
          paddingVertical: 8,
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: background,
          borderWidth: variant === 'quiet' ? 0 : 1,
          borderColor: variant === 'primary' ? '#FFCC25' : '#E5E7EB',
          opacity: blocked ? 0.55 : 1,
        }}
      >
        {variant !== 'quiet' && <GlassRim radius={30} />}
        {loading && <ActivityIndicator color={foreground} />}
        <Text
          style={{
            color: foreground,
            flexShrink: 1,
            flex: variant !== 'quiet' ? 1 : undefined,
          }}
          className="text-center text-base font-semibold"
        >
          {label}
        </Text>
        {showArrow && !loading && (
          <View
            accessible={false}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#202326',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 10,
                height: 10,
                borderTopWidth: 2,
                borderRightWidth: 2,
                borderColor: '#FFFFFF',
                transform: [{ rotate: '45deg' }],
                marginRight: 4,
              }}
            />
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

export function Input({
  label,
  hint,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & { label: string; hint?: string; error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <View
        style={[
          glassSurface,
          {
            borderRadius: 10,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 5,
            borderColor: error ? '#202326' : focused ? '#202326' : '#E5E7EB',
          },
        ]}
      >
        <GlassRim radius={20} />
        <Text style={{ fontSize: 12, color: '#202326' }}>{label}</Text>
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor="#202326"
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            {
              minHeight: 40,
              padding: 0,
              paddingVertical: 3,
              fontSize: 16,
              fontWeight: '500',
              color: '#202326',
              textAlignVertical: props.multiline ? 'top' : 'center',
            },
            style,
          ]}
        />
      </View>
      {!!(error || hint) && (
        <Text
          accessibilityLiveRegion="polite"
          style={{
            color: error ? '#202326' : '#202326',
            fontSize: 13,
          }}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
}

export function Select({
  label,
  value,
  options,
  onChange,
  placeholder = 'Choose an option',
  disabled = false,
  searchable = false,
  maxVisibleOptions,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  searchable?: boolean;
  maxVisibleOptions?: number;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const visible = options.filter((option) =>
    option.label.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  return (
    <View style={{ gap: 8 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${selected?.label ?? placeholder}`}
        accessibilityHint="Opens the available options"
        accessibilityState={{ expanded: open, disabled }}
        disabled={disabled}
        onPress={() => {
          setOpen(!open);
          setQuery('');
        }}
        className="active:opacity-80"
        style={{
          ...glassSurface,
          minHeight: 52,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: open ? '#202326' : '#E5E7EB',
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: open ? '#E5E7EB' : '#FFFFFF',
          opacity: disabled ? 0.5 : undefined,
        }}
      >
        <GlassRim radius={18} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 12, color: '#202326' }}>{label}</Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: selected ? '#202326' : '#202326',
            }}
          >
            {selected?.label ?? placeholder}
          </Text>
        </View>
        <Ionicons
          accessible={false}
          name={open ? 'chevron-up' : 'chevron-down'}
          size={20}
          color="#202326"
        />
      </Pressable>
      {open && !disabled && (
        <GlassReveal>
          <View
            style={{
              borderWidth: 1,
              borderColor: '#E5E7EB',
              borderRadius: 10,
              backgroundColor: '#FFFFFF',
              padding: 8,
              gap: 8,
            }}
          >
            {searchable && (
              <Input
                label={`Search ${label.toLowerCase()}`}
                value={query}
                onChangeText={setQuery}
                autoCapitalize="none"
                placeholder="Type to filter options"
              />
            )}
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              style={{ maxHeight: 240 }}
            >
              {visible.length === 0 && (
                <Text style={{ padding: 16, color: '#202326' }}>
                  No options found.
                </Text>
              )}
              {visible.slice(0, maxVisibleOptions).map((option) => (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ checked: option.value === value }}
                  onPress={() => {
                    onChange(option.value);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="active:opacity-80"
                  style={{
                    minHeight: 48,
                    padding: 12,
                    borderRadius: 8,
                    flexDirection: 'row',
                    gap: 12,
                    alignItems: 'center',
                    backgroundColor:
                      option.value === value ? '#FFCC25' : 'transparent',
                  }}
                >
                  <Text style={{ flex: 1, color: '#202326', fontSize: 16 }}>
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <Ionicons
                      accessible={false}
                      name="checkmark"
                      size={20}
                      color="#202326"
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
            {!!maxVisibleOptions && visible.length > maxVisibleOptions && (
              <Text style={{ padding: 8, color: '#202326' }}>
                Showing the first {maxVisibleOptions} matches. Type to narrow
                your search.
              </Text>
            )}
            <Action
              label="Close options"
              variant="quiet"
              onPress={() => setOpen(false)}
            />
          </View>
        </GlassReveal>
      )}
    </View>
  );
}
export function Loading() {
  return <ActivityIndicator accessibilityLabel="Loading" color="#202326" />;
}
export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-outline bg-surface p-6">
      <Text
        accessibilityRole="header"
        className="text-xl font-semibold text-ink"
      >
        {title}
      </Text>
      <Text className="text-base leading-6 text-muted">{description}</Text>
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
