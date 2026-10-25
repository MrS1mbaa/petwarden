import * as Haptics from 'expo-haptics';

export function lightHaptic() {
  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {
    // Some devices and browsers have no haptic motor.
  });
}
export function successHaptic() {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
