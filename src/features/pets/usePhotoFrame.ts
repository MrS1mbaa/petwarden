import { useCallback, useLayoutEffect, type RefObject } from 'react';
import { View } from 'react-native';
import { tokens } from '../../theme/theme';
import { usePhotoTransition } from './photoTransition';
import { validPhotoFrame, type PhotoFrame } from './photoGeometry';

export function measurePhotoFrame(ref: RefObject<View | null>): Promise<PhotoFrame | null> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => resolve(null), tokens.motion.photoMeasureTimeout);
    if (!ref.current) { clearTimeout(timeout); resolve(null); return; }
    try { ref.current.measureInWindow((x, y, width, height) => { clearTimeout(timeout); const frame = { x, y, width, height }; resolve(validPhotoFrame(frame) ? frame : null); }); }
    catch { clearTimeout(timeout); resolve(null); }
  });
}
export function usePhotoTarget(petId: number | undefined, ref: RefObject<View | null>) {
  const pending = usePhotoTransition(state => state.pending);
  const matching = pending?.petId === petId ? pending : null;
  const key = matching?.key;
  const measure = useCallback(() => {
    if (key === undefined) return;
    void measurePhotoFrame(ref).then(frame => { if (frame) usePhotoTransition.getState().target(key, frame); });
  }, [key, ref]);
  useLayoutEffect(measure, [measure]);
  return { measure, transferring: matching !== null, measured: matching === null || matching.to !== null };
}
