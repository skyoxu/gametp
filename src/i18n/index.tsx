import React from 'react';
import {
  DICTS,
  detectLang,
  I18nContext,
  type I18nContextValue,
  type Lang,
} from './core';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>(detectLang());

  const setLang = React.useCallback((l: Lang) => {
    localStorage.setItem('app.lang', l);
    setLangState(l);
  }, []);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[lang] as any;
      const parts = key.split('.');
      let curr: any = dict;
      for (const p of parts) {
        curr = curr?.[p];
        if (curr == null) break;
      }
      let val = typeof curr === 'string' ? curr : key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          val = val.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), String(v));
        });
      }
      return val;
    },
    [lang]
  );

  const value = React.useMemo<I18nContextValue>(
    () => ({ lang, setLang, t }),
    [lang, setLang, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
