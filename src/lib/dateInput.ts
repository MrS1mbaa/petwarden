// Typing "01132026" yields "01.13.2026": digits only, dots inserted, so no separator is ever guessed wrong.
export function maskDate(text: string) {
  const d = text.replace(/\D/g, '').slice(0, 8);
  return d.length <= 2 ? d : d.length <= 4 ? `${d.slice(0, 2)}.${d.slice(2)}` : `${d.slice(0, 2)}.${d.slice(2, 4)}.${d.slice(4)}`;
}
// "01.13.2026" is month-first; offer "13.01.2026". Returns null unless swapping is a plausible fix.
export function swappedDate(text: string) {
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(text);
  return m && Number(m[1]) <= 12 && Number(m[2]) > 12 && Number(m[2]) <= 31 ? `${m[2]}.${m[1]}.${m[3]}` : null;
}
// Typing "0800" yields "08:00", "830" yields "08:30" (an hour can't start with 3-9), "8:" keeps meaning 08.
// Several times (medication) are split every four digits: "08002000" -> "08:00, 20:00".
export function maskTimes(text: string, max = 12) {
  let digits = text.replace(/(^|\D)(\d)(?=:)/g, '$10$2').replace(/\D/g, '');
  const times: string[] = [];
  while (digits && times.length < max) {
    if (Number(digits[0]) > 2) digits = `0${digits}`;
    const time = digits.slice(0, 4); digits = digits.slice(4);
    times.push(time.length > 2 ? `${time.slice(0, 2)}:${time.slice(2)}` : time);
  }
  return times.join(', ');
}
export const maskTime = (text: string) => maskTimes(text, 1);
