import { useCallback, useEffect, useState } from 'react';
import { hydratePets } from './service';
import { hydrateLanguage } from '../../lib/language';
import { hydrateTerms } from '../legal/terms';
import { clearTransientFiles } from '../documents/storage';

export function useBootstrap() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const load = useCallback(() => Promise.all([hydrateLanguage(), hydratePets(), hydrateTerms()]).then(() => setStatus('ready'), error => {
    if (__DEV__) console.error('Lokalna baza nije učitana:', error);
    setStatus('error');
  }), []);
  useEffect(() => {
    try { clearTransientFiles(); } catch { /* best-effort cleanup, never blocks startup */ }
    void load();
  }, [load]);
  return { status, retry: () => { setStatus('loading'); void load(); } };
}
