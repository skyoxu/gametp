import React from 'react';
import { I18nContext } from './core';

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
