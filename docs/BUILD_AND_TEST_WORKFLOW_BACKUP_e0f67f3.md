# Build and Test 宸ヤ綔娴佸浠芥枃妗?(e0f67f3鐗堟湰)

## 馃搵 澶囦唤璇存槑

**鍒涘缓鏃堕棿:** 2025-09-14  
**鍩轰簬鐗堟湰:** e0f67f3 (fix(e2e): 淇e2e-perf-smoke娴嬭瘯鐜鍙橀噺浼犻€掗棶棰?  
**澶囦唤鐩殑:** 淇濆瓨褰撳墠姝ｅ父宸ヤ綔鐨刡uild鍜宼est宸ヤ綔娴侀厤缃紝浠ヤ究浠婂悗鍗囩骇寮傚父鏃跺揩閫熸仮澶? 
**楠岃瘉鐘舵€?** 鉁?宸查獙璇佹甯稿伐浣?
---

## 馃幆 宸ヤ綔娴侀獙璇佺粨鏋滄憳瑕?
### 鉁?姝ｅ父宸ヤ綔鐨勭粍浠?
- **鏋勫缓绯荤粺:** Vite + TypeScript + Electron缂栬瘧閾炬甯?- **绫诲瀷妫€鏌?** TypeScript缂栬瘧鏃犻敊璇?- **浠ｇ爜璐ㄩ噺:** ESLint妫€鏌ラ€氳繃锛堣鍛婃暟閲忓湪鍙帴鍙楄寖鍥村唴锛?- **瀹夊叏妫€鏌?** Electronegativity鎵弿鍜宯pm audit瀹屾垚
- **鍗曞厓娴嬭瘯:** Vitest娴嬭瘯濂椾欢杩愯姝ｅ父
- **Git宸ヤ綔娴?** 棰勬彁浜ら挬瀛愬拰鎻愪氦淇℃伅楠岃瘉姝ｅ父

### 鉂?宸茬煡闂

- **E2E娴嬭瘯:** 鍐掔儫娴嬭瘯瓒呮椂澶辫触锛孌OM鍏冪礌 `[data-testid="app-root"]` 鏈強鏃跺嚭鐜?
---

## 馃摝 鏍稿績閰嶇疆鏂囦欢

### package.json 鑴氭湰閰嶇疆

```json
{
  "scripts": {
    "build": "tsc -p electron && tsc -b && vite build",
    "dev": "vite",
    "dev:electron": "concurrently \"npm run dev\" \"wait-on http://localhost:5173 && electron .\"",
    "preview": "vite preview",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:perf-smoke": "playwright test --project=electron-smoke-tests tests/e2e/smoke/perf.spec.ts --workers=1 --retries=0 --reporter=line,json",
    "test:unit": "vitest run --reporter=verbose --reporter=junit --outputFile=test-results/junit-results.xml",
    "lint": "npm run lint:src && npm run lint:tests",
    "lint:src": "eslint \"src/**/*.{ts,tsx}\" --max-warnings 115",
    "lint:tests": "eslint \"tests/**/*.{ts,tsx}\" --max-warnings 200",
    "lint:fix": "npm run lint:src -- --fix && npm run lint:tests -- --fix",
    "typecheck": "tsc --noEmit",
    "security:check": "npm run security:scan && npm run security:audit",
    "security:scan": "electronegativity --input . --output electronegativity-scan.csv --verbose false --electron-version 30.0.0",
    "security:audit": "npm audit --audit-level high",
    "guard:ci": "npm run typecheck && npm run lint && npm run test:unit && npm run security:check"
  }
}
```

### 鍏抽敭渚濊禆鐗堟湰

```json
{
  "devDependencies": {
    "@types/react": "~19.0.1",
    "@types/react-dom": "~19.0.1",
    "@typescript-eslint/eslint-plugin": "^8.16.0",
    "@typescript-eslint/parser": "^8.16.0",
    "@vitejs/plugin-react": "^4.3.4",
    "electron": "^37.2.1",
    "eslint": "^9.17.0",
    "playwright": "^1.49.1",
    "typescript": "~5.8.3",
    "vite": "^7.0.6",
    "vitest": "^2.1.8"
  },
  "dependencies": {
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
```

### TypeScript閰嶇疆 (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true
  },
  "include": ["src"]
}
```

### ESLint閰嶇疆鍏抽敭鐐?
- **src鐩綍:** 鏈€澶ц鍛婃暟115涓?- **tests鐩綍:** 鏈€澶ц鍛婃暟200涓?- **鍩轰簬:** @typescript-eslint/recommended 瑙勫垯

### Vite閰嶇疆 (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          phaser: ['phaser'],
          sentry: ['@sentry/electron'],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: false,
  },
});
```

---

## 馃敡 Electron閰嶇疆

### 涓昏繘绋?(electron/main.ts)

- **瀹夊叏閰嶇疆:** nodeIntegration=false, contextIsolation=true
- **CSP绛栫暐:** 涓ユ牸鐨勫唴瀹瑰畨鍏ㄧ瓥鐣?- **鏉冮檺绠＄悊:** 缁熶竴鐨勬潈闄愯姹傚鐞?
### 棰勫姞杞借剼鏈?(electron/preload.ts)

- **contextBridge API:** 瀹夊叏鐨勪富杩涚▼/娓叉煋杩涚▼閫氫俊
- **鐧藉悕鍗旳PI:** 涓ユ牸鎺у埗鏆撮湶鐨勫姛鑳?
---

## 馃И 娴嬭瘯閰嶇疆

### Playwright閰嶇疆 (playwright.config.ts)

```typescript
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results/test-results.json' }],
    ['junit', { outputFile: 'test-results/junit-results.xml' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'electron-smoke-tests',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/smoke/**/*.spec.ts',
    },
  ],
});
```

### Vitest閰嶇疆 (vitest.config.ts)

```typescript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'dist/**', 'dist-electron/**', 'tests/**'],
    },
  },
});
```

---

## 馃攳 楠岃瘉妫€鏌ユ竻鍗?
### 鏋勫缓楠岃瘉

- [x] `npm run build` - 鎴愬姛瀹屾垚锛垀15-17绉掞級
- [x] TypeScript缂栬瘧鏃犻敊璇?- [x] 鐢熸垚dist/鐩綍锛屽寘鍚墍鏈夎祫婧?- [x] 婧愭槧灏勬枃浠舵纭敓鎴?- [x] 璧勬簮浼樺寲鍜屽垎鍧楁甯?
### 绫诲瀷妫€鏌?
- [x] `npm run typecheck` - 鏃燭ypeScript閿欒
- [x] 涓ユ牸妯″紡閰嶇疆鐢熸晥
- [x] React 19绫诲瀷鍏煎鎬ф甯?
### 浠ｇ爜璐ㄩ噺

- [x] `npm run lint:src` - 閫氳繃锛堣鍛娾墹115锛?- [x] `npm run lint:tests` - 閫氳繃锛堣鍛娾墹200锛?- [x] ESLint瑙勫垯閰嶇疆姝ｇ‘

### 瀹夊叏妫€鏌?
- [x] `npm run security:scan` - Electronegativity鎵弿瀹屾垚
- [x] `npm run security:audit` - npm audit閫氳繃锛?涓凡鐭ュ彲鎺ュ彈婕忔礊锛?
### 鍗曞厓娴嬭瘯

- [x] `npm run test:unit` - 527涓祴璇曢€氳繃锛?涓烦杩?- [x] JUnit鎶ュ憡鐢熸垚姝ｅ父
- [x] 瑕嗙洊鐜囨姤鍛婂彲鐢?
### Git宸ヤ綔娴?
- [x] Husky棰勬彁浜ら挬瀛愬伐浣滄甯?- [x] lint-staged閰嶇疆鐢熸晥
- [x] 鎻愪氦淇℃伅楠岃瘉姝ｅ父

---

## 鈿欙笍 鐜瑕佹眰

### Node.js & npm

- **Node.js:** 鎺ㄨ崘 18.x 鎴?20.x
- **npm:** 鎺ㄨ崘 9.x 鎴栨洿楂樼増鏈?
### 绯荤粺渚濊禆

- **Python:** 3.x (鐢ㄤ簬鏌愪簺native妯″潡缂栬瘧)
- **Visual Studio Build Tools:** Windows鐜闇€瑕?
### 寮€鍙戝伐鍏?
- **TypeScript:** ~5.8.3
- **Electron:** ^37.2.1
- **Vite:** ^7.0.6

---

## 馃搳 鎬ц兘鍩哄噯

### 鏋勫缓鏃堕棿

- **寮€鍙戞瀯寤?** ~3-5绉掞紙澧為噺锛?- **鐢熶骇鏋勫缓:** ~15-17绉掞紙瀹屾暣锛?- **TypeScript缂栬瘧:** ~2-3绉?
### 鍖呭ぇ灏?
- **鎬诲ぇ灏?** ~2.3MB (gzipped: ~600KB)
- **鏈€澶hunk:** phaser.js (~1.5MB, gzipped: ~340KB)
- **React vendor:** ~357KB (gzipped: ~106KB)

### 娴嬭瘯鎵ц鏃堕棿

- **鍗曞厓娴嬭瘯:** ~5-10绉掞紙527涓祴璇曪級
- **ESLint:** ~3-5绉?- **TypeScript妫€鏌?** ~2-3绉?
---

## 馃攧 鎭㈠鎸囧崡

褰撴湭鏉ュ崌绾у鑷碽uild鍜宼est宸ヤ綔娴佸紓甯告椂锛屼娇鐢ㄦ鏂囨。杩涜鎭㈠锛?
### 1. 妫€鏌ヤ緷璧栫増鏈?
```powershell
# 姣斿褰撳墠鐗堟湰涓庡浠界増鏈?npm list --depth=0
```

### 2. 鎭㈠鍏抽敭閰嶇疆鏂囦欢

- `package.json` (scripts鍜宒ependencies閮ㄥ垎)
- `tsconfig.json`
- `vite.config.ts`
- `playwright.config.ts`
- `vitest.config.ts`
- `.eslintrc.*`

### 3. 楠岃瘉宸ヤ綔娴?
```powershell
# 鎸夐『搴忔墽琛岄獙璇?npm run typecheck
npm run lint
npm run build
npm run test:unit
npm run security:check
```

### 4. 鍥炴粴绛栫暐

濡傛灉鎭㈠浠嶆湁闂锛屽彲浠ヨ€冭檻锛?
```powershell
# 鍥炴粴鍒癳0f67f3鐗堟湰
git checkout e0f67f3
git checkout -b recovery/build-workflow-fix
```

---

## 馃摑 娉ㄦ剰浜嬮」

### E2E娴嬭瘯闂

- E2E鍐掔儫娴嬭瘯鐩墠瓒呮椂澶辫触
- 闂涓嶅奖鍝嶆瀯寤哄拰鍏朵粬娴嬭瘯
- 涓昏鍘熷洜鏄疍OM鍏冪礌娓叉煋鏃跺簭闂
- 鍙綔涓虹嫭绔嬫妧鏈€哄姟澶勭悊

### 瀹夊叏璀﹀憡

- 4涓猲pm audit璀﹀憡锛?涓猯ow锛?涓猰oderate锛?- 鍧囦负渚濊禆搴撻棶棰橈紝涓嶅奖鍝嶆牳蹇冨姛鑳?- 瀹氭湡鏇存柊渚濊禆鍙В鍐?
### 鎬ц兘浼樺寲寤鸿

- 鑰冭檻浠ｇ爜鍒嗗壊鍑忓皬phaser.js鍖呭ぇ灏?- 鍙€氳繃鍔ㄦ€乮mport浼樺寲棣栧睆鍔犺浇
- Bundle鍒嗘瀽鍙敤浜庤繘涓€姝ヤ紭鍖?
---

## 馃摓 鏀寔淇℃伅

**鏂囨。鐗堟湰:** 1.0  
**鏈€鍚庢洿鏂?** 2025-09-14  
**缁存姢鑰?** Claude Code  
**鐩稿叧issue:** E2E娴嬭瘯瓒呮椂闂闇€瑕佺嫭绔嬭窡韪?
濡傞渶鎭㈠姝ら厤缃紝璇蜂弗鏍兼寜鐓ф湰鏂囨。鐨勯厤缃繘琛岋紝骞跺湪鎭㈠鍚庤繍琛屽畬鏁寸殑楠岃瘉妫€鏌ユ竻鍗曘€?
