import { copy } from '../../lib/copy.ts';

export function petAge(birthDate: string | null, today: Date) {
  if (!birthDate) return null;
  const [year, month, day] = birthDate.split('-').map(Number);
  const months = (today.getFullYear() - year) * 12 + today.getMonth() + 1 - month - (today.getDate() < day ? 1 : 0);
  if (months < 0) return null;
  const anniversary = new Date(year, month - 1 + months, day, 12); // may roll into next month for day 31: still a safe lower bound
  const days = Math.max(0, Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12).getTime() - anniversary.getTime()) / 86_400_000));
  return copy.homeCare.age(Math.floor(months / 12), months % 12, days);
}
