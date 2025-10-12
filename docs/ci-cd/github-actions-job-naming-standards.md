# GitHub Actions Job ID 鍛藉悕鏍囧噯鍖栫瓥鐣?

## 姒傝堪

鏈枃妗ｅ畾涔変簡 GitHub Actions 宸ヤ綔娴佷腑 job ID 鐨勬爣鍑嗗寲鍛藉悕绛栫暐锛岀‘淇濅緷璧栧紩鐢ㄧ殑涓€鑷存€у拰鍙淮鎶ゆ€с€?

## 鏍稿績鍘熷垯

### 1. 绋冲畾鎬т紭鍏堬紙Stability First锛?

- **蹇呴渶妫€鏌ョ殑鏍稿績 job** 浣跨敤绋冲畾銆佸彲棰勬祴鐨勫悗缂€ `-core`
- **鎵╁睍娴嬭瘯 job** 浣跨敤鍚庣紑 `-extended`
- **闂ㄧ妫€鏌?job** 浣跨敤鍚庣紑 `-gate`

### 2. 鎻忚堪鎬у懡鍚嶏紙Descriptive Naming锛?

- job ID 蹇呴』娓呮琛ㄨ揪鍏跺姛鑳藉拰鑱岃矗
- 浣跨敤 kebab-case锛堣繛瀛楃鍒嗛殧锛?- 閬垮厤缂╁啓锛岄櫎闈炴槸琛屼笟鏍囧噯缂╁啓锛堝 `e2e`, `api`锛?

### 3. 灞傛鍖栫粍缁囷紙Hierarchical Organization锛?

- 鎸夊姛鑳藉煙鍒嗙粍锛歚quality-_`, `security-_`, `test-_`, `build-_`, `deploy-\*`
- 鎸夌幆澧冨垎缁勶細`*-development`, `*-staging`, `*-production`

## 鏍囧噯鍛藉悕妯″紡

### 鏍稿績浣滀笟锛堝繀闇€妫€鏌ワ級

杩欎簺浣滀笟鏄垎鏀繚鎶ゅ拰CI/CD娴佺▼鐨勫叧閿緷璧栵細

```yaml
jobs:
  # 璐ㄩ噺闂ㄧ - 濮嬬粓浣滀负绗竴閬撳叧鍙?  quality-gates:
    name: Quality Gates Check

  # 鍗曞厓娴嬭瘯 - 绋冲畾鐨勬牳蹇冩祴璇?  unit-tests-core:
    name: Unit Tests (windows-latest, Node 20)

  # 鏋勫缓楠岃瘉 - 鏍稿績鏋勫缓妫€鏌?  build-verification-core:
    name: Build Verification (windows-latest)

  # 瀹夊叏闂ㄧ - 蹇呴渶鐨勫畨鍏ㄦ鏌?  electron-security-gate:
    name: Electron Security Gate

  # 瑕嗙洊鐜囬棬绂?- 浠ｇ爜璐ㄩ噺鎺у埗
  coverage-gate:
    name: Coverage Gate
```

### 鎵╁睍浣滀笟锛堝彲閫夛級

杩欎簺浣滀笟鎻愪緵鏇村叏闈㈢殑娴嬭瘯瑕嗙洊锛屼絾涓嶉樆鏂熀鏈祦绋嬶細

```yaml
jobs:
  # 鎵╁睍鍗曞厓娴嬭瘯 - 澶氬钩鍙扮煩闃垫祴璇?  unit-tests-extended:
    name: Unit Tests Extended Matrix

  # 鎵╁睍鏋勫缓楠岃瘉 - 澶氬钩鍙版瀯寤?  build-verification-extended:
    name: Build Verification Extended Matrix
```

### 涓撻」妫€鏌ヤ綔涓?

鎸夊姛鑳藉煙缁勭粐鐨勪笓椤规鏌ワ細

```yaml
jobs:
  # 渚濊禆瀹夊叏瀹¤
  dependency-audit:
    name: Dependency Security Audit

  # 鍙娴嬫€ч獙璇?  observability-verification:
    name: Observability Verification

  # 鎬ц兘鍩哄噯娴嬭瘯
  performance-benchmarks:
    name: Performance Benchmarks

  # 鍙戝竷鍋ュ悍妫€鏌?  release-health-gate:
    name: Release Health Gate

  # 閮ㄧ讲灏辩华妫€鏌?  deployment-readiness:
    name: Deployment Readiness Check
```

## 鍛藉悕绾﹀畾璇︾粏瑙勮寖

### 1. Job ID 鏍煎紡

```
<domain>-<function>[-<qualifier>][-<environment>]
```

\*_绀轰緥锛?_

- `quality-gates` (domain: quality, function: gates)
- `unit-tests-core` (domain: unit-tests, function: core)
- `observability-gate-production` (domain: observability, function: gate, environment: production)

### 2. 甯哥敤鍩熷墠缂€锛圖omain Prefixes锛?

- `quality-*`: 浠ｇ爜璐ㄩ噺妫€鏌?- `security-*`: 瀹夊叏鎵弿鍜屽璁?- `test-*`: 鍚勭被娴嬭瘯浣滀笟
- `build-*`: 鏋勫缓鍜岀紪璇?- `deploy-*`: 閮ㄧ讲鐩稿叧
- `release-*`: 鍙戝竷娴佺▼
- `monitor-*`: 鐩戞帶鍜屽仴搴锋鏌?

### 3. 甯哥敤闄愬畾绗︼紙Qualifiers锛?

- `-core`: 蹇呴渶鐨勬牳蹇冩鏌?- `-extended`: 鎵╁睍鐨勯潪闃绘柇妫€鏌?- `-gate`: 闂ㄧ鎺у埗鐐?- `-audit`: 瀹¤鍜屾壂鎻?- `-verification`: 楠岃瘉鍜岀‘璁?

### 4. 鐜鍚庣紑锛圗nvironment Suffixes锛?

- `-development`: 寮€鍙戠幆澧?- `-staging`: 棰勫彂甯冪幆澧?- `-production`: 鐢熶骇鐜

## 渚濊禆寮曠敤鏈€浣冲疄璺?

### 1. 绋冲畾鏍稿績浣滀笟寮曠敤

````yaml
jobs:
  coverage-gate:
    needs: unit-tests-core # 鉁?姝ｇ‘锛氬紩鐢ㄧǔ瀹氱殑鏍稿績浣滀笟

  build-verification-core:
    needs: unit-tests-core # 鉁?姝ｇ‘锛氫竴鑷寸殑鏍稿績浣滀笟寮曠敤

  release-health-gate:
    needs: [unit-tests-core, coverage-gate, electron-security-gate] # 鉁?姝ｇ‘锛氬涓ǔ瀹氬紩鐢?```

### 2. 閬垮厤鐨勫弽妯″紡

```yaml
jobs:
  coverage-gate:
    needs: unit-tests # 鉂?閿欒锛氬紩鐢ㄤ笉瀛樺湪鐨勪綔涓?
  build-verification:
    needs: tests # 鉂?閿欒锛氭ā绯婄殑浣滀笟鍚?
  deploy:
    needs: build-and-test # 鉂?閿欒锛氫笉涓€鑷寸殑鍛藉悕椋庢牸
````

## 鍒嗘敮淇濇姢閰嶇疆

### Required Status Checks

浠ヤ笅浣滀笟蹇呴』閰嶇疆涓哄垎鏀繚鎶ょ殑蹇呴渶妫€鏌ワ細

````yaml
# .github/settings.yml 鎴栭€氳繃 GitHub UI 閰嶇疆
branches:
  main:
    protection:
      required_status_checks:
        strict: true
        contexts:
          - 'quality-gates'
          - 'unit-tests-core'
          - 'coverage-gate'
          - 'build-verification-core'
          - 'electron-security-gate'
          - 'release-health-gate' # 浠呭涓诲垎鏀?```

## 杩佺Щ鎸囧崡

### 鐜版湁宸ヤ綔娴佽縼绉?
1. **璇嗗埆鏍稿績浣滀笟**锛氭爣璇嗗繀闇€鐨勬鏌ョ偣
2. **閲嶅懡鍚嶄负鏍囧噯鏍煎紡**锛氬簲鐢?`-core` 鍚庣紑
3. **鏇存柊渚濊禆寮曠敤**锛氱‘淇?`needs` 鎸囧悜姝ｇ‘鐨勪綔涓欼D
4. **楠岃瘉渚濊禆鍏崇郴**锛氳繍琛?`npm run guard:workflows` 楠岃瘉
5. **鏇存柊鍒嗘敮淇濇姢**锛氬悓姝ユ洿鏂板繀闇€鐘舵€佹鏌?
### 娓愯繘寮忚縼绉绘楠?
```powershell
# 1. 楠岃瘉褰撳墠鐘舵€?npm run guard:workflows
# 2. 识别需要重命名的作业（Windows）
Select-String -Pattern "needs:" -Path .github/workflows/*.yml

# 3. 搴旂敤鏍囧噯鍛藉悕
# 鎵嬪姩缂栬緫鎴栦娇鐢ㄨ剼鏈壒閲忔浛鎹?
# 4. 楠岃瘉杩佺Щ缁撴灉
npm run guard:workflows

# 5. 娴嬭瘯 CI 娴佺▼
git push --dry-run  # 纭繚涓嶄細鐮村潖鐜版湁娴佺▼
````

## 楠岃瘉宸ュ叿

### 鑷姩鍖栨鏌?

椤圭洰鍖呭惈浠ヤ笅楠岃瘉宸ュ叿锛?

````powershell
# 妫€鏌ュ崟涓伐浣滄祦渚濊禆
npm run guard:workflow-deps

# 妫€鏌ユ墍鏈夊伐浣滄祦
npm run guard:workflows

# 闆嗘垚鍒?CI 娴佺▼
npm run guard:ci  # 鍖呭惈宸ヤ綔娴侀獙璇?```

### 鎸佺画闆嗘垚闆嗘垚

鍦?`.github/workflows/ci.yml` 涓凡闆嗘垚宸ヤ綔娴侀獙璇侊細

```yaml
steps:
  - name: 馃攳 宸ヤ綔娴佷緷璧栭獙璇?    run: npm run guard:workflows
````

## 鏁呴殰鎺掓煡

### 甯歌闂

1. **渚濊禆寮曠敤閿欒**

   ```
   Error: Job 'coverage-gate' depends on missing job 'unit-tests'
   ```

   **瑙ｅ喅鏂规**锛氬皢 `unit-tests` 鏇存柊涓?`unit-tests-core`

2. **寰幆渚濊禆**

   ```
   Error: Circular dependency detected: job-a 鈫?job-b 鈫?job-a
   ```

   **瑙ｅ喅鏂规**锛氶噸鏂拌璁′綔涓氫緷璧栧叧绯伙紝娑堥櫎寰幆

3. **鍒嗘敮淇濇姢澶辫触**
   ```
   Error: Required status check "unit-tests" is missing
   ```
   **瑙ｅ喅鏂规**锛氭洿鏂板垎鏀繚鎶ら厤缃腑鐨勭姸鎬佹鏌ュ悕绉?

### 璋冭瘯宸ュ叿

```powershell
# 妫€鏌ョ壒瀹氬伐浣滄祦
node scripts/ci/workflow-dependency-check.cjs .github/workflows/ci.yml

# 鐢熸垚渚濊禆鍥撅紙濡傛灉闇€瑕佸彲瑙嗗寲锛?# 鍙€冭檻闆嗘垚 Graphviz 鎴栧叾浠栦緷璧栧浘鐢熸垚宸ュ叿
```

## 鏈潵鎵╁睍

### 璁″垝涓殑鏀硅繘

1. **璇箟鍖栫増鏈泦鎴?\*锛氫綔涓氬悕绉板寘鍚増鏈俊鎭?2. **鍔ㄦ€佷綔涓氱敓鎴?\*锛氬熀浜庢枃浠跺彉鏇村姩鎬佽皟鏁翠綔涓?3. **浣滀笟渚濊禆浼樺寲**锛氬熀浜庡彉鏇村奖鍝嶅垎鏋愪紭鍖栦緷璧栭摼
2. \**鍙鍖栧伐鍏?*锛氫緷璧栧叧绯诲浘鐨勫彲瑙嗗寲灞曠ず

### 宸ュ叿璺嚎鍥?

- [ ] 闆嗘垚 actionlint 杩涜璇硶妫€鏌?- [ ] 娣诲姞浣滀笟鎬ц兘鐩戞帶
- [ ] 瀹炵幇鏅鸿兘浣滀笟璋冨害
- [ ] 鏀寔鏉′欢鎬т綔涓氫緷璧?

---

## 鍙樻洿鍘嗗彶

| 鐗堟湰 | 鏃ユ湡     | 鍙樻洿鎻忚堪                           |
| ------ | ---------- | -------------------------------------- |
| 1.0    | 2025-09-04 | 鍒濆鐗堟湰锛屽畾涔夋牳蹇冨懡鍚嶆爣鍑? |

## 鐩稿叧鏂囨。

- [GitHub Actions 鏈€浣冲疄璺礭(../docs/github-actions-best-practices.md)
- [CI/CD 娴佺▼璁捐](../docs/cicd-process-design.md)
- [鍒嗘敮淇濇姢绛栫暐](../docs/branch-protection-strategy.md)
