import type { Species } from '../../db/species';

// Suggestions only: the breed field stays free text, so any breed can still be typed.
// Popular breeds come first because the unfiltered list shows only the top few.
const breeds: Record<Species, readonly string[]> = {
  dog: ['Labrador Retriever', 'German Shepherd', 'Golden Retriever', 'French Bulldog', 'Beagle', 'Pembroke Welsh Corgi', 'Dachshund', 'Samoyed', 'Poodle', 'Husky', 'Border Collie', 'Chihuahua', 'Yorkshire Terrier', 'Jack Russell Terrier', 'Shih Tzu', 'Pug', 'Rottweiler', 'Boxer', 'Cocker Spaniel', 'Maltese', 'Pomeranian', 'Dobermann', 'Great Dane', 'Saint Bernard', 'Bernese Mountain Dog', 'Australian Shepherd', 'Cavalier King Charles Spaniel', 'Bichon Frise', 'American Bulldog', 'English Bulldog', 'Staffordshire Bull Terrier', 'Pit Bull', 'Akita', 'Shiba Inu', 'Dalmatian', 'Weimaraner', 'Vizsla', 'Basset Hound', 'West Highland White Terrier', 'Schnauzer', 'Malinois', 'Newfoundland', 'Sarplaninac', 'Tornjak', 'Serbian Hound'],
  cat: ['British Shorthair', 'Maine Coon', 'Persian', 'Siamese', 'Ragdoll', 'Bengal', 'Sphynx', 'Scottish Fold', 'Russian Blue', 'Norwegian Forest Cat', 'Abyssinian', 'Birman', 'Burmese', 'Devon Rex', 'Exotic Shorthair', 'Oriental', 'Savannah', 'Siberian', 'Turkish Angora', 'Turkish Van', 'American Shorthair', 'Domestic Shorthair', 'Domestic Longhair'],
  rabbit: ['Holland Lop', 'Mini Lop', 'Netherland Dwarf', 'Lionhead', 'Mini Rex', 'Rex', 'Dutch', 'English Angora', 'Flemish Giant', 'Mini Satin', 'Polish', 'Harlequin', 'New Zealand White', 'Californian'],
  hamster: ['Syrian (Golden)', 'Dwarf Campbell', 'Winter White Dwarf', 'Roborovski', 'Chinese'],
  guinea_pig: ['American', 'Abyssinian', 'Peruvian', 'Silkie', 'Teddy', 'Texel', 'Skinny Pig', 'Crested'],
  bird: ['Budgerigar', 'Cockatiel', 'Canary', 'Lovebird', 'African Grey Parrot', 'Cockatoo', 'Macaw', 'Conure', 'Amazon Parrot', 'Finch', 'Parakeet', 'Eclectus', 'Dove', 'Pigeon'],
  reptile: ['Bearded Dragon', 'Leopard Gecko', 'Ball Python', 'Corn Snake', 'Red-eared Slider', 'Hermann\'s Tortoise', 'Greek Tortoise', 'Crested Gecko', 'Green Iguana', 'Chameleon', 'Boa Constrictor'],
  fish: ['Goldfish', 'Betta', 'Guppy', 'Neon Tetra', 'Angelfish', 'Molly', 'Platy', 'Koi', 'Cichlid', 'Discus', 'Zebra Danio'],
  other: [],
};
export const breedsFor = (species: Species) => breeds[species];
// Up to `limit` suggestions: breeds containing what was typed, or the popular ones while the field is empty.
export function breedSuggestions(species: Species, typed: string, limit = 8) {
  const query = typed.trim().toLowerCase();
  const list = breeds[species].filter(name => !query || name.toLowerCase().includes(query));
  return list.filter(name => name.toLowerCase() !== query).slice(0, limit);
}
