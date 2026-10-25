export type PhotoFrame = { x: number; y: number; width: number; height: number };
export function validPhotoFrame(frame: PhotoFrame) {
  return Object.values(frame).every(Number.isFinite) && frame.width > 0 && frame.height > 0;
}
export function localPhotoFrame(frame: PhotoFrame, origin: { x: number; y: number }): PhotoFrame {
  'worklet';
  return { ...frame, x: frame.x - origin.x, y: frame.y - origin.y };
}
export function interpolatePhotoFrame(from: PhotoFrame, to: PhotoFrame, progress: number): PhotoFrame {
  'worklet';
  return { x: from.x + (to.x - from.x) * progress, y: from.y + (to.y - from.y) * progress, width: from.width + (to.width - from.width) * progress, height: from.height + (to.height - from.height) * progress };
}
