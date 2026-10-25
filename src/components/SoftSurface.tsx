import { StaticCanvas } from './StaticCanvas';
import { useMemo, useState, type PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';
import { RoundedRect, Shadow } from '@shopify/react-native-skia';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';

type Props = PropsWithChildren<ViewProps & { raised?: boolean; radius?: number; color?: string }>;
export function SoftSurface({ children, raised = false, radius = tokens.radius.card, color, style, ...props }: Props) {
  const { colors } = useTheme();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const bleed = tokens.size.shadowBleed;
  const fill = color ?? (raised ? colors.surfaceRaised : colors.surface);
  const drawing = useMemo(() => <RoundedRect x={bleed} y={bleed} width={size.width} height={size.height} r={radius} color={fill}>
    <Shadow dx={tokens.shadow.offset} dy={tokens.shadow.offset} blur={tokens.shadow.blur} color={colors.shadow} />
    <Shadow dx={-tokens.shadow.innerOffset} dy={-tokens.shadow.innerOffset} blur={tokens.shadow.innerBlur} color={colors.highlight} inner />
  </RoundedRect>, [bleed, colors.highlight, colors.shadow, fill, radius, size.height, size.width]);
  return <View {...props} style={[{ borderRadius: radius, backgroundColor: fill }, style]} onLayout={event => {
    const { width, height } = event.nativeEvent.layout;
    setSize(previous => previous.width === width && previous.height === height ? previous : { width, height });
    props.onLayout?.(event);
  }}>
    {size.width > 0 && <StaticCanvas pointerEvents="none" accessible={false} style={{ position: 'absolute', left: -bleed, top: -bleed, width: size.width + bleed * 2, height: size.height + bleed * 2 }}>
      {drawing}
    </StaticCanvas>}
    <View style={styles.content}>{children}</View>
  </View>;
}
const styles = StyleSheet.create({ content: { flexGrow: 1 } });


