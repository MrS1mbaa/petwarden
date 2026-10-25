import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';
import { tokens } from '../src/theme/theme';
import { AppText } from '../src/components/AppText';
import { RecoveryScreen } from '../src/components/RecoveryScreen';
import { copy } from '../src/lib/copy';
import { useBootstrap } from '../src/features/pets/useBootstrap';
import { useReminderLifecycle } from '../src/notifications/useReminderLifecycle';
import { PhotoTransitionOverlay } from '../src/components/PhotoTransitionOverlay';
import { TermsGate } from '../src/features/legal/TermsGate';
import { useTerms } from '../src/features/legal/terms';

void SplashScreen.preventAutoHideAsync().catch(() => {});

export function ErrorBoundary({ retry }: ErrorBoundaryProps) {
  return <ThemeProvider fontsReady={false}><RecoveryScreen title={copy.error} body={copy.errorBody} action={copy.retry} onPress={() => void retry()} /></ThemeProvider>;
}

function Navigator() {
  const { colors, dark } = useTheme();
  const { status, retry } = useBootstrap();
  const accepted = useTerms(state => state.accepted);
  // Reminder taps and syncing wait until the terms are accepted, so they never navigate behind the gate.
  useReminderLifecycle(status === 'ready' && accepted);
  if (status === 'loading') return <LoadingState />;
  if (status === 'error') return <RecoveryScreen title={copy.databaseError} body={copy.databaseErrorBody} action={copy.retry} onPress={retry} />;
  if (!accepted) return <><StatusBar style={dark ? 'light' : 'dark'} /><TermsGate /></>;
  return <><StatusBar style={dark ? 'light' : 'dark'} /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'none' }}><Stack.Screen name="(tabs)" /><Stack.Screen name="welcome" /><Stack.Screen name="onboarding" /></Stack></>;
}

function LoadingState() {
  const { colors, dark } = useTheme();
  return <View style={[styles.loading, { backgroundColor: colors.bg }]}><StatusBar style={dark ? 'light' : 'dark'} /><ActivityIndicator color={colors.textPrimary} /><AppText>{copy.loading}</AppText></View>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMedium: require('../assets/fonts/SpaceGrotesk-Medium.otf'),
    SpaceBold: require('../assets/fonts/SpaceGrotesk-Bold.otf'),
  });
  const [fallback, setFallback] = useState(false);
  useEffect(() => { if (loaded || error) void SplashScreen.hideAsync(); }, [loaded, error]);
  return <GestureHandlerRootView style={styles.root}><SafeAreaProvider><ThemeProvider fontsReady={loaded}>
    {error && !fallback ? <RecoveryScreen title={copy.fontError} body={copy.fontErrorBody} action={copy.continue} onPress={() => setFallback(true)} />
      : loaded || fallback ? <><Navigator /><PhotoTransitionOverlay /></> : <LoadingState />}
  </ThemeProvider></SafeAreaProvider></GestureHandlerRootView>;
}
const styles = StyleSheet.create({ root: { flex: 1 }, loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.space.lg } });
