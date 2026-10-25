import { Platform } from 'react-native';
import * as Notifications from './localNotifications.native';
import { copy } from '../lib/copy';
import type { Reminder, Scheduler } from './plan';
import { notificationTarget, type NotificationTarget } from './open';

export const supported = true;
// iOS keeps at most 64 pending requests; Android's AlarmManager allows 500 per app, so stay below that.
export const maxPending = Platform.OS === 'ios' ? 64 : 400;
const channelId = 'moj-care';
Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });
export async function hasPermission() {
  const value = await Notifications.getPermissionsAsync();
  return value.granted || value.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL || value.ios?.status === Notifications.IosAuthorizationStatus.EPHEMERAL;
}
// Re-created only when the channel name (language) changes: schedule() runs up to 400 times per sync.
let channelReady: { name: string; done: Promise<unknown> } | null = null;
function channel() {
  if (Platform.OS !== 'android') return Promise.resolve();
  const name = copy.reminders.channel;
  if (channelReady?.name !== name) channelReady = { name, done: Notifications.setNotificationChannelAsync(channelId, { name, importance: Notifications.AndroidImportance.DEFAULT, sound: 'default' }).catch(error => { channelReady = null; throw error; }) };
  return channelReady.done;
}
export async function requestPermission() {
  await channel();
  await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowSound: true, allowBadge: false } });
  return hasPermission();
}
export const scheduler: Scheduler = {
  list: async () => (await Notifications.getAllScheduledNotificationsAsync()).map(item => ({ id: item.identifier, fingerprint: typeof item.content.data?.fingerprint === 'string' ? item.content.data.fingerprint : null })),
  cancel: id => Notifications.cancelScheduledNotificationAsync(id),
  schedule: async (item: Reminder) => {
    await channel();
    const trigger = item.trigger.kind === 'daily' ? { type: Notifications.SchedulableTriggerInputTypes.DAILY as const, hour: item.trigger.hour, minute: item.trigger.minute, channelId }
      : item.trigger.kind === 'weekly' ? { type: Notifications.SchedulableTriggerInputTypes.WEEKLY as const, hour: item.trigger.hour, minute: item.trigger.minute, weekday: item.trigger.weekday, channelId }
        : { type: Notifications.SchedulableTriggerInputTypes.DATE as const, date: new Date(item.trigger.timestamp), channelId };
    await Notifications.scheduleNotificationAsync({ identifier: item.id, content: { title: item.title, body: item.body, sound: 'default', data: { fingerprint: item.fingerprint, app: 'petwarden', url: item.url ?? '/', ...(item.petId == null ? {} : { petId: item.petId }) } }, trigger });
  },
};
export function observeNotificationOpen(onOpen: (target: NotificationTarget) => void) {
  const consume = (response: Notifications.NotificationResponse) => {
    const target = notificationTarget(response.notification.request.content.data);
    if (!target) return;
    onOpen(target);
    Notifications.clearLastNotificationResponse();
  };
  const last = Notifications.getLastNotificationResponse();
  if (last) consume(last);
  const listener = Notifications.addNotificationResponseReceivedListener(consume);
  return () => listener.remove();
}
