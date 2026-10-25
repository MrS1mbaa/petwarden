import assert from 'node:assert/strict';
import { darkColors, lightColors, resolveTheme, tokens } from '../src/theme/theme.ts';
import { en } from '../src/lib/i18n/en.ts';
import { sr } from '../src/lib/i18n/sr.ts';
import { copy, copyLanguage, setCopyLanguage } from '../src/lib/copy.ts';

function luminance(hex: string) {
  const values = hex.slice(1).match(/.{2}/g)!.map(value => {
    const channel = parseInt(value, 16) / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
function contrast(a: string, b: string) {
  const [light, dark] = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}
function composite(front: string, back: string, opacity: number) {
  const channels = [0, 1, 2].map(index => Math.round(parseInt(front.slice(1 + index * 2, 3 + index * 2), 16) * opacity + parseInt(back.slice(1 + index * 2, 3 + index * 2), 16) * (1 - opacity)));
  return '#' + channels.map(value => value.toString(16).padStart(2, '0')).join('');
}
for (const colors of [lightColors, darkColors]) {
  for (const background of [colors.bg, colors.surface, colors.surfaceRaised]) {
    for (const foreground of [colors.textPrimary, colors.textSecondary]) {
      assert.ok(contrast(foreground, background) >= 4.5, `${foreground}/${background} nema AA kontrast`);
    }
  }
  assert.ok(contrast(colors.onInk, colors.ink) >= 4.5);
  assert.ok(contrast(colors.onHero, colors.hero) >= 4.5);
  assert.ok(contrast(colors.heroMuted, colors.hero) >= 4.5);
  for (const name of ['corgi', 'sage', 'butter', 'blush', 'sky'] as const) {
    assert.ok(contrast(colors[`${name}Deep`], colors[`${name}Soft`]) >= 4.5, `${name}Deep/${name}Soft nema AA kontrast`);
    assert.ok(contrast(colors.textPrimary, colors[`${name}Soft`]) >= 4.5, `tekst/${name}Soft nema AA kontrast`);
  }
  assert.ok(contrast(colors.onCorgi, colors.corgi) >= 4.5, 'Tekst na glavnom dugmetu nema AA kontrast');
  assert.ok(contrast(colors.onSage, colors.sage) >= 3, 'Potvrda na zelenoj pločici nema 3:1 kontrast');
  assert.ok(contrast(composite(colors.textPrimary, colors.bg, tokens.home.completedOpacity), composite(colors.surface, colors.bg, tokens.home.completedOpacity)) >= 4.5, 'Završena nega mora zadržati AA kontrast');
}
// Both languages must expose identical keys, array lengths and call signatures.
function shape(value: unknown): unknown {
  if (typeof value === 'function') return `fn${value.length}`;
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map(key => [key, shape((value as Record<string, unknown>)[key])]));
  return typeof value;
}
assert.deepEqual(shape(en), shape(sr), 'English and Serbian copy differ in shape');
assert.equal(copyLanguage(), 'en', 'English is the default language');
assert.equal(copy.home.title, 'Home');
setCopyLanguage('sr'); assert.equal(copy.home.title, 'Početna'); setCopyLanguage('en');
assert.equal(resolveTheme('system', 'dark'), 'dark');
assert.equal(resolveTheme('system', null), 'light');
assert.equal(resolveTheme('light', 'dark'), 'light');
assert.equal(resolveTheme('dark', 'light'), 'dark');
assert.ok(tokens.size.touch >= 48);
console.log('PASS: AA kontrast obe teme, izbor teme, minimalna dodirna zona.');
