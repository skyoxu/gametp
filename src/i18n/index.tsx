import React from 'react';
import en from './en-US.json';
import zh from './zh-CN.json';

type Lang = 'en-US' | 'zh-CN';

type Dict = typeof en;

const DICTS: Record<Lang, Dict> = {
  'en-US': en,
  'zh-CN': zh,
};

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

function detectLang(): Lang {
  const stored = localStorage.getItem('app.lang') as Lang | null;
  if (stored && (stored === 'en-US' || stored === 'zh-CN')) return stored;
  const nav = (navigator.language || 'en-US').toLowerCase();
  if (nav.startsWith('zh')) return 'zh-CN';
  return 'en-US';
}

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

export function useI18n() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return (key: string, vars?: Record<string, string | number>) =>
    ctx.t(key, vars);
}

export function useLang() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error('useLang must be used within I18nProvider');
  return { lang: ctx.lang, setLang: ctx.setLang };
}
