/**
 * i18n keys parity test (en-US vs zh-CN)
 * Ensures zh-CN contains all keys required by components used in template
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function loadJson(p: string) {
  return JSON.parse(readFileSync(p, 'utf-8')) as Record<string, any>;
}

function listKeys(obj: any, prefix = ''): string[] {
  if (obj == null || typeof obj !== 'object') return [prefix].filter(Boolean);
  const keys: string[] = [];
  for (const k of Object.keys(obj)) {
    const p = prefix ? `${prefix}.${k}` : k;
    const child = obj[k];
    if (child && typeof child === 'object') {
      keys.push(...listKeys(child, p));
    } else {
      keys.push(p);
    }
  }
  return keys;
}

describe('i18n keys parity', () => {
  it('zh-CN should contain all keys present in en-US for used namespaces', () => {
    const en = loadJson(join(process.cwd(), 'src', 'i18n', 'en-US.json'));
    const zh = loadJson(join(process.cwd(), 'src', 'i18n', 'zh-CN.json'));

    const namespaces = [
      'controlPanel',
      'notifications',
      'interface',
      'statusPanel',
      'settingsPanel',
    ] as const;

    for (const ns of namespaces) {
      const enNs = en[ns];
      const zhNs = zh[ns];
      expect(enNs).toBeTruthy();
      expect(zhNs).toBeTruthy();

      const enKeys = listKeys(enNs, ns);
      const zhKeys = new Set(listKeys(zhNs, ns));

      const missing = enKeys.filter(k => !zhKeys.has(k));
      expect(missing).toEqual([]);
    }
  });
});
