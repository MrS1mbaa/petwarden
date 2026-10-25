import { copy } from '../../lib/copy.ts';
export const maxAssetBytes = 12 * 1024 * 1024;
export const maxBackupBytes = 24 * 1024 * 1024;
export const supportedMime = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
export function documentTitle(value: string) {
  const title = value.trim();
  if (!title || title.length > 150) throw new Error(copy.documents.invalidName);
  return title;
}
export function mimeForName(name: string) {
  const extension = name.toLowerCase().split('.').at(-1);
  return ({ pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' } as Record<string, string>)[extension ?? ''] ?? '';
}
export function validateAsset(mime: string, bytes: number) {
  if (!supportedMime.includes(mime) || !Number.isFinite(bytes) || bytes <= 0 || bytes > maxAssetBytes) throw new Error(copy.documents.invalidFile);
}
export function validateDataUri(uri: string) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/]*={0,2})$/.exec(uri);
  if (!match || match[2].length % 4 !== 0) throw new Error(copy.documents.invalidFile);
  const bytes = match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0);
  validateAsset(match[1], bytes);
  return { mime: match[1], bytes };
}
// Stored URIs are either data URLs (web) or app files keeping their extension (native).
export function documentKind(uri: string): 'pdf' | 'image' {
  const mime = uri.startsWith('data:') ? uri.slice(5, uri.indexOf(';')) : mimeForName(uri.split(/[?#]/)[0]);
  return mime === 'application/pdf' ? 'pdf' : 'image';
}
export function matchesQuery(title: string, query: string) {
  const normalize = (value: string) => value.toLocaleLowerCase('sr-Latn-RS').normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/đ/g, 'dj');
  return normalize(title).includes(normalize(query.trim()));
}
