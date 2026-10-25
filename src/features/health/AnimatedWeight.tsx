import { RollingNumber } from '../../components/RollingNumber';
import { AppText } from '../../components/AppText';
import { copy, locale } from '../../lib/copy';

export function AnimatedWeight({ value, compact = false }: { value: number | null; compact?: boolean }) {
  if (value === null) return <AppText variant={compact ? 'section' : 'title'} bold>{copy.missingValue}</AppText>;
  return <RollingNumber text={new Intl.NumberFormat(locale(), { maximumFractionDigits: 3, useGrouping: false }).format(value)} suffix={copy.units.kg.toUpperCase()} label={copy.healthRecords.kilograms(value)} variant={compact ? 'wellness' : 'title'} />;
}
