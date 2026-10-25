import { createContext, useContext, useMemo, useState, useEffect, useRef, useCallback, type PropsWithChildren } from 'react';
import { useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { darkColors, lightColors, resolveTheme, type Colors, type ThemeMode } from './theme';
import { readSetting, writeSetting } from '../db/repositories/settings';

type Theme = { colors: Colors; dark: boolean; mode: ThemeMode; setMode: (mode: ThemeMode) => Promise<void>; fontsReady: boolean };
const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children, fontsReady }: PropsWithChildren<{ fontsReady: boolean }>) {
  const system = useColorScheme();
  const [mode, updateMode] = useState<ThemeMode>('light');
  const changed = useRef(false);
  useEffect(() => { let active = true; void readSetting('themeMode').then(value => { if (active && !changed.current && (value === 'light' || value === 'dark' || value === 'system')) updateMode(value); }, () => {}); return () => { active = false; }; }, []);
  const setMode = useCallback(async (value: ThemeMode) => { changed.current = true; await writeSetting('themeMode', value); updateMode(value); }, []);
  const dark = resolveTheme(mode, system) === 'dark';
  useEffect(() => { void SystemUI.setBackgroundColorAsync(dark ? darkColors.bg : lightColors.bg).catch(() => {}); }, [dark]);
  const value = useMemo(() => ({ colors: dark ? darkColors : lightColors, dark, mode, setMode, fontsReady }), [dark, mode, setMode, fontsReady]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('ThemeProvider nedostaje');
  return theme;
}

