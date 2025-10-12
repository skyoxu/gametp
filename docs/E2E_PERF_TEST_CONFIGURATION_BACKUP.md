# E2E Performance Test Configuration Backup

> **鏃ユ湡**: 2025-09-14  
> **闂**: P95鎬ц兘娴嬭瘯澶辫触 - test-button鍏冪礌缂哄け  
> **淇鐘舵€?\*: 鉁?宸茶В鍐?
> **Git Commit\*\*: [璁板綍瀵瑰簲鐨凣it鎻愪氦鍝堝笇]

## 闂鎻忚堪

P95鎬ц兘娴嬭瘯鍦╜tests/e2e/smoke/perf.spec.ts`涓け璐ワ紝閿欒淇℃伅鏄剧ず`test-button`鍏冪礌涓嶅彲瑙侊紝瀵艰嚧浜や簰娴嬭瘯鏃犳硶杩涜銆?
**鏍规湰鍘熷洜**: `VITE_E2E_SMOKE`鐜鍙橀噺鏈纭紶閫掔粰鏋勫缓杩囩▼鍜孍lectron杩愯鏃剁幆澧冿紝瀵艰嚧`PerfTestHarness`缁勪欢鏃犳硶姝ｇ‘鍔犺浇銆?

## 淇閰嶇疆璁板綍

### 1. 鏍稿績淇鏂囦欢

**鏂囦欢**: `tests/helpers/launch.ts`

#### 1.1 鏋勫缓鏃剁幆澧冨彉閲忔敞鍏?

```typescript
// 绗?5-33琛岋細buildApp()鍑芥暟涓殑鐜鍙橀噺閰嶇疆
try {
  console.log('[launch] building application (npm run build)...');
  execSync('npm run build', {
    stdio: 'inherit',
    env: {
      ...process.env,
      VITE_E2E_SMOKE: 'true', // 纭繚鏋勫缓鏃舵敞鍏ョ幆澧冨彉閲?    },
  });
```

#### 1.2 杩愯鏃剁幆澧冨彉閲忛厤缃?

**launchApp鍑芥暟 (绗?6-58琛?**:

```typescript
return electron.launch({
  args: [main],
  env: {
    CI: 'true',
    ELECTRON_ENABLE_LOGGING: '1',
    SECURITY_TEST_MODE: 'true',
    E2E_AUTO_START: '1',
    VITE_E2E_SMOKE: 'true', // 杩愯鏃剁幆澧冨彉閲?  },
});
```

**launchAppWithArgs鍑芥暟 (绗?1-84琛?**:

```typescript
return electron.launch({
  args,
  env: {
    CI: 'true',
    ELECTRON_ENABLE_LOGGING: '1',
    SECURITY_TEST_MODE: 'true',
    E2E_AUTO_START: '1',
    VITE_E2E_SMOKE: 'true', // 杩愯鏃剁幆澧冨彉閲?  },
});
```

**launchAppWithPage鍑芥暟 (绗?3-103琛?**:

```typescript
const app = await (electronOverride || electron).launch({
  args: [main],
  env: {
    CI: 'true',
    SECURITY_TEST_MODE: 'true',
    E2E_AUTO_START: '1',
    VITE_E2E_SMOKE: 'true', // 杩愯鏃剁幆澧冨彉閲?  },
  cwd: process.cwd(),
  timeout: 45000,
});
```

### 2. 鐜鍙橀噺妫€鏌ョ偣

#### 2.1 鍓嶇浠ｇ爜妫€鏌ョ偣

**鏂囦欢**: `src/app.tsx` (绗?0琛?

```typescript
const isPerfSmoke = (() => {
  const byFlag = (import.meta as any)?.env?.VITE_E2E_SMOKE === 'true';
  // 姝ゅ搴旇鍦‥2E娴嬭瘯鐜涓繑鍥瀟rue
})();
```

**鏂囦欢**: `src/components/PerfTestHarness.tsx` (绗?1琛?

```typescript
const e2eSmoke = (import.meta as any)?.env?.VITE_E2E_SMOKE === 'true';
// 姝ゅ搴旇鍦‥2E娴嬭瘯鐜涓繑鍥瀟rue锛岀‘淇?20ms鑷姩闅愯棌閫昏緫鐢熸晥
```

#### 2.2 娴嬭瘯楠岃瘉鐐?

**鏂囦欢**: `tests/e2e/smoke/perf.spec.ts` (绗?8-77琛?

```typescript
// 搴旇鑳芥垚鍔熸壘鍒颁互涓嬪厓绱狅細
await page.waitForSelector('[data-testid="perf-harness"]', { timeout: 10000 });
await page.waitForSelector('[data-testid="test-button"]', { timeout: 5000 });
```

### 3. 鎶€鏈粏鑺傝鏄?

#### 3.1 Vite鐜鍙橀噺鏈哄埗

- **鍓嶇紑瑕佹眰**: 蹇呴』浣跨敤`VITE_`鍓嶇紑鎵嶈兘娉ㄥ叆鍒板鎴风浠ｇ爜
- \*_鏋勫缓鏃舵敞鍏?_: 閫氳繃`execSync`鐨刞env`鍙傛暟鍦ㄦ瀯寤烘椂璁剧疆
- **璁块棶鏂瑰紡**: 鍦ㄥ墠绔唬鐮佷腑閫氳繃`import.meta.env.VITE_E2E_SMOKE`璁块棶

#### 3.2 Electron鐜鍙橀噺浼犻€?

- **涓昏繘绋?\*: 閫氳繃`electron.launch()`鐨刞env`鍙傛暟浼犻€?- **娓叉煋杩涚▼**: Vite鏋勫缓鏃跺凡缁忔敞鍏ワ紝鏃犻渶棰濆浼犻€?- **涓€鑷存€?\*: 纭繚鏋勫缓鏃跺拰杩愯鏃堕兘璁剧疆鐩稿悓鐨勭幆澧冨彉閲?

#### 3.3 鍙屽眰娉ㄥ叆鏈哄埗

1. **鏋勫缓灞傞潰**: `execSync('npm run build', { env: { VITE_E2E_SMOKE: 'true' } })`
2. **杩愯灞傞潰**: `electron.launch({ env: { VITE_E2E_SMOKE: 'true' } })`

## 娴嬭瘯楠岃瘉缁撴灉

### P95鎬ц兘娴嬭瘯缁撴灉

```
interaction_response P95閲囨牱缁熻:
  鏍锋湰鏁伴噺: 30
  P95鍊? 22.00ms
  骞冲潎鍊? 17.37ms
  鏈€灏忓€? 11.00ms
  鏈€澶у€? 24.00ms
  闃堝€? 200ms
  鐘舵€? 鉁?閫氳繃
```

### E2E鍐掔儫娴嬭瘯缁撴灉

- 鉁?Electron搴旂敤鍚姩娴嬭瘯閫氳繃
- 鉁?P95鎬ц兘娴嬭瘯閫氳繃
- 鉁?瀹夊叏鍩虹嚎楠岃瘉閫氳繃
- 鉁?CSP绛栫暐楠岃瘉閫氳繃

## 鍏抽敭閰嶇疆鏂囦欢蹇収

### playwright.config.ts鐩稿叧閰嶇疆

```typescript
// electron-smoke-tests椤圭洰閰嶇疆 (绗?7-89琛?
{
  name: 'electron-smoke-tests',
  testMatch: ['**/smoke/**/*.spec.ts', '**/smoke.*.spec.ts'],
  timeout: 90000, // 澧炲姞鍐掔儫娴嬭瘯瓒呮椂鍒?0绉?  use: {
    ...devices['Desktop Chrome'],
    launchOptions: {
      executablePath: undefined,
      env: {
        NODE_ENV: 'test',
        CI: 'true',
        SECURITY_TEST_MODE: 'true',
      },
    },
  },
}
```

### vite.config.ts鐩稿叧閰嶇疆

```typescript
// 纭繚sourcemap閰嶇疆姝ｇ‘锛屾敮鎸佺幆澧冨彉閲忔敞鍏?build: {
  sourcemap: 'hidden',
  // 鍏朵粬鏋勫缓閰嶇疆...
}
```

## 鏁呴殰鎺掗櫎鎸囧崡

### 濡傛灉P95娴嬭瘯鍐嶆澶辫触锛屾鏌ヤ互涓嬮」鐩細

1. \*_鐜鍙橀噺妫€鏌?_:

   ```powershell
   # 鍦ㄦ瀯寤鸿繃绋嬩腑搴旇鐪嬪埌PerfTestHarness缁勪欢琚瀯寤?   # 妫€鏌ist/assets/鐩綍涓槸鍚﹀瓨鍦≒erfTestHarness-xxx.js鏂囦欢
   Get-ChildItem dist/assets/PerfTestHarness-*.js
   ```

2. \*_杩愯鏃堕獙璇?_:

   ```javascript
   // 鍦ㄦ祻瑙堝櫒鎺у埗鍙颁腑妫€鏌?   console.log('VITE_E2E_SMOKE:', import.meta.env.VITE_E2E_SMOKE);
   ```

3. **缁勪欢鍔犺浇楠岃瘉**:
   ```powershell
   # 妫€鏌lectron鏃ュ織涓槸鍚︽湁PerfTestHarness鐩稿叧鐨勮姹?   # 搴旇鐪嬪埌绫讳技锛歅erfTestHarness-xxx.js -> C:\...\dist\assets\PerfTestHarness-xxx.js
   ```

### 甯歌闂涓庤В鍐虫柟妗?

#### 闂1: test-button鍏冪礌浠嶇劧鎵句笉鍒?

**瑙ｅ喅鏂规**: 妫€鏌ユ墍鏈塦electron.launch()`璋冪敤鏄惁閮藉寘鍚玚VITE_E2E_SMOKE: 'true'`

#### 闂2: PerfTestHarness缁勪欢鏈姞杞?

**瑙ｅ喅鏂规**: 纭繚鏋勫缓鏃剁幆澧冨彉閲忔纭缃紝閲嶆柊杩愯鏋勫缓

#### 闂3: 鐜鍙橀噺鍦ㄨ繍琛屾椂鏈敓鏁?

**瑙ｅ喅鏂规**: 妫€鏌ite閰嶇疆锛岀‘淇濈幆澧冨彉閲忓墠缂€姝ｇ‘

## 鍏煎鎬ц鏄?

- **Windows鍏煎**: 浣跨敤`set VITE_E2E_SMOKE=true`鍦╓indows鍛戒护琛屼腑璁剧疆
- \*_璺ㄥ钩鍙?_: 鍦∟ode.js涓€氳繃`process.env`缁熶竴澶勭悊
- **CI/CD**: 鍦–I鐜涓細鑷姩浣跨敤鏋勫缓缂撳瓨浼樺寲

## 鍥炴粴鏂规

濡傛灉淇瀵艰嚧鍏朵粬闂锛屽彲浠ラ€氳繃浠ヤ笅姝ラ鍥炴粴锛?

1. **绉婚櫎鐜鍙橀噺娉ㄥ叆**:
   - 浠巂buildApp()`鍑芥暟鐨刞env`閰嶇疆涓Щ闄VITE_E2E_SMOKE`
   - 浠庢墍鏈塦electron.launch()`璋冪敤涓Щ闄VITE_E2E_SMOKE`

2. **鎭㈠鍘熷閰嶇疆**:

   ```typescript
   // buildApp()涓仮澶嶄负锛?   env: { ...process.env }

   // electron.launch()涓仮澶嶄负锛?   env: {
     CI: 'true',
     ELECTRON_ENABLE_LOGGING: '1',
     SECURITY_TEST_MODE: 'true',
     E2E_AUTO_START: '1',
   }
   ```

## 鐩稿叧鍙傝€冩枃妗?

- [citest/ciinfo.md](citest/ciinfo.md) - CI娴嬭瘯鍩烘湰瑙勫垯
- [docs/BUILD_AND_TEST_WORKFLOW_BACKUP_e0f67f3.md](docs/BUILD_AND_TEST_WORKFLOW_BACKUP_e0f67f3.md) - 鏋勫缓鍜屾祴璇曞伐浣滄祦閰嶇疆
- [Vite鐜鍙橀噺鏂囨。](https://vitejs.dev/guide/env-and-mode.html)
- [Playwright Electron娴嬭瘯鏂囨。](https://playwright.dev/docs/api/class-electron)

---

**鏈€鍚庢洿鏂?\*: 2025-09-14  
**淇鑰?_: Claude Code Assistant  
\*\*楠岃瘉鐘舵€?_: 鉁?宸查€氳繃瀹屾暣E2E娴嬭瘯楠岃瘉
