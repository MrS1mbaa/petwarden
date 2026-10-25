import type { Scheduler } from './plan';
import type { NotificationTarget } from './open';
export const supported = false;
export const maxPending = 0;
export async function hasPermission() { return false; }
export async function requestPermission() { return false; }
export const scheduler: Scheduler = { list: async () => [], cancel: async () => {}, schedule: async () => {} };
export function observeNotificationOpen(_onOpen: (target: NotificationTarget) => void) { return () => {}; }
