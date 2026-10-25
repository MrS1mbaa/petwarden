import { router } from 'expo-router';
import { RecoveryScreen } from '../src/components/RecoveryScreen';
import { copy } from '../src/lib/copy';
export default function NotFound() { return <RecoveryScreen title={copy.notFound} action={copy.returnHome} onPress={() => router.replace('/')} />; }
