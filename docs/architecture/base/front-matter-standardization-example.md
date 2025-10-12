# Base 鏂囨。 Front-Matter 鏍囧噯鍖栫ず渚?

## 闂鐜扮姸

褰撳墠 01绔犲拰02绔犵殑 front-matter 鍙寘鍚崰浣嶇鍙橀噺锛岀己灏戞爣鍑嗗瓧娈碉細

```yaml
# 褰撳墠鏍煎紡锛堜笉瀹屾暣锛?---
APP_NAME: ${APP_NAME}
PRODUCT_NAME: ${PRODUCT_NAME}
PRODUCT_SLUG: ${PRODUCT_SLUG}
# ... 鍏朵粬鍗犱綅绗?---
```

## 寤鸿鐨勬爣鍑嗗寲鏍煎紡

### 01绔犳爣鍑嗗寲鍚庣殑 front-matter

```yaml
---
title: 01 绾︽潫涓庣洰鏍?鈥?Base-Clean (90-95)
status: base-SSoT
adr_refs: [ADR-0001, ADR-0002, ADR-0003, ADR-0004, ADR-0005]
placeholders: ${APP_NAME}, ${PRODUCT_NAME}, ${PRODUCT_SLUG}, ${DOMAIN_PREFIX}, ${SENTRY_ORG}, ${SENTRY_PROJECT}, ${RELEASE_PREFIX}, ${VERSION}, ${ENV}, ${CRASH_FREE_SESSIONS}
---
```

### 02绔犳爣鍑嗗寲鍚庣殑 front-matter

```yaml
---
title: 02 瀹夊叏鍩虹嚎锛圗lectron锛夆€?Base-Clean (95)
status: base-SSoT
adr_refs: [ADR-0002, ADR-0005]
placeholders: ${APP_NAME}, ${PRODUCT_NAME}, ${PRODUCT_SLUG}, ${DOMAIN_PREFIX}, ${SENTRY_ORG}, ${SENTRY_PROJECT}, ${RELEASE_PREFIX}, ${VERSION}, ${ENV}
---
```

## 鏍囧噯鍖栧悗鐨勫ソ澶?

### 1. 涓庡叾浠?Base 鏂囨。涓€鑷?

- 鉁?缁熶竴鐨?`title` 瀛楁鏍煎紡
- 鉁?鏄庣‘鐨?`status: base-SSoT` 鏍囪瘑
- 鉁?娓呮櫚鐨?`adr_refs` 杩借釜鍏崇郴

### 2. 鏄庣‘鍗犱綅绗﹀０鏄?

- 鉁?`placeholders` 瀛楁鏄庣‘鍒楀嚭鎵€鏈夊崰浣嶇
- 鉁?渚夸簬鑷姩鍖栧伐鍏烽獙璇佸拰鏇挎崲
- 鉁?鎻愪緵瀹屾暣鐨勪緷璧栧叧绯绘槧灏?

### 3. 閰嶇疆鍒嗗眰瀹炵幇绀轰緥

#### 鏋勫缓鏃舵浛鎹㈢ず渚嬶紙npm run config:substitute锛?

\*_鏇挎崲鍓嶏紙Base 鏂囨。锛?_:

```markdown
# 绯荤粺瀹氫綅

- **浜у搧绫诲瀷**: 娣卞害鐢熸€佹ā鎷熸父鎴?- 鐜╁浣滀负 ${DOMAIN_PREFIX} 绠＄悊鍛?- **鎶€鏈爤鏍稿績**: ${PRODUCT_NAME} 鍩轰簬 Electron + React 19
- **鐗堟湰**: ${VERSION}
```

\*_鏇挎崲鍚庯紙椤圭洰瀹炵幇锛?_:

```markdown
# 绯荤粺瀹氫綅

- **浜у搧绫诲瀷**: 娣卞害鐢熸€佹ā鎷熸父鎴?- 鐜╁浣滀负 gamedev 绠＄悊鍛?- **鎶€鏈爤鏍稿績**: ViteGame - 娣卞害鐢熸€佹ā鎷熸父鎴?鍩轰簬 Electron + React 19
- **鐗堟湰**: 0.1.0
```

#### 閰嶇疆婧愭槧灏勭ず渚?

| 鍗犱綅绗?          | 閰嶇疆灞?  | 瀹為檯鍊?                            | 鏉ユ簮                   |
| ------------------ | ---------- | ------------------------------------ | ------------------------ |
| `${APP_NAME}`      | Package    | `gamedev-vitegame`                   | package.json name        |
| `${PRODUCT_NAME}`  | Package    | `ViteGame - 娣卞害鐢熸€佹ā鎷熸父鎴廯 | package.json productName |
| `${VERSION}`       | Package    | `0.1.0`                              | package.json version     |
| `${DOMAIN_PREFIX}` | Domain     | `gamedev`                            | 纭紪鐮佸煙閰嶇疆        |
| `${SENTRY_ORG}`    | CI Secrets | `my-company`                         | 鐜鍙橀噺/CI瀵嗛挜      |
| `${NODE_ENV}`      | Runtime    | `production`                         | 杩愯鏃剁幆澧冨彉閲?     |

## 瀹炴柦姝ラ

### 姝ラ1: 鏍囧噯鍖?Front-Matter

```powershell
# 1. 澶囦唤褰撳墠鏂囨。
cp docs/architecture/base/01-introduction-and-goals-v2.md docs/architecture/base/01-introduction-and-goals-v2.md.backup
cp docs/architecture/base/02-security-baseline-electron-v2.md docs/architecture/base/02-security-baseline-electron-v2.md.backup

# 2. 鎵嬪姩鏇存柊 front-matter 涓烘爣鍑嗘牸寮?# 锛堜娇鐢ㄤ笂闈㈡彁渚涚殑鏍囧噯鍖栨牸寮忥級
```

### 姝ラ2: 楠岃瘉鏍囧噯鍖栫粨鏋?

```powershell
# 楠岃瘉 Base 鏂囨。娓呮磥鎬?npm run guard:base

# 楠岃瘉閰嶇疆瀹屾暣鎬?npm run config:layers:validate

# 楠岃瘉鍗犱綅绗﹀鐞?npm run config:substitute:validate
```

### 姝ラ3: 娴嬭瘯閰嶇疆鏇挎崲

```powershell
# 寮€鍙戠幆澧冩祴璇曪紙浠呴獙璇侊紝涓嶆浛鎹級
NODE_ENV=development npm run config:substitute:validate

# 鐢熶骇鐜娴嬭瘯锛堝疄闄呮浛鎹級
NODE_ENV=production SENTRY_ORG=test-org npm run config:substitute:docs

Select-String -Pattern "\${" -Path docs/architecture/base/01-*.md,docs/architecture/base/02-*.md
```

## 閰嶇疆楠岃瘉娓呭崟

### 鉁?Front-Matter 蹇呴渶瀛楁妫€鏌?

- [x] `title` - 娓呮櫚鐨勬枃妗ｆ爣棰?- [x] `status: base-SSoT` - 鏍囪瘑涓?Base 鏂囨。
- [x] `adr_refs` - 寮曠敤鐩稿叧鐨?ADR
- [x] `placeholders` - 澹版槑鎵€鏈変娇鐢ㄧ殑鍗犱綅绗?

### 鉁?鍗犱綅绗︿竴鑷存€ф鏌?

- [x] `placeholders` 瀛楁涓０鏄庣殑鍗犱綅绗︿笌姝ｆ枃涓娇鐢ㄧ殑涓€鑷?- [x] 鎵€鏈?`${VAR}` 鏍煎紡鐨勫崰浣嶇閮芥湁瀵瑰簲鐨勯厤缃簮
- [x] 鏁忔劅鍗犱綅绗︼紙濡?SENTRY\_\*锛夋爣璇嗕负 CI Secrets

### 鉁?閰嶇疆鍒嗗眰瀹屾暣鎬ф鏌?

- [x] Package Layer: `APP_NAME`, `PRODUCT_NAME`, `VERSION`
- [x] CI Secrets Layer: `SENTRY_ORG`, `SENTRY_PROJECT`
- [x] Runtime Layer: `NODE_ENV`, `RELEASE_PREFIX`
- [x] Domain Layer: `DOMAIN_PREFIX`, `CRASH_FREE_SESSIONS`

## 棰勬湡鏁堟灉

### 寮€鍙戜綋楠屾敼鍠?

- 馃殌 \*_缁熶竴鐨勬枃妗ｇ粨鏋?_ - 鎵€鏈?Base 鏂囨。閬靛惊鐩稿悓鏍囧噯
- 馃敡 \*_鑷姩鍖栭厤缃鐞?_ - 閫氳繃宸ュ叿閾惧鐞嗗崰浣嶇鏇挎崲
- 馃搳 \*_瀹屾暣鐨勮拷韪煩闃?_ - ADR 寮曠敤鍜屽崰浣嶇渚濊禆娓呮櫚鍙

### 閮ㄧ讲娴佺▼浼樺寲

- 鈿?\*_鐜閫傞厤鑷姩鍖?_ - 涓嶅悓鐜鑷姩浣跨敤瀵瑰簲閰嶇疆
- 馃敀 **瀹夊叏閰嶇疆鍒嗙** - 鏁忔劅淇℃伅閫氳繃 CI 瀵嗛挜绠＄悊
- 鉁?**閰嶇疆楠岃瘉闂ㄧ** - 鑷姩妫€鏌ラ厤缃畬鏁存€у拰鍚堣鎬?

### 缁存姢鎴愭湰闄嶄綆

- 馃摎 **Base 鏂囨。淇濇寔閫氱敤** - 鍗犱綅绗︽満鍒剁‘淇濇ā鏉垮彲澶嶇敤
- 馃攧 **椤圭洰閰嶇疆鐙珛绠＄悊** - 閰嶇疆鍙樻洿涓嶅奖鍝?Base 鏂囨。缁撴瀯
- 馃洝锔?**鍒嗗眰瀹夊叏绛栫暐** - 涓嶅悓绫诲瀷閰嶇疆閲囩敤閫傚綋鐨勫畨鍏ㄧ骇鍒?
  杩欑娣峰悎閰嶇疆绠＄悊绛栫暐鏃繚鎸佷簡 Base 鏂囨。鐨勫彲澶嶇敤鎬э紝鍙堝疄鐜颁簡椤圭洰瀹炴柦鏃剁殑閰嶇疆瀹夊叏鎬у拰鐏垫椿鎬с€?
