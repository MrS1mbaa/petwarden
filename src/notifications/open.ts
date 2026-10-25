export type NotificationTarget = { url: '/' | '/health'; petId?: number };
export function notificationTarget(data: unknown): NotificationTarget | null {
  if (!data || typeof data !== 'object') return null;
  const value = data as Record<string, unknown>;
  if (value.app !== 'petwarden') return null;
  if (value.petId != null && (!Number.isSafeInteger(value.petId) || Number(value.petId) <= 0)) return null;
  return { url: value.url === '/health' ? '/health' : '/', ...(value.petId == null ? {} : { petId: value.petId as number }) };
}
