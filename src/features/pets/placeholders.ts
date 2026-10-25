import type { ImageSource } from 'expo-image';
import type { Species } from '../../db/schema';

// Shown when a pet has no photo. Pictures rotate by pet id so each pet keeps its own.
const pictures: Record<Species, ImageSource[]> = {
  dog: [require('../../../assets/placeholders/dog-corgi.webp'), require('../../../assets/placeholders/dog-beagle.webp'), require('../../../assets/placeholders/dog-dachshund.webp'), require('../../../assets/placeholders/dog-samoyed.webp')],
  cat: [require('../../../assets/placeholders/cat-tabby.webp')],
  rabbit: [require('../../../assets/placeholders/rabbit-lop.webp')],
  hamster: [require('../../../assets/placeholders/hamster.webp')],
  guinea_pig: [],
  bird: [],
  reptile: [],
  fish: [],
  other: [require('../../../assets/placeholders/rabbit-lop.webp'), require('../../../assets/placeholders/hamster.webp')],
};
export function petPlaceholder(pet: { id: number; species: Species }): ImageSource | null {
  const list = pictures[pet.species];
  return list.length ? list[pet.id % list.length] : null;
}
