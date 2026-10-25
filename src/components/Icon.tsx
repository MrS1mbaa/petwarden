import { StaticCanvas } from './StaticCanvas';
import { memo } from 'react';
import { Group, Path } from '@shopify/react-native-skia';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';

// Normalized 24x24 vector assets, shared across navigation and empty states.
const paths = {
  home: 'M4 10 L12 3 L20 10 L20 20 Q20 21 19 21 L5 21 Q4 21 4 20 Z M9 16 L15 16',
  planner: 'M5 5 L19 5 Q21 5 21 7 L21 19 Q21 21 19 21 L5 21 Q3 21 3 19 L3 7 Q3 5 5 5 Z M7 3 L7 7 M17 3 L17 7 M3 10 L21 10 M7 14 L8 14 M12 14 L13 14 M17 14 L18 14 M7 18 L8 18 M12 18 L13 18',
  health: 'M8 3 L16 3 Q19 3 19 6 L19 19 Q19 21 17 21 L7 21 Q5 21 5 19 L5 6 Q5 3 8 3 Z M9 8 L15 8 M12 5 L12 11 M9 15 L15 15 M9 18 L14 18',
  profile: 'M8 4 Q6 2 4 5 Q1 9 3 15 L6 13 M16 4 Q18 2 20 5 Q23 9 21 15 L18 13 M8 4 Q12 2 16 4 Q19 7 18 13 Q18 21 12 21 Q6 21 6 13 Q5 7 8 4 Z M9 10 L9 11 M15 10 L15 11 M10 15 Q12 13 14 15 L12 17 Z M12 17 L12 19',
  paw: 'M9 14 Q12 10 15 14 L19 18 Q21 22 16 22 Q12 20 8 22 Q3 22 5 18 Z M4 10 C1 6 4 4 6 7 C9 11 5 13 4 10 Z M8 6 C6 1 10 0 11 4 C13 9 9 10 8 6 Z M13 4 C14 0 18 1 17 6 C16 10 12 9 13 4 Z M18 7 C20 4 23 6 21 10 C19 13 16 11 18 7 Z',
  sun: 'M12 7 A5 5 0 1 0 12 17 A5 5 0 1 0 12 7 M12 1 L12 3 M12 21 L12 23 M1 12 L3 12 M21 12 L23 12 M4 4 L6 6 M18 18 L20 20 M20 4 L18 6 M6 18 L4 20',
  bell: 'M6 16 L6 10 Q6 4 12 4 Q18 4 18 10 L18 16 L20 18 L4 18 Z M10 21 Q12 23 14 21 M12 2 L12 4',
  plus: 'M12 5 L12 19 M5 12 L19 12',
  edit: 'M5 16 L16 5 Q17 4 19 6 Q21 8 19 9 L8 20 L4 21 Z M14 7 L18 11 M5 16 L8 20',
  bone: 'M7 7 Q7 2 3 4 Q0 7 4 9 Q1 13 5 14 Q8 15 9 12 L15 18 Q14 22 18 22 Q22 22 21 18 Q25 18 23 14 Q21 11 18 14 L12 8 Q15 5 12 3 Q9 2 7 7 Z',
  weight: 'M4 9 L20 9 L22 20 Q22 22 20 22 L4 22 Q2 22 2 20 Z M8 9 L8 6 Q12 1 16 6 L16 9 M12 6 L12 9',
  close: 'M6 6 L18 18 M18 6 L6 18',
  clock: 'M12 2 A10 10 0 1 0 12 22 A10 10 0 1 0 12 2 M12 6 L12 12 L16 14',
  chevronLeft: 'M15 5 L8 12 L15 19',
  chevronRight: 'M9 5 L16 12 L9 19',
  syringe: 'M18 2 L22 6 M20 4 L15 9 M17 7 L8 16 L4 16 L4 12 L13 3 Z M2 22 L6 18 M9 7 L11 9 M7 9 L9 11',
  pill: 'M9 4 Q12 1 15 4 L20 9 Q23 12 20 15 L15 20 Q12 23 9 20 L4 15 Q1 12 4 9 Z M6.5 6.5 L17.5 17.5',
  folder: 'M3 7 Q3 5 5 5 L10 5 L12 7 L19 7 Q21 7 21 9 L21 18 Q21 20 19 20 L5 20 Q3 20 3 18 Z',
  note: 'M6 3 L15 3 L19 7 L19 20 Q19 21 18 21 L6 21 Q5 21 5 20 L5 4 Q5 3 6 3 Z M15 3 L15 7 L19 7 M8 12 L16 12 M8 16 L13 16',
  download: 'M12 4 L12 15 M7 10 L12 15 L17 10 M5 20 L19 20',
  upload: 'M12 15 L12 4 M7 9 L12 4 L17 9 M5 20 L19 20',
  user: 'M12 12 A4 4 0 1 0 12 4 A4 4 0 1 0 12 12 M4 21 Q4 15 12 15 Q20 15 20 21',
  camera: 'M4 8 Q4 6 6 6 L8 6 L10 4 L14 4 L16 6 L18 6 Q20 6 20 8 L20 18 Q20 20 18 20 L6 20 Q4 20 4 18 Z M12 9 A4 4 0 1 0 12 17 A4 4 0 1 0 12 9',
  search: 'M11 4 A7 7 0 1 0 11 18 A7 7 0 1 0 11 4 M16 16 L21 21',
  stethoscope: 'M5 3 L5 9 Q5 14 10 14 Q15 14 15 9 L15 3 M10 14 L10 17 Q10 21 14 21 Q18 21 18 17 L18 15 M18 11 A2 2 0 1 0 18 15 A2 2 0 1 0 18 11',
} as const;
export type IconName = keyof typeof paths;
export const Icon = memo(function Icon({ name, color, size = tokens.size.icon }: { name: IconName; color?: string; size?: number }) {
  const { colors } = useTheme();
  return <StaticCanvas style={{ width: size, height: size }} pointerEvents="none" accessible={false}>
    <Group transform={[{ scale: size / 24 }]}>
      <Path path={paths[name]} color={color ?? colors.textPrimary} style={name === 'paw' ? 'fill' : 'stroke'} strokeWidth={1.8} strokeCap="round" strokeJoin="round" />
    </Group>
  </StaticCanvas>;
});


