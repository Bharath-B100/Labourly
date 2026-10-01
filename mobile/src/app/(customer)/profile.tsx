import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileEditor from '../../onboarding/ProfileEditor';

export default function ProfileScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ProfileEditor editing={true} />
    </SafeAreaView>
  );
}
