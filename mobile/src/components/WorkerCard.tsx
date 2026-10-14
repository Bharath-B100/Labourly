import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { glassSurface, GlassRim, palette } from './theme';
import type { WorkerCard as WorkerCardType } from '../api/marketplace';

export function WorkerCard({ worker }: { worker: WorkerCardType }) {
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`View ${worker.name}, ${worker.trade}`}
      onPress={() => router.push(`/worker/${worker.id}`)}
      className="active:opacity-80"
      style={[
        glassSurface,
        {
          padding: 14,
          marginBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
      ]}
    >
      <GlassRim />
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          overflow: 'hidden',
          backgroundColor: 'rgba(247,201,72,0.55)',
          borderWidth: 1,
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {worker.profilePhotoUrl ? (
          <Image
            source={{ uri: worker.profilePhotoUrl }}
            style={{ width: 60, height: 60 }}
          />
        ) : (
          <Text
            style={{ fontSize: 25, fontWeight: '700', color: palette.teal }}
          >
            {worker.name.charAt(0)}
          </Text>
        )}
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 18, fontWeight: '700', color: palette.ink }}>
          {worker.name}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            gap: 6,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: palette.teal, fontSize: 14 }}>
            {worker.trade}
          </Text>
          {worker.availability === 'AVAILABLE' && (
            <Text
              style={{
                fontSize: 11,
                color: palette.teal,
                backgroundColor: 'rgba(178,227,206,0.5)',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
              }}
            >
              Available
            </Text>
          )}
        </View>
        <Text style={{ fontSize: 12, color: palette.muted }}>
          {worker.skills?.length
            ? worker.skills.slice(0, 2).join(' • ')
            : `${worker.city}, ${worker.state}`}
        </Text>
        {worker.workerType === 'TEAM' && (
          <Text style={{ fontSize: 11, color: palette.teal }}>
            Team: {worker.teamSize}
          </Text>
        )}
      </View>
      <View
        style={[
          glassSurface,
          {
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: 'center',
            justifyContent: 'center',
          },
        ]}
      >
        <Ionicons name="chevron-forward" size={22} color={palette.teal} />
      </View>
    </Pressable>
  );
}
