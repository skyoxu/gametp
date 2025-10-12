# 馃摎 椤圭洰鏂囨。绱㈠紩

> 提示（Windows-only）：命令示例以 PowerShell 为准；若遇到 Linux 命令，请参见 `docs/maintainers/POWERSHELL_EQUIVALENTS.md` 查找等效写法。

> **Vite Game Project** - 鍩轰簬 Electron + React 19 + Phaser 3 + AI 鍗忎綔寮€鍙戞ā寮忕殑鎶€鏈枃妗ｄ腑蹇?
> [![鐗堟湰](https://img.shields.io/badge/Version-0.0.0-blue)](../CHANGELOG.md)
> [![鏂囨。鐘舵€乚(https://img.shields.io/badge/Docs-Active-green)]()
> [![AI鍗忎綔](https://img.shields.io/badge/AI%20Collaboration-76.4%25-purple)](../CHANGELOG.md)

---

## 馃殌 蹇€熷紑濮?

| 鏂囨。                                     | 鎻忚堪                                       | 閲嶈鎬?  |
| ------------------------------------------ | -------------------------------------------- | --------- |
| [馃搵 璐＄尞鎸囧崡](CONTRIBUTING.md)       | 寮€鍙戞祦绋嬨€佽川閲忛棬绂併€丄I鍗忎綔瑙勮寖 | 猸愨瓙猸? |
| [馃 鑷姩鍖栨寚鍗梋(automation-guides.md) | Claude Code CLI銆佹湰鍦癕ock銆佹€ц兘娴嬭瘯   | 猸愨瓙猸? |
| [馃摑 鍙樻洿鏃ュ織](../CHANGELOG.md)       | AI+浜虹被鍗忎綔鐗堟湰鍘嗗彶杩借釜            | 猸愨瓙猸? |
| [馃摉 椤圭洰瑙勮寖](../CLAUDE.md)          | 椤圭洰绾у紑鍙戣鑼冨拰璐ㄩ噺瑕佹眰           | 猸愨瓙猸? |

---

## 馃摉 鏍稿績鏋舵瀯鏂囨。

### 馃彈锔?鍩虹鏋舵瀯 (Base Documents)

> \**璺ㄥ垏闈㈢郴缁熼骞?*锛屾棤PRD鐥曡抗锛屼娇鐢ㄥ崰浣嶇 `${DOMAIN_*}` `${PRODUCT_*}`

| 绔犺妭 | 鏂囨。                                                                                 | 鏍稿績鍐呭                                 | 鐘舵€?      |
| ------ | -------------------------------------------------------------------------------------- | ------------------------------------------- | ----------- |
| 01     | [绾︽潫涓庣洰鏍嘳(architecture/base/01-introduction-and-goals-enhanced.md)             | NFR/SLO銆佹妧鏈爤銆佽川閲忕洰鏍?           | 鉁?Active   |
| 02     | [瀹夊叏鍩虹嚎](architecture/base/02-security-baseline-electron-v2-claude.md)           | Electron瀹夊叏銆丆SP绛栫暐銆佹矙绠辨ā寮?    | 鉁?Active   |
| 03     | [鍙娴嬫€(architecture/base/03-observability-sentry-logging-enhanced.md)             | Sentry闆嗘垚銆丷elease Health銆佺洃鎺х瓥鐣? | 鉁?Active   |
| 04     | [绯荤粺涓婁笅鏂嘳(architecture/base/04-system-context-c4-event-flows.md)               | C4妯″瀷銆佷簨浠舵祦銆佺郴缁熻竟鐣?          | 鉁?Active   |
| 05     | [鏁版嵁妯″瀷](architecture/base/05-data-models-and-storage-ports.md)                   | 瀛樺偍绔彛銆佹暟鎹缓妯°€佹寔涔呭寲绛栫暐  | 鉁?Active   |
| 06     | [杩愯鏃惰鍥綸(architecture/base/06-runtime-view-loops-state-machines-error-paths.md) | 鐘舵€佹満銆侀敊璇矾寰勩€佹父鎴忓惊鐜?      | 鉁?Active   |
| 07     | [寮€鍙戞瀯寤篯(architecture/base/07-dev-build-and-gates.md)                            | 璐ㄩ噺闂ㄧ銆丆I/CD銆佸紑鍙戝伐鍏烽摼       | 鉁?Active   |
| 08     | [鍔熻兘绾靛垏妯℃澘](architecture/base/08-鍔熻兘绾靛垏-template.md)                     | 妯″潡寮€鍙戞ā鏉垮拰绾︽潫瑙勮寖             | 鉁?Template |
| 09     | [鎬ц兘瀹归噺](architecture/base/09-performance-and-capacity.md)                        | 鎬ц兘鍩哄噯銆佸閲忚鍒掋€佸洖褰掗槇鍊?     | 鉁?Active   |
| 10     | [鍥介檯鍖栬繍缁碷(architecture/base/10-i18n-ops-release.md)                            | i18n妗嗘灦銆佽繍缁寸瓥鐣ャ€佸彂甯冩祦绋?    | 鉁?Active   |

### 馃幆 涓氬姟鍔熻兘 (Overlay Documents)

> **PRD鐗瑰畾瀹炵幇**锛屼富瑕佹壙杞?08绔犲姛鑳界旱鍒囷紙UI鈫掍簨浠垛啋鍩熸ā鍨嬧啋鎸佷箙鍖栤啋楠屾敹锛?

#### 鍏細绠＄悊绯荤粺 (PRD-GM-GUILD-MANAGER)

| 妯″潡              | 鍔熻兘鎻忚堪                               | 鏂囨。璺緞                                                                                   | 瀹炵幇鐘舵€? |
| ------------------ | ------------------------------------------ | --------------------------------------------------------------------------------------------- | ------------ |
| 馃彌锔?绠＄悊妯″潡 | 鍏細鍒涘缓銆侀厤缃€佹潈闄愮鐞?          | [overlays/08-game-prd/鍏細绠＄悊妯″潡/](architecture/overlays/08-game-prd/鍏細绠＄悊妯″潡/) | 馃搵 Design  |
| 馃懃 浼氬憳妯″潡   | 鎴愬憳鎷涘嫙銆佺瓑绾х鐞嗐€佹潈闄愬垎閰?   | [overlays/08-game-prd/鍏細浼氬憳妯″潡/](architecture/overlays/08-game-prd/鍏細浼氬憳妯″潡/) | 馃搵 Design  |
| 馃彧 鍚庡嫟妯″潡   | 璧勬簮绠＄悊銆佷粨搴撶郴缁熴€佽锤鏄撳姛鑳? | [overlays/08-game-prd/鍏細鍚庡嫟妯″潡/](architecture/overlays/08-game-prd/鍏細鍚庡嫟妯″潡/) | 馃搵 Design  |
| 馃挰 璁哄潧妯″潡   | 鍐呴儴璁哄潧銆佸叕鍛婄郴缁熴€佹秷鎭€氱煡  | [overlays/08-game-prd/鍏細璁哄潧妯″潡/](architecture/overlays/08-game-prd/鍏細璁哄潧妯″潡/) | 馃搵 Design  |
| 鈿旓笍 鎴樻湳涓績 | 鎴樼暐瑙勫垝銆佷换鍔″崗璋冦€佹垬鏈垎鏋?   | [overlays/08-game-prd/鎴樻湳涓績妯″潡/](architecture/overlays/08-game-prd/鎴樻湳涓績妯″潡/) | 馃搵 Design  |

---

## 馃彌锔?鏋舵瀯鍐崇瓥璁板綍 (ADR)

> **宸叉帴鍙楃殑鏋舵瀯鍐崇瓥**锛屽綋鍓嶆湁鏁堝彛寰勶紝浣滀负鎶€鏈€夊瀷鍜屽疄鐜扮殑鏉冨▉鍙傝€?
> | ADR | 鏍囬 | 鍐崇瓥鍐呭 | 鐘舵€? | 褰卞搷鑼冨洿 |
> | -------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------- | ----------- | -------- |
> | [ADR-0001](adr/ADR-0001-tech-stack.md) | 鎶€鏈爤閫夊瀷 | Electron + React 19 + Vite + TypeScript + Tailwind v4 + Phaser 3 | 鉁?Accepted | 鍏ㄦ爤 |
> | [ADR-0002](adr/ADR-0002-electron-security.md) | Electron瀹夊叏鍩虹嚎 | 娌欑妯″紡 + contextIsolation + IPC鐧藉悕鍗? | 鉁?Accepted | 瀹夊叏灞? |
> | [ADR-0003](adr/ADR-0003-observability-release-health.md) | 鍙娴嬫€т笌Release Health | 鍩轰簬Sentry鐨勪紒涓氱骇鐩戞帶绛栫暐 | 鉁?Accepted | 鐩戞帶灞? |
> | [ADR-0004](adr/ADR-0004-event-bus-and-contracts.md) | 浜嬩欢鎬荤嚎涓庡绾? | 绫诲瀷瀹夊叏IPC + 棰嗗煙浜嬩欢 + DTO鐗堟湰鍖? | 鉁?Accepted | 閫氫俊灞? |
> | [ADR-0005](adr/ADR-0005-quality-gates.md) | 璐ㄩ噺闂ㄧ浣撶郴 | 澶氱淮搴﹁嚜鍔ㄥ寲璐ㄩ噺淇濊瘉绛栫暐 | 鉁?Accepted | CI/CD灞? |

---

## 馃搵 浜у搧闇€姹傛枃妗?(PRD)

### 馃З PRD 鍒嗙墖绯荤粺

> **妯″潡鍖朠RD绠＄悊**锛屾敮鎸佸ぇ鍨嬩骇鍝侀渶姹傜殑鍒嗙墖瀛樺偍鍜岀粍鍚?
> | PRD鏂囨。 | 鍒嗙墖鏁伴噺 | 鏍稿績妯″潡 | 鐘舵€? |
> | ------------------------------------------------- | -------- | ---------------------------- | --------- |
> | [鍏細绠＄悊鍣╙(PRD-Guild-Manager.md) | 24涓垎鐗?| 绠＄悊銆佷細鍛樸€佸悗鍕ゃ€佽鍧涖€佹垬鏈?| 馃搵 Design |
> | [鍒嗙墖绱㈠紩](prd_chunks/PRD-Guild-Manager_index.md) | - | 鍒嗙墖瀵艰埅鍜屼緷璧栧叧绯? | 鉁?Active |

### 馃搳 PRD 鍒嗙墖璇︽儏

## 璇︾粏鍒嗙墖鍒楄〃锛歔prd_chunks/](prd_chunks/) 鐩綍鍖呭惈24涓姛鑳藉垎鐗囷紝姣忎釜鍒嗙墖涓撴敞鐗瑰畾鍔熻兘鍩熴€?

## 馃敡 寮€鍙戝伐鍏蜂笌鑴氭湰

### 馃摐 鑷姩鍖栬剼鏈?

| 鑴氭湰                                                     | 鍔熻兘                        | 浣跨敤鏂瑰紡                        | 闆嗘垚鐘舵€? |
| ---------------------------------------------------------- | ----------------------------- | ----------------------------------- | ------------ |
| [璐ㄩ噺闂ㄧ](../scripts/quality_gates.mjs)                | 瑕嗙洊鐜?Release Health妫€鏌? | `npm run guard:quality`             | 鉁?CI闆嗘垚  |
| [Electron瀹夊叏鎵弿](../scripts/scan_electron_safety.mjs) | 瀹夊叏閰嶇疆妫€鏌?            | `npm run guard:electron`            | 鉁?CI闆嗘垚  |
| [鍙樻洿鏃ュ織鏇存柊](../scripts/update-changelog.mjs)      | AI鍗忎綔CHANGELOG鑷姩鍖?     | `node scripts/update-changelog.mjs` | 鉁?鏂板     |
| [Base鏂囨。娓呮磥](../scripts/verify_base_clean.mjs)       | Base鏂囨。PRD-ID娓呮磥妫€鏌?  | `npm run guard:base`                | 鉁?CI闆嗘垚  |
| [鐗堟湰鍚屾](../scripts/version_sync_check.mjs)           | 鐗堟湰涓€鑷存€ф鏌?           | `npm run guard:version`             | 鉁?CI闆嗘垚  |

### 馃И 娴嬭瘯宸ュ叿

| 娴嬭瘯绫诲瀷 | 宸ュ叿            | 鍛戒护                  | 瑕嗙洊鑼冨洿                  |
| ------------ | ----------------- | ----------------------- | ----------------------------- |
| 鍗曞厓娴嬭瘯 | Vitest            | `npm run test:unit`     | 鏍稿績閫昏緫銆佸伐鍏峰嚱鏁?   |
| E2E娴嬭瘯    | Playwright        | `npm run test:e2e`      | 鐢ㄦ埛娴佺▼銆佺晫闈氦浜?     |
| 鎬ц兘娴嬭瘯  | 鑷畾涔?          | `npm run perf:*`        | 鍚姩鏃堕棿銆佸唴瀛樸€佹覆鏌? |
| 瀹夊叏娴嬭瘯 | Electronegativity | `npm run security:scan` | Electron瀹夊叏閰嶇疆          |

### 鈿欙笍 璐ㄩ噺闂ㄧ鍛戒护

````powershell
# 瀹屾暣璐ㄩ噺妫€鏌ラ摼 (CI/CD鏍囧噯)
npm run guard:ci

# 鍒嗛」妫€鏌?npm run typecheck       # TypeScript绫诲瀷妫€鏌?npm run lint           # ESLint浠ｇ爜瑙勮寖
npm run test:unit      # 鍗曞厓娴嬭瘯
npm run guard:electron # Electron瀹夊叏
npm run test:e2e       # E2E娴嬭瘯
npm run guard:quality  # 瑕嗙洊鐜?Release Health
npm run guard:base     # Base鏂囨。娓呮磥鎬?npm run guard:version  # 鐗堟湰鍚屾妫€鏌?```

---

## 馃搳 椤圭洰鐘舵€佹瑙?
### 馃幆 褰撳墠鐗堟湰鐘舵€?
- **鐗堟湰**: 0.0.0 (鍒濆鍖栭樁娈?
- **AI鍗忎綔姣斾緥**: 76.4% AI瀹炵幇 + 23.6% 浜虹被瀹℃牳
- **娴嬭瘯瑕嗙洊鐜?*: 鐩爣 90%+ (琛岃鐩栫巼), 85%+ (鍒嗘敮瑕嗙洊鐜?
- **璐ㄩ噺闂ㄧ**: 鉁?鍏ㄩ儴閫氳繃
- **Release Health**: 鐩爣 Sessions 鈮?9.5%, Users 鈮?9.0%

### 馃彈锔?鏋舵瀯瀹屾垚搴?
| 灞傜骇          | 瀹屾垚搴?| 鐘舵€佽鏄?                  |
| ------------- | ------ | -------------------------- |
| 馃敡 鍩虹璁炬柦灞?| 95%    | 寮€鍙戠幆澧冦€佹瀯寤恒€丆I/CD瀹屽  |
| 馃彈锔?鏋舵瀯璁捐灞?| 90%    | Base鏂囨。瀹屾暣锛孉DR浣撶郴鍋ュ叏  |
| 馃幃 涓氬姟鍔熻兘灞?| 15%    | PRD璁捐瀹屾垚锛屽疄鐜板緟鍚姩    |
| 馃И 娴嬭瘯璐ㄩ噺灞?| 85%    | 娴嬭瘯妗嗘灦瀹屽锛岃鐩栫巼寰呮彁鍗?|
| 馃搳 鐩戞帶杩愮淮灞?| 70%    | Sentry闆嗘垚锛屾€ц兘鐩戞帶寰呭畬鍠?|

### 馃搱 鍏抽敭鎸囨爣

- **鏂囨。鏁伴噺**: 100+ 鎶€鏈枃妗?- **ADR鏁伴噺**: 5涓凡鎺ュ彈鍐崇瓥
- **PRD鍒嗙墖**: 24涓姛鑳芥ā鍧?- **鑷姩鍖栬剼鏈?*: 10+ 璐ㄩ噺闂ㄧ鑴氭湰
- **娴嬭瘯濂椾欢**: 鍗曞厓娴嬭瘯 + E2E娴嬭瘯 + 鎬ц兘娴嬭瘯

---

## 馃梻锔?鏂囨。鍒嗙被瀵艰埅

### 馃摎 鎸夋枃妗ｇ被鍨嬫祻瑙?
#### 馃彌锔?鏋舵瀯涓庤璁?
- **绯荤粺鏋舵瀯**: [architecture/base/](architecture/base/) - 10绔犲畬鏁存灦鏋勮璁?- **鍔熻兘璁捐**: [architecture/overlays/](architecture/overlays/) - 涓氬姟鍔熻兘瀹炵幇鏂规
- **鍐崇瓥璁板綍**: [adr/](adr/) - 鏋舵瀯鍐崇瓥杩借釜
- **璁捐鏂囨。**: [鎶€鏈灦鏋勬枃妗(tech-architecture-ai-first.base.md)

#### 馃搵 浜у搧涓庨渶姹?
- **浜у搧闇€姹?*: [PRD-Guild-Manager.md](PRD-Guild-Manager.md) - 鍏細绠＄悊鍣ㄥ畬鏁撮渶姹?- **闇€姹傚垎鐗?*: [prd_chunks/](prd_chunks/) - 妯″潡鍖栭渶姹傜鐞?- **娓告垙璁捐**: [GDD-琛ラ仐-鍏細缁忕悊.md](GDD-琛ラ仐-鍏細缁忕悊.md) - 娓告垙璁捐鏂囨。

#### 馃敡 寮€鍙戜笌宸ュ叿

- **寮€鍙戞寚鍗?*: [CONTRIBUTING.md](CONTRIBUTING.md) - 瀹屾暣寮€鍙戞祦绋?- **鑷姩鍖栨寚鍗?*: [automation-guides.md](automation-guides.md) - Claude Code CLI浣跨敤
- **鎬濈淮妯″紡**: [thinking-modes-guide.md](thinking-modes-guide.md) - AI鎬濈淮宸ュ叿浣跨敤

### 馃搨 鎸夐噸瑕佹€х骇鍒?
#### 猸愨瓙猸?鏍稿績鏂囨。 (姣忔棩蹇呰)

1. [CONTRIBUTING.md](CONTRIBUTING.md) - 寮€鍙戞祦绋嬪拰璐ㄩ噺闂ㄧ
2. [automation-guides.md](automation-guides.md) - 鑷姩鍖栧伐鍏蜂娇鐢?3. [CHANGELOG.md](../CHANGELOG.md) - 鐗堟湰鍘嗗彶鍜孉I鍗忎綔杩借釜
4. [CLAUDE.md](../CLAUDE.md) - 椤圭洰瑙勮寖鍜岃涓哄噯鍒?
#### 猸愨瓙 閲嶈鍙傝€?(鍛ㄥ害鍥為【)

1. [ADR鏂囨。](adr/) - 鏋舵瀯鍐崇瓥鏉冨▉鍙傝€?2. [鍩虹鏋舵瀯鏂囨。](architecture/base/) - 绯荤粺璁捐璇︾粏璇存槑
3. [璐ㄩ噺闂ㄧ鑴氭湰](../scripts/) - 鑷姩鍖栧伐鍏峰疄鐜?
#### 猸?涓撻」璧勬枡 (鎸夐渶鏌ラ槄)

1. [PRD鍒嗙墖鏂囨。](prd_chunks/) - 鐗瑰畾鍔熻兘闇€姹?2. [鍘嗗彶鏂囨。](old/) - 婕旇繘鍘嗗彶璁板綍
3. [涓氬姟鍔熻兘璁捐](architecture/overlays/) - 鍏蜂綋妯″潡瀹炵幇

---

## 馃攧 鏂囨。缁存姢

### 馃摑 鏂囨。鏇存柊绛栫暐

- **鑷姩鍚屾**: scripts/update-changelog.mjs 鑷姩鏇存柊CHANGELOG
- **鐗堟湰璺熻釜**: 涓巔ackage.json鐗堟湰鍙疯仈鍔?- **璐ㄩ噺妫€鏌?*: guard:base 纭繚Base鏂囨。娓呮磥鎬?- **AI鍗忎綔杩借釜**: 姣忎釜鏇存柊璁板綍AI vs 浜虹被璐＄尞姣斾緥

### 馃殌 蹇€熸洿鏂版寚浠?
```powershell
# 鏇存柊鍙樻洿鏃ュ織
node scripts/update-changelog.mjs --add "鏂板姛鑳芥弿杩?

# 楠岃瘉鏂囨。瀹屾暣鎬?npm run guard:base

# 鐢熸垚鏂扮殑鏋舵瀯鏂囨。 (BMAD)
/architect
*create-doc architecture-update.yaml
````

### 馃敆 鏂囨。鍏宠仈鍏崇郴

```mermaid
graph TD
    A[CLAUDE.md 椤圭洰瑙勮寖] --> B[CONTRIBUTING.md 寮€鍙戞寚鍗梋
    B --> C[automation-guides.md 鑷姩鍖朷
    C --> D[Base Architecture 鍩虹鏋舵瀯]
    D --> E[ADR 鏋舵瀯鍐崇瓥]
    D --> F[Overlay 涓氬姟鍔熻兘]
    E --> G[PRD 浜у搧闇€姹俔
    F --> G
    G --> H[Scripts 鑷姩鍖栬剼鏈琞
    H --> I[CHANGELOG.md 鐗堟湰鍘嗗彶]
```

---

## 鉂?甯歌闂

### Q: 濡備綍蹇€熸壘鍒扮壒瀹氬姛鑳界殑鏂囨。锛?

A:

1. 鏌ョ湅鏈枃妗ｇ殑鍒嗙被瀵艰埅
2. 浣跨敤`Ctrl+F`鎼滅储鍏抽敭璇?3. 妫€鏌?[prd_chunks绱㈠紩](prd_chunks/PRD-Guild-Manager_index.md)

### Q: Base 鍜?Overlay 鏂囨。鏈変粈涔堝尯鍒紵

A:

- **Base**: 璺ㄥ垏闈㈢郴缁熼骞诧紝鏃犲叿浣撲骇鍝佷俊鎭紝浣跨敤鍗犱綅绗?- **Overlay**: 鐗瑰畾PRD瀹炵幇锛屽寘鍚叿浣撲笟鍔￠€昏緫鍜屼骇鍝佸姛鑳?

### Q: 濡備綍璐＄尞鏂囨。锛?

A:

1. 闃呰 [CONTRIBUTING.md](CONTRIBUTING.md) 浜嗚В娴佺▼
2. 閬靛惊鏂囨。鏍煎紡鍜孉I鍗忎綔鏍囪瑙勮寖
3. 浣跨敤 `npm run guard:ci` 楠岃瘉璐ㄩ噺闂ㄧ

### Q: AI鍗忎綔姣斾緥濡備綍璁＄畻锛?

A: 鍙傝€?[CHANGELOG.md](../CHANGELOG.md) 涓殑鏍囪瑙勮寖锛?

- `[AI:xx%]` - AI鐢熸垚/瀹炵幇鍗犳瘮
- `[Human:xx%]` - 浜虹被瀹℃牳/淇敼鍗犳瘮

---

## 馃 璐＄尞鑰?

鏈枃妗ｄ綋绯婚噰鐢?**AI + 浜虹被鍗忎綔** 寮€鍙戞ā寮忕淮鎶わ細

- **AI 璐＄尞**: 鏂囨。鐢熸垚銆佺粨鏋勫寲缁勭粐銆佽嚜鍔ㄦ洿鏂拌剼鏈?- **浜虹被璐＄尞**: 鏋舵瀯璁捐銆佸唴瀹瑰鏍搞€佽川閲忔帶鍒躲€佹垬鐣ヨ鍒?- **鍗忎綔宸ュ叿**: Claude Code CLI + BMAD绯荤粺 + 璐ㄩ噺闂ㄧ

### 馃摓 鎶€鏈敮鎸?

- **鏂囨。闂**: 鎻愪氦 [GitHub Issue](https://github.com/your-org/vitegame/issues)
- \*_寮€鍙戞寚瀵?_: 鍙傝€?[CONTRIBUTING.md](CONTRIBUTING.md)
- **鏋舵瀯鍜ㄨ**: 鏌ラ槄 [ADR鏂囨。](adr/) 鎴栬仈绯绘灦鏋勫洟闃?

---

## 馃敄 鐗堟湰淇℃伅

- **鏂囨。鐗堟湰**: v1.0.0
- \*_鏈€鍚庢洿鏂?_: 2025-01-27
- \*_缁存姢鐘舵€?_: 鉁?绉瀬缁存姢
- **涓嬫瀹￠槄**: 2025-02-15

---

> **瀵艰埅鎻愮ず**:
>
> - 馃攳 浣跨敤 `Ctrl+F` 蹇€熸悳绱?> - 馃摫 鏈枃妗ｆ敮鎸佺Щ鍔ㄨ澶囨祻瑙?> - 馃攧 瀹氭湡妫€鏌ユ洿鏂帮紝鏂囨。涓庝唬鐮佸悓姝ユ紨杩?> - 馃挕 濡傚彂鐜版枃妗ｉ棶棰橈紝璇峰強鏃跺弽棣?

---

_鏈€鍚庢洿鏂版椂闂? {{ "now" | date: "%Y-%m-%d %H:%M" }} | 鏂囨。鐢熸垚: 馃 AI + 馃懁 Human_
