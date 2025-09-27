# 璐＄尞鎸囧崡 (CONTRIBUTING.md)

鏈寚鍗楄鏄庡浣曞湪鏈」鐩腑杩涜寮€鍙戙€佹祴璇曞拰璐＄尞浠ｇ爜銆?
## 馃殌 蹇€熷紑濮?
### 鐜瑕佹眰

- **Node.js**: 鈮?8.0.0
- **npm**: 鈮?.0.0
- **鎿嶄綔绯荤粺**: Windows (涓昏鏀寔)

### 椤圭洰璁剧疆

```powershell
# 1. 鍏嬮殕椤圭洰
git clone <椤圭洰鍦板潃>
cd vitegame

# 2. 瀹夎渚濊禆
npm install

# 3. 鍚姩寮€鍙戞湇鍔″櫒
npm run dev

# 4. 鍚姩Electron搴旂敤
npm run dev:electron
```

## 馃洝锔?鏈湴瀹堥棬鑴氭湰浣跨敤

### 瀹屾暣璐ㄩ噺妫€鏌?
```powershell
# 杩愯鎵€鏈夎川閲忛棬绂?(鎺ㄨ崘鍦ㄦ彁浜ゅ墠杩愯)
npm run guard:ci
```

### 鍒嗛」妫€鏌?
```powershell
# TypeScript绫诲瀷妫€鏌?npm run typecheck

# ESLint浠ｇ爜瑙勮寖妫€鏌?npm run lint

# 鍗曞厓娴嬭瘯
npm run test:unit

# Electron瀹夊叏妫€鏌?npm run guard:electron

# E2E娴嬭瘯
npm run test:e2e

# 璐ㄩ噺闂ㄧ (瑕嗙洊鐜?+ Release Health)
npm run guard:quality

# Base鏂囨。娓呮磥妫€鏌?npm run guard:base

# 鐗堟湰鍚屾妫€鏌?npm run guard:version
```

### 娴嬭瘯瑕嗙洊鐜?
```powershell
# 鐢熸垚瑕嗙洊鐜囨姤鍛?npm run test:coverage

# 鏌ョ湅瑕嗙洊鐜囨姤鍛?(Windows)
npm run test:coverage:open
```

## 馃搧 椤圭洰缁撴瀯

```
鈹溾攢鈹€ src/                    # 涓昏婧愪唬鐮?鈹?  鈹溾攢鈹€ core/              # 鏍稿績涓氬姟閫昏緫
鈹?  鈹溾攢鈹€ domain/            # 棰嗗煙妯″瀷鍜岀鍙?鈹?  鈹溾攢鈹€ shared/            # 鍏变韩缁勪欢鍜屽悎绾?鈹?  鈹斺攢鈹€ styles/            # Tailwind CSS鏍峰紡
鈹溾攢鈹€ electron/              # Electron涓昏繘绋嬪拰棰勫姞杞借剼鏈?鈹溾攢鈹€ tests/                 # 娴嬭瘯鏂囦欢
鈹?  鈹溾攢鈹€ e2e/              # Playwright E2E娴嬭瘯
鈹?  鈹溾攢鈹€ core/             # 鏍稿績閫昏緫鍗曞厓娴嬭瘯
鈹?  鈹斺攢鈹€ domain/           # 棰嗗煙濂戠害娴嬭瘯
鈹溾攢鈹€ scripts/               # 璐ㄩ噺闂ㄧ鑴氭湰
鈹溾攢鈹€ docs/                  # 椤圭洰鏂囨。
鈹?  鈹溾攢鈹€ architecture/      # 鏋舵瀯鏂囨。
鈹?  鈹?  鈹溾攢鈹€ base/         # 璺ㄥ垏闈㈠熀纭€鏂囨。
鈹?  鈹?  鈹斺攢鈹€ overlays/     # PRD鐗瑰畾鏂囨。
鈹?  鈹斺攢鈹€ adr/              # 鏋舵瀯鍐崇瓥璁板綍
```

## 馃摑 濡備綍鏂板 Overlay (PRD-ID)

### 1. 鍒涘缓 Overlay 鐩綍缁撴瀯

```powershell
# 鍦╫verlays涓嬪垱寤烘柊鐨凱RD鐩綍
New-Item -ItemType Directory -Force -Path docs/architecture/overlays/PRD-<YOUR-PRODUCT-ID>/08
```

### 2. 鍒涘缓鍔熻兘绾靛垏鏂囨。

```powershell
# 鍒涘缓鍔熻兘妯″潡鏂囨。
New-Item -ItemType File -Force -Path docs/architecture/overlays/PRD-<YOUR-PRODUCT-ID>/08/08-鍔熻兘绾靛垏-<妯″潡鍚?.md
```

### 3. 鏂囨。妯℃澘绀轰緥

```markdown
---
PRD-ID: PRD-<YOUR-PRODUCT-ID>
Arch-Refs: [01, 02, 03, 08]
ADRs: [ADR-0001, ADR-0002]
Test-Refs: [tests/slices/<妯″潡鍚?-acceptance.spec.ts]
Monitors: [sentry.error.rate, performance.response_time]
SLO-Refs: [SLO-PERF-001, SLO-AVAIL-001]
---

# 08-鍔熻兘绾靛垏-<妯″潡鍚?

## UI灞?
...

## 浜嬩欢灞?
...

## 鍩熸ā鍨?
...

## 鎸佷箙鍖?
...

## 楠屾敹鏍囧噯

...
```

### 4. 鍒涘缓瀵瑰簲娴嬭瘯鏂囦欢

```powershell
# 鍗曞厓娴嬭瘯
New-Item -ItemType File -Force -Path tests/slices/<妯″潡鍚?-unit.test.ts

# E2E楠屾敹娴嬭瘯
New-Item -ItemType File -Force -Path tests/slices/<妯″潡鍚?-acceptance.spec.ts
```

### 5. 鏇存柊鍚堢害鏂囦欢

```powershell
# 鍦ㄥ叡浜悎绾︾洰褰曟坊鍔犵被鍨嬪畾涔?New-Item -ItemType File -Force -Path src/shared/contracts/<妯″潡鍚?-types.ts
New-Item -ItemType File -Force -Path src/shared/contracts/<妯″潡鍚?-events.ts
```

## 馃И 濡備綍杩愯娴嬭瘯

### 鍗曞厓娴嬭瘯 (Vitest)

```powershell
# 杩愯鎵€鏈夊崟鍏冩祴璇?npm run test:unit

# 鐩戝惉妯″紡杩愯
npm run test:unit:watch

# 甯I鐣岄潰杩愯
npm run test:unit:ui

# 鐢熸垚瑕嗙洊鐜囨姤鍛?npm run test:coverage
```

### E2E娴嬭瘯 (Playwright)

```powershell
# 杩愯鎵€鏈塃2E娴嬭瘯
npm run test:e2e

# 杩愯瀹夊叏鐩稿叧E2E娴嬭瘯
npm run test:e2e:security

# Debug妯″紡杩愯E2E娴嬭瘯
npx playwright test --debug
```

### 娴嬭瘯鏂囦欢瑙勮寖

- 鍗曞厓娴嬭瘯鏂囦欢: `*.test.ts` 鎴?`*.spec.ts`
- E2E娴嬭瘯鏂囦欢: `tests/e2e/*.spec.ts`
- 娴嬭瘯瑕嗙洊鐜囪姹? 琛岃鐩栫巼鈮?0%, 鍒嗘敮瑕嗙洊鐜団墺85%

## 馃敀 Electron 瀹夊叏瑙勮寖

### 涓荤獥鍙ｅ畨鍏ㄩ厤缃?
```typescript
// electron/main.ts 蹇呴』鍖呭惈瀹夊叏閰嶇疆
const mainWindow = new BrowserWindow({
  webPreferences: {
    nodeIntegration: false, // 蹇呴』false
    contextIsolation: true, // 蹇呴』true
    sandbox: true, // 蹇呴』true
    preload: path.join(__dirname, 'preload.js'),
  },
});
```

### 棰勫姞杞借剼鏈鑼?
```typescript
// electron/preload.ts 浣跨敤contextBridge
import { contextBridge } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // 鍙毚闇茬櫧鍚嶅崟API
  openPath: (path: string) => ipcRenderer.invoke('open-path', path),
});
```

### CSP瀹夊叏绛栫暐

```html
<!-- index.html 蹇呴』鍖呭惈CSP -->
<meta
  http-equiv="Content-Security-Policy"
  content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
/>
```

## 馃搵 浠ｇ爜瑙勮寖

### TypeScript 瑙勮寖

- 涓ユ牸绫诲瀷妫€鏌? `"strict": true`
- 鍏叡绫诲瀷瀹氫箟鏀惧湪 `src/shared/contracts/**`
- 绂佹浣跨敤 `any`, 濡傞渶浣跨敤闇€娣诲姞TODO娉ㄩ噴鍜屽洖杩佽鍒?
### 鏍峰紡瑙勮寖

- 浣跨敤 Tailwind CSS v4
- 鑷畾涔夋牱寮忔斁鍦?`src/styles/globals.css`
- 閬靛惊鍘熷瓙鍖朇SS鍘熷垯

### 浠ｇ爜鎻愪氦瑙勮寖

```powershell
# 鎻愪氦鍓嶈繍琛岃川閲忔鏌?npm run guard:ci

# Git鎻愪氦淇℃伅鏍煎紡
git commit -m "feat: 娣诲姞鐢ㄦ埛璁よ瘉鍔熻兘

璇︾粏鎻忚堪鍙樻洿鍐呭鍜屽師鍥?
馃 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

## 馃摑 鍙樻洿璁板綍缁存姢

### CHANGELOG.md 鏇存柊娴佺▼

#### 鑷姩鍖栨洿鏂?(鎺ㄨ崘)

```powershell
# 浣跨敤鑷姩鍖栬剼鏈洿鏂?CHANGELOG
node scripts/update-changelog.mjs --add "鏂板鐢ㄦ埛璁よ瘉鍔熻兘" --ai 85 --adr "0006"
node scripts/update-changelog.mjs --fix "淇鍐呭瓨娉勬紡闂" --ai 70 --adr "0007"
```

#### 鎵嬪姩鏇存柊娴佺▼

1. **寮€鍙戣繃绋嬩腑**: 鍦?`[Unreleased]` 閮ㄥ垎璁板綍鍙樻洿
2. **鐗堟湰鍙戝竷鍓?*: 灏?`[Unreleased]` 鍐呭绉诲姩鍒版柊鐗堟湰鍙蜂笅
3. **鍙樻洿鍒嗙被**: 浣跨敤鏍囧噯鍒嗙被 Added/Changed/Deprecated/Removed/Fixed/Security

#### AI 鍗忎綔鏍囪瑙勮寖

姣忎釜鍙樻洿鏉＄洰蹇呴』鍖呭惈鍗忎綔姣斾緥鏍囪锛?
- **AI 涓诲 (AI:80%+)**: AI 鐢熸垚浠ｇ爜/鏂囨。锛屼汉绫昏交搴﹀鏍?
  ```markdown
  - **[AI:90%] [Human:10%] [ADR-0002]** Electron 瀹夊叏鍩虹嚎閰嶇疆
  ```

- **鍗忎綔鍧囪　 (AI:40-60%)**: AI 杈呭姪瀹炵幇锛屼汉绫绘繁搴﹀弬涓庤璁?
  ```markdown
  - **[AI:60%] [Human:40%] [ADR-0004]** 浜嬩欢鎬荤嚎涓庡绾︾郴缁?  ```

- **浜虹被涓诲 (Human:70%+)**: 浜虹被璁捐瀹炵幇锛孉I 鎻愪緵杈呭姪寤鸿
  ```markdown
  - **[AI:20%] [Human:80%] [ADR-0001]** 鎶€鏈爤鏋舵瀯鍐崇瓥
  ```

#### 璐ㄩ噺鏍囪瑙勮寖

鍙樻洿鏉＄洰搴斿寘鍚互涓嬭川閲忔寚鏍囷細

```markdown
- **[AI:75%] [Human:25%] [ADR-0005] [Coverage:92%] [RH: Sessions 99.8%, Users 99.7%] [Guard:鉁匽** 璐ㄩ噺闂ㄧ浣撶郴瀹炵幇
```

鏍囪璇存槑锛?
- **[Coverage:xx%]**: 娴嬭瘯瑕嗙洊鐜?- **[RH: Sessions xx%, Users xx%]**: Release Health 鎸囨爣
- **[Guard:鉁?鉂宂**: 璐ㄩ噺闂ㄧ閫氳繃鐘舵€?- **[ADR-xxxx]**: 鍏宠仈鐨勬灦鏋勫喅绛栬褰?
### RELEASE_NOTES.md 鏇存柊娴佺▼

#### 闈㈠悜鐢ㄦ埛鐨勫彂甯冭鏄?
RELEASE_NOTES.md 涓撴敞浜庣敤鎴蜂环鍊煎拰浣撻獙鏀硅繘锛?
```markdown
### 鉁?鏂板鍔熻兘

#### 馃幃 娓告垙鏍稿績鍔熻兘

- **娓告垙寮曟搸**: 闆嗘垚 Phaser 3锛屾敮鎸?2D 娓告垙寮€鍙?- **鍦烘櫙绠＄悊**: 鎻愪緵鍦烘櫙鍒囨崲鍜岀姸鎬佺鐞?
### 馃幆 鎬ц兘鎸囨爣

| 鎸囨爣绫诲瀷    | 鐩爣鍊?| 瀹為檯琛ㄧ幇 |
| ----------- | ------ | -------- |
| 馃殌 鍚姩鏃堕棿 | < 3绉? | 2.1绉?   |
```

#### 鏇存柊鏃舵満

- 姣忔鐗堟湰鍙戝竷鏃跺繀椤绘洿鏂?- 閲嶇偣鍏虫敞鐢ㄦ埛鍙劅鐭ョ殑鍙樺寲
- 鍖呭惈绯荤粺瑕佹眰銆佸畨瑁呰鏄庛€佸凡鐭ラ棶棰?
### 鐗堟湰鍙戝竷宸ヤ綔娴?
#### 瀹屾暣鍙戝竷娴佺▼

```powershell
# 1. 杩愯璐ㄩ噺闂ㄧ妫€鏌?npm run guard:ci

# 2. 鏇存柊 CHANGELOG (鑷姩鍖?
node scripts/update-changelog.mjs --add "鏂板姛鑳芥弿杩? --fix "淇鎻忚堪"

# 3. 鏇存柊鐗堟湰鍙?npm version patch  # 鎴?minor/major

# 4. 鏇存柊 RELEASE_NOTES.md (鎵嬪姩)
# 缂栬緫鐢ㄦ埛闈㈠悜鐨勫彂甯冭鏄?
# 5. 鎻愪氦鐗堟湰鍙樻洿
git add CHANGELOG.md RELEASE_NOTES.md package.json
git commit -m "chore: release v0.1.0

馃摑 鍙樻洿璁板綍:
- 鏂板鐢ㄦ埛璁よ瘉鍔熻兘 [AI:85%] [Human:15%]
- 淇鍐呭瓨娉勬紡闂 [AI:70%] [Human:30%]

馃 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

# 6. 鍒涘缓鐗堟湰鏍囩
git tag -a v0.1.0 -m "Release v0.1.0"
```

#### 闆嗘垚鍒板紑鍙戞祦绋?
鍦ㄦ瘡娆″姛鑳藉紑鍙戝畬鎴愬悗锛?
```powershell
# 寮€鍙戝畬鎴愬悗鑷姩鏇存柊 CHANGELOG
npm run guard:ci && \
node scripts/update-changelog.mjs --add "鍔熻兘鎻忚堪" --ai 80 --adr "0008" && \
git add CHANGELOG.md && \
git commit -m "docs: update changelog for new feature"
```

### 鍙樻洿璁板綍鏈€浣冲疄璺?
#### 鍙樻洿鎻忚堪瑙勮寖

- **鍏蜂綋鏄庣‘**: 鎻忚堪瀹為檯鍙樺寲锛屼笉鏄娊璞℃蹇?- **闈㈠悜褰卞搷**: 璇存槑瀵圭敤鎴?寮€鍙戣€呯殑褰卞搷
- **鎶€鏈噯纭?*: 寮曠敤姝ｇ‘鐨?ADR 鍜岃鐩栫巼鏁版嵁

#### 绀轰緥瀵规瘮

鉂?**涓嶅ソ鐨勬弿杩?*:

```markdown
- **[AI:90%]** 浼樺寲浜嗙郴缁?```

鉁?**濂界殑鎻忚堪**:

```markdown
- **[AI:85%] [Human:15%] [ADR-0003] [Coverage:94%]** 鍙娴嬫€у熀纭€璁炬柦锛歋entry Release Health 闆嗘垚锛屾敮鎸?Crash-Free Sessions 鐩戞帶鍜屾櫤鑳介噰鏍风瓥鐣?```

#### ADR 鍏宠仈瑙勫垯

- **鏂板姛鑳?*: 蹇呴』鍏宠仈鑷冲皯 1 涓浉鍏?ADR
- **鏋舵瀯鍙樻洿**: 蹇呴』鏂板鎴栨洿鏂?ADR锛屽苟鍦ㄥ彉鏇磋褰曚腑鏍囨敞 `Supersedes: ADR-xxxx`
- **瀹夊叏鍙樻洿**: 蹇呴』鍏宠仈 ADR-0002 (Electron 瀹夊叏鍩虹嚎)

### 鑴氭湰宸ュ叿浣跨敤

#### update-changelog.mjs 鍙傛暟璇存槑

```powershell
# 鍩烘湰鐢ㄦ硶
node scripts/update-changelog.mjs [options]

# 鍙傛暟璇存槑
--add "鎻忚堪"      # 娣诲姞鏂板姛鑳?--change "鎻忚堪"   # 淇敼鐜版湁鍔熻兘
--fix "鎻忚堪"      # 淇闂
--remove "鎻忚堪"   # 绉婚櫎鍔熻兘
--security "鎻忚堪" # 瀹夊叏鐩稿叧鍙樻洿
--deprecate "鎻忚堪" # 搴熷純鍔熻兘

# 璐ㄩ噺鏍囪鍙傛暟
--ai 80           # AI 璐＄尞鐧惧垎姣?(榛樿70)
--adr "0001,0002" # 鍏宠仈 ADR 缂栧彿
--guard-passed    # 璐ㄩ噺闂ㄧ閫氳繃 (榛樿true)
```

#### 绀轰緥浣跨敤鍦烘櫙

```powershell
# 鏂板鍔熻兘
node scripts/update-changelog.mjs \
  --add "鐢ㄦ埛璁よ瘉绯荤粺锛氭敮鎸?JWT Token 鍜屾潈闄愮鐞? \
  --ai 75 \
  --adr "0006,0007"

# 淇闂
node scripts/update-changelog.mjs \
  --fix "淇娓告垙鍦烘櫙鍒囨崲鏃剁殑鍐呭瓨娉勬紡闂" \
  --ai 85 \
  --adr "0008"

# 澶氫釜鍙樻洿
node scripts/update-changelog.mjs \
  --add "鍏細绠＄悊鐣岄潰" \
  --fix "娓叉煋鎬ц兘浼樺寲" \
  --ai 70
```

### 涓?CI/CD 闆嗘垚

#### 鑷姩鍖栨鏌?
璐ㄩ噺闂ㄧ鑴氭湰浼氶獙璇侊細

- CHANGELOG.md 鏍煎紡姝ｇ‘鎬?- 鍙樻洿鏉＄洰鍖呭惈蹇呴渶鐨勬爣璁?- ADR 寮曠敤鏈夋晥鎬?- 瑕嗙洊鐜囨暟鎹畬鏁存€?
#### 澶辫触澶勭悊

濡傛灉鍙樻洿璁板綍妫€鏌ュけ璐ワ細

```powershell
# 妫€鏌?CHANGELOG 鏍煎紡
node scripts/verify_changelog_format.mjs

# 淇甯歌闂
node scripts/update-changelog.mjs --validate --fix
```

## 馃毆 璐ㄩ噺闂ㄧ

### 鏈湴闂ㄧ (鎻愪氦鍓嶅繀椤婚€氳繃)

1. **TypeScript绫诲瀷妫€鏌?*: `npm run typecheck`
2. **ESLint瑙勮寖妫€鏌?*: `npm run lint`
3. **鍗曞厓娴嬭瘯**: `npm run test:unit`
4. **Electron瀹夊叏妫€鏌?*: `npm run guard:electron`
5. **E2E娴嬭瘯**: `npm run test:e2e`
6. **瑕嗙洊鐜囨鏌?*: `npm run guard:quality`
7. **鏂囨。娓呮磥妫€鏌?*: `npm run guard:base`
8. **鐗堟湰鍚屾妫€鏌?*: `npm run guard:version`

### CI闂ㄧ瑙勫垯

- 鎵€鏈夋鏌ュ繀椤婚€氳繃鎵嶈兘鍚堝苟PR
- 瑕嗙洊鐜囬槇鍊? 琛屸墺90%, 鍒嗘敮鈮?5%, 鍑芥暟鈮?0%, 璇彞鈮?0%
- Release Health: Crash-Free Sessions鈮?9.5%, Users鈮?9.0%

## 馃悰 鏁呴殰鎺掓煡

### 甯歌闂

#### 1. TypeScript缂栬瘧閿欒

```powershell
# 妫€鏌ョ被鍨嬮敊璇?npm run typecheck

# 甯歌瑙ｅ喅鏂规
- 妫€鏌mport璺緞鏄惁姝ｇ‘
- 纭绫诲瀷瀹氫箟鏂囦欢瀛樺湪
- 鏇存柊@types/鐩稿叧鍖呯増鏈?```

#### 2. 娴嬭瘯澶辫触

```powershell
# 鍗曠嫭杩愯澶辫触鐨勬祴璇?npx vitest run <test-file-pattern>

# E2E娴嬭瘯澶辫触
npx playwright test --debug <test-file>
```

#### 3. Electron瀹夊叏妫€鏌ュけ璐?
```powershell
# 鏌ョ湅璇︾粏瀹夊叏鎶ュ憡
npm run guard:electron
cat logs/security/electron-security-scan-*.json
```

#### 4. 瑕嗙洊鐜囦笉瓒?
```powershell
# 鏌ョ湅瑕嗙洊鐜囨姤鍛?npm run test:coverage:open

# 鏌ユ壘鏈鐩栫殑浠ｇ爜
- 妫€鏌overage/lcov-report/index.html
- 閲嶇偣鍏虫敞绾㈣壊鏍囪鐨勬湭瑕嗙洊浠ｇ爜
```

## 馃摎 鐩稿叧鏂囨。

- [鏋舵瀯鏂囨。](./architecture/base/) - 绯荤粺鏋舵瀯璁捐
- [ADR璁板綍](./adr/) - 鏋舵瀯鍐崇瓥璁板綍
- [CLAUDE.md](../CLAUDE.md) - 椤圭洰寮€鍙戣鑼?- [娴嬭瘯鎸囧崡](./tests/README.md) - 璇︾粏娴嬭瘯璇存槑

## 馃 璐＄尞娴佺▼

1. **Fork椤圭洰** 鈫?鍒涘缓鍔熻兘鍒嗘敮
2. **寮€鍙?* 鈫?閬靛惊浠ｇ爜瑙勮寖鍜屾祴璇曡姹?3. **鏈湴楠岃瘉** 鈫?杩愯 `npm run guard:ci`
4. **鎻愪氦PR** 鈫?濉啓瀹屾暣鐨凱R妯℃澘
5. **浠ｇ爜瀹℃煡** 鈫?鍦板潃瀹℃煡鎰忚
6. **鍚堝苟** 鈫?閫氳繃鎵€鏈夋鏌ュ悗鍚堝苟

---

馃挕 **鎻愮ず**: 濡傛湁鐤戦棶锛岃鏌ョ湅鍏蜂綋鐨勮剼鏈枃浠?`scripts/` 鐩綍鎴栬仈绯婚」鐩淮鎶よ€呫€?


