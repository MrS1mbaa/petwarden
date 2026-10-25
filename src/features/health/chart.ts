export type Measurement = { id: number; date: string; valueKg: number };
export type ChartPoint = Measurement & { x: number; y: number };
export function chartGeometry(records: Measurement[], width: number, height: number, padding: number, limit: number) {
  const daily = new Map<string, Measurement>();
  for (const record of records.slice().sort((a, b) => a.date.localeCompare(b.date) || a.id - b.id)) {
    if (Number.isFinite(record.valueKg) && record.valueKg > 0 && Number.isFinite(Date.parse(record.date))) daily.set(record.date, record);
  }
  const sorted = [...daily.values()].slice(-limit);
  if (!sorted.length || width <= padding * 2 || height <= padding * 2) return { points: [] as ChartPoint[], path: '', min: 0, max: 0 };
  const values = sorted.map(record => record.valueKg);
  const low = Math.min(...values), high = Math.max(...values);
  const margin = Math.max((high - low) * 0.15, high * 0.02, 0.1);
  const min = Math.max(0, low - margin), max = high + margin;
  const first = Date.parse(sorted[0].date), last = Date.parse(sorted.at(-1)!.date);
  const points = sorted.map(record => ({
    ...record,
    x: first === last ? width / 2 : padding + (Date.parse(record.date) - first) / (last - first) * (width - padding * 2),
    y: padding + (max - record.valueKg) / (max - min) * (height - padding * 2),
  }));
  // Straight segments preserve measured values without smoothing overshoot.
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ');
  return { points, path, min, max };
}
export function nearestPoint(points: { x: number }[], x: number) {
  'worklet';
  let nearest = 0;
  for (let index = 1; index < points.length; index++) {
    if (Math.abs(points[index].x - x) < Math.abs(points[nearest].x - x)) nearest = index;
  }
  return nearest;
}
