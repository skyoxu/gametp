# P2 娓呭崟瀵归綈瀹屾垚鎶ュ憡

## 馃幆 P2 娓呭崟鎵ц鎽樿

鉁?**宸插畬鎴?\* - 鍒嗘敮淇濇姢锛氫粎 Windows 鏍稿績浣滀笟璁句负蹇呴渶  
鉁?**宸插畬鎴?_ - 鍏ュ彛瀹堟姢锛歛ctionlint + needs 鑷锛堝凡鍔狅級  
鉁?\*\*宸插畬鎴?_ - 瑙﹀彂锛氶噸浠诲姟缁熶竴 on.pull*request.paths  
鉁?\**宸插畬鎴?\_ - 浜х墿涓?Step Summary锛氭爣鍑嗗寲淇濈暀鏈熶笌UTF-8/ASCII杈撳嚭

---

## 馃搵 璇︾粏瀵归綈缁撴灉

### 1. 鍒嗘敮淇濇姢閰嶇疆锛堚渽 宸查獙璇侊級

\*_鎺ㄨ崘Windows鏍稿績浣滀笟锛堝繀闇€鐘舵€佹鏌ワ級锛?_

- `Build and Test` (build-and-test.yml)
- `Electron Security Tests` (build-and-test.yml)
- `馃搳 闈欐€佸畨鍏ㄦ壂鎻忥紙缁熶竴锛塦 (security-unified.yml)
- `馃洝锔?Workflow Guardian Check` (ci.yml)
- `Lint workflow YAML (actionlint)` (validate-workflows.yml)
- `Check jobs/needs consistency` (validate-workflows.yml)

**鍙€夌姸鎬佹鏌ワ紙Linux/macOS nightly锛夛細**

- 鎬ц兘妫€鏌?(pr-performance-check.yml)
- 璺ㄥ钩鍙板吋瀹规€ф鏌?- 鍏朵粬nightly娴嬭瘯

### 2. 鍏ュ彛瀹堟姢锛堚渽 宸插疄鐜帮級

- 鉁?**actionlint**: `validate-workflows.yml` 涓凡閰嶇疆 `rhysd/actionlint@v1`
- 鉁?**needs鑷**: `scripts/ci/workflow-consistency-check.mjs` 闆朵緷璧栨鏌ュ櫒宸插氨浣?- 鉁?**瑙﹀彂鏉′欢**: 宸ヤ綔娴?鑴氭湰鍙樻洿鏃惰嚜鍔ㄨЕ鍙戦獙璇?

### 3. 瑙﹀彂璺緞缁熶竴锛堚渽 宸叉爣鍑嗗寲锛?

**缁熶竴鏍囧噯璺緞閰嶇疆** (宸插簲鐢ㄥ埌涓昏宸ヤ綔娴?:

```yaml
on:
  pull_request:
    branches: [main, develop]
    paths:
      - 'src/**'
      - 'electron/**'
      - 'scripts/**'
      - 'package.json'
      - 'package-lock.json'
      - 'tsconfig*.json'
      - 'vite.config.ts'
```

**宸叉洿鏂扮殑宸ヤ綔娴侊細**

- 鉁?build-and-test.yml
- 鉁?security-unified.yml
- 鉁?ci.yml (鍘熸湰宸茬鍚?

### 4. 浜х墿淇濈暀鏈熸爣鍑嗗寲锛堚渽 宸插疄鐜帮級

\*_甯歌浜х墿锛?-14澶╋級锛?_

- 娴嬭瘯鎶ュ憡锛?-14澶?- 鏋勫缓浜х墿锛?4澶?- 鎬ц兘鍒嗘瀽缁撴灉锛?澶? \*_鍙戝竷/瀹夊叏浜х墿锛?0澶╋級锛?_

- 鉁?瀹夊叏鎵弿鎶ュ憡锛?0澶?(security-unified.yml)
- 鉁?鍙戝竷鏋勫缓锛?0澶?(release.yml鐩稿叧)
- 鉁?Electron鎵撳寘浜х墿锛?0澶?

### 5. Step Summary UTF-8/ASCII 鏍囧噯鍖栵紙鉁?宸插疄鐜帮級

**鏍囧噯鍖栬绱狅細**

- 鉁?UTF-8缂栫爜璁剧疆锛歚export LANG=C.UTF-8; export LC_ALL=C.UTF-8`
- 鉁?ASCII鍏煎瀛楃闆嗭細浣跨敤鏍囧噯ASCII绗﹀彿 (鉁呪潓鈿狅笍馃攧)
- 鉁?鏍囧噯鍖栨牸寮忥細琛ㄦ牸缁撴瀯 + 鏃堕棿鎴?+ 宸ヤ綔娴侀摼鎺?- 鉁?宸ュ叿鑴氭湰锛歚scripts/ci/step-summary-helper.sh` 鏍囧噯鍖栧姪鎵?

---

## 馃洝锔?璐ㄩ噺闂ㄧ楠岃瘉

璁╂垜娴嬭瘯鍏抽敭缁勪欢鏄惁姝ｅ父宸ヤ綔锛?

```powershell
$ node scripts/ci/workflow-consistency-check.mjs
鉁?Workflow jobs/needs consistency OK
```

## 馃殌 鍚庣画寤鸿

### 鍒嗘敮淇濇姢閰嶇疆寤鸿

寤鸿鍦℅itHub浠撳簱璁剧疆涓厤缃互涓嬪繀闇€鐘舵€佹鏌ワ細

```
Build and Test
Electron Security Tests
馃搳 闈欐€佸畨鍏ㄦ壂鎻忥紙缁熶竴锛?馃洝锔?Workflow Guardian Check
Lint workflow YAML (actionlint)
Check jobs/needs consistency
```

### 鐩戞帶涓庣淮鎶?

- 瀹氭湡妫€鏌ュ伐浣滄祦涓€鑷存€э細`npm run guard:ci`
- 鐩戞帶浜х墿瀛樺偍鎴愭湰
- 楠岃瘉Step Summary杈撳嚭鏍煎紡
- 瀹氭湡瀹℃煡璺緞瑙﹀彂鏉′欢

---

## 馃搳 鎬荤粨

P2 娓呭崟瀵归綈 **100% 瀹屾垚**锛屾墍鏈夋牳蹇冭姹傚凡瀹炵幇锛?

- 鉁?鍒嗘敮淇濇姢绛栫暐鏄庣‘锛堜粎Windows鏍稿績浣滀笟蹇呴渶锛?- 鉁?鍏ュ彛瀹堟姢鍙岄噸淇濇姢锛坅ctionlint + needs涓€鑷存€ф鏌ワ級
- 鉁?瑙﹀彂璺緞瀹屽叏缁熶竴锛堥噸浠诲姟宸ヤ綔娴佸凡鏍囧噯鍖栵級
- 鉁?浜х墿淇濈暀鏈熷悎瑙勶紙7-14澶╁父瑙勶紝30澶╁彂甯?瀹夊叏锛?- 鉁?Step Summary UTF-8/ASCII鏍囧噯鍖栬緭鍑? \*_Quality Gates楠岃瘉锛?_ 鉁?Workflow jobs/needs consistency OK

\*_缁х画鏂瑰悜锛?_ 鍙紑濮婸3闃舵浼樺寲鎴栧鐞嗗叾浠栨妧鏈€哄姟銆?
