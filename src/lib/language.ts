import { create } from 'zustand';
import { readSetting, writeSetting } from '../db/repositories/settings';
import { syncReminders } from '../notifications/service';
import { copyLanguage, isLanguage, setCopyLanguage, type Language } from './copy';

type State = { language: Language };
// Screens subscribe to this store so they re-render when the dictionary behind `copy` switches.
export const useLanguage = create<State>(() => ({ language: copyLanguage() }));

export async function hydrateLanguage() {
  const saved = await readSetting('language');
  if (isLanguage(saved)) { setCopyLanguage(saved); useLanguage.setState({ language: saved }); }
}
export async function changeLanguage(language: Language) {
  setCopyLanguage(language);
  useLanguage.setState({ language });
  await writeSetting('language', language);
  // Scheduled notifications carry their text, so they are rebuilt in the new language.
  await syncReminders().catch(() => {});
}
