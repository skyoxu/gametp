# GitHub Actions宸ヤ綔娴佷紭鍖栭厤缃褰?
> **鏃ユ湡**: 2025-09-14  
> **闂**: "閲嶅缓 + chrome-error"闂 - 閲嶅鏋勫缓瀵艰嚧CI鏃堕棿闀夸笖鏄撳嚭閿? 
> **淇鐘舵€?*: 鉁?宸茶В鍐? 
> **浼樺寲鏂规**: 鏋勫缓artifacts鍏变韩绛栫暐

## 闂鎻忚堪

GitHub Actions宸ヤ綔娴佷腑瀛樺湪浠ヤ笅闂锛?
1. **閲嶅鏋勫缓**: `build-and-unit` job鏋勫缓涓€娆★紝`e2e-perf-smoke` job閫氳繃`tests/helpers/launch.ts`鍐嶆鏋勫缓
2. **鏋勫缓鏃堕棿闀?*: 姣忎釜闇€瑕佹瀯寤虹殑job閮借鎵ц瀹屾暣鐨?5绉掓瀯寤鸿繃绋?3. **Chrome閿欒椋庨櫓**: 澶氭鏋勫缓澧炲姞浜嗗嚭閿欐鐜?4. **璧勬簮娴垂**: CI鐜涓噸澶嶆墽琛岀浉鍚岀殑npm run build鍛戒护

## 浼樺寲鏂规璁捐

### 鏍稿績绛栫暐: "鏋勫缓涓€娆★紝鍒板浣跨敤"

- 鍒涘缓鐙珛鐨刞build-artifacts` job杩涜缁熶竴鏋勫缓
- 浣跨敤`actions/upload-artifact@v4`涓婁紶鏋勫缓浜х墿
- 鎵€鏈夋祴璇昷ob浣跨敤`actions/download-artifact@v4`涓嬭浇鏋勫缓浜х墿
- 閫氳繃`CI_ARTIFACTS_AVAILABLE`鐜鍙橀噺鎺у埗璺宠繃閲嶅鏋勫缓

### 鎶€鏈疄鐜扮粏鑺?
#### 1. 鏂板build-artifacts job

```yaml
build-artifacts:
  runs-on: windows-latest
  defaults:
    run:
      shell: pwsh
  outputs:
    artifacts-available: ${{ steps.build-check.outputs.artifacts-available }}
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: 20
        cache: 'npm'
    - run: npm ci
    - name: Build application
      env:
        VITE_E2E_SMOKE: 'true' # 纭繚E2E缁勪欢姝ｇ‘鏋勫缓
      run: npm run build
    - name: Verify build outputs
      id: build-check
      run: |
        if ((Test-Path -LiteralPath 'dist') -and (Test-Path -LiteralPath 'dist-electron')) {
          Write-Host "鉁?Build artifacts verified: dist/ and dist-electron/ directories exist"
          echo "artifacts-available=true" >> $env:GITHUB_OUTPUT
        } else {
          Write-Error "鉂?Build artifacts missing: dist/ or dist-electron/ not found"
          echo "artifacts-available=false" >> $env:GITHUB_OUTPUT
          exit 1
        }
    - name: Upload build artifacts
      uses: actions/upload-artifact@v4
      with:
        name: build-artifacts
        path: |
          dist/
          dist-electron/
        retention-days: 1
        compression-level: 6
        include-hidden-files: false
```

#### 2. 淇敼build-and-unit job渚濊禆鍏崇郴

```yaml
build-and-unit:
  needs: build-artifacts # 渚濊禆build-artifacts瀹屾垚
  runs-on: windows-latest
  # 绉婚櫎鏋勫缓姝ラ锛屼笓娉ㄤ簬浠ｇ爜璐ㄩ噺妫€鏌?```

#### 3. 淇敼e2e-perf-smoke job浣跨敤artifacts

```yaml
e2e-perf-smoke:
  needs: [build-artifacts, build-and-unit]
  env:
    CI_ARTIFACTS_AVAILABLE: 'true' # 鍏抽敭鏍囪瘑锛氳烦杩囨瀯寤?  steps:
    - name: Download build artifacts
      if: steps.changes-e2e.outputs.any_changed == 'true'
      uses: actions/download-artifact@v4
      with:
        name: build-artifacts
        path: .
    - name: Verify downloaded artifacts
      if: steps.changes-e2e.outputs.any_changed == 'true'
      run: |
        Write-Host "馃摝 Verifying downloaded build artifacts..."
        if ((Test-Path -LiteralPath 'dist') -and (Test-Path -LiteralPath 'dist-electron')) {
          Write-Host "鉁?Build artifacts downloaded successfully"
          if (Test-Path -LiteralPath 'dist-electron/main.js') {
            Write-Host "   - main.js entry point found"
          } else {
            Write-Error "鉂?main.js entry point not found"
            exit 1
          }
        } else {
          Write-Error "鉂?Downloaded artifacts missing"
          exit 1
        }
```

#### 4. 淇敼tests/helpers/launch.ts鏀寔artifacts妯″紡

```typescript
function buildApp() {
  // CI artifacts妯″紡锛氳烦杩囨瀯寤猴紝鐩存帴浣跨敤涓嬭浇鐨勬瀯寤轰骇鐗?  if (process.env.CI_ARTIFACTS_AVAILABLE === 'true') {
    console.log(
      '[launch] CI artifacts mode: using pre-built artifacts, skipping build'
    );
    return;
  }

  // 鍘熸湁鏋勫缓閫昏緫淇濇寔涓嶅彉...
}
```

## 閰嶇疆鍙樻洿璁板綍

### 鍏抽敭鏂囦欢淇敼

#### `.github/workflows/build-and-test.yml`

**鏂板鍐呭**:

- `build-artifacts` job锛堢9-47琛岋級
- `build-and-unit` job渚濊禆鍏崇郴淇敼锛堢50琛岋級
- `e2e-perf-smoke` job dependencies淇敼锛堢90琛岋級
- `CI_ARTIFACTS_AVAILABLE: 'true'`鐜鍙橀噺锛堢101琛岋級
- 鏋勫缓浜х墿涓嬭浇鍜岄獙璇佹楠わ紙绗?19-142琛岋級

**绉婚櫎鍐呭**:

- `build-and-unit` job涓殑鏋勫缓姝ラ锛堝師绗?7-48琛岋級

#### `tests/helpers/launch.ts`

**淇敼浣嶇疆**: `buildApp()`鍑芥暟锛堢18-50琛岋級
**鏂板閫昏緫**:

```typescript
// CI artifacts妯″紡锛氳烦杩囨瀯寤猴紝鐩存帴浣跨敤涓嬭浇鐨勬瀯寤轰骇鐗?if (process.env.CI_ARTIFACTS_AVAILABLE === 'true') {
  console.log(
    '[launch] CI artifacts mode: using pre-built artifacts, skipping build'
  );
  return;
}
```

### 鐜鍙橀噺閰嶇疆

#### CI鐜鍙橀噺

- `CI_ARTIFACTS_AVAILABLE=true`: 鎸囩ず浣跨敤棰勬瀯寤虹殑artifacts锛岃烦杩囨湰鍦版瀯寤?- `VITE_E2E_SMOKE=true`: 纭繚鏋勫缓鏃跺寘鍚獷2E娴嬭瘯缁勪欢

#### 鏋勫缓鏃舵敞鍏ョ殑鐜鍙橀噺

- `VITE_E2E_SMOKE=true`: 鍦╜build-artifacts` job鐨勬瀯寤烘楠や腑娉ㄥ叆

## 鎬ц兘浼樺寲缁撴灉

### 棰勬湡鏀硅繘鎸囨爣

- **鏋勫缓鏃堕棿鑺傜渷**: 60%+ 锛堜粠澶氭15绉掓瀯寤洪檷鑷?娆?5绉掓瀯寤猴級
- **CI鎬绘椂闂?*: 鍑忓皯绾?0-30绉掞紙鍙栧喅浜庡苟琛宩ob鏁伴噺锛?- **鎴愬姛鐜囨彁鍗?*: 鍑忓皯閲嶅鏋勫缓瀵艰嚧鐨勯殢鏈哄け璐?- **璧勬簮浣跨敤**: 闄嶄綆CI runner鐨凜PU/鍐呭瓨浣跨敤

### 宸ヤ綔娴佹墽琛岃矾寰勫姣?
#### 浼樺寲鍓?
```
build-and-unit: checkout 鈫?setup 鈫?npm ci 鈫?build (15s) 鈫?lint 鈫?test 鈫?coverage
    鈫?e2e-perf-smoke: checkout 鈫?setup 鈫?npm ci 鈫?[launch.ts鍐呴儴鍐嶆build (15s)] 鈫?test
```

#### 浼樺寲鍚?
```
build-artifacts: checkout 鈫?setup 鈫?npm ci 鈫?build (15s) 鈫?upload-artifact
    鈫?build-and-unit: checkout 鈫?setup 鈫?npm ci 鈫?lint 鈫?test 鈫?coverage (骞惰)
e2e-perf-smoke: checkout 鈫?setup 鈫?npm ci 鈫?download-artifact 鈫?test (骞惰)
```

## 鍏煎鎬т繚闅?
### 鏈湴寮€鍙戠幆澧?
- **鏈湴E2E娴嬭瘯**: `CI_ARTIFACTS_AVAILABLE`鏈缃椂锛屾甯告墽琛屾瀯寤?- **寮€鍙戝伐浣滄祦**: `npm run dev`銆乣npm run build`绛夊懡浠や笉鍙楀奖鍝?- **IDE闆嗘垚**: VS Code绛夌紪杈戝櫒鐨勮皟璇曞姛鑳芥甯?
### CI鐜鍚戝悗鍏煎

- **鐜鍙橀噺缂哄け鏃?*: 鑷姩fallback鍒板師鏈夋瀯寤洪€昏緫
- **鏋勫缓澶辫触鏃?*: build-artifacts澶辫触浼氶樆姝㈠悗缁璲ob锛岀‘淇濇暟鎹竴鑷存€?- **artifacts涓嶅彲鐢?*: 涓嬭浇澶辫触鏃朵細exit 1锛屾槑纭寚绀洪棶棰?
## 楠岃瘉娴嬭瘯缁撴灉

### 鏈湴楠岃瘉 鉁?
```powershell
# 1. TypeScript缂栬瘧妫€鏌?npm run typecheck  # 鉁?閫氳繃

# 2. 浠ｇ爜璐ㄩ噺妫€鏌?npm run lint       # 鉁?閫氳繃 (src: 111/115 warnings, tests: <300 warnings)

# 3. E2E鍐掔儫娴嬭瘯
npm run test:e2e:perf-smoke  # 鉁?閫氳繃 (P95: 22ms < 200ms闃堝€?

# 4. GitHub Actions YAML璇硶
actionlint .github/workflows/build-and-test.yml  # 鉁?鏃犻敊璇?
# 5. 鏋勫缓浜х墿楠岃瘉
npm run build     # 鉁?鐢熸垚 dist/ 鍜?dist-electron/ 鐩綍
```

### E2E娴嬭瘯璇︾粏缁撴灉

```
@smoke Perf Smoke Suite:
  鉁?@smoke App renders          (42ms)
  鉁?@smoke Interaction P95      (10.17s)

P95鎬ц兘缁熻:
  - 鏍锋湰鏁伴噺: 30
  - P95鍊? 22.00ms
  - 骞冲潎鍊? 16.00ms
  - 鏈€灏忓€? 12.00ms
  - 鏈€澶у€? 22.00ms
  - 闃堝€? 200ms
  - 鐘舵€? 鉁?閫氳繃
```

## 鍥炴粴鏂规

濡傛灉浼樺寲鏂规鍑虹幇闂锛屽彲浠ラ€氳繃浠ヤ笅姝ラ蹇€熷洖婊氾細

### 1. 鎭㈠宸ヤ綔娴佹枃浠?
```powershell
git checkout HEAD~1 -- .github/workflows/build-and-test.yml
```

### 2. 鎭㈠launch.ts鏂囦欢

```powershell
git checkout HEAD~1 -- tests/helpers/launch.ts
```

### 3. 鎴栬€呮墜鍔ㄤ慨鏀?
- 灏哷build-and-unit` job鎭㈠涓哄寘鍚瀯寤烘楠?- 绉婚櫎`build-artifacts` job
- 绉婚櫎`e2e-perf-smoke` job涓殑artifact涓嬭浇姝ラ
- 绉婚櫎`CI_ARTIFACTS_AVAILABLE`鐜鍙橀噺妫€鏌?
## 鏁呴殰鎺掗櫎鎸囧崡

### 甯歌闂涓庤В鍐虫柟妗?
#### 闂1: artifacts涓嬭浇澶辫触

```
Error: Artifact 'build-artifacts' not found
```

**瑙ｅ喅鏂规**: 妫€鏌build-artifacts` job鏄惁鎴愬姛瀹屾垚锛岀‘淇漚rtifact鍚嶇О鍖归厤

#### 闂2: main.js鏂囦欢缂哄け

```
鉂?main.js entry point not found in dist-electron/
```

**瑙ｅ喅鏂规**: 妫€鏌ユ瀯寤鸿繃绋嬩腑TypeScript缂栬瘧鏄惁鎴愬姛锛岀‘淇漞lectron鐩綍姝ｇ‘缂栬瘧

#### 闂3: 鐜鍙橀噺鏈敓鏁?
```
[launch] building application (npm run build)...
```

**瑙ｅ喅鏂规**: 纭`CI_ARTIFACTS_AVAILABLE=true`鍦╦ob鐜鍙橀噺涓纭缃?
#### 闂4: 娴嬭瘯瓒呮椂鎴栧け璐?
**瑙ｅ喅鏂规**: 妫€鏌ヤ笅杞界殑artifacts鏄惁鍖呭惈瀹屾暣鐨勬瀯寤轰骇鐗╋紝楠岃瘉VITE_E2E_SMOKE鐜鍙橀噺

### 鐩戞帶鎸囨爣

#### 鎴愬姛鎸囨爣

- `build-artifacts` job鏋勫缓鏃堕棿绋冲畾鍦?5-20绉?- artifact涓婁紶鎴愬姛鐜?00%
- artifact涓嬭浇鏃堕棿<5绉?- E2E娴嬭瘯閫氳繃鐜囦笉闄嶄綆

#### 鍛婅鏉′欢

- artifact涓嬭浇澶辫触鐜?1%
- 鎬籆I鏃堕棿瓒呰繃浼樺寲鍓嶅熀绾?- E2E娴嬭瘯澶辫触鐜囧鍔?
## 鎶€鏈€哄姟涓庡悗缁紭鍖?
### 宸茬煡闄愬埗

- artifact淇濈暀鏈熶负1澶╋紙閫傚悎鐭湡鍒嗘敮锛岄暱鏈熷垎鏀渶鎵嬪姩璋冩暣锛?- 鍙紭鍖栦簡鍗曚釜workflow锛屽叾浠杦orkflow鍙弬鑰冩妯″紡
- 鏆傛湭瀹炵幇璺╳orkflow鐨刟rtifact鍏变韩

### 鍚庣画浼樺寲鏂瑰悜

- 鑰冭檻浣跨敤GitHub Actions cache鏇夸唬artifact锛堥€傚悎棰戠箒璁块棶鍦烘櫙锛?- 瀹炵幇澶歫ob骞惰涓嬭浇鍚屼竴artifact鐨勪紭鍖?- 娣诲姞artifact澶у皬鐩戞帶鍜屽帇缂╃巼浼樺寲
- 鑰冭檻澧炲姞鏋勫缓浜х墿鐨刢hecksum楠岃瘉

## 鐩稿叧鍙傝€冩枃妗?
- [GitHub Actions artifacts瀹樻柟鏂囨。](https://docs.github.com/en/actions/guides/storing-workflow-data-as-artifacts)
- [actions/upload-artifact@v4鏂囨。](https://github.com/actions/upload-artifact/tree/v4/)
- [actions/download-artifact@v4鏂囨。](https://github.com/actions/download-artifact/tree/v4/)
- [Playwright Electron娴嬭瘯鏈€浣冲疄璺礭(https://playwright.dev/docs/api/class-electron)
- [citest/ciinfo.md](citest/ciinfo.md) - CI娴嬭瘯鍩烘湰瑙勫垯
- [E2E_PERF_TEST_CONFIGURATION_BACKUP.md](E2E_PERF_TEST_CONFIGURATION_BACKUP.md) - P95娴嬭瘯閰嶇疆
- [BUILD_AND_TEST_WORKFLOW_BACKUP_e0f67f3.md](BUILD_AND_TEST_WORKFLOW_BACKUP_e0f67f3.md) - 鍘熷伐浣滄祦閰嶇疆澶囦唤

---

**鏈€鍚庢洿鏂?*: 2025-09-14  
**淇鑰?*: Claude Code Assistant  
**楠岃瘉鐘舵€?*: 鉁?宸查€氳繃瀹屾暣鏈湴楠岃瘉锛屽緟CI鐜楠岃瘉  
**瀹℃牳鐘舵€?*: 鉁?宸查€氳繃Zen MCP鏋舵瀯璇勫鍜孋ontext7 MCP鎶€鏈皟鐮?
