# Claude Code CLI 鑷姩鍖栨墽琛屾寚鍗?

> 鏈寚鍗楄鏄庡浣曚娇鐢?Claude Code CLI 鎵ц鏂囨。鐢熸垚銆佹祴璇曘€佹瀯寤恒€佺洃鎺х瓑鑷姩鍖栨祦绋?

---

## 馃搵 蹇€熷弬鑰?

### 鏍稿績鑷姩鍖栧懡浠?

```powershell
# 瀹屾暣璐ㄩ噺妫€鏌ラ摼
npm run guard:ci

# 鏂囨。鐢熸垚涓庢洿鏂?node scripts/update-changelog.mjs --add "鏂板姛鑳芥弿杩?

# 鏈湴寮€鍙戠幆澧冨惎鍔?npm run dev && npm run dev:electron
```

---

## 馃 Claude Code CLI 闆嗘垚鏂瑰紡

### 1. BMAD Slash Commands (浜や簰寮?

#### 鍙敤鐨凚MAD浠ｇ悊鍛戒护

````powershell
# 鏍稿績浠ｇ悊
/bmad-master          # 涓绘帶浠ｇ悊锛屼竾鑳戒换鍔℃墽琛屽櫒
/architect             # 杞欢鏋舵瀯甯堜唬鐞?/dev                   # 寮€鍙戝伐绋嬪笀浠ｇ悊
/qa                    # 璐ㄩ噺淇濊瘉浠ｇ悊

# 娓告垙寮€鍙戜笓鐢?/game-designer         # 娓告垙璁捐甯堜唬鐞嗭紙Phaser涓撶敤锛?/game-developer        # 娓告垙寮€鍙戣€呬唬鐞?/game-architect        # 娓告垙鏋舵瀯甯堜唬鐞嗭紙Unity涓撶敤锛?```

#### BMAD宸ヤ綔娴佺ず渚?
```powershell
# 1. 鍚姩鏋舵瀯甯堜唬鐞?/architect

# 2. 浣跨敤鍐呴儴鍛戒护
*help                  # 鏄剧ず鍙敤鍛戒护
*create-doc            # 鍒涘缓鏂囨。妯℃澘
*task                  # 鎵ц棰勫畾涔変换鍔?*execute-checklist     # 鎵ц妫€鏌ユ竻鍗?*exit                  # 閫€鍑轰唬鐞嗘ā寮?
# 3. 鍒涘缓鏋舵瀯鏂囨。
*create-doc architecture-tmpl.yaml
*execute-checklist architect-checklist.md
````

#### 娓告垙寮€鍙戝伐浣滄祦

```powershell
# 娓告垙璁捐甯堜唬鐞?/game-designer
*help
*create-doc game-design-tmpl.yaml
*task create-game-module

# 娓告垙寮€鍙戣€呬唬鐞?/game-developer
*task create-phaser-scene
*execute-checklist game-dev-checklist.md
```

### 2. NPM Scripts (鑴氭湰鍖?

#### 寮€鍙戠幆澧冭嚜鍔ㄥ寲

```powershell
# 鍚姩寮€鍙戠幆澧?npm run dev                    # Vite寮€鍙戞湇鍔″櫒
npm run dev:electron           # Electron搴旂敤

# 浠ｇ爜妫€鏌?npm run typecheck             # TypeScript绫诲瀷妫€鏌?npm run lint                  # ESLint浠ｇ爜瑙勮寖
npm run test:unit             # 鍗曞厓娴嬭瘯
npm run test:e2e              # E2E娴嬭瘯
```

#### 璐ㄩ噺闂ㄧ鑷姩鍖?

````powershell
# 瀹屾暣璐ㄩ噺妫€鏌ラ摼
npm run guard:ci

# 鍒嗛」璐ㄩ噺妫€鏌?npm run guard:electron         # Electron瀹夊叏妫€鏌?npm run guard:quality          # 瑕嗙洊鐜?Release Health
npm run guard:base             # Base鏂囨。娓呮磥妫€鏌?npm run guard:version          # 鐗堟湰鍚屾妫€鏌?```

#### 鏋勫缓涓庡彂甯冭嚜鍔ㄥ寲

```powershell
# 鏋勫缓
npm run build                  # 鐢熶骇鏋勫缓
npm run build:electron         # Electron搴旂敤鎵撳寘

# 瀹夊叏鎵弿
npm run security:scan          # Electron瀹夊叏鎵弿
npm run security:audit         # 渚濊禆瀹夊叏瀹¤
````

---

## 馃敡 鏈湴寮€鍙戠幆澧?Mock 鏈嶅姟

### 1. Sentry Mock 鏈嶅姟

#### 蹇€熷惎鍔?Sentry Mock

```powershell
# 鍚姩 Node.js Mock 鏈嶅姟
npm run sentry:mock

# 楠岃瘉 Mock 鏈嶅姟鐘舵€?npm run sentry:mock:test

# 鏌ョ湅 Mock 鏁版嵁
curl http://localhost:9000/api/0/projects/test/releases/latest/
```

#### Sentry Mock 閰嶇疆

鍒涘缓 `scripts/sentry-mock-server.mjs`锛?

```javascript
#!/usr/bin/env node

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 9000;

app.use(cors());
app.use(express.json());

// Mock Release Health API
app.get('/api/0/projects/:org/:project/releases/:version/', (req, res) => {
  res.json({
    version: req.params.version,
    healthData: {
      crashFreeSessionsRate: 99.8,
      crashFreeUsersRate: 99.7,
      adoptionRate: 85.2,
    },
    created: new Date().toISOString(),
  });
});

// Mock Error Tracking
app.post('/api/0/projects/:org/:project/events/', (req, res) => {
  console.log('馃搳 Sentry Event:', req.body.message || 'Unknown event');
  res.json({ id: 'mock-event-' + Date.now() });
});

app.listen(PORT, () => {
  console.log(`馃攳 Sentry Mock Server running on http://localhost:${PORT}`);
  console.log('馃搳 Available endpoints:');
  console.log('  - GET /api/0/projects/test/test/releases/latest/');
  console.log('  - POST /api/0/projects/test/test/events/');
});
```

#### 鐜鍙橀噺閰嶇疆

鍦ㄥ紑鍙戠幆澧?`.env.local` 涓細

```powershell
# Sentry Mock 閰嶇疆
SENTRY_DSN=http://mock@localhost:9000/1
SENTRY_ENVIRONMENT=development
SENTRY_MOCK_MODE=true

# 鏈湴Release Health Mock
RELEASE_HEALTH_MOCK=true
CRASH_FREE_SESSIONS_THRESHOLD=99.0
CRASH_FREE_USERS_THRESHOLD=98.5
```

#### Docker 鍙€夋柟妗?

濡傞渶瀹屾暣 Sentry 鐜锛?

```powershell
# 鍒涘缓 docker-compose.sentry.yml
version: '3.8'
services:
  redis:
    image: redis:alpine
  postgres:
    image: postgres:13
    environment:
      POSTGRES_HOST_AUTH_METHOD: trust
  sentry:
    image: getsentry/sentry:latest
    depends_on:
      - redis
      - postgres
    ports:
      - "9000:9000"
    environment:
      SENTRY_SECRET_KEY: 'mock-secret-key'
```

```powershell
# 鍚姩瀹屾暣 Sentry Mock
docker-compose -f docker-compose.sentry.yml up -d

# 鍋滄鏈嶅姟
docker-compose -f docker-compose.sentry.yml down
```

### 2. 鎬ц兘娴嬭瘯鐜

#### 鏈湴鎬ц兘娴嬭瘯濂椾欢

鎵╁睍鐜版湁 `scripts/benchmarks/` 鐩綍锛?
**鍚姩鏃堕棿娴嬭瘯**

```powershell
# 娴嬭瘯 Electron 鍚姩鏃堕棿
npm run perf:startup

# 瀹炵幇: scripts/benchmarks/startup-time.ts
export async function measureStartupTime() {
  const startTime = process.hrtime.bigint();

  // 鍚姩 Electron 搴旂敤
  const electronProcess = spawn('electron', ['.']);

  return new Promise((resolve) => {
    electronProcess.stdout.on('data', (data) => {
      if (data.includes('App Ready')) {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1_000_000; // ms
        resolve(duration);
      }
    });
  });
}
```

**鍐呭瓨浣跨敤鐩戞帶**

```powershell
# 鎸佺画鐩戞帶鍐呭瓨浣跨敤
npm run perf:memory

# 瀹炵幇: scripts/benchmarks/memory-usage.ts
export async function monitorMemoryUsage(durationMs = 60000) {
  const measurements = [];
  const startTime = Date.now();

  const interval = setInterval(() => {
    const usage = process.memoryUsage();
    measurements.push({
      timestamp: Date.now() - startTime,
      heapUsed: usage.heapUsed / 1024 / 1024, // MB
      heapTotal: usage.heapTotal / 1024 / 1024,
      external: usage.external / 1024 / 1024
    });
  }, 1000);

  setTimeout(() => {
    clearInterval(interval);
    analyzeMemoryTrend(measurements);
  }, durationMs);
}
```

**娓叉煋鎬ц兘娴嬭瘯**

```powershell
# 娴嬭瘯娓告垙娓叉煋甯х巼
npm run perf:rendering

# 瀹炵幇: scripts/benchmarks/rendering-fps.ts
export async function measureRenderingFPS(sceneCount = 5) {
  const fpsData = [];

  // 妯℃嫙涓嶅悓鍦烘櫙鐨勬覆鏌撴祴璇?  for (let i = 0; i < sceneCount; i++) {
    const fps = await measureSceneFPS(`test-scene-${i}`);
    fpsData.push({
      scene: `test-scene-${i}`,
      avgFPS: fps.average,
      minFPS: fps.minimum,
      maxFPS: fps.maximum
    });
  }

  return fpsData;
}
```

#### 鎬ц兘鍩哄噯闆嗘垚

灏嗘€ц兘娴嬭瘯闆嗘垚鍒拌川閲忛棬绂侊細

```powershell
# 鍦?scripts/quality_gates.mjs 涓坊鍔犳€ц兘妫€鏌?async function checkPerformanceGates() {
  console.log('鈿?妫€鏌ユ€ц兘鍩哄噯...');

  const startupTime = await measureStartupTime();
  const memoryUsage = await measurePeakMemoryUsage();
  const renderingFPS = await measureAverageRenderingFPS();

  const failed = [];

  if (startupTime > 3000) { // 3绉掗槇鍊?    failed.push(`鍚姩鏃堕棿 ${startupTime}ms > 3000ms`);
  }

  if (memoryUsage > 200) { // 200MB闃堝€?    failed.push(`鍐呭瓨浣跨敤 ${memoryUsage}MB > 200MB`);
  }

  if (renderingFPS < 55) { // 55 FPS闃堝€?    failed.push(`娓叉煋甯х巼 ${renderingFPS} FPS < 55 FPS`);
  }

  if (failed.length > 0) {
    throw new Error(`鎬ц兘鍩哄噯澶辫触:\n${failed.map(f => `  - ${f}`).join('\n')}`);
  }

  console.log('鉁?鎬ц兘鍩哄噯妫€鏌ラ€氳繃锛?);
  return { startupTime, memoryUsage, renderingFPS };
}
```

---

## 馃毆 CI闂ㄧ闃绘柇鏈哄埗

### 1. 璐ㄩ噺闂ㄧ闃堝€奸厤缃?

#### 鐜鍙橀噺閰嶇疆

```powershell
# 瑕嗙洊鐜囬槇鍊?COVERAGE_LINES_THRESHOLD=90
COVERAGE_BRANCHES_THRESHOLD=85
COVERAGE_FUNCTIONS_THRESHOLD=90
COVERAGE_STATEMENTS_THRESHOLD=90

# Release Health 闃堝€?CRASH_FREE_SESSIONS_THRESHOLD=99.5
CRASH_FREE_USERS_THRESHOLD=99.0
ADOPTION_RATE_THRESHOLD=80.0

# 鎬ц兘闃堝€?STARTUP_TIME_THRESHOLD=3000        # 姣
MEMORY_USAGE_THRESHOLD=200         # MB
RENDERING_FPS_THRESHOLD=55         # FPS
```

#### 闂ㄧ閰嶇疆鏂囦欢

鍒涘缓 `.quality-gates.config.json`锛?

```json
{
  "gates": {
    "coverage": {
      "lines": 90,
      "branches": 85,
      "functions": 90,
      "statements": 90,
      "enforceIncrease": false
    },
    "releaseHealth": {
      "crashFreeSessionsThreshold": 99.5,
      "crashFreeUsersThreshold": 99.0,
      "adoptionRateThreshold": 80.0
    },
    "performance": {
      "startupTimeMs": 3000,
      "memoryUsageMB": 200,
      "renderingFPS": 55
    },
    "security": {
      "allowHighVulnerabilities": 0,
      "allowMediumVulnerabilities": 2
    }
  },
  "notifications": {
    "onFailure": ["console", "file"],
    "reportPath": "logs/quality-gates/"
  }
}
```

### 2. 闂ㄧ澶辫触澶勭悊娴佺▼

#### 鑷姩淇寤鸿

```powershell
# 褰撻棬绂佸け璐ユ椂锛屾彁渚涜嚜鍔ㄤ慨澶嶅缓璁?npm run guard:diagnose

# 瀹炵幇: scripts/gate-diagnostics.mjs
function provideDiagnosticSuggestions(failures) {
  const suggestions = {
    'coverage-low': [
      '1. 杩愯 npm run test:coverage:open 鏌ョ湅璇︾粏鎶ュ憡',
      '2. 璇嗗埆鏈鐩栫殑鍏抽敭浠ｇ爜璺緞',
      '3. 娣诲姞鍗曞厓娴嬭瘯鎴朎2E娴嬭瘯',
      '4. 鑰冭檻绉婚櫎鏃犵敤鐨勬浠ｇ爜'
    ],
    'performance-slow': [
      '1. 杩愯 npm run perf:profile 鐢熸垚鎬ц兘鍒嗘瀽',
      '2. 妫€鏌ユ槸鍚︽湁鍐呭瓨娉勬紡',
      '3. 浼樺寲鍚姩鏃剁殑鍚屾鎿嶄綔',
      '4. 鑰冭檻寤惰繜鍔犺浇闈炲叧閿ā鍧?
    ],
    'security-vulnerabilities': [
      '1. 杩愯 npm audit fix 鑷姩淇',
      '2. 鏌ョ湅 npm audit 璇︾粏鎶ュ憡',
      '3. 璇勪及鏄惁鍙互鍗囩骇渚濊禆鐗堟湰',
      '4. 鑰冭檻瀵绘壘鏇夸唬渚濊禆搴?
    ]
  };

  return suggestions;
}
```

#### CI鐜闂ㄧ闃绘柇

GitHub Actions 闆嗘垚锛?

```yaml
# .github/workflows/quality-gates.yml
name: Quality Gates
on: [push, pull_request]

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run Quality Gates
        run: npm run guard:ci
        env:
          # 鍦–I鐜涓娇鐢ㄦ洿涓ユ牸鐨勯槇鍊?          COVERAGE_LINES_THRESHOLD: 92
          CRASH_FREE_SESSIONS_THRESHOLD: 99.7

      - name: Upload Quality Report
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: quality-gates-report
          path: logs/quality/

      - name: Comment PR with Results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const reportPath = 'logs/quality/quality-gates-latest.json';

            if (fs.existsSync(reportPath)) {
              const report = JSON.parse(fs.readFileSync(reportPath));
              
              const body = `
              ## 馃毆 璐ㄩ噺闂ㄧ鎶ュ憡
              
              **鎬绘鏌ラ」**: ${report.summary.totalChecks}
              **閫氳繃妫€鏌?*: ${report.summary.passedChecks}
              **澶辫触妫€鏌?*: ${report.summary.failedChecks}
              
              ${report.summary.failedChecks > 0 ? '鉂?**璐ㄩ噺闂ㄧ鏈€氳繃锛岃淇鍚庨噸鏂版彁浜?*' : '鉁?**璐ㄩ噺闂ㄧ妫€鏌ラ€氳繃**'}
              `;
              
              github.rest.issues.createComment({
                issue_number: context.issue.number,
                owner: context.repo.owner,
                repo: context.repo.repo,
                body: body
              });
            }
```

### 3. 鍙戝竷闃绘柇绛栫暐

#### 鍒嗘敮淇濇姢瑙勫垯

```powershell
# 閫氳繃鑴氭湰閰嶇疆GitHub鍒嗘敮淇濇姢
node scripts/setup-branch-protection.mjs

# 瀹炵幇: 瑕佹眰鎵€鏈夎川閲忛棬绂侀€氳繃鎵嶈兘鍚堝苟
const protectionRules = {
  required_status_checks: {
    strict: true,
    checks: [
      { context: "quality-gates" },
      { context: "security-scan" },
      { context: "performance-test" }
    ]
  },
  enforce_admins: false,
  required_pull_request_reviews: {
    required_approving_review_count: 1,
    dismiss_stale_reviews: true
  },
  restrictions: null
};
```

#### 鍙戝竷闂ㄧ妫€鏌?

```powershell
# 鍙戝竷鍓嶆渶缁堟鏌?npm run release:preflight

# 瀹炵幇: scripts/release-preflight.mjs
async function releasePreflightCheck() {
  console.log('馃殎 寮€濮嬪彂甯冮妫€...');

  // 1. 纭繚鍦ㄦ纭垎鏀?  await verifyBranch('main');

  // 2. 纭繚宸ヤ綔鍖烘竻娲?  await verifyCleanWorkingDirectory();

  // 3. 杩愯瀹屾暣璐ㄩ噺闂ㄧ
  await runQualityGates();

  // 4. 楠岃瘉鐗堟湰鍙峰悎瑙勬€?  await verifyVersionCompliance();

  // 5. 妫€鏌ュ彂甯冨仴搴锋寚鏍?  await verifyReleaseHealthMetrics();

  console.log('鉁?鍙戝竷棰勬閫氳繃锛屽彲浠ュ畨鍏ㄥ彂甯冿紒');
}
```

---

## 馃摎 鏂囨。鐢熸垚鑷姩鍖?

### 1. 鑷姩鍖栨枃妗ｇ敓鎴?

```powershell
# 鐢熸垚鏋舵瀯鏂囨。
/architect
*create-doc architecture-tmpl.yaml
*task update-architecture-docs

# 鐢熸垚API鏂囨。
npm run docs:generate

# 鏇存柊鍙樻洿鏃ュ織
node scripts/update-changelog.mjs --add "鏂板姛鑳芥弿杩? --ai 80
```

### 2. 鏂囨。鍚屾楠岃瘉

```powershell
# 妫€鏌ユ枃妗ｄ笌浠ｇ爜鍚屾鎬?npm run docs:verify

# 妫€鏌ase鏂囨。娓呮磥鎬?npm run guard:base
```

---

## 馃攳 鐩戞帶涓庡彲瑙傛祴鎬?

### 1. 鏈湴鐩戞帶鍚姩

```powershell
# 鍚姩Sentry Mock (寮€鍙戠幆澧?
npm run sentry:mock

# 楠岃瘉鍙娴嬫€ч厤缃?npm run test:observability

# 妫€鏌elease Health鏁版嵁
npm run ci:gate:sentry-up
```

### 2. 鎬ц兘鐩戞帶

```powershell
# 鍚姩鎬ц兘鐩戞帶
npm run perf:monitor

# 鐢熸垚鎬ц兘鎶ュ憡
npm run perf:report

# 浜嬩欢寰幆寤惰繜鐩戞帶
node scripts/benchmarks/event-loop-latency.ts
```

---

## 馃洜锔?鏁呴殰鎺掓煡

### 甯歌闂涓庤В鍐虫柟妗?

#### 1. 璐ㄩ噺闂ㄧ澶辫触

````powershell
# 璇婃柇璐ㄩ噺闂ㄧ闂
npm run guard:diagnose

# 鏌ョ湅璇︾粏鎶ュ憡
cat logs/quality/quality-gates-latest.json

# 閫愰」妫€鏌?npm run typecheck        # TypeScript閿欒
npm run lint            # 浠ｇ爜瑙勮寖
npm run test:coverage   # 瑕嗙洊鐜囦笉瓒?```

#### 2. Sentry杩炴帴闂

```powershell
# 妫€鏌entry閰嶇疆
npm run test:observability

# 鍚姩鏈湴Mock
npm run sentry:mock

# 楠岃瘉鐜鍙橀噺
echo $SENTRY_DSN
````

#### 3. 鎬ц兘娴嬭瘯寮傚父

```powershell
# 閲嶆柊鏍″噯鎬ц兘鍩哄噯
npm run perf:calibrate

# 妫€鏌ョ郴缁熻祫婧?npm run perf:system-check

# 鏌ョ湅鎬ц兘鍘嗗彶
cat logs/performance/benchmark-history.json
```

---

## 馃摉 鐩稿叧鏂囨。

- [璐＄尞鎸囧崡](./CONTRIBUTING.md) - 寮€鍙戞祦绋嬪拰瑙勮寖
- [鏋舵瀯鏂囨。](./architecture/base/) - 绯荤粺鏋舵瀯璁捐
- [ADR璁板綍](./adr/) - 鏋舵瀯鍐崇瓥璁板綍
- [鏂囨。绱㈠紩](./README.md) - 鍏ㄩ儴鏂囨。瀵艰埅

---

## 馃挕 鏈€浣冲疄璺?

### 寮€鍙戝伐浣滄祦寤鸿

```powershell
# 1. 姣忔棩寮€鍙戝惎鍔ㄥ簭鍒?npm run dev && npm run dev:electron &
npm run sentry:mock &
npm run perf:monitor &

# 2. 鎻愪氦鍓嶆鏌ュ簭鍒?npm run guard:ci
node scripts/update-changelog.mjs --add "浠婃棩寮€鍙戝唴瀹?

# 3. 鍙戝竷鍓嶆鏌ュ簭鍒?npm run release:preflight
npm run guard:ci --strict
```

### BMAD + 鑷姩鍖栨贩鍚堝伐浣滄祦

```powershell
# 浜や簰寮忔灦鏋勮璁?/architect
*create-doc architecture-update.yaml

# 鑴氭湰鍖栬川閲忔鏌?npm run guard:ci

# 浜や簰寮忔祴璇曡璁?/qa
*execute-checklist testing-checklist.md

# 鑴氭湰鍖栨祴璇曟墽琛?npm run test:unit && npm run test:e2e
```

---

> **鎻愮ず**: 鏈寚鍗楅殢椤圭洰鍙戝睍鎸佺画鏇存柊銆傚鍙戠幇闂鎴栭渶瑕佽ˉ鍏呭唴瀹癸紝璇锋彁浜ssue鎴栨洿鏂版枃妗ｃ€?
