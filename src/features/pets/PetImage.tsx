import { StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { Image } from 'expo-image';
import { Icon } from '../../components/Icon';
import type { Pet } from '../../db/schema';
import { petPlaceholder } from './placeholders';

// The pet's photo, else a species illustration, else a paw icon.
export function PetImage({ pet, label, style, iconSize, iconColor }: { pet: Pick<Pet, 'id' | 'species' | 'photoUri'>; label?: string; style?: StyleProp<ImageStyle>; iconSize?: number; iconColor?: string }) {
  if (pet.photoUri) return <Image source={{ uri: pet.photoUri }} accessibilityLabel={label} contentFit="cover" style={[styles.fill, style]} />;
  const picture = petPlaceholder(pet);
  if (picture) return <Image source={picture} accessibilityLabel={label} accessible={!!label} contentFit="contain" style={[styles.fill, style]} />;
  return <Icon name="paw" size={iconSize} color={iconColor} />;
}
const styles = StyleSheet.create({ fill: { width: '100%', height: '100%' } });
