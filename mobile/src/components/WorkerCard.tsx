import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { glassSurface, GlassRim, palette } from './theme';
import type { WorkerCard as WorkerCardType } from '../api/marketplace';
import { getDefaultWorkerAvatar } from '../assets/defaultAvatars';

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
          padding: 12,
          marginBottom: 10,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        },
      ]}
    >
      <GlassRim />
      <View
        style={{
          width: 80,
          height: 96,
          borderRadius: 12,
          overflow: 'hidden',
          backgroundColor: '#FFCC25',
          borderWidth: 1,
          borderColor: 'white',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Image
          source={
            worker.profilePhotoUrl
              ? { uri: worker.profilePhotoUrl }
              : getDefaultWorkerAvatar(worker.trade)
          }
          style={{ width: 80, height: 96 }}
          resizeMode="cover"
        />
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: palette.ink }}>
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
                backgroundColor: '#E5E7EB',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
              }}
            >
              Open to work
            </Text>
          )}
        </View>
        <Text style={{ fontSize: 12, color: palette.muted }}>
          {worker.skills?.length
            ? worker.skills.slice(0, 2).join(' • ')
            : `${worker.city}, ${worker.state}`}
        </Text>
        <Text style={{ fontSize: 13, color: palette.ink, fontWeight: '600' }}>
          Price by quotation
        </Text>
        <Text style={{ fontSize: 12, color: palette.ink }}>
          {worker.experienceYears} years experience
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
