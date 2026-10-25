import { en } from './i18n/en.ts';
import { sr } from './i18n/sr.ts';
import type { Copy } from './i18n/types.ts';

export type Language = 'en' | 'sr';
export const languages: Language[] = ['en', 'sr'];
const dictionaries: Record<Language, Copy> = { en, sr };
let current: Language = 'en';

export function isLanguage(value: unknown): value is Language { return value === 'en' || value === 'sr'; }
export function setCopyLanguage(language: Language) { current = language; }
export function copyLanguage() { return current; }
export function locale() { return current === 'sr' ? 'sr-Latn-RS' : 'en-GB'; }
// Reads through to the active dictionary, so `copy.home.title` always follows the chosen language.
export const copy = new Proxy({} as Copy, { get: (_target, key) => dictionaries[current][key as keyof Copy] });
