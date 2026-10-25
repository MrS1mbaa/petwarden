import { Image } from 'expo-image';
import { StyleSheet } from 'react-native';
import { tokens } from '../theme/theme';
// A local poster keeps the web preview offline without adding a Lottie CDN player.
export function EmptyPet() { return <Image accessible={false} source={require('../../assets/illustrations/dog-beagle.webp')} contentFit="contain" style={styles.pet} />; }
const styles = StyleSheet.create({ pet: { width: tokens.size.emptyIllustration, height: tokens.size.emptyIllustration, alignSelf: 'center' } });
