import { StaticCanvas } from './StaticCanvas';
import { memo } from 'react';
import { Circle, Oval, Group, LinearGradient, Path, Shadow, vec } from '@shopify/react-native-skia';
import { tokens } from '../theme/theme';
import type { TaskType } from '../features/care/model';

// Bowl and leash take their category color: meals corgi orange, walks sage green.
export const CareIllustration = memo(function CareIllustration({ type }: { type: TaskType }) {
  const p = tokens.illustration;
  const size = tokens.home.careIcon;
  const shade = p.orangeShade, fill = p.orange;
  return <StaticCanvas pointerEvents="none" accessible={false} style={{ width: size, height: size }}>
    <Group transform={[{ scale: size / 48 }]}>
      {type === 'meal' ? <>
        <Path path="M8 24 Q5 17 13 16 Q10 9 18 11 Q19 4 25 10 Q33 6 34 14 Q41 12 42 21 L39 29 L11 29 Z" color={p.food}><Shadow dx={0} dy={2} blur={2} color={p.foodShade} inner /></Path>
        <Path path="M8 24 Q5 17 13 16 Q10 9 18 11 Q19 4 25 10 Q33 6 34 14 Q41 12 42 21" color={p.outline} style="stroke" strokeWidth={1.5} />
        {[{ x: 16, y: 18 }, { x: 24, y: 14 }, { x: 32, y: 21 }, { x: 25, y: 22 }].map(({ x, y }) => <Circle key={x + y} cx={x} cy={y} r={1.7} color={p.foodShade} />)}
        <Path path="M8 23 L40 23 L45 37 Q43 43 24 43 Q5 43 3 37 Z"><LinearGradient start={vec(12, 24)} end={vec(35, 43)} colors={[fill, shade]} /></Path>
        <Path path="M8 23 L40 23 L45 37 Q43 43 24 43 Q5 43 3 37 Z" color={p.outline} style="stroke" strokeWidth={1.5} />
        <Path path="M13 27 L35 27" color={p.shine} style="stroke" strokeWidth={1.5} strokeCap="round" />
        <Path path="M21 35 Q24 31 27 35 L29 38 L19 38 Z M19 31 L20 32 M24 29 L24 30 M28 31 L29 32" color={p.outline} style="stroke" strokeWidth={1.5} strokeCap="round" />
      </> : type === 'walk' ? <>
        <Oval x={4} y={13} width={40} height={18} color={p.greenShade} />
        <Oval x={4} y={9} width={40} height={18} color={p.green}><Shadow dx={0} dy={-1} blur={2} color={p.shine} inner /></Oval>
        <Oval x={9} y={13} width={30} height={10} color={p.shine} />
        <Oval x={4} y={9} width={40} height={18} color={p.outline} style="stroke" strokeWidth={1.5} />
        <Path path="M41 22 Q48 40 24 40 L10 40" style="stroke" strokeWidth={2} strokeCap="round" color={p.outline} />
        <Circle cx={9} cy={40} r={3} color={p.outline} />
      </> : <Path path="M17 17 Q10 12 7 17 Q3 23 9 25 Q5 30 11 33 Q17 36 19 29 L29 19 Q36 21 38 15 Q40 9 34 8 Q31 3 26 7 Q22 11 27 14 Z" color={p.orange}><Shadow dx={1} dy={2} blur={2} color={p.orangeShade} inner /></Path>}
    </Group>
  </StaticCanvas>;
});



