// Order is the order shown in the picker. `other` is the catch-all for anything not listed.
export const speciesList = ['dog', 'cat', 'rabbit', 'hamster', 'guinea_pig', 'bird', 'reptile', 'fish', 'other'] as const;
export type Species = (typeof speciesList)[number];
export const isSpecies = (value: unknown): value is Species => (speciesList as readonly unknown[]).includes(value);
