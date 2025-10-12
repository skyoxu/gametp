import React from 'react';
import en from './en-US.json';
import zh from './zh-CN.json';

export type Lang = 'en-US' | 'zh-CN';

export type Dict = typeof en;

export const DICTS: Record<Lang, Dict> = {
  'en-US': en,
  'zh-CN': zh,
};

export interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

export const I18nContext = React.createContext<I18nContextValue | null>(null);

export function detectLang(): Lang {
  const stored = localStorage.getItem('app.lang') as Lang | null;
  if (stored && (stored === 'en-US' || stored === 'zh-CN')) return stored;
  const nav = (navigator.language || 'en-US').toLowerCase();
  if (nav.startsWith('zh')) return 'zh-CN';
  return 'en-US';
}
