import { create } from 'zustand';
import { readSetting, writeSetting } from '../../db/repositories/settings';

// Bump when the Terms of use or Privacy policy change in substance: every user then sees the
// acceptance screen again before the app opens.
export const TERMS_VERSION = '2026-10-25';
const KEY = 'termsAcceptedVersion';

type State = { accepted: boolean };
export const useTerms = create<State>(() => ({ accepted: false }));

export async function hydrateTerms() {
  useTerms.setState({ accepted: (await readSetting(KEY)) === TERMS_VERSION });
}
export async function acceptTerms() {
  await writeSetting(KEY, TERMS_VERSION);
  useTerms.setState({ accepted: true });
}
