import { useLocalSearchParams } from 'expo-router';
import ProfileEditor from '../onboarding/ProfileEditor';

export default function EditProfile() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  return <ProfileEditor editing requestedRole={role} />;
}
