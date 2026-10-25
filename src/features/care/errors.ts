import { copy } from '../../lib/copy';
// Built per call so the list matches whichever language is active.
const messages = (): readonly string[] => [copy.homeCare.invalidTitle, copy.homeCare.invalidType, copy.onboarding.validation.time, copy.onboarding.validation.name, copy.onboarding.validation.breed, copy.plannerCare.invalidRepeat];
export function careError(error: unknown) {
  return error instanceof Error && messages().includes(error.message) ? error.message : copy.homeCare.saveError;
}
