// Removes the Firebase / Google Play services parts that expo-notifications' push support merges into
// the manifest. PetWarden only schedules local notifications and has no Firebase config or internet
// permission, so these components never work; removing them keeps the APK free of push/telemetry
// entry points. The Java classes stay compiled in, they just can never start.
const { withAndroidManifest } = require('expo/config-plugins');

const REMOVE = {
  activity: ['com.google.android.gms.common.api.GoogleApiActivity'],
  provider: ['com.google.firebase.provider.FirebaseInitProvider'],
  receiver: [
    'com.google.firebase.iid.FirebaseInstanceIdReceiver',
    'com.google.android.datatransport.runtime.scheduling.jobscheduling.AlarmManagerSchedulerBroadcastReceiver',
  ],
  service: [
    'com.google.firebase.components.ComponentDiscoveryService',
    'com.google.firebase.messaging.FirebaseMessagingService',
    'expo.modules.notifications.service.ExpoFirebaseMessagingService',
    'com.google.android.datatransport.runtime.backends.TransportBackendDiscovery',
    'com.google.android.datatransport.runtime.scheduling.jobscheduling.JobInfoSchedulerService',
    'com.google.android.gms.metadata.ModuleDependencies',
  ],
};

module.exports = config => withAndroidManifest(config, mod => {
  const manifest = mod.modResults.manifest;
  manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
  const application = manifest.application[0];
  for (const [tag, names] of Object.entries(REMOVE)) {
    const kept = (application[tag] ?? []).filter(item => !names.includes(item.$['android:name']));
    application[tag] = [...kept, ...names.map(name => ({ $: { 'android:name': name, 'tools:node': 'remove' } }))];
  }
  return mod;
});
