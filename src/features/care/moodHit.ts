export type MoodBounds = { x: number; y: number; width: number; height: number };
export function moodAtPoint(bounds: (MoodBounds | null)[], x: number, y: number) {
  'worklet';
  return bounds.findIndex(box => box !== null && x >= box.x && x < box.x + box.width && y >= box.y && y < box.y + box.height);
}
