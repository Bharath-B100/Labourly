import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import type { WorkerCard as WorkerCardType } from '../api/marketplace';
import { palette } from './theme';
import { SaveWorkerButton } from './SaveWorkerButton';

export function WorkerCard({ worker }: { worker: WorkerCardType }) {
  const router = useRouter();
  const availability =
    {
      AVAILABLE: 'Available — confirm dates when hiring',
      BUSY: 'Currently busy',
      UNAVAILABLE: 'Currently unavailable',
    }[worker.availability] ?? 'Availability not provided';
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View ${worker.name}, ${worker.trade}`}
        onPress={() => router.push(`/(customer)/worker/${worker.id}`)}
        style={styles.profile}
      >
        {worker.profilePhotoUrl ? (
          <Image
            source={{ uri: worker.profilePhotoUrl }}
            style={styles.avatar}
          />
        ) : (
          <View style={[styles.avatar, styles.placeholder]}>
            <Text style={styles.initial}>
              {worker.name?.trim().charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
        )}
        <View style={styles.details}>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.text}>
            {worker.trade} · {worker.experienceYears} years experience
          </Text>
          <Text style={styles.text}>
            {[worker.city, worker.state].filter(Boolean).join(', ')}
          </Text>
          <Text style={styles.text}>Price by quotation</Text>
          <Text
            style={[
              styles.status,
              worker.availability === 'AVAILABLE' && styles.available,
            ]}
          >
            {availability}
          </Text>
          {worker.availability !== 'AVAILABLE' && (
            <Text style={styles.text}>Next available date not provided</Text>
          )}
        </View>
      </Pressable>
      <SaveWorkerButton key={worker.id} workerId={worker.id} compact />
    </View>
  );
}
const styles = StyleSheet.create({
  card: {
    backgroundColor: palette.white,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: palette.grey,
    gap: 4,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 48,
  },
  avatar: { width: 64, height: 76, borderRadius: 12 },
  placeholder: {
    backgroundColor: palette.grey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { fontSize: 26, fontWeight: '700', color: palette.ink },
  details: { flex: 1, minWidth: 0, gap: 5 },
  name: { fontSize: 16, fontWeight: '700', color: palette.ink },
  text: { fontSize: 13, color: palette.ink },
  status: {
    color: palette.ink,
    fontSize: 13,
    fontWeight: '600',
    paddingVertical: 4,
  },
  available: {
    backgroundColor: palette.yellow,
    borderRadius: 6,
    paddingHorizontal: 6,
  },
});
