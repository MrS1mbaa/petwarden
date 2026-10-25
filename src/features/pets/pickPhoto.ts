import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { copy } from '../../lib/copy';
import { mimeForName } from '../documents/model';
export async function pickPhotoAsset() {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) throw new Error(copy.onboarding.photoPermission);
  }
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8, allowsMultipleSelection: false });
  if (result.canceled || !result.assets[0]) return null;
  const asset = result.assets[0], name = asset.fileName ?? asset.uri.split('/').at(-1) ?? 'fotografija.jpg';
  const dataMime = /^data:([^;,]+)/.exec(asset.uri)?.[1];
  return { uri: asset.uri, name, mime: asset.mimeType ?? dataMime ?? (mimeForName(name) || 'image/jpeg') };
}
export async function pickPhoto() { return (await pickPhotoAsset())?.uri ?? null; }
