# CI/CD 绠￠亾缁存姢鎸囧崡

> 提示（Windows-only）：命令示例以 PowerShell 为准；若需要 Linux 参考，请看 `docs/maintainers/POWERSHELL_EQUIVALENTS.md`。

> **鐩爣鍙椾紬**: 缁存姢鑰呫€佹妧鏈礋璐ｄ汉銆侀珮绾у紑鍙戣€? 
> **鏈€鍚庢洿鏂?*: 2025骞?| **缁存姢棰戠巼**: 姣忔湀瀹℃煡锛岄噸澶у彉鏇存椂绔嬪嵆鏇存柊

## 馃搵 绋冲畾 Job 鍚嶇О娓呭崟

### 馃敀 鏍稿績纭棬绂?Jobs锛堝垎鏀繚鎶ゅ繀椤伙級

杩欎簺 job 鍚嶇О**涓嶅彲闅忔剰鏇存敼**锛屽畠浠笌鍒嗘敮淇濇姢瑙勫垯缁戝畾锛?
| Job 鍚嶇О                 | 宸ヤ綔娴?| 鐢ㄩ€?             | 鍒嗘敮淇濇姢 | 鍙樻洿椋庨櫓  |
| ------------------------ | ------ | ----------------- | -------- | --------- |
| `quality-gates`          | ci.yml | 璐ㄩ噺闂ㄧ鎬绘帶      | 鉁?蹇呴渶  | 馃敶 楂橀闄?|
| `unit-tests-core`        | ci.yml | 鏍稿績鍗曞厓娴嬭瘯      | 鉁?蹇呴渶  | 馃敶 楂橀闄?|
| `coverage-gate`          | ci.yml | 瑕嗙洊鐜囬棬绂?       | 鉁?蹇呴渶  | 馃敶 楂橀闄?|
| `electron-security-gate` | ci.yml | Electron 瀹夊叏妫€鏌?| 鉁?蹇呴渶  | 馃敶 楂橀闄?|

### 馃洝锔?瀹堟姢妫€鏌?Jobs锛堟帹鑽愪繚鐣欙級

| Job 鍚嶇О             | 宸ヤ綔娴?        | 鐢ㄩ€?          | 鍒嗘敮淇濇姢  | 鍙樻洿椋庨櫓  |
| -------------------- | -------------- | -------------- | --------- | --------- |
| `workflow-guardian`  | ci.yml         | 宸ヤ綔娴佸畧鎶よ嚜妫€ | 馃敹 鎺ㄨ崘   | 馃煛 涓闄?|
| `soft-gate-guardian` | soft-gates.yml | 杞棬绂佸畧鎶ゆ鏌?| 鉂?涓嶉渶瑕?| 馃煝 浣庨闄?|

### 馃攧 鏀拺 Jobs锛堝彲閫傚害璋冩暣锛?
| Job 鍚嶇О              | 宸ヤ綔娴?        | 鐢ㄩ€?          | 鍒嗘敮淇濇姢  | 鍙樻洿椋庨櫓  |
| --------------------- | -------------- | -------------- | --------- | --------- |
| `unit-tests-extended` | ci.yml         | 鎵╁睍鍗曞厓娴嬭瘯   | 鉂?涓嶉渶瑕?| 馃煝 浣庨闄?|
| `integration-tests`   | ci.yml         | 闆嗘垚娴嬭瘯       | 鉂?涓嶉渶瑕?| 馃煝 浣庨闄?|
| `release-health-gate` | ci.yml         | 鍙戝竷鍋ュ悍搴︽鏌?| 鉂?涓嶉渶瑕?| 馃煝 浣庨闄?|
| `quality-gate-check`  | soft-gates.yml | 杞棬绂佽川閲忔鏌?| 鉂?涓嶉渶瑕?| 馃煝 浣庨闄?|

## 馃敡 鍒嗘敮淇濇姢閰嶇疆鏍囧噯

### 涓诲垎鏀?(main) 蹇呴渶妫€鏌ユ竻鍗?
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "quality-gates",
      "unit-tests-core",
      "coverage-gate",
      "electron-security-gate"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true
  },
  "restrictions": null
}
```

### 妫€鏌ラ厤缃師鍒?
1. **纭棬绂?Jobs**: 蹇呴』鍦ㄥ垎鏀繚鎶や腑锛岀‘淇濅唬鐮佽川閲?2. **杞棬绂?Jobs**: 涓嶅簲鍦ㄥ垎鏀繚鎶や腑锛屼粎鎻愪緵鍙嶉
3. **瀹堟姢 Jobs**: 鎺ㄨ崘鍖呭惈锛屾彁鍗囩閬撶ǔ瀹氭€?4. **鏀拺 Jobs**: 鎸夐渶鍖呭惈锛屼笉褰卞搷鍚堝苟娴佺▼

## 馃毃 Job 鍚嶇О鍙樻洿娴佺▼

### 馃敶 楂橀闄╁彉鏇达紙鏍稿績纭棬绂侊級

**褰卞搷**: 鍒嗘敮淇濇姢澶辨晥锛屽悎骞跺彲鑳界粫杩囪川閲忔鏌?
**娴佺▼**:

1. **閫氱煡**: 鎻愬墠 1 鍛ㄩ€氱煡鎵€鏈夌淮鎶よ€?2. **璁″垝**: 瀹夋帓鍦ㄩ潪楂樺嘲鏈燂紙鍛ㄤ簲鏅氭垨鍛ㄦ湯锛?3. **鍚屾鎿嶄綔**:
   ```powershell
   # 姝ラ 1: 鏇存柊宸ヤ綔娴佷腑鐨?job 鍚嶇О
   # 姝ラ 2: 绛夊緟鏂板悕绉扮殑 job 杩愯鎴愬姛
   # 姝ラ 3: 绔嬪嵆鏇存柊鍒嗘敮淇濇姢瑙勫垯
   gh api repos/:owner/:repo/branches/main/protection \
     --method PATCH \
     --field required_status_checks[contexts][]=鏂癹ob鍚嶇О
   # 姝ラ 4: 浠庡垎鏀繚鎶よ鍒欎腑绉婚櫎鏃у悕绉?   ```
4. **楠岃瘉**: 鍒涘缓娴嬭瘯 PR 纭淇濇姢瑙勫垯鐢熸晥
5. **鏂囨。**: 鏇存柊鏈枃妗ｅ拰鐩稿叧 README

### 馃煛 涓闄╁彉鏇达紙瀹堟姢妫€鏌ワ級

**褰卞搷**: 鑷鍔熻兘鍙楀奖鍝嶏紝浣嗕笉闃绘柇寮€鍙?
**娴佺▼**:

1. **閫氱煡**: 鍦ㄥ洟闃熼閬撻€氱煡
2. **鎿嶄綔**: 鐩存帴鏇存柊 job 鍚嶇О
3. **楠岃瘉**: 纭瀹堟姢鍔熻兘姝ｅ父宸ヤ綔

### 馃煝 浣庨闄╁彉鏇达紙鏀拺鍔熻兘锛?
**褰卞搷**: 浠呭姛鑳芥湰韬彈褰卞搷

**娴佺▼**:

1. **鎿嶄綔**: 鐩存帴鏇存柊骞舵祴璇?2. **璁板綍**: 鍦ㄥ彉鏇存棩蹇椾腑璁板綍

## 馃攳 瀹堟姢鑷绯荤粺

### Actionlint 闆嗘垚

- **浣嶇疆**: 姣忎釜宸ヤ綔娴佺殑绗竴姝?- **宸ュ叿**: `raven-actions/actionlint@v2`
- **澶辫触绛栫暐**: 绔嬪嵆澶辫触锛岄樆鏂墽琛?
### Needs 渚濊禆鏍￠獙

- **鑴氭湰**: `scripts/ci/workflow-guardian.mjs`
- **鍔熻兘**: 妫€鏌?needs 寮曠敤瀹屾暣鎬с€佸惊鐜緷璧?- **澶辫触绛栫暐**: 绔嬪嵆澶辫触锛岄槻姝㈡閿?
### 鍒嗘敮淇濇姢鍚屾妫€鏌?
- **鑴氭湰**: `scripts/ci/branch-protection-guardian.mjs`
- **鍔熻兘**: 姣斿鍒嗘敮淇濇姢涓庡叧閿?jobs
- **澶辫触绛栫暐**: 璀﹀憡妯″紡锛岃褰曚絾涓嶉樆鏂?
## 馃搳 瀹归敊鏈哄埗鐭╅樀

| 鍔熻兘绫诲瀷 | API 澶辫触澶勭悊 | 鏉冮檺涓嶈冻澶勭悊 | 缃戠粶瓒呮椂澶勭悊 |
| -------- | ------------ | ------------ | ------------ |
| 纭棬绂?  | 鉂?鏋勫缓澶辫触  | 鉂?鏋勫缓澶辫触  | 馃攧 閲嶈瘯 3 娆?|
| 杞棬绂?  | 鈿狅笍 闄嶇骇缁х画  | 鈿狅笍 璁板綍璀﹀憡  | 鈿狅笍 璺宠繃璇勮  |
| 瀹堟姢妫€鏌?| 鈿狅笍 璀﹀憡妯″紡  | 鈿狅笍 璺宠繃妫€鏌? | 鈿狅笍 璁板綍鏃ュ織  |

## 馃洜锔?甯哥敤缁存姢鍛戒护

### 妫€鏌ュ綋鍓嶅垎鏀繚鎶ょ姸鎬?
```powershell
gh api repos/:owner/:repo/branches/main/protection | jq '.required_status_checks.contexts'
```

### 楠岃瘉宸ヤ綔娴佽娉?
```powershell
actionlint .github/workflows/*.yml
```

### 杩愯鏈湴瀹堟姢妫€鏌?
```powershell
node scripts/ci/workflow-guardian.mjs
node scripts/ci/branch-protection-guardian.mjs
```

### 鏇存柊鍒嗘敮淇濇姢瑙勫垯锛堢ず渚嬶級

```powershell
# 娣诲姞鏂扮殑蹇呴渶妫€鏌?gh api repos/:owner/:repo/branches/main/protection \
  --method PATCH \
  --field required_status_checks[contexts][]="鏂癹ob鍚嶇О"

# 绉婚櫎搴熷純妫€鏌?gh api repos/:owner/:repo/branches/main/protection \
  --method PATCH \
  --field required_status_checks[contexts]-="搴熷純job鍚嶇О"
```

## 馃殌 鏈€浣冲疄璺?
### Job 鍛藉悕瑙勮寖

1. **鎻忚堪鎬?*: 鍚嶇О搴旀竻妤氳〃杈惧姛鑳?(`unit-tests-core` 鉁?vs `tests` 鉂?
2. **绋冲畾鎬?*: 鏍稿績 job 鍚嶇О涓€缁忕‘瀹氬氨涓嶈交鏄撳彉鏇?3. **灞傛鎬?*: 浣跨敤杩炲瓧绗﹀垎闅旈€昏緫灞傛 (`electron-security-gate`)
4. **绠€娲佹€?*: 閬垮厤杩囬暱鍚嶇О锛屾帶鍒跺湪 20 瀛楃鍐?
### 鍙樻洿绠＄悊

1. **娓愯繘寮?*: 鍏堟坊鍔犳柊 job锛岀‘璁ょǔ瀹氬悗鍐嶇Щ闄ゆ棫 job
2. **鏂囨。椹卞姩**: 鎵€鏈夊悕绉板彉鏇撮兘瑕佹洿鏂扮淮鎶ゆ枃妗?3. **閫氱煡鏈哄埗**: 楂橀闄╁彉鏇磋鎻愬墠閫氱煡鍥㈤槦
4. **鍥炴粴棰勬**: 鍑嗗蹇€熷洖婊氭柟妗?
### 鐩戞帶鍛婅

1. **鍒嗘敮淇濇姢妫€鏌?*: 瀹氭湡杩愯瀹堟姢鑴氭湰锛屽彂鐜颁笉涓€鑷村強鏃朵慨澶?2. **澶辫触鍒嗘瀽**: 鐩戞帶 CI 澶辫触鐜囷紝璇嗗埆绯荤粺鎬ч棶棰?3. **鎬ц兘鐩戞帶**: 鍏虫敞 job 鎵ц鏃堕棿锛屼紭鍖栫閬撴晥鐜?
## 馃摓 鏁呴殰澶勭悊

### 鍒嗘敮淇濇姢澶辨晥

**鐥囩姸**: 鍙互鍚堝苟鏈€氳繃妫€鏌ョ殑 PR  
**澶勭悊**: 绔嬪嵆妫€鏌ュ苟淇鍒嗘敮淇濇姢瑙勫垯锛屽彲鑳介渶瑕佷复鏃堕攣瀹氬悎骞?
### 宸ヤ綔娴佷緷璧栨閿?
**鐥囩姸**: Job 鏃犻檺绛夊緟锛屽伐浣滄祦鍗′綇  
**澶勭悊**: 杩愯 `workflow-guardian.mjs` 妫€鏌ュ惊鐜緷璧栵紝淇 needs 鍏崇郴

### 杞棬绂侀樆鏂悎骞?
**鐥囩姸**: 杞棬绂?job 澶辫触瀵艰嚧 PR 鏃犳硶鍚堝苟  
**澶勭悊**: 妫€鏌?job 鐨?`conclusion` 鏄惁涓?`neutral`锛岀‘淇濆閿欐満鍒剁敓鏁?
---

**馃摙 閲嶈鎻愰啋**: 鏈枃妗ｇ殑鍑嗙‘鎬х洿鎺ュ奖鍝?CI/CD 绠￠亾绋冲畾鎬с€備换浣曠浉鍏冲彉鏇撮兘瑕佸悓姝ユ洿鏂版鏂囨。銆?

## 新增：文档守卫（PR 轻门禁）

为避免 Linux 命令回归，建议将 `docs-shell-pr-gate` 纳入分支保护（Required status checks）— 该 Job 仅在 Pull Request 触发：

```powershell
# 添加 docs-shell-pr-gate 到必需检查（示例）
gh api repos/:owner/:repo/branches/main/protection \
  --method PATCH \
  --field required_status_checks[contexts][]=docs-shell-pr-gate
```

注意：可通过标签临时豁免（windows-docs-waive / windows-guard-waive / size-waive），用于大规模文档迁移期间。


# 一次性添加多个必需检查（推荐）

```powershell
# 合并添加多个 Required checks（不会覆盖旧配置）
$contexts = @('Validate Workflows & Guards / Enforce UTF-8 + LF for workflows','Validate Workflows & Guards / Docs shell PR light gate') -join ','
GH_TOKEN=$env:ADMIN_TOKEN node scripts/ci/update-branch-protection.mjs
# 环境变量：
#   ADMIN_TOKEN: 拥有仓库保护规则写权限的令牌
#   BRANCHES:   main 或 main,develop
#   REQUIRED_CONTEXTS: $contexts
```
