import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../theme/theme';
export function CheckCelebration({ onFinish }: { onFinish: () => void }) {
  return <View pointerEvents="none" style={styles.animation}><LottieView source={require('../../assets/lottie/check-confetti.json')} autoPlay loop={false} onAnimationFinish={onFinish} onAnimationFailure={onFinish} style={styles.fill} /></View>;
}
const styles = StyleSheet.create({ animation: { position: 'absolute', width: tokens.home.checkBurst, height: tokens.home.checkBurst, top: (tokens.home.taskHeight - tokens.home.checkBurst) / 2, left: (tokens.home.checkWidth - tokens.home.checkBurst) / 2 }, fill: { width: '100%', height: '100%' } });
