import { Text, type TextProps } from 'react-native';
import { tokens } from '../theme/theme';
import { useTheme } from '../theme/ThemeProvider';

type Props = TextProps & { variant?: keyof typeof tokens.type; bold?: boolean; muted?: boolean };
export function AppText({ variant = 'body', bold = false, muted = false, style, ...props }: Props) {
  const { colors, fontsReady } = useTheme();
  return <Text {...props} style={[tokens.type[variant], { color: muted ? colors.textSecondary : colors.textPrimary, fontFamily: fontsReady ? (bold ? tokens.font.bold : tokens.font.medium) : undefined, fontWeight: fontsReady ? undefined : (bold ? '700' : '500') }, style]} />;
}
