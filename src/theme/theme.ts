// Accents come from the corgi mascot; each care category owns one: meals corgi, walks sage,
// mood butter, vet blush, medication/documents sky. *Soft is a tile tint, *Deep is AA text on it.
export const lightColors = {
  bg: '#F7F5F0', surface: '#EDEAE3', surfaceRaised: '#FFFFFF',
  ink: '#1E1E1E', textPrimary: '#1E1E1E', textSecondary: '#5E5B55',
  textMuted: '#8A867E', onInk: '#F7F5F0', shadow: '#1E1E1E14',
  highlight: '#FFFFFFB3', paw: '#E6E2D9', green: '#3F6B35', orange: '#A3460C', error: '#B3261E', hero: '#1E1E1E', onHero: '#F7F5F0', heroMuted: '#BDB8AE', heroChip: '#FFFFFF1A', scrim: '#000000', photoFrame: '#FFFFFF',
  corgi: '#F07A2B', corgiSoft: '#FFE4D1', corgiDeep: '#A3460C', onCorgi: '#1E1E1E',
  sage: '#6F9B62', sageSoft: '#E1EEDA', sageDeep: '#3F6B35', onSage: '#FFFFFF',
  butter: '#FFC845', butterSoft: '#FFF3CC', butterDeep: '#7A5300',
  blush: '#F2A0A0', blushSoft: '#FCE3E1', blushDeep: '#A23A3F',
  sky: '#7DB3E8', skySoft: '#E2EEFA', skyDeep: '#275D90',
} as const;

export type Colors = { [Key in keyof typeof lightColors]: string };
export const darkColors: Colors = {
  bg: '#171715', surface: '#252522', surfaceRaised: '#2E2E2A',
  ink: '#F2F0EA', textPrimary: '#F2F0EA', textSecondary: '#BAB6AC',
  textMuted: '#8F8B82', onInk: '#1E1E1C', shadow: '#00000045',
  highlight: '#FFFFFF0B', paw: '#262622', green: '#B5DAA9', orange: '#FFB98A', error: '#F0A69C', hero: '#0F0F0D', onHero: '#F2F0EA', heroMuted: '#BAB6AC', heroChip: '#FFFFFF14', scrim: '#000000', photoFrame: '#D8D4CA',
  corgi: '#FF9150', corgiSoft: '#4A2F1E', corgiDeep: '#FFB98A', onCorgi: '#1E1E1E',
  sage: '#8EC07F', sageSoft: '#2C3A27', sageDeep: '#B5DAA9', onSage: '#1E1E1C',
  butter: '#FFD466', butterSoft: '#463D22', butterDeep: '#FFE08F',
  blush: '#F5B1B1', blushSoft: '#47292A', blushDeep: '#F8C4C4',
  sky: '#95C3F0', skySoft: '#24344A', skyDeep: '#B9D7F5',
};
export type Accent = 'corgi' | 'sage' | 'butter' | 'blush' | 'sky';
export function accent(colors: Colors, name: Accent) {
  return { fill: colors[name], soft: colors[`${name}Soft`], deep: colors[`${name}Deep`] };
}

export const tokens = {
  documents: { previewHeight: 240 },
  planner: { dayWidth: 48, dayHeight: 72, weekDays: 7, dayPoll: 60_000 },
  chart: { numberDuration: 350, numberBaseline: 32, height: 180, padding: 20, limit: 30, stroke: 3, gridStroke: 1, pointRadius: 3, selectedRadius: 7, drawDuration: 420, tooltipWidth: 216, tooltipHeight: 40, tooltipTop: 0, tooltipBaseline: 25 },
  decoration: { pawOpacity: 0.55 },
  illustration: { green: '#35B984', greenShade: '#1D8158', orange: '#F2A13D', orangeShade: '#BA6825', food: '#FFBF49', foodShade: '#DF8A28', outline: '#262523', shine: '#FFFFFFB0' },
  home: { compactBreakpoint: 360, compactNameSize: 24, compactNameLineHeight: 32, avatar: 44, heroHeight: 148, heroPhoto: 120, heroPhotoInset: 12, heroPhotoTop: -22, heroPhotoFrame: 4, heroTextLeft: 148, heroTopGap: 40, moodBottom: -22, taskHeight: 64, checkWidth: 64, careIcon: 36, careTile: 48, careTileRadius: 16, ring: 56, ringStroke: 6, progressHeight: 8, wellnessHeight: 140, wellnessIcon: 36, wellnessValue: 26, wellnessLineHeight: 34, wellnessNumberBaseline: 27, completedOpacity: 0.65, checkScale: 0.96, checkPop: 1.12, checkBurst: 96, swipeReveal: 80, swipeThreshold: 24, swipeRubber: 0.18 },
  sheet: { maxHeightRatio: 0.86, hiddenRatio: 0.9, dismissThreshold: 90, dismissVelocity: 900, rubber: 0.18, handleWidth: 40, handleHeight: 5, blur: 24, dim: 0.3, snapDuration: 280, moodScale: 1.12 },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, hero: 48 },
  radius: { card: 28, icon: 20, pill: 999 },
  size: {
    touch: 48, icon: 24, emblem: 64, emptyIllustration: 88,
    tabHeight: 76, tabPillHeight: 64, tabInset: 6, tabMaxWidth: 480,
    pageMaxWidth: 560, cardMinHeight: 260, shadowBleed: 16,
    pawCanvasHeight: 280, screenSlide: 12,
    inputHeight: 56, photo: 112, progressDot: 8, progressActiveWidth: 28,
  },
  type: {
    label: { fontSize: 13, lineHeight: 18 },
    body: { fontSize: 16, lineHeight: 24 },
    section: { fontSize: 20, lineHeight: 28 },
    title: { fontSize: 32, lineHeight: 40 },
  },
  font: { medium: 'SpaceMedium', bold: 'SpaceBold' },
  motion: {
    spring: { damping: 16, stiffness: 190, mass: 1 },
    pressScale: 0.97, fadeDuration: 220, stagger: 60,
    tabStretch: 1.1, tabBounce: 1.12, shimmerDuration: 1_400, shimmerWidthRatio: 0.35,
    photoMeasureTimeout: 300, photoTransitionTimeout: 1_500, photoOverlayLayer: 10, digitGap: 1, labelNumberBaseline: 14,
  },
  shadow: { blur: 10, offset: 4, innerBlur: 3, innerOffset: 1 },
  splash: { titleTopRatio: 0.06, titleScale: 0.14, firstLineScale: 0.2, titleLineHeight: 1, dogHeightRatio: 0.52, dogWidthRatio: 1, dogBottom: 120, logo: 40, glowOuter: 1.45, glowInner: 0.95, glowBottom: 90, chipTops: [0.5, 0.6, 0.7], dogEnterOffset: 120, letterDelay: 35, dogDelay: 140, buttonDelay: 660, buttonScale: 0.92, buttonMinWidth: 200, titleTracking: -2, glyphWidth: 0.64, titleMaxWidth: 0.88 },
} as const;

export type ThemeMode = 'system' | 'light' | 'dark';
export function resolveTheme(mode: ThemeMode, system: string | null | undefined) {
  return mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
}
