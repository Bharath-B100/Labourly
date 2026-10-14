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

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <GlassBackdrop />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ flexGrow: 1, padding: 24 }}
      >
        <View className="w-full max-w-2xl self-center gap-6">
          <Brand />
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
  const background = {
    primary: 'rgba(255,211,54,0.72)',
    secondary: 'rgba(255,255,255,0.18)',
    danger: 'rgba(251, 113, 133, 0.12)',
    quiet: 'transparent',
  }[variant];
  const foreground =
    variant === 'primary'
      ? '#104C49'
      : variant === 'danger'
        ? '#B42340'
        : '#104C49';
  const showArrow = withArrow ?? (variant !== 'quiet' && variant !== 'danger');
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
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
          minHeight: variant === 'quiet' ? 44 : 52,
          borderRadius: 999,
          paddingHorizontal: 20,
          paddingVertical: 8,
          justifyContent: 'center',
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          backgroundColor: background,
          shadowColor: '#145C58',
          shadowOpacity: variant === 'quiet' ? 0 : 0.16,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 5 },
          elevation: 0,
          borderWidth: variant === 'quiet' ? 0 : 1,
          borderColor:
            variant === 'secondary'
              ? 'rgba(255,255,255,0.95)'
              : variant === 'danger'
                ? 'rgba(251, 113, 133, 0.3)'
                : 'rgba(255,255,255,0.95)',
          opacity: blocked ? 0.5 : undefined,
          boxShadow: variant === 'quiet' ? 'none' : glassSurface.boxShadow,
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
              backgroundColor: '#145C58',
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
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingTop: 8,
            paddingBottom: 5,
            borderColor: error
              ? '#B42340'
              : focused
                ? '#145C58'
                : 'rgba(255,255,255,0.92)',
          },
        ]}
      >
        <GlassRim radius={20} />
        <Text style={{ fontSize: 12, color: '#466E68' }}>{label}</Text>
        <TextInput
          {...props}
          accessibilityLabel={props.accessibilityLabel ?? label}
          placeholderTextColor="#648C83"
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
              minHeight: 32,
              padding: 0,
              paddingVertical: 3,
              fontSize: 16,
              fontWeight: '500',
              color: '#104C49',
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
            color: error ? '#B42340' : '#466E68',
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
          borderRadius: 18,
          borderWidth: 1,
          borderColor: open ? '#145C58' : 'rgba(255,255,255,0.96)',
          paddingHorizontal: 16,
          paddingVertical: 8,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          backgroundColor: open
            ? 'rgba(20,92,88,0.12)'
            : 'rgba(255,255,255,0.20)',
          opacity: disabled ? 0.5 : undefined,
        }}
      >
        <GlassRim radius={18} />
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={{ fontSize: 12, color: '#466E68' }}>{label}</Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '500',
              color: selected ? '#104C49' : '#648C83',
            }}
          >
            {selected?.label ?? placeholder}
          </Text>
        </View>
        <Text accessible={false} style={{ color: '#104C49', fontSize: 18 }}>
          {open ? '−' : '⌄'}
        </Text>
      </Pressable>
      {open && !disabled && (
        <GlassReveal>
          <View
            style={{
              borderWidth: 1,
              borderColor: 'rgba(20,92,88,0.24)',
              borderRadius: 18,
              backgroundColor: '#F7F9F5',
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
                <Text style={{ padding: 16, color: '#466E68' }}>
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
                      option.value === value
                        ? 'rgba(20,92,88,0.24)'
                        : 'transparent',
                  }}
                >
                  <Text style={{ flex: 1, color: '#104C49', fontSize: 16 }}>
                    {option.label}
                  </Text>
                  {option.value === value && (
                    <Text
                      accessible={false}
                      style={{ color: '#104C49', fontWeight: '700' }}
                    >
                      ✓
                    </Text>
                  )}
                </Pressable>
              ))}
            </ScrollView>
            {!!maxVisibleOptions && visible.length > maxVisibleOptions && (
              <Text style={{ padding: 8, color: '#466E68' }}>
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
  return <ActivityIndicator accessibilityLabel="Loading" color="#145C58" />;
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
