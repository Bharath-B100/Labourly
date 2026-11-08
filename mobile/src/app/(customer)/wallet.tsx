import { useRouter } from 'expo-router';
import { LabourlyWalletScreen } from '../../components/LabourlyWalletScreen';
export default function WalletScreen() {
  const router = useRouter();
  return <LabourlyWalletScreen onBack={() => router.back()} />;
}
