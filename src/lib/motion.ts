import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { ReduceMotion, useReducedMotion } from 'react-native-reanimated';
import { tokens } from '../theme/theme';

export const spring = { ...tokens.motion.spring, reduceMotion: ReduceMotion.System };

export function useMotionPreference() {
  const initial = useReducedMotion();
  const [reduced, setReduced] = useState(initial);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(value => { if (active) setReduced(value); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { active = false; subscription.remove(); };
  }, []);
  return reduced;
}
