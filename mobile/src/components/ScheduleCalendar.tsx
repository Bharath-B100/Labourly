import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { palette } from './theme';

export function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function ScheduleCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const [month, setMonth] = useState(() => {
    const selected = value ? new Date(`${value}T12:00:00`) : new Date();
    return Number.isNaN(selected.getTime()) ? new Date() : selected;
  });
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const today = dateKey(new Date());
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Previous month"
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
          }
          style={{
            minWidth: 48,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: palette.ink, fontSize: 24 }}>‹</Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          style={{
            flex: 1,
            textAlign: 'center',
            fontWeight: '700',
            color: palette.ink,
          }}
        >
          {month.toLocaleDateString('en-IN', {
            month: 'long',
            year: 'numeric',
          })}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Next month"
          onPress={() =>
            setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
          }
          style={{
            minWidth: 48,
            minHeight: 48,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: palette.ink, fontSize: 24 }}>›</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row' }}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <Text
            key={index}
            accessible={false}
            style={{
              width: '14.2857%',
              textAlign: 'center',
              color: palette.ink,
            }}
          >
            {day}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {Array.from({ length: start.getDay() }, (_, index) => (
          <View key={`empty-${index}`} style={{ width: '14.2857%' }} />
        ))}
        {Array.from({ length: days }, (_, index) => {
          const date = dateKey(
            new Date(month.getFullYear(), month.getMonth(), index + 1),
          );
          const disabled = date < today;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`Select ${date}`}
              accessibilityState={{ selected: value === date, disabled }}
              disabled={disabled}
              onPress={() => onChange(date)}
              style={{
                width: '14.2857%',
                minHeight: 48,
                paddingVertical: 10,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 10,
                backgroundColor:
                  value === date ? palette.yellow : palette.white,
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <Text
                style={{
                  color: palette.ink,
                  fontWeight: value === date ? '700' : '400',
                }}
              >
                {index + 1}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
