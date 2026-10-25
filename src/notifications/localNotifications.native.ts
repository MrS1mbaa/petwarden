// SDK 57's barrel starts remote push registration on import, which throws in Android Expo Go.
// Import only local APIs; keep this boundary checked when upgrading expo-notifications.
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { IosAuthorizationStatus } from 'expo-notifications/build/NotificationPermissions.types';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { SchedulableTriggerInputTypes, type NotificationResponse } from 'expo-notifications/build/Notifications.types';
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { getAllScheduledNotificationsAsync } from 'expo-notifications/build/getAllScheduledNotificationsAsync';
export { cancelScheduledNotificationAsync } from 'expo-notifications/build/cancelScheduledNotificationAsync';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { getLastNotificationResponse, clearLastNotificationResponse, addNotificationResponseReceivedListener } from 'expo-notifications/build/NotificationsEmitter';
