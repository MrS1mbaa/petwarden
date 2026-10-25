import { copy } from '../lib/copy';
import { maskDate, swappedDate } from '../lib/dateInput';
import { FormField } from './FormField';

type Props = { label: string; value: string; onChange: (value: string) => void; validate: (value: string) => unknown; editable?: boolean; onCard?: boolean };
// Masks input as DD.MM.YYYY and explains a bad date as soon as all digits are in, not only after "Continue".
export function DateField({ label, value, onChange, validate, editable, onCard }: Props) {
  let error: string | null = null;
  if (value.length === 10) {
    try { validate(value); } catch {
      const swap = swappedDate(value);
      let swapOk = false;
      if (swap) { try { validate(swap); swapOk = true; } catch {} }
      error = swapOk ? copy.onboarding.dateSwap(swap!) : copy.onboarding.validation.birthDate;
    }
  }
  return <FormField label={label} editable={editable} onCard={onCard} value={value} placeholder={copy.onboarding.dateHint} onChangeText={text => onChange(maskDate(text))} keyboardType="number-pad" maxLength={10} error={error} />;
}
