import { Platform } from 'react-native';
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
    return { ok: true, uri: Platform.OS === 'web' ? await shrinkForWeb(asset.uri) : asset.uri };
  } catch {
    return { ok: false, reason: 'error' };
  }
}

/** Maior lado da foto guardada na web, em pixels. */
const WEB_MAX_SIDE = 1024;

/**
 * Na web a foto chega como data URL com a imagem inteira (vários MB) e o relato
 * é gravado no localStorage, que só aceita uns 5 MB no total. Reduzimos para no
 * máximo 1024 px em JPEG, o que deixa a foto com uns 100–200 KB.
 * Se algo falhar, devolve a imagem original.
 */
async function shrinkForWeb(uri: string): Promise<string> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = uri;
    });
    const scale = Math.min(1, WEB_MAX_SIDE / Math.max(img.width, img.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return uri;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return uri;
  }
}
