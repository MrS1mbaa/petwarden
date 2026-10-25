import { create } from 'zustand';
import type { Pet } from '../../db/schema';
import { initialDraft, type PetDraft } from './validation';

type PetState = { pets: Pet[]; activePetId: number | null; draft: PetDraft; setPets: (pets: Pet[], activePetId: number | null) => void; updateDraft: (patch: Partial<PetDraft>) => void; resetDraft: () => void };
export const usePetStore = create<PetState>(set => ({
  pets: [], activePetId: null, draft: { ...initialDraft },
  setPets: (pets, activePetId) => set({ pets, activePetId }),
  updateDraft: patch => set(state => ({ draft: { ...state.draft, ...patch } })),
  resetDraft: () => set({ draft: { ...initialDraft } }),
}));
export function useActivePet() {
  return usePetStore(state => state.pets.find(pet => pet.id === state.activePetId) ?? state.pets[0] ?? null);
}
