import { Redirect, Tabs } from 'expo-router';
import { useLanguage } from '../../src/lib/language';
import { TabBar } from '../../src/components/TabBar';
import { copy } from '../../src/lib/copy';
import { useTheme } from '../../src/theme/ThemeProvider';
import { usePetStore } from '../../src/features/pets/store';

export default function TabsLayout() {
  const { colors } = useTheme();
  const count = usePetStore(state => state.pets.length);
  useLanguage(state => state.language);
  if (count === 0) return <Redirect href="/welcome" />;
  return <Tabs tabBar={props => <TabBar {...props} />} screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.bg }, animation: 'none' }}>
    <Tabs.Screen name="index" options={{ title: copy.home.title }} />
    <Tabs.Screen name="planner" options={{ title: copy.planner.title }} />
    <Tabs.Screen name="health" options={{ title: copy.health.title }} />
    <Tabs.Screen name="profile" options={{ title: copy.profile.title }} />
  </Tabs>;
}
