import { create } from 'zustand';
import { validPhotoFrame, type PhotoFrame } from './photoGeometry';

type Transition = { key: number; petId: number; uri: string; from: PhotoFrame; to: PhotoFrame | null };
type State = { pending: Transition | null; begin: (petId: number, uri: string, from: PhotoFrame) => void; target: (key: number, to: PhotoFrame) => void; finish: (key: number) => void };
let sequence = 0;
export const usePhotoTransition = create<State>(set => ({
  pending: null,
  begin: (petId, uri, from) => { if (validPhotoFrame(from)) set({ pending: { key: ++sequence, petId, uri, from, to: null } }); },
  target: (key, to) => { if (validPhotoFrame(to)) set(state => state.pending?.key === key && !state.pending.to ? { pending: { ...state.pending, to } } : state); },
  finish: key => set(state => state.pending?.key === key ? { pending: null } : state),
}));
