import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { glassSurface, GlassRim, palette } from './theme';
import type { RequirementView } from '../api/marketplace';

import { formatRequirementLocation } from '../location/formatLocation';

export function RequirementCard({
  requirement,
  onPress,
  embedded = false,
}: {
  requirement: RequirementView;
  onPress?: () => void;
  embedded?: boolean;
}) {
  const router = useRouter();
  const date = (value: string) =>
    new Date(value).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  const locationText = formatRequirementLocation(
    requirement.city,
    requirement.district,
    requirement.state,
  );

  const rows: [React.ComponentProps<typeof Ionicons>['name'], string][] = [
    ['location-outline', locationText],
    [
      'people-outline',
      `${requirement.workerCount} worker${requirement.workerCount > 1 ? 's' : ''} needed`,
    ],
    [
      'calendar-outline',
      `${date(requirement.startsAt)} – ${date(requirement.endsAt)}`,
    ],
  ];
  return (
    <Pressable
      onPress={onPress ?? (() => router.push(`/requirement/${requirement.id}`))}
      accessibilityRole="button"
      accessibilityLabel={`View ${requirement.title}`}
      className="active:opacity-80"
      style={[
        !embedded && glassSurface,
        {
          padding: embedded ? 4 : 20,
          marginBottom: embedded ? 4 : 16,
        },
      ]}
    >
      {!embedded && <GlassRim />}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, gap: 7 }}>
          <Text style={{ fontSize: 21, fontWeight: '700', color: palette.ink }}>
            {requirement.title}
          </Text>
          <Text
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 13,
              paddingVertical: 5,
              borderRadius: 18,
              fontSize: 12,
              fontWeight: '700',
              color:
                requirement.status === 'CANCELLED' ? '#202326' : palette.teal,
              backgroundColor:
                requirement.status === 'OPEN' ? '#FFCC25' : '#E5E7EB',
            }}
          >
            {requirement.status}
          </Text>
          <Text style={{ fontSize: 16, color: palette.teal, marginBottom: 8 }}>
            {requirement.trade}
          </Text>
        </View>
        <View
          style={[
            glassSurface,
            {
              width: 40,
              height: 40,
              borderRadius: 20,
              alignItems: 'center',
              justifyContent: 'center',
            },
          ]}
        >
          <Ionicons name="chevron-forward" size={24} color={palette.teal} />
        </View>
      </View>
      {rows.map(([icon, text]) => (
        <View
          key={icon}
          style={{
            flexDirection: 'row',
            gap: 12,
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <View
            style={{
              backgroundColor: '#E5E7EB',
              width: 29,
              height: 29,
              borderRadius: 15,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name={icon} size={20} color={palette.teal} />
          </View>
          <Text style={{ flex: 1, fontSize: 13, color: palette.teal }}>
            {text}
          </Text>
        </View>
      ))}
    </Pressable>
  );
}
