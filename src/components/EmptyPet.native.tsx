import LottieView from 'lottie-react-native';
import { StyleSheet, View } from 'react-native';
import { tokens } from '../theme/theme';
import { useMotionPreference } from '../lib/motion';
export function EmptyPet() {
  const reduced = useMotionPreference();
  return <View accessible={false} pointerEvents="none" style={styles.pet}><LottieView key={String(reduced)} source={require('../../assets/lottie/empty-pet.json')} autoPlay={!reduced} loop={false} progress={reduced ? 0 : undefined} style={styles.pet} /></View>;
}
const styles = StyleSheet.create({ pet: { width: tokens.size.emptyIllustration, height: tokens.size.emptyIllustration, alignSelf: 'center' } });
