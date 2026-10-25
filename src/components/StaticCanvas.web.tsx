import { useEffect, useState, type PropsWithChildren } from 'react';
import { Image, PixelRatio, StyleSheet, View, type ViewProps } from 'react-native';
import { Group, Skia, drawAsPicture } from '@shopify/react-native-skia';

// Small static Skia surfaces share no persistent WebGL contexts on web.
// Raster surfaces also avoid the upstream zero-size OffscreenCanvas unmount race.
export function StaticCanvas({ children, style, ...props }: PropsWithChildren<ViewProps>) {
  const layout = StyleSheet.flatten(style);
  const width = typeof layout?.width === 'number' ? layout.width : 0;
  const height = typeof layout?.height === 'number' ? layout.height : 0;
  const [uri, setUri] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (width <= 0 || height <= 0) return;
    const scale = PixelRatio.get();
    void drawAsPicture(<Group>{children}</Group>).then(picture => {
      const surface = Skia.Surface.Make(Math.ceil(width * scale), Math.ceil(height * scale));
      if (!surface) { picture.dispose(); throw new Error('Skia surface nije dostupna.'); }
      try {
        const canvas = surface.getCanvas();
        canvas.scale(scale, scale);
        canvas.drawPicture(picture);
        surface.flush();
        const image = surface.makeImageSnapshot();
        try { if (active) setUri(`data:image/png;base64,${image.encodeToBase64()}`); }
        finally { image.dispose(); }
      } finally { surface.dispose(); picture.dispose(); }
    }).catch(error => { if (__DEV__) console.warn('Statički Skia prikaz nije učitan.', error); });
    return () => { active = false; };
  }, [children, height, width]);
  return <View {...props} style={style}>{uri && <Image source={{ uri }} style={styles.image} resizeMode="stretch" />}</View>;
}
const styles = StyleSheet.create({ image: { width: '100%', height: '100%' } });
