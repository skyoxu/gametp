# Release Scripts - 鍙戝竷鑴氭湰闆嗗悎

鏈洰褰曞寘鍚畬鏁寸殑娓愯繘鍙戝竷鍜岃嚜鍔ㄥ洖婊氳剼鏈紝鍩轰簬 ADR-0008 瀹炵幇銆?
## 馃搵 鑴氭湰姒傝

| 鑴氭湰                           | 鐢ㄩ€?                    | 杈撳叆                 | 杈撳嚭            |
| ------------------------------ | ------------------------ | -------------------- | --------------- |
| `patch-staging-percentage.mjs` | 淇敼鍒嗛樁娈靛彂甯冪櫨鍒嗘瘮     | feed鏂囦欢, 鐧惧垎姣?    | JSON缁撴灉        |
| `auto-rollback.mjs`            | 鍩轰簬Sentry鐨勫仴搴锋鏌ュ喅绛?| 鐜鍙橀噺             | JSON缁撴灉+閫€鍑虹爜 |
| `execute-rollback.mjs`         | 鎵ц瀹屾暣鍥炴粴娴佺▼         | feed鏂囦欢, 鐗堟湰绛?    | JSON缁撴灉        |
| `rollback-feed.mjs`            | 灏唂eed鍥炴粴鍒版寚瀹氱増鏈?    | feed鏂囦欢, 娓呭崟, 鐗堟湰 | JSON缁撴灉        |
| `manage-manifest.mjs`          | 鐗堟湰娓呭崟绠＄悊宸ュ叿         | 鍛戒护鍜屽弬鏁?          | JSON缁撴灉        |

## 馃殌 浣跨敤鏂瑰紡

### 閫氳繃 NPM Scripts锛堟帹鑽愶級

```powershell
$ErrorActionPreference = 'Stop'
$VERSION = '1.2.3'
$PREV_VERSION = '1.1.0'

npm run release:stage:5
Start-Sleep -Seconds 600
if (-not (npm run release:health-check)) {
  npm run release:rollback:to-version -- dist/latest.yml artifacts/manifest.json $PREV_VERSION
  exit 1
}
npm run release:stage:25
```


### 鐩存帴璋冪敤鑴氭湰

```powershell
# 分阶段发布
node scripts/release/patch-staging-percentage.mjs dist/latest.yml 25

# 稳健性检测
$env:SENTRY_AUTH_TOKEN = 'xxx'
$env:APP_VERSION = '1.2.3'
try {
  node scripts/release/auto-rollback.mjs
}
finally {
  Remove-Item Env:SENTRY_AUTH_TOKEN -ErrorAction SilentlyContinue
  Remove-Item Env:APP_VERSION -ErrorAction SilentlyContinue
}

# 完整回滚
node scripts/release/execute-rollback.mjs --feed=dist/latest.yml --previous-version=1.1.0 --manifest=artifacts/manifest.json --reason 'Critical issue detected'

# 版本回滚
node scripts/release/rollback-feed.mjs dist/latest.yml artifacts/manifest.json 1.1.0

# 版本管理
node scripts/release/manage-manifest.mjs add --version=1.2.3 --path=dist/app.exe
```

## 馃搳 鑴氭湰璇︾粏璇存槑

### 1. patch-staging-percentage.mjs

淇敼 electron-updater feed 鏂囦欢鐨?`stagingPercentage` 瀛楁銆?
```javascript
// 鐢ㄦ硶
patchStagingPercentage(feedFile, percentage);

// 绀轰緥
const result = patchStagingPercentage('dist/latest.yml', 25);
// => { ok: true, feedFile: 'dist/latest.yml', stagingPercentage: 25, timestamp: '...' }
```

**鐗规€?*锛?
- 鉁?鏀寔鎵€鏈?electron-updater feed 鏍煎紡
- 鉁?鑷姩鍒涘缓鐩綍鍜屾枃浠?- 鉁?鐧惧垎姣旇寖鍥撮獙璇?(0-100)
- 鉁?鍘熷瓙鎿嶄綔锛屽け璐ユ椂涓嶄細鎹熷潖鏂囦欢

### 2. auto-rollback.mjs

鍩轰簬 Sentry Release Health 杩涜鍋ュ悍搴︽鏌ュ拰鍥炴粴鍐崇瓥銆?
```javascript
// 鐢ㄦ硶
checkReleaseHealth(version, thresholdUsers, thresholdSessions)

// 鐜鍙橀噺
SENTRY_AUTH_TOKEN=sntrys_xxx
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
APP_VERSION=1.2.3
THRESHOLD_CF_USERS=0.995
THRESHOLD_CF_SESSIONS=0.995
```

**閫€鍑虹爜**锛?
- `0` - 鍋ュ悍搴﹂€氳繃锛屽彲缁х画鍙戝竷
- `42` - 鍋ュ悍搴︿笉杈炬爣锛屽缓璁洖婊?- `1` - API 閿欒鎴栧叾浠栧け璐?- `2` - 鍙傛暟閰嶇疆閿欒

**鍋ュ悍鎸囨爣**锛?
- **Crash-Free Users**: 鏈粡鍘嗗穿婧冪殑鐢ㄦ埛鐧惧垎姣?- **Crash-Free Sessions**: 鏈粡鍘嗗穿婧冪殑浼氳瘽鐧惧垎姣?
### 3. execute-rollback.mjs

鎵ц瀹屾暣鐨勫洖婊氭搷浣滐紝鍖呮嫭绱ф€ュ仠姝㈠拰鐗堟湰鍥為€€銆?
```javascript
// 鍔熻兘
executeRollback({
  feedFile, // feed 鏂囦欢璺緞
  previousVersion, // 鍥炴粴鐩爣鐗堟湰锛堝彲閫夛級
  manifestFile, // 鐗堟湰娓呭崟璺緞锛堢増鏈洖閫€鏃堕渶瑕侊級
  reason, // 鍥炴粴鍘熷洜
  notify, // 鏄惁鍙戦€侀€氱煡
});
```

**涓ら樁娈靛洖婊?*锛?
1. **绱ф€ュ仠姝?*: 璁剧疆 `stagingPercentage=0` 绔嬪嵆鍋滄鏂扮増鏈垎鍙?2. **鐗堟湰鍥為€€**: 灏?feed 鍐呭鍥炴粴鍒颁笂涓€绋冲畾鐗堟湰锛堝彲閫夛級

### 4. rollback-feed.mjs

灏?electron-updater feed 鏂囦欢鍥炴粴鍒版寚瀹氱増鏈€?
```javascript
// 鐢ㄦ硶
rollbackFeed(feedFile, manifestFile, targetVersion);

// 绀轰緥
const result = rollbackFeed(
  'dist/latest.yml',
  'artifacts/manifest.json',
  '1.1.0'
);
```

**鎵ц鍐呭**锛?
- 鉁?浠庣増鏈竻鍗曡鍙栫洰鏍囩増鏈畬鏁翠俊鎭?- 鉁?鏇存柊 feed 鏂囦欢鐨?version銆乸ath銆乻ha512 绛夊瓧娈?- 鉁?璁剧疆 `stagingPercentage=0` 绔嬪嵆鐢熸晥
- 鉁?楠岃瘉鐗堟湰瀛樺湪鍜屾暟鎹畬鏁存€?
### 5. manage-manifest.mjs

鐗堟湰娓呭崟绠＄悊宸ュ叿锛屾敮鎸佹坊鍔犮€佸垪鍑恒€侀獙璇併€佹竻鐞嗙増鏈€?
```javascript
// 鍛戒护
add      // 娣诲姞鏂扮増鏈?list     // 鍒楀嚭鎵€鏈夌増鏈?validate // 楠岃瘉娓呭崟鏍煎紡
cleanup  // 娓呯悊杩囨湡鐗堟湰

// 娓呭崟鏍煎紡
{
  "1.2.3": {
    "path": "app-1.2.3.exe",
    "sha512": "sha512-base64hash...",
    "size": 52428800,
    "releaseDate": "2025-08-29T10:00:00.000Z",
    "files": [...]
  }
}
```

## 馃敡 鐜閰嶇疆

### 蹇呴渶鐜鍙橀噺

```powershell
# Sentry 环境变量（健康检查用）
$env:SENTRY_AUTH_TOKEN = 'sntrys_xxx'      # Sentry API 认证令牌
$env:SENTRY_ORG = 'your-organization'      # Sentry 组织名称
$env:SENTRY_PROJECT = 'your-project'       # Sentry 项目名称
$env:APP_VERSION = '1.2.3'                 # 当前应用版本

# 健康度阈值（可按需调整）
$env:THRESHOLD_CF_USERS = '0.995'          # Crash-Free Users 阈值，默认 99.5%
$env:THRESHOLD_CF_SESSIONS = '0.995'       # Crash-Free Sessions 阈值，默认 99.5%

# 回滚通知配置（可选）
$env:WEBHOOK_URL = 'https://hooks.slack.com/xxx'  # 通知 Webhook URL
$env:ROLLBACK_LOG_DIR = 'logs/rollback'           # 回滚日志目录
$env:SENTRY_API_TIMEOUT = '10000'                # API 请求超时 (ms)
```

### 鏂囦欢缁撴瀯瑕佹眰

```
project/
鈹溾攢鈹€ dist/
鈹?  鈹溾攢鈹€ latest.yml          # Windows feed 鏂囦欢
鈹溾攢鈹€ artifacts/
鈹?  鈹斺攢鈹€ manifest.json       # 鐗堟湰娓呭崟鏂囦欢
鈹溾攢鈹€ logs/
鈹?  鈹斺攢鈹€ rollback/          # 鍥炴粴鎿嶄綔鏃ュ織
鈹斺攢鈹€ scripts/release/       # 鏈洰褰?```

## 馃搳 闆嗘垚绀轰緥

### 1. Shell 鑴氭湰闆嗘垚

```powershell
$ErrorActionPreference = 'Stop'

$version = '1.2.3'
$previousVersion = '1.1.0'

Write-Host "🚀 开始灰度发布 $version"

# 阶段 1: 5% 发布
Write-Host "📊 阶段 1: 5% 发布"
npm run release:stage:5

Write-Host "⏱️ 等待 10 分钟收集健康数据..."
Start-Sleep -Seconds 600

try {
  npm run release:health-check
}
catch {
  Write-Warning "❌ 5% 阶段健康检查失败，执行回滚"
  npm run release:rollback:to-version -- dist/latest.yml artifacts/manifest.json $previousVersion
  throw
}

Write-Host "✅ 5% 阶段健康通过，继续下一阶段"

# 阶段 2: 25% 发布
npm run release:stage:25
# TODO: 后续阶段按发布策略继续扩容
```

### 2. Node.js 绋嬪簭闆嗘垚

```javascript
import { patchStagingPercentage } from './scripts/release/patch-staging-percentage.mjs';
import { checkReleaseHealth } from './scripts/release/auto-rollback.mjs';
import { executeRollback } from './scripts/release/execute-rollback.mjs';

async function progressiveRelease(version, stages = [5, 25, 50, 100]) {
  for (const stage of stages) {
    console.log(`馃幆 鍙戝竷闃舵: ${stage}%`);

    // 璁剧疆鍒嗛樁娈电櫨鍒嗘瘮
    const stageResult = patchStagingPercentage('dist/latest.yml', stage);
    console.log('鍒嗛樁娈佃缃?', stageResult);

    // 绛夊緟鏁版嵁鏀堕泦
    await new Promise(resolve => setTimeout(resolve, 10 * 60 * 1000)); // 10鍒嗛挓

    // 鍋ュ悍妫€鏌?    try {
      const healthResult = await checkReleaseHealth(version, 0.995, 0.995);
      if (!healthResult.pass) {
        console.log('鉂?鍋ュ悍妫€鏌ュけ璐ワ紝鎵ц鑷姩鍥炴粴');
        await executeRollback({
          feedFile: 'dist/latest.yml',
          previousVersion: 'previous-stable-version',
          manifestFile: 'artifacts/manifest.json',
          reason: `Health check failed at ${stage}% stage`,
          notify: true,
        });
        throw new Error('Release failed health check');
      }
      console.log('鉁?鍋ュ悍妫€鏌ラ€氳繃');
    } catch (error) {
      console.error('鍋ュ悍妫€鏌ユ垨鍥炴粴澶辫触:', error);
      break;
    }
  }

  console.log('馃帀 娓愯繘鍙戝竷瀹屾垚');
}
```

### 3. CI/CD 闆嗘垚锛圙itHub Actions锛?
鍙傝 `.github/workflows/` 鐩綍涓殑瀹屾暣宸ヤ綔娴佺ず渚嬨€?
## 馃攳 璋冭瘯鍜屾棩蹇?
### 璋冭瘯妯″紡

```powershell
# 启用详细日志
$env:DEBUG = 'release:*'
npm run release:stage:25
Remove-Item Env:DEBUG -ErrorAction SilentlyContinue

# 模拟执行（不会实际改动文件）
$env:DRY_RUN = 'true'
npm run release:health-check
Remove-Item Env:DRY_RUN -ErrorAction SilentlyContinue
```

### 鏃ュ織鏂囦欢浣嶇疆

- **鍥炴粴鏃ュ織**: `logs/rollback/rollback-YYYY-MM-DD.json`
- **鍋ュ悍妫€鏌?*: 杈撳嚭鍒?stdout/stderr
- **鐗堟湰娓呭崟**: `artifacts/manifest.json`

### 鏃ュ織鏍煎紡

```json
{
  "action": "rollback",
  "feedFile": "dist/latest.yml",
  "previousVersion": "1.1.0",
  "reason": "Health check failed",
  "success": true,
  "steps": [...],
  "timestamp": "2025-08-29T17:45:00.000Z"
}
```

## 鈿狅笍 鏁呴殰鎺掗櫎

### 甯歌闂

#### 1. Sentry API 璁よ瘉澶辫触

```text
# 閿欒淇℃伅
鉂?Request failed: Request failed with status 401

# 瑙ｅ喅鏂规硶
# 1. 妫€鏌?SENTRY_AUTH_TOKEN 鏄惁姝ｇ‘
# 2. 纭 token 鍏锋湁 project:read 鏉冮檺
# 3. 楠岃瘉 SENTRY_ORG 鍜?SENTRY_PROJECT 鍚嶇О
```

#### 2. 鐗堟湰娓呭崟鏂囦欢闂

```text
# 閿欒淇℃伅
鉂?Version 1.2.3 not found in manifest

# 瑙ｅ喅鏂规硶
# 1. 浣跨敤 manage-manifest.mjs add 娣诲姞鐗堟湰
# 2. 妫€鏌ョ増鏈竻鍗曟枃浠舵牸寮忔槸鍚︽纭?# 3. 纭鐗堟湰鍙锋牸寮忕鍚堣涔夊寲鐗堟湰瑙勮寖
```

#### 3. Feed 鏂囦欢鏍煎紡閿欒

```text
# 閿欒淇℃伅
鉂?Failed to parse YAML response

# 瑙ｅ喅鏂规硶
# 1. 妫€鏌?YAML 鏂囦欢璇硶鏄惁姝ｇ‘
# 2. 纭鏂囦欢璺緞瀛樺湪涓斿彲璇诲啓
# 3. 楠岃瘉 electron-updater feed 鏍煎紡
```

#### 4. 鍋ュ悍鏁版嵁涓嶅彲鐢?
```text
# 閿欒淇℃伅
鉂?Health metrics not available for release

# 瑙ｅ喅鏂规硶
# 1. 绛夊緟鏇撮暱鏃堕棿璁?Sentry 鏀堕泦鏁版嵁锛?-15鍒嗛挓锛?# 2. 纭 Sentry Release 宸叉纭垱寤?# 3. 妫€鏌ュ簲鐢ㄦ槸鍚︽纭泦鎴?Sentry SDK
```

### 鑴氭湰娴嬭瘯

```powershell
# 测试脚本功能（使用示例数据）
npm test                    # 运行单元测试
npm run test:integration    # 集成测试
npm run test:e2e           # 端到端测试

# 手动验证
node scripts/release/patch-staging-percentage.mjs --help
node scripts/release/manage-manifest.mjs validate
```

## 馃摎 鍙傝€冭祫鏂?
- [ADR-0008: 娓愯繘鍙戝竷鍜岃嚜鍔ㄥ洖婊氱瓥鐣(../../docs/ADR-0008-娓愯繘鍙戝竷鍜岃嚜鍔ㄥ洖婊氬疄鐜版寚鍗?md)
- [electron-updater 鏂囨。](https://www.electron.build/auto-update)
- [Sentry Release Health API](https://docs.sentry.io/api/releases/)
- [璇箟鍖栫増鏈鑼僝(https://semver.org/lang/zh-CN/)

## 馃敀 瀹夊叏娉ㄦ剰浜嬮」

- **API 瀵嗛挜瀹夊叏**: 浣跨敤鐜鍙橀噺瀛樺偍锛屽垏鍕跨‖缂栫爜
- **鏉冮檺鏈€灏忓寲**: Sentry token 浠呮巿浜堝繀瑕佺殑璇诲彇鏉冮檺
- **瀹¤鏃ュ織**: 鎵€鏈夊洖婊氭搷浣滈兘鏈夎缁嗚褰?- **璁块棶鎺у埗**: 鐢熶骇鐜鑴氭湰鎵ц闇€瑕侀€傚綋鐨勬潈闄愭帶鍒?

