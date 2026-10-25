// Decimal comma (Serbian) or point (English); both roll the same way.
const separator = /[.,]/;
export function rollingColumns(from: string, to: string) {
  const [oldInteger, oldFraction = ''] = from.split(separator), [newInteger, newFraction = ''] = to.split(separator);
  const mark = (text: string) => text.match(separator)?.[0] ?? ' ';
  const integers = Math.max(oldInteger.length, newInteger.length), fractions = Math.max(oldFraction.length, newFraction.length);
  const oldText = oldInteger.padStart(integers) + (fractions ? mark(from) + oldFraction.padEnd(fractions) : '');
  const newText = newInteger.padStart(integers) + (fractions ? mark(to) + newFraction.padEnd(fractions) : '');
  return [...newText].map((next, index) => ({ from: oldText[index], to: next }));
}
