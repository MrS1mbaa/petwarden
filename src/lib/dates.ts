export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function displayDate(iso: string | null) {
  return iso ? iso.split('-').reverse().join('.') + '.' : '—';
}
