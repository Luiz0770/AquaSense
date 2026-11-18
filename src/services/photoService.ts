import * as ImagePicker from 'expo-image-picker';

export type PhotoSource = 'camera' | 'library';

export type PhotoPick = { ok: true; uri: string } | { ok: false; reason: 'permission' | 'canceled' | 'error' };

/** Recorte 16:10 (o mesmo formato da foto na tela de detalhe), qualidade média e sem metadados (EXIF, que pode ter a localização). */
const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [16, 10],
  quality: 0.6,
  exif: false,
};

/**
 * Tira uma foto com a câmera ou escolhe uma da galeria para anexar ao relato.
 * A câmera pede permissão; a galeria usa o seletor do sistema e não precisa de permissão.
 */
export async function pickReportPhoto(source: PhotoSource): Promise<PhotoPick> {
  try {
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return { ok: false, reason: 'permission' };
    }
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(OPTIONS) : await ImagePicker.launchImageLibraryAsync(OPTIONS);
    const asset = res.canceled ? undefined : res.assets?.[0];
    if (!asset?.uri) return { ok: false, reason: 'canceled' };
    return { ok: true, uri: asset.uri };
  } catch {
    return { ok: false, reason: 'error' };
  }
}
