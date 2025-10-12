# GitHub Actions 宸ヤ綔娴佽鏄?

鏈洰褰曞寘鍚熀浜?ADR-0008 瀹炵幇鐨勫畬鏁存笎杩涘彂甯冨拰鑷姩鍥炴粴 GitHub Actions 宸ヤ綔娴併€?

## 馃搵 宸ヤ綔娴佹瑙?

| 宸ヤ綔娴?               | 鏂囦欢                           | 瑙﹀彂鏂瑰紡       | 鐢ㄩ€?                                       |
| ----------------------- | -------------------------------- | ------------------ | -------------------------------------------- |
| **Release Preparation** | `release-prepare.yml`            | 鎵嬪姩瑙﹀彂       | 鍙戝竷鍑嗗锛氱増鏈鐞嗐€乫eed 鏂囦欢鍒涘缓 |
| **Release Ramp**        | `release-ramp.yml`               | 鎵嬪姩瑙﹀彂       | 娓愯繘鍙戝竷锛氬垎闃舵鍙戝竷鍜屽仴搴锋鏌?  |
| **Release Monitor**     | `release-monitor.yml`            | 瀹氭椂/鎵嬪姩      | 鎸佺画鐩戞帶锛氬仴搴峰害鐩戞帶鍜屽紓甯告娴? |
| **Emergency Rollback**  | `release-emergency-rollback.yml` | 鎵嬪姩/鑷姩瑙﹀彂 | 绱ф€ュ洖婊氾細蹇€熷洖婊氬埌绋冲畾鐗堟湰     |

## 馃殌 鏍囧噯鍙戝竷娴佺▼

### 1. 鍙戝竷鍑嗗闃舵

```bash
# GitHub UI 鎿嶄綔:
# Actions 鈫?Release Preparation 鈫?Run workflow
# 鍙傛暟濉啓:
#   version: 1.2.3
#   artifact_path: dist/app-1.2.3.exe
#   create_feeds: 鉁?true
```

**鎵ц鍐呭**:

- 鉁?楠岃瘉鐗堟湰鍙锋牸寮?- 鉁?灏嗙増鏈坊鍔犲埌 `artifacts/manifest.json`
- 鉁?鍒涘缓 Windows feed 鏂囦欢锛坄dist/latest.yml`锛?- 鉁?楠岃瘉鐗堟湰娓呭崟瀹屾暣鎬?- 鉁?鎻愪氦骞舵帹閫佸彉鏇?

### 2. 娓愯繘鍙戝竷闃舵

鎸夐『搴忔墽琛屽悇闃舵锛屾瘡涓樁娈甸兘鍖呭惈鍋ュ悍妫€鏌ワ細

#### 闃舵 1: 5% 鍙戝竷

```bash
# Actions 鈫?Release Ramp 鈫?Run workflow
# 鍙傛暟: stage=5, feed_file=dist/latest.yml, skip_health_check=false
```

#### 闃舵 2: 25% 鍙戝竷

```bash
# 绛夊緟 10-15 鍒嗛挓瑙傚療 5% 闃舵鎸囨爣
# Actions 鈫?Release Ramp 鈫?Run workflow
# 鍙傛暟: stage=25
```

#### 闃舵 3: 50% 鍙戝竷

```bash
# 绛夊緟 10-15 鍒嗛挓瑙傚療 25% 闃舵鎸囨爣
# Actions 鈫?Release Ramp 鈫?Run workflow
# 鍙傛暟: stage=50
```

#### 闃舵 4: 100% 鍏ㄩ噺鍙戝竷

```bash
# 绛夊緟 10-15 鍒嗛挓瑙傚療 50% 闃舵鎸囨爣
# Actions 鈫?Release Ramp 鈫?Run workflow
# 鍙傛暟: stage=100
```

### 3. 鎸佺画鐩戞帶

鐩戞帶宸ヤ綔娴佽嚜鍔ㄨ繍琛岋紙姣?5鍒嗛挓锛夛細

- 鉁?妫€鏌ュ綋鍓嶅彂甯冨仴搴峰害
- 鉁?寮傚父鏃惰嚜鍔ㄨЕ鍙戠揣鎬ュ洖婊?- 鉁?鏇存柊鐩戞帶浠〃鐩?- 鉁?鍙戦€佸憡璀﹂€氱煡

## 鈿?绱ф€ユ儏鍐靛鐞?

### 鎵嬪姩绱ф€ュ洖婊氾紙Windows-only锛?

````bash
# Actions 鈫?Emergency Rollback 鈫?Run workflow
# 鍙傛暟濉啓:
#   reason: "Critical security vulnerability detected"
#   target_version: 1.1.0 (涓婁竴绋冲畾鐗堟湰)
#   feed_files: all锛圵indows-only 浠撳簱涓瓑浠蜂簬鍥炴粴 dist/latest.yml锛?```

### 鑷姩鍥炴粴瑙﹀彂鏉′欢

- Crash-Free Users < 99.5%
- Crash-Free Sessions < 99.5%
- Sentry Release Health API 寮傚父
- 鐩戞帶宸ヤ綔娴佹娴嬪埌鎸佺画鍋ュ悍闂

## 馃敡 鐜閰嶇疆

### Repository Variables (Settings 鈫?Environments 鈫?Variables)

```bash
SENTRY_ORG=your-organization        # Sentry 缁勭粐鍚?SENTRY_PROJECT=vitegame            # Sentry 椤圭洰鍚?APP_VERSION=1.2.3                  # 褰撳墠鍙戝竷鐗堟湰
PREV_GA_VERSION=1.1.0             # 涓婁竴绋冲畾鐗堟湰锛堝洖婊氱洰鏍囷級
THRESHOLD_CF_USERS=0.995          # Crash-Free Users 闃堝€?THRESHOLD_CF_SESSIONS=0.995       # Crash-Free Sessions 闃堝€?```

### Repository Secrets (Settings 鈫?Secrets and variables 鈫?Actions)

```bash
SENTRY_AUTH_TOKEN=sntrys_xxx      # Sentry API 璁よ瘉浠ょ墝
WEBHOOK_URL=https://hooks.slack.com/xxx  # 鍙€夛細閫氱煡 Webhook
````

### 鏉冮檺閰嶇疆

宸ヤ綔娴侀渶瑕佷互涓嬫潈闄愶細

- `contents: write` - 鎻愪氦 feed 鏂囦欢鍙樻洿
- `actions: write` - 瑙﹀彂鍏朵粬宸ヤ綔娴侊紙鐩戞帶 鈫?绱ф€ュ洖婊氾級

## 馃搳 鐩戞帶鍜屽憡璀?

### 宸ヤ綔娴佺姸鎬佺洃鎺?

- **鎴愬姛**: 鉁?缁胯壊寰界珷锛屽彂甯冪户缁笅涓€闃舵
- **鍋ュ悍妫€鏌ュけ璐?\*: 鉂?绾㈣壊寰界珷锛岃嚜鍔ㄨЕ鍙戝洖婊?- **閮ㄥ垎澶辫触\*\*: 鈿狅笍 榛勮壊寰界珷锛岄渶瑕佷汉宸ュ共棰?

### 閫氱煡娓犻亾

閰嶇疆 `WEBHOOK_URL` 鍚庯紝浠ヤ笅浜嬩欢浼氬彂閫侀€氱煡锛?

- 馃幆 闃舵鍙戝竷瀹屾垚
- 馃毃 鍋ュ悍妫€鏌ュけ璐?- 馃攧 鑷姩鍥炴粴鎵ц
- 鈿狅笍 鐩戞帶寮傚父

### 鐩戞帶鏁版嵁

鐩戞帶鐘舵€佷繚瀛樺湪 `.github/monitoring/latest-status.json`:

```json
{
  "timestamp": "2025-08-29T17:45:00.000Z",
  "version": "1.2.3",
  "staging_percentage": 25,
  "health_status": "healthy",
  "health_data": {...},
  "next_check": "2025-08-29T18:00:00.000Z"
}
```

## 馃幆 鏈€浣冲疄璺?

### 鍙戝竷璁″垝

1. **鍑嗗闃舵**: 宸ヤ綔鏃ヤ笂鍗堝畬鎴愬彂甯冨噯澶?2. **5% 闃舵**: 涓婂崍鍙戝竷锛岃瀵?2-4 灏忔椂
2. **25% 闃舵**: 涓嬪崍鍙戝竷锛岃瀵熷埌娆℃棩涓婂崍
3. **50% 闃舵**: 娆℃棩涓婂崍鍙戝竷锛岃瀵?4-6 灏忔椂
4. **100% 闃舵**: 纭绋冲畾鍚庡叏閲忓彂甯?

### 鍋ュ悍鎸囨爣闃堝€?

- **淇濆畧绛栫暐**: 99.9% (0.999)
- **鏍囧噯绛栫暐**: 99.5% (0.995) 鉁?鎺ㄨ崘
- \*_婵€杩涚瓥鐣?_: 99.0% (0.990)

### 鍥炴粴鍐崇瓥

- **鑷姩鍥炴粴**: 鍋ュ悍搴︿綆浜庨槇鍊硷紝鏃犱汉宸ュ共棰?- **浜哄伐鍥炴粴**: 涓氬姟鎸囨爣寮傚父銆佺敤鎴峰弽棣堢瓑
- **鏆傚仠鍙戝竷**: 澶栭儴渚濊禆闂銆佽妭鍋囨棩绛?

## 馃攳 鏁呴殰鎺掗櫎

### 甯歌闂

#### 1. Sentry API 璁よ瘉澶辫触

```bash
# 閿欒: SENTRY_AUTH_TOKEN 鏃犳晥
# 瑙ｅ喅: 妫€鏌?token 鏉冮檺锛岄渶瑕?project:read 鍜?org:read
```

#### 2. 鍋ュ悍鏁版嵁涓嶅彲鐢?

````bash
# 閿欒: Health metrics not available
# 瑙ｅ喅: 绛夊緟鏇撮暱鏃堕棿璁?Sentry 鏀堕泦鏁版嵁锛堥€氬父 5-15 鍒嗛挓锛?```

#### 3. 宸ヤ綔娴佹潈闄愪笉瓒?
```bash
# 閿欒: Resource not accessible by integration
# 瑙ｅ喅: 妫€鏌?Repository Settings 鈫?Actions 鈫?General 鈫?Workflow permissions
````

#### 4. Feed 鏂囦欢鏍煎紡閿欒

```bash
# 閿欒: YAML parsing failed
# 瑙ｅ喅: 妫€鏌?feed 鏂囦欢鏍煎紡锛岀‘淇?YAML 璇硶姝ｇ‘
```

### 璋冭瘯妯″紡

鍚敤宸ヤ綔娴佽皟璇曡緭鍑猴細

```bash
# Repository Settings 鈫?Secrets 鈫?Actions
# 娣诲姞: ACTIONS_STEP_DEBUG = true
# 娣诲姞: ACTIONS_RUNNER_DEBUG = true
```

## 馃摎 鐩稿叧鏂囨。

- [ADR-0008: 娓愯繘鍙戝竷鍜岃嚜鍔ㄥ洖婊氱瓥鐣(../docs/ADR-0008-娓愯繘鍙戝竷鍜岃嚜鍔ㄥ洖婊氬疄鐜版寚鍗?md)
- [electron-updater Staged Rollout](https://www.electron.build/auto-update#staged-rollouts)
- [Sentry Release Health API](https://docs.sentry.io/api/releases/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 馃洝锔?瀹夊叏鑰冭檻

- API 瀵嗛挜浣跨敤 GitHub Secrets 瀛樺偍
- 宸ヤ綔娴佷娇鐢ㄦ渶灏忔潈闄愬師鍒?- 绱ф€ュ洖婊氬彲閰嶇疆闇€瑕佷汉宸ユ壒鍑嗭紙Environment Protection锛?- 鎵€鏈夋搷浣滈兘鏈夎缁嗙殑瀹¤鏃ュ織

## 馃搱 鎬ц兘浼樺寲

- 骞惰鎵ц澶氬钩鍙?feed 鏇存柊
- 缂撳瓨 Node.js 渚濊禆鍔犻€熸瀯寤?- 鏅鸿兘绛夊緟鏃堕棿锛氭牴鎹彂甯冮樁娈佃皟鏁寸洃鎺ч棿闅?- 鏉′欢鎵ц锛氶潪宸ヤ綔鏃堕棿璺宠繃鐩戞帶浠ヨ妭鐪佽绠楄祫婧?
