# 鎶€鏈灦鏋勬枃妗?AI浼樺厛澧炲己鐗?鏂囦欢5\_寮€鍙戠幆澧冧笌鍔熻兘瀹炵幇

## 绗?绔狅細寮€鍙戠幆澧冧笌鏋勫缓锛堣瀺鍚堢淮鎶ょ瓥鐣?閮ㄧ讲杩愮淮锛?

> **鏍稿績鐞嗗康**: 鏋勫缓楂樻晥鐨勫紑鍙戠幆澧冨拰鑷姩鍖栬繍缁翠綋绯伙紝纭繚浠庡紑鍙戝埌鐢熶骇鐨勫畬鏁村伐绋嬪寲娴佺▼锛屾敮鎸丄I浠ｇ爜鐢熸垚鐨勬渶浣冲疄璺?

### 7.1 寮€鍙戠幆澧冮厤缃?

#### 7.1.1 鏍稿績寮€鍙戝伐鍏烽摼

```json5
// package.json - 瀹屾暣鐨勪緷璧栫鐞?{
  name: 'guild-manager',
  version: '1.0.0',
  description: '銆婂叕浼氱粡鐞嗐€? AI椹卞姩鐨勫叕浼氱鐞嗘父鎴?,
  type: 'module',
  main: 'dist/main.js',
  scripts: {
    // 寮€鍙戠幆澧?    dev: 'concurrently "npm run dev:vite" "npm run dev:electron"',
    'dev:vite': 'vite --host 0.0.0.0 --port 3000',
    'dev:electron': 'wait-on http://localhost:3000 && cross-env NODE_ENV=development electron .',

    // 鏋勫缓鑴氭湰
    build: 'npm run build:renderer && npm run build:main',
    'build:renderer': 'vite build',
    'build:main': 'tsc -p tsconfig.main.json && copyfiles -u 1 "src/main/**/*.!(ts)" dist/',
    'build:prod': 'npm run clean && npm run build && electron-builder',

    // 娴嬭瘯鑴氭湰
    test: 'vitest',
    'test:ui': 'vitest --ui',
    'test:coverage': 'vitest --coverage',
    'test:e2e': 'playwright test',
    'test:e2e:ui': 'playwright test --ui',

    // 璐ㄩ噺妫€鏌?    lint: 'eslint src --ext .ts,.tsx --fix',
    'type-check': 'tsc --noEmit',
    format: 'prettier --write "src/**/*.{ts,tsx,json,md}"',

    // 鏁版嵁搴撶鐞?    'db:migrate': 'node scripts/migrate.js',
    'db:seed': 'node scripts/seed.js',
    'db:backup': 'node scripts/backup.js',

    // 閮ㄧ讲鑴氭湰
    'deploy:staging': 'npm run build:prod && node scripts/deploy-staging.js',
    'deploy:production': 'npm run build:prod && node scripts/deploy-production.js',

    // 缁存姢鑴氭湰
    clean: 'rimraf dist build coverage',
    postinstall: 'electron-builder install-app-deps',
    'audit:security': 'npm audit --audit-level moderate',
    'update:deps': 'npm-check-updates -u',
  },

  // 鐢熶骇渚濊禆
  dependencies: {
    electron: '^32.0.0',
    react: '^19.0.0',
    'react-dom': '^19.0.0',
    phaser: '^3.80.0',
    'better-sqlite3': '^11.0.0',
    i18next: '^23.15.0',
    'react-i18next': '^15.0.0',
    zustand: '^5.0.0',
    '@tanstack/react-query': '^5.59.0',
    tailwindcss: '^4.0.0',
    'framer-motion': '^11.11.0',
  },

  // 寮€鍙戜緷璧?  devDependencies: {
    '@types/react': '^19.0.0',
    '@types/react-dom': '^19.0.0',
    '@types/better-sqlite3': '^7.6.11',
    vite: '^6.0.0',
    '@vitejs/plugin-react': '^4.3.0',
    'electron-builder': '^25.0.0',
    typescript: '^5.6.0',
    vitest: '^2.1.0',
    '@vitest/ui': '^2.1.0',
    '@vitest/coverage-v8': '^2.1.0',
    playwright: '^1.48.0',
    eslint: '^9.12.0',
    '@typescript-eslint/eslint-plugin': '^8.8.0',
    prettier: '^3.3.0',
    concurrently: '^9.0.0',
    'wait-on': '^8.0.0',
    'cross-env': '^7.0.3',
    copyfiles: '^2.4.1',
    rimraf: '^6.0.0',
  },

  // Electron Builder閰嶇疆
  build: {
    appId: 'com.guildmanager.app',
    productName: 'Guild Manager',
    directories: {
      output: 'release',
    },
    files: ['dist/**/*', 'node_modules/**/*', 'package.json'],
    mac: {
      category: 'public.app-category.games',
    },
    win: {
      target: 'nsis',
    },
    linux: {
      target: 'AppImage',
    },
  },
}
```

#### 7.1.2 TypeScript閰嶇疆瀹屾暣鏂规

```json5
// tsconfig.json - 涓婚厤缃?{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,

    // 涓ユ牸妫€鏌ラ€夐」
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noUncheckedIndexedAccess": true,

    // 璺緞鍒悕
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/core/*": ["src/core/*"],
      "@/modules/*": ["src/modules/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"],
      "@/assets/*": ["src/assets/*"]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.d.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "build",
    "release"
  ]
}

// tsconfig.main.json - Electron涓昏繘绋嬮厤缃?{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noEmit": false,
    "outDir": "dist",
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node"
  },
  "include": [
    "src/main/**/*.ts"
  ]
}

// tsconfig.renderer.json - 娓叉煋杩涚▼閰嶇疆
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx"
  },
  "include": [
    "src/renderer/**/*.ts",
    "src/renderer/**/*.tsx"
  ]
}
```

#### 7.1.3 Vite鏋勫缓閰嶇疆

```typescript
// vite.config.ts - 瀹屾暣鏋勫缓閰嶇疆
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      // React 19 鏀寔
      jsxImportSource: undefined,
      jsxRuntime: 'automatic',
    }),
  ],

  // 璺緞瑙ｆ瀽
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/modules': path.resolve(__dirname, './src/modules'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },

  // 寮€鍙戞湇鍔″櫒閰嶇疆
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: true,
    cors: true,
  },

  // 鏋勫缓閰嶇疆
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
    target: 'es2022',

    // 浠ｇ爜鍒嗗壊
    rollupOptions: {
      output: {
        manualChunks: {
          // 绗笁鏂瑰簱鍒嗗潡
          'vendor-react': ['react', 'react-dom'],
          'vendor-phaser': ['phaser'],
          'vendor-i18n': ['i18next', 'react-i18next'],
          'vendor-ui': ['framer-motion', '@tanstack/react-query'],

          // 涓氬姟妯″潡鍒嗗潡
          'core-systems': [
            './src/core/events',
            './src/core/state',
            './src/core/ai',
          ],
          'game-modules': [
            './src/modules/guild',
            './src/modules/combat',
            './src/modules/economy',
          ],
        },
      },
    },

    // 鎬ц兘浼樺寲
    chunkSizeWarningLimit: 1000,
    assetsInlineLimit: 4096,
  },

  // 鐜鍙橀噺
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
  },

  // CSS棰勫鐞?  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`,
      },
    },
  },

  // 浼樺寲閰嶇疆
  optimizeDeps: {
    include: ['react', 'react-dom', 'phaser', 'i18next', 'react-i18next'],
  },
});
```

### 7.2 鑷姩鍖栨瀯寤轰笌CI/CD

#### 7.2.1 GitHub Actions宸ヤ綔娴?

```yaml
# .github/workflows/ci.yml - 鎸佺画闆嗘垚
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20'
  ELECTRON_CACHE: ${{ github.workspace }}/.cache/electron
  ELECTRON_BUILDER_CACHE: ${{ github.workspace }}/.cache/electron-builder

jobs:
  # 浠ｇ爜璐ㄩ噺妫€鏌?  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Type checking
        run: npm run type-check

      - name: Linting
        run: npm run lint

      - name: Security audit
        run: npm run audit:security

  # 鍗曞厓娴嬭瘯
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:coverage

      - name: Upload coverage reports
        uses: codecov/codecov-action@v4
        with:
          file: ./coverage/lcov.info

  # E2E娴嬭瘯
  e2e-tests:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Build application
        run: npm run build

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.os }}
          path: playwright-report/

  # 鏋勫缓涓庡彂甯?  build-and-release:
    needs: [quality-check, unit-tests, e2e-tests]
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build:prod
        env:
          CSC_LINK: ${{ secrets.CSC_LINK }}
          CSC_KEY_PASSWORD: ${{ secrets.CSC_KEY_PASSWORD }}
          APPLEID: ${{ secrets.APPLEID }}
          APPLEIDPASS: ${{ secrets.APPLEIDPASS }}

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: release/

  # 閮ㄧ讲鍒伴鍙戝竷鐜
  deploy-staging:
    needs: build-and-release
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to staging
        run: |
          echo "Deploying to staging environment..."
          # 閮ㄧ讲閫昏緫

  # 閮ㄧ讲鍒扮敓浜х幆澧?  deploy-production:
    needs: build-and-release
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production
        run: |
          echo "Deploying to production environment..."
          # 閮ㄧ讲閫昏緫
```

#### 7.2.2 鏋勫缓鑴氭湰鑷姩鍖?

```typescript
// scripts/build-automation.ts - 鏋勫缓鑷姩鍖栬剼鏈?import { execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { build } from 'electron-builder';

interface BuildOptions {
  platform: 'win' | 'mac' | 'linux' | 'all';
  env: 'development' | 'staging' | 'production';
  skipTests?: boolean;
  publish?: boolean;
}

class BuildAutomation {
  private readonly rootDir: string;
  private readonly distDir: string;
  private readonly releaseDir: string;

  constructor() {
    this.rootDir = process.cwd();
    this.distDir = path.join(this.rootDir, 'dist');
    this.releaseDir = path.join(this.rootDir, 'release');
  }

  // 瀹屾暣鏋勫缓娴佺▼
  async performBuild(options: BuildOptions): Promise<void> {
    console.log('馃殌 Starting build automation...');

    try {
      // 1. 娓呯悊鐜
      await this.cleanEnvironment();

      // 2. 鐜妫€鏌?      await this.checkEnvironment();

      // 3. 渚濊禆瀹夎
      await this.installDependencies();

      // 4. 浠ｇ爜璐ㄩ噺妫€鏌?      if (!options.skipTests) {
        await this.runQualityChecks();
      }

      // 5. 鏋勫缓搴旂敤
      await this.buildApplication(options);

      // 6. 杩愯娴嬭瘯
      if (!options.skipTests) {
        await this.runTests();
      }

      // 7. 鎵撳寘搴旂敤
      await this.packageApplication(options);

      // 8. 鍙戝竷搴旂敤
      if (options.publish) {
        await this.publishApplication(options);
      }

      console.log('鉁?Build automation completed successfully!');
    } catch (error) {
      console.error('鉂?Build automation failed:', error);
      process.exit(1);
    }
  }

  // 娓呯悊鏋勫缓鐜
  private async cleanEnvironment(): Promise<void> {
    console.log('馃Ч Cleaning build environment...');

    const dirsToClean = [
      this.distDir,
      this.releaseDir,
      path.join(this.rootDir, 'coverage'),
      path.join(this.rootDir, 'playwright-report'),
    ];

    for (const dir of dirsToClean) {
      if (await fs.pathExists(dir)) {
        await fs.remove(dir);
      }
    }
  }

  // 鐜妫€鏌?  private async checkEnvironment(): Promise<void> {
    console.log('馃攳 Checking build environment...');

    // 妫€鏌ode.js鐗堟湰
    const nodeVersion = process.version;
    if (!nodeVersion.startsWith('v20')) {
      throw new Error(`Node.js 20.x required, got ${nodeVersion}`);
    }

    // 妫€鏌ュ繀瑕佹枃浠?    const requiredFiles = ['package.json', 'tsconfig.json', 'vite.config.ts'];

    for (const file of requiredFiles) {
      if (!(await fs.pathExists(path.join(this.rootDir, file)))) {
        throw new Error(`Required file not found: ${file}`);
      }
    }
  }

  // 瀹夎渚濊禆
  private async installDependencies(): Promise<void> {
    console.log('馃摝 Installing dependencies...');

    this.execCommand('npm ci');
    this.execCommand('npm run postinstall');
  }

  // 浠ｇ爜璐ㄩ噺妫€鏌?  private async runQualityChecks(): Promise<void> {
    console.log('馃攷 Running quality checks...');

    // TypeScript绫诲瀷妫€鏌?    this.execCommand('npm run type-check');

    // ESLint妫€鏌?    this.execCommand('npm run lint');

    // 瀹夊叏瀹¤
    this.execCommand('npm run audit:security');
  }

  // 鏋勫缓搴旂敤
  private async buildApplication(options: BuildOptions): Promise<void> {
    console.log('馃彈锔?Building application...');

    // 璁剧疆鐜鍙橀噺
    process.env.NODE_ENV = options.env;
    process.env.BUILD_ENV = options.env;

    // 鏋勫缓娓叉煋杩涚▼
    this.execCommand('npm run build:renderer');

    // 鏋勫缓涓昏繘绋?    this.execCommand('npm run build:main');

    // 鏁版嵁搴撹縼绉?    if (options.env !== 'development') {
      this.execCommand('npm run db:migrate');
    }
  }

  // 杩愯娴嬭瘯
  private async runTests(): Promise<void> {
    console.log('馃И Running tests...');

    // 鍗曞厓娴嬭瘯
    this.execCommand('npm run test:coverage');

    // E2E娴嬭瘯
    this.execCommand('npm run test:e2e');
  }

  // 鎵撳寘搴旂敤
  private async packageApplication(options: BuildOptions): Promise<void> {
    console.log('馃摝 Packaging application...');

    const targets = this.getElectronTargets(options.platform);

    await build({
      targets,
      config: {
        directories: {
          output: this.releaseDir,
        },
        publish: options.publish ? 'always' : 'never',
      },
    });
  }

  // 鑾峰彇Electron鏋勫缓鐩爣
  private getElectronTargets(platform: BuildOptions['platform']) {
    const { Platform } = require('electron-builder');

    switch (platform) {
      case 'win':
        return Platform.WINDOWS.createTarget();
      case 'mac':
        return Platform.MAC.createTarget();
      case 'linux':
        return Platform.LINUX.createTarget();
      case 'all':
        return Platform.current().createTarget();
      default:
        return Platform.current().createTarget();
    }
  }

  // 鍙戝竷搴旂敤
  private async publishApplication(options: BuildOptions): Promise<void> {
    console.log('馃殌 Publishing application...');

    if (options.env === 'production') {
      // 鍙戝竷鍒扮敓浜х幆澧?      await this.publishToProduction();
    } else if (options.env === 'staging') {
      // 鍙戝竷鍒伴鍙戝竷鐜
      await this.publishToStaging();
    }
  }

  // 鎵ц鍛戒护
  private execCommand(command: string): void {
    console.log(`鈻讹笍 Executing: ${command}`);
    execSync(command, { stdio: 'inherit', cwd: this.rootDir });
  }

  // 鍙戝竷鍒扮敓浜х幆澧?  private async publishToProduction(): Promise<void> {
    console.log('馃寪 Publishing to production...');
    // 瀹炵幇鐢熶骇鐜鍙戝竷閫昏緫
  }

  // 鍙戝竷鍒伴鍙戝竷鐜
  private async publishToStaging(): Promise<void> {
    console.log('馃И Publishing to staging...');
    // 瀹炵幇棰勫彂甯冪幆澧冨彂甯冮€昏緫
  }
}

// CLI鎺ュ彛
if (require.main === module) {
  const buildAutomation = new BuildAutomation();

  const options: BuildOptions = {
    platform: (process.argv[2] as BuildOptions['platform']) || 'current',
    env: (process.argv[3] as BuildOptions['env']) || 'development',
    skipTests: process.argv.includes('--skip-tests'),
    publish: process.argv.includes('--publish'),
  };

  buildAutomation.performBuild(options);
}
```

### 7.3 缁存姢绛栫暐涓庣洃鎺?

#### 7.3.1 绯荤粺鍋ュ悍鐩戞帶

```typescript
// src/core/monitoring/HealthMonitor.ts
class SystemHealthMonitor {
  private healthChecks: Map<string, HealthCheck>;
  private monitoringInterval: NodeJS.Timer;
  private alertThresholds: AlertThresholds;
  private metricsCollector: MetricsCollector;

  constructor(config: HealthMonitorConfig) {
    this.healthChecks = new Map();
    this.alertThresholds = config.alertThresholds;
    this.metricsCollector = new MetricsCollector();

    this.initializeHealthChecks();
  }

  // 鍒濆鍖栧仴搴锋鏌ラ」
  private initializeHealthChecks(): void {
    // 鏁版嵁搴撹繛鎺ユ鏌?    this.addHealthCheck('database', new DatabaseHealthCheck());

    // 鍐呭瓨浣跨敤妫€鏌?    this.addHealthCheck('memory', new MemoryHealthCheck());

    // CPU浣跨敤妫€鏌?    this.addHealthCheck('cpu', new CPUHealthCheck());

    // 纾佺洏绌洪棿妫€鏌?    this.addHealthCheck('disk', new DiskHealthCheck());

    // AI寮曟搸鍋ュ悍妫€鏌?    this.addHealthCheck('ai-engine', new AIEngineHealthCheck());

    // 浜嬩欢绯荤粺鍋ュ悍妫€鏌?    this.addHealthCheck('event-system', new EventSystemHealthCheck());
  }

  // 寮€濮嬬洃鎺?  startMonitoring(): void {
    console.log('馃彞 Starting system health monitoring...');

    // 姣?0绉掓墽琛屼竴娆″仴搴锋鏌?    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, 30000);

    // 绔嬪嵆鎵ц涓€娆℃鏌?    this.performHealthChecks();
  }

  // 鎵ц鍋ュ悍妫€鏌?  private async performHealthChecks(): Promise<void> {
    const results: HealthCheckResult[] = [];

    // 骞惰鎵ц鎵€鏈夊仴搴锋鏌?    const checkPromises = Array.from(this.healthChecks.entries()).map(
      async ([name, check]) => {
        try {
          const result = await check.execute();
          results.push({ name, ...result });
        } catch (error) {
          results.push({
            name,
            status: 'critical',
            message: `Health check failed: ${error.message}`,
            timestamp: Date.now(),
          });
        }
      }
    );

    await Promise.all(checkPromises);

    // 澶勭悊妫€鏌ョ粨鏋?    await this.processHealthResults(results);
  }

  // 澶勭悊鍋ュ悍妫€鏌ョ粨鏋?  private async processHealthResults(
    results: HealthCheckResult[]
  ): Promise<void> {
    const systemHealth: SystemHealthStatus = {
      overall: 'healthy',
      checks: results,
      timestamp: Date.now(),
    };

    // 纭畾鏁翠綋鍋ュ悍鐘舵€?    const criticalIssues = results.filter(r => r.status === 'critical');
    const warningIssues = results.filter(r => r.status === 'warning');

    if (criticalIssues.length > 0) {
      systemHealth.overall = 'critical';
    } else if (warningIssues.length > 0) {
      systemHealth.overall = 'warning';
    }

    // 鏀堕泦鎸囨爣
    this.metricsCollector.recordHealthMetrics(systemHealth);

    // 鍙戦€佸憡璀?    if (systemHealth.overall !== 'healthy') {
      await this.sendHealthAlert(systemHealth);
    }

    // 璁板綍鍋ュ悍鏃ュ織
    this.logHealthStatus(systemHealth);
  }

  // 鍙戦€佸仴搴峰憡璀?  private async sendHealthAlert(health: SystemHealthStatus): Promise<void> {
    const alert: HealthAlert = {
      severity: health.overall,
      message: this.generateAlertMessage(health),
      timestamp: Date.now(),
      checks: health.checks.filter(c => c.status !== 'healthy'),
    };

    // 鍙戦€佸埌鏃ュ織绯荤粺
    console.warn('鈿狅笍 System Health Alert:', alert);

    // 鍙戦€佸埌鐩戞帶绯荤粺
    await this.metricsCollector.sendAlert(alert);
  }

  // 鐢熸垚鍛婅娑堟伅
  private generateAlertMessage(health: SystemHealthStatus): string {
    const issues = health.checks.filter(c => c.status !== 'healthy');
    const critical = issues.filter(c => c.status === 'critical');
    const warnings = issues.filter(c => c.status === 'warning');

    let message = `System health: ${health.overall}. `;

    if (critical.length > 0) {
      message += `Critical issues: ${critical.map(c => c.name).join(', ')}. `;
    }

    if (warnings.length > 0) {
      message += `Warnings: ${warnings.map(c => c.name).join(', ')}.`;
    }

    return message;
  }
}

// 鏁版嵁搴撳仴搴锋鏌?class DatabaseHealthCheck implements HealthCheck {
  async execute(): Promise<HealthCheckResult> {
    try {
      // 妫€鏌ユ暟鎹簱杩炴帴
      const db = await this.getDatabaseConnection();

      // 鎵ц绠€鍗曟煡璇?      const result = db.prepare('SELECT 1 as test').get();

      if (!result || result.test !== 1) {
        return {
          status: 'critical',
          message: 'Database query failed',
          timestamp: Date.now(),
        };
      }

      // 妫€鏌ユ暟鎹簱澶у皬
      const dbSize = await this.getDatabaseSize();
      if (dbSize > 1024 * 1024 * 1024) {
        // 1GB
        return {
          status: 'warning',
          message: `Database size is large: ${(dbSize / 1024 / 1024).toFixed(2)}MB`,
          timestamp: Date.now(),
        };
      }

      return {
        status: 'healthy',
        message: 'Database connection is healthy',
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `Database connection failed: ${error.message}`,
        timestamp: Date.now(),
      };
    }
  }
}

// AI寮曟搸鍋ュ悍妫€鏌?class AIEngineHealthCheck implements HealthCheck {
  async execute(): Promise<HealthCheckResult> {
    try {
      // 妫€鏌orker姹犵姸鎬?      const workerPool = this.getAIWorkerPool();
      const activeWorkers = workerPool.getActiveWorkerCount();
      const totalWorkers = workerPool.getTotalWorkerCount();

      if (activeWorkers === 0) {
        return {
          status: 'critical',
          message: 'No active AI workers',
          timestamp: Date.now(),
        };
      }

      // 妫€鏌ュ钩鍧囧搷搴旀椂闂?      const avgResponseTime = workerPool.getAverageResponseTime();
      if (avgResponseTime > 5000) {
        // 5绉?        return {
          status: 'warning',
          message: `AI response time is slow: ${avgResponseTime}ms`,
          timestamp: Date.now(),
        };
      }

      // 妫€鏌ュ喅绛栫紦瀛樺懡涓巼
      const cacheHitRate = workerPool.getCacheHitRate();
      if (cacheHitRate < 0.7) {
        // 70%
        return {
          status: 'warning',
          message: `Low AI cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`,
          timestamp: Date.now(),
        };
      }

      return {
        status: 'healthy',
        message: `AI engine healthy: ${activeWorkers}/${totalWorkers} workers active`,
        timestamp: Date.now(),
      };
    } catch (error) {
      return {
        status: 'critical',
        message: `AI engine check failed: ${error.message}`,
        timestamp: Date.now(),
      };
    }
  }
}
```

### 7.4 鍥㈤槦鍗忎綔涓庣煡璇嗙鐞?(Team Collaboration & Knowledge Management)

#### 7.4.1 鏂颁汉鍏ヨ亴鎸囧崡 (Onboarding Guide)

**瀹屾暣鍏ヨ亴娴佺▼**

```typescript
// src/docs/onboarding/OnboardingWorkflow.ts
export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // 鍒嗛挓
  prerequisites: string[];
  deliverables: string[];
  resources: Resource[];
  mentor?: string;
}

export interface Resource {
  type: 'documentation' | 'video' | 'code' | 'tool' | 'meeting';
  title: string;
  url: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

// 鏂颁汉鍏ヨ亴宸ヤ綔娴佸畾涔?export const ONBOARDING_WORKFLOW: OnboardingStep[] = [
  {
    id: 'environment-setup',
    title: '寮€鍙戠幆澧冩惌寤?,
    description: '瀹夎鍜岄厤缃畬鏁寸殑寮€鍙戠幆澧冿紝鍖呮嫭蹇呰鐨勫伐鍏峰拰渚濊禆',
    estimatedTime: 120, // 2灏忔椂
    prerequisites: [],
    deliverables: [
      '鑳藉鎴愬姛鍚姩寮€鍙戞湇鍔″櫒',
      '鑳藉杩愯瀹屾暣鐨勬祴璇曞浠?,
      '鑳藉鏋勫缓鐢熶骇鐗堟湰',
      '寮€鍙戝伐鍏烽厤缃畬鎴愶紙IDE銆丟it銆丯ode.js绛夛級'
    ],
    resources: [
      {
        type: 'documentation',
        title: '鐜鎼缓鎸囧崡',
        url: '/docs/setup/environment-setup.md',
        description: '璇︾粏鐨勫紑鍙戠幆澧冮厤缃楠?,
        priority: 'high'
      },
      {
        type: 'video',
        title: '鐜鎼缓婕旂ず瑙嗛',
        url: '/docs/videos/environment-setup-demo.mp4',
        description: '15鍒嗛挓鐨勭幆澧冩惌寤烘紨绀?,
        priority: 'medium'
      },
      {
        type: 'tool',
        title: '鐜妫€鏌ヨ剼鏈?,
        url: '/scripts/check-environment.js',
        description: '鑷姩妫€鏌ョ幆澧冮厤缃槸鍚︽纭?,
        priority: 'high'
      }
    ]
  },
  {
    id: 'codebase-overview',
    title: '浠ｇ爜搴撴灦鏋勬瑙?,
    description: '鐞嗚В椤圭洰鐨勬暣浣撴灦鏋勩€佺洰褰曠粨鏋勫拰鏍稿績姒傚康',
    estimatedTime: 180, // 3灏忔椂
    prerequisites: ['environment-setup'],
    deliverables: [
      '瀹屾垚鏋舵瀯鐞嗚В娴嬭瘯锛?0%浠ヤ笂姝ｇ‘鐜囷級',
      '鑳藉瑙ｉ噴涓昏妯″潡鐨勮亴璐?,
      '鐞嗚В鏁版嵁娴佸拰浜嬩欢娴?,
      '瀹屾垚浠ｇ爜瀵艰缁冧範'
    ],
    resources: [
      {
        type: 'documentation',
        title: '鎶€鏈灦鏋勬枃妗?,
        url: '/docs/architecture/',
        description: 'AI浼樺厛澧炲己鐗堟妧鏈灦鏋勬枃妗?,
        priority: 'high'
      },
      {
        type: 'documentation',
        title: '浠ｇ爜瀵艰鎸囧崡',
        url: '/docs/onboarding/code-walkthrough.md',
        description: '鍏抽敭浠ｇ爜鏂囦欢鍜屾ā鍧楃殑瀵艰',
        priority: 'high'
      },
      {
        type: 'meeting',
        title: '鏋舵瀯璁茶В浼氳',
        url: 'calendar-invite',
        description: '涓庢灦鏋勫笀杩涜1瀵?鏋舵瀯璁茶В锛?灏忔椂锛?,
        priority: 'high'
      }
    ],
    mentor: '鎶€鏈灦鏋勫笀'
  },
  {
    id: 'development-workflow',
    title: '寮€鍙戞祦绋嬩笌瑙勮寖',
    description: '瀛︿範椤圭洰鐨勫紑鍙戞祦绋嬨€佷唬鐮佽鑼冨拰鏈€浣冲疄璺?,
    estimatedTime: 90, // 1.5灏忔椂
    prerequisites: ['codebase-overview'],
    deliverables: [
      '瀹屾垚绗竴涓狿R骞堕€氳繃浠ｇ爜瀹℃煡',
      '鐞嗚ВGit宸ヤ綔娴佺▼',
      '鎺屾彙浠ｇ爜瑙勮寖鍜岃川閲忔爣鍑?,
      '閰嶇疆寮€鍙戝伐鍏凤紙ESLint銆丳rettier绛夛級'
    ],
    resources: [
      {
        type: 'documentation',
        title: '寮€鍙戞祦绋嬫寚鍗?,
        url: '/docs/development/workflow.md',
        description: 'Git娴佺▼銆佸垎鏀瓥鐣ャ€丳R瑙勮寖绛?,
        priority: 'high'
      },
      {
        type: 'documentation',
        title: '浠ｇ爜瑙勮寖鏂囨。',
        url: '/docs/development/coding-standards.md',
        description: 'TypeScript銆丷eact銆佹祴璇曠瓑浠ｇ爜瑙勮寖',
        priority: 'high'
      },
      {
        type: 'code',
        title: '绀轰緥PR妯℃澘',
        url: '/docs/examples/pr-template.md',
        description: '鏍囧噯PR鎻忚堪妯℃澘鍜屾鏌ユ竻鍗?,
        priority: 'medium'
      }
    ],
    mentor: '鍥㈤槦Lead'
  },
  {
    id: 'testing-strategy',
    title: '娴嬭瘯绛栫暐涓庡疄璺?,
    description: '鎺屾彙椤圭洰鐨勬祴璇曢噾瀛楀銆佹祴璇曞伐鍏峰拰娴嬭瘯缂栧啓瑙勮寖',
    estimatedTime: 150, // 2.5灏忔椂
    prerequisites: ['development-workflow'],
    deliverables: [
      '涓虹幇鏈夊姛鑳界紪鍐欏崟鍏冩祴璇?,
      '缂栧啓涓€涓泦鎴愭祴璇?,
      '杩愯骞剁悊瑙2E娴嬭瘯',
      '杈惧埌90%浠ヤ笂鐨勬祴璇曡鐩栫巼'
    ],
    resources: [
      {
        type: 'documentation',
        title: '娴嬭瘯绛栫暐鏂囨。',
        url: '/docs/testing/strategy.md',
        description: '娴嬭瘯閲戝瓧濉斻€佸伐鍏烽€夋嫨銆佽鐩栫巼瑕佹眰',
        priority: 'high'
      },
      {
        type: 'code',
        title: '娴嬭瘯绀轰緥浠ｇ爜',
        url: '/src/tests/examples/',
        description: '鍚勭被娴嬭瘯鐨勬渶浣冲疄璺电ず渚?,
        priority: 'high'
      },
      {
        type: 'video',
        title: 'TDD瀹炶返婕旂ず',
        url: '/docs/videos/tdd-demo.mp4',
        description: '30鍒嗛挓TDD寮€鍙戝疄璺垫紨绀?,
        priority: 'medium'
      }
    ],
    mentor: '娴嬭瘯宸ョ▼甯?
  },
  {
    id: 'domain-knowledge',
    title: '涓氬姟棰嗗煙鐭ヨ瘑',
    description: '鐞嗚В鍏細绠＄悊娓告垙鐨勪笟鍔￠€昏緫銆佺敤鎴烽渶姹傚拰浜у搧鐩爣',
    estimatedTime: 120, // 2灏忔椂
    prerequisites: ['testing-strategy'],
    deliverables: [
      '瀹屾垚涓氬姟鐭ヨ瘑娴嬭瘯锛?5%浠ヤ笂姝ｇ‘鐜囷級',
      '鐞嗚В鏍稿績涓氬姟娴佺▼',
      '鐔熸倝鐢ㄦ埛瑙掕壊鍜屼娇鐢ㄥ満鏅?,
      '鎺屾彙娓告垙绯荤粺鐨勬牳蹇冩蹇?
    ],
    resources: [
      {
        type: 'documentation',
        title: '浜у搧闇€姹傛枃妗?,
        url: '/docs/product/PRD.md',
        description: '瀹屾暣鐨勪骇鍝侀渶姹傚拰鍔熻兘瑙勬牸',
        priority: 'high'
      },
      {
        type: 'documentation',
        title: '鐢ㄦ埛鏁呬簨闆嗗悎',
        url: '/docs/product/user-stories.md',
        description: '璇︾粏鐨勭敤鎴锋晠浜嬪拰楠屾敹鏍囧噯',
        priority: 'high'
      },
      {
        type: 'meeting',
        title: '浜у搧璁茶В浼氳',
        url: 'calendar-invite',
        description: '涓庝骇鍝佺粡鐞嗚繘琛屼笟鍔¤瑙ｏ紙1.5灏忔椂锛?,
        priority: 'high'
      }
    ],
    mentor: '浜у搧缁忕悊'
  },
  {
    id: 'first-feature',
    title: '绗竴涓姛鑳藉紑鍙?,
    description: '鐙珛瀹屾垚涓€涓皬鍔熻兘鐨勫畬鏁村紑鍙戯紝浠庨渶姹傚埌涓婄嚎',
    estimatedTime: 480, // 8灏忔椂锛堣法澶氬ぉ锛?    prerequisites: ['domain-knowledge'],
    deliverables: [
      '瀹屾垚鍔熻兘璁捐鏂囨。',
      '瀹炵幇鍔熻兘浠ｇ爜锛堝寘鍚祴璇曪級',
      '閫氳繃浠ｇ爜瀹℃煡',
      '鍔熻兘鎴愬姛閮ㄧ讲鍒伴鍙戝竷鐜',
      '瀹屾垚鍔熻兘楠屾敹娴嬭瘯'
    ],
    resources: [
      {
        type: 'documentation',
        title: '鍔熻兘寮€鍙戞祦绋?,
        url: '/docs/development/feature-development.md',
        description: '浠庨渶姹傚垎鏋愬埌涓婄嚎鐨勫畬鏁存祦绋?,
        priority: 'high'
      },
      {
        type: 'code',
        title: '鍔熻兘寮€鍙戞ā鏉?,
        url: '/templates/feature-template/',
        description: '鏍囧噯鍔熻兘寮€鍙戠殑浠ｇ爜缁撴瀯妯℃澘',
        priority: 'medium'
      },
      {
        type: 'meeting',
        title: '鍔熻兘璇勫浼氳',
        url: 'calendar-invite',
        description: '鍔熻兘璁捐鍜屽疄鐜扮殑璇勫浼氳',
        priority: 'high'
      }
    ],
    mentor: '璧勬繁寮€鍙戝伐绋嬪笀'
  },
  {
    id: 'team-integration',
    title: '鍥㈤槦铻嶅叆涓庢寔缁涔?,
    description: '铻嶅叆鍥㈤槦鏂囧寲锛屽缓绔嬫寔缁涔犲拰鏀硅繘鐨勪範鎯?,
    estimatedTime: 60, // 1灏忔椂
    prerequisites: ['first-feature'],
    deliverables: [
      '鍙傚姞鍥㈤槦浼氳鍜屾妧鏈垎浜?,
      '寤虹珛涓汉瀛︿範璁″垝',
      '瀹屾垚鍏ヨ亴鍙嶉鍜屾敼杩涘缓璁?,
      '鎴愪负鍥㈤槦姝ｅ紡鎴愬憳'
    ],
    resources: [
      {
        type: 'documentation',
        title: '鍥㈤槦鏂囧寲鎵嬪唽',
        url: '/docs/team/culture.md',
        description: '鍥㈤槦浠峰€艰銆佸伐浣滄柟寮忓拰鍗忎綔瑙勮寖',
        priority: 'high'
      },
      {
        type: 'meeting',
        title: '鍏ヨ亴鎬荤粨浼氳',
        url: 'calendar-invite',
        description: '涓庣粡鐞嗚繘琛屽叆鑱屾€荤粨鍜岃亴涓氳鍒掕璁?,
        priority: 'high'
      }
    ],
    mentor: '鍥㈤槦缁忕悊'
  }
];

// 鍏ヨ亴杩涘害璺熻釜
export class OnboardingTracker {
  private progress: Map<string, OnboardingProgress> = new Map();

  interface OnboardingProgress {
    stepId: string;
    status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
    startTime?: number;
    completionTime?: number;
    notes: string[];
    mentorFeedback?: string;
    blockers: string[];
  }

  // 寮€濮嬪叆鑱屾祦绋?  startOnboarding(employeeId: string): void {
    ONBOARDING_WORKFLOW.forEach(step => {
      this.progress.set(`${employeeId}-${step.id}`, {
        stepId: step.id,
        status: step.prerequisites.length === 0 ? 'not_started' : 'blocked',
        notes: [],
        blockers: step.prerequisites.filter(prereq =>
          !this.isStepCompleted(employeeId, prereq)
        )
      });
    });
  }

  // 鏇存柊姝ラ鐘舵€?  updateStepStatus(
    employeeId: string,
    stepId: string,
    status: OnboardingProgress['status'],
    notes?: string
  ): void {
    const progressId = `${employeeId}-${stepId}`;
    const progress = this.progress.get(progressId);

    if (progress) {
      progress.status = status;

      if (status === 'in_progress' && !progress.startTime) {
        progress.startTime = Date.now();
      }

      if (status === 'completed') {
        progress.completionTime = Date.now();

        // 瑙ｉ攣渚濊禆姝ゆ楠ょ殑鍏朵粬姝ラ
        this.unlockDependentSteps(employeeId, stepId);
      }

      if (notes) {
        progress.notes.push(notes);
      }

      this.progress.set(progressId, progress);
    }
  }

  // 鐢熸垚鍏ヨ亴鎶ュ憡
  generateOnboardingReport(employeeId: string): OnboardingReport {
    const allProgress = Array.from(this.progress.entries())
      .filter(([key]) => key.startsWith(employeeId))
      .map(([, progress]) => progress);

    const completed = allProgress.filter(p => p.status === 'completed').length;
    const inProgress = allProgress.filter(p => p.status === 'in_progress').length;
    const blocked = allProgress.filter(p => p.status === 'blocked').length;
    const notStarted = allProgress.filter(p => p.status === 'not_started').length;

    const totalTime = allProgress
      .filter(p => p.startTime && p.completionTime)
      .reduce((total, p) => total + (p.completionTime! - p.startTime!), 0);

    return {
      employeeId,
      totalSteps: ONBOARDING_WORKFLOW.length,
      completedSteps: completed,
      inProgressSteps: inProgress,
      blockedSteps: blocked,
      notStartedSteps: notStarted,
      completionPercentage: (completed / ONBOARDING_WORKFLOW.length) * 100,
      totalTimeSpent: totalTime,
      estimatedCompletion: this.calculateEstimatedCompletion(employeeId),
      currentBlockers: this.getCurrentBlockers(employeeId)
    };
  }
}
```

\*_鐜鎼缓鑷姩鍖?_

```powershell
# scripts/setup-dev-environment.ps1 - Windows 环境初始化脚本
$ErrorActionPreference = 'Stop'

Write-Host "🚀 开始构建《公会管理》开发环境..."

function Test-SystemRequirements {
  Write-Host "🔍 检查系统依赖..."
  if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw "未检测到 Node.js，请安装 Node.js 20.x"
  }
  $nodeMajor = [int]((node --version).TrimStart('v').Split('.')[0])
  if ($nodeMajor -lt 20) {
    throw "Node.js 版本需 ≥ 20.x，当前为 $(node --version)"
  }
  if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "未检测到 Git，请安装 Git"
  }
  $os = Get-CimInstance Win32_OperatingSystem
  $gitVersion = (git --version).Split(' ')[2]
  Write-Host "✅ 系统环境：$($os.OSArchitecture)、Node.js $(node --version)、Git $gitVersion"
}

function Install-Dependencies {
  Write-Host "📦 安装项目依赖..."
  if (Test-Path node_modules) {
    Write-Host "🧹 清理旧依赖..."
    Remove-Item -Recurse -Force node_modules
  }
  if (Test-Path package-lock.json) {
    Remove-Item -Force package-lock.json
  }
  npm ci
  npx playwright install
  Write-Host "✅ 依赖安装完成"
}

function Setup-DevTools {
  Write-Host "🛠️ 配置开发工具..."
  if (Test-Path .git) {
    npx husky install
  }
  if (Get-Command code -ErrorAction SilentlyContinue) {
    New-Item -ItemType Directory -Force -Path .vscode | Out-Null
    @'
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "ms-playwright.playwright",
    "ms-vscode.test-adapter-converter",
    "gruntfuggly.todo-tree"
  ]
}
'@ | Set-Content -Path .vscode/extensions.json -Encoding UTF8

    @'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": [
    "javascript",
    "typescript",
    "typescriptreact"
  ],
  "tailwindCSS.experimental.classRegex": [
    ["clsx\(([^)]*)\)", "(?:'|"|`)([^']*)(?:'|"|`)"]
  ]
}
'@ | Set-Content -Path .vscode/settings.json -Encoding UTF8
  }
  Write-Host "✅ 工具配置完成"
}

function Initialize-Database {
  param([switch]$WithSeed)
  Write-Host "🗄️ 初始化数据库..."
  New-Item -ItemType Directory -Force -Path data/database | Out-Null
  npm run db:migrate
  if ($WithSeed) {
    npm run db:seed
  }
  Write-Host "✅ 数据库就绪"
}

function New-DevConfig {
  Write-Host "📝 生成 .env.local ..."
  if (-not (Test-Path '.env.local')) {
@'
# 开发环境配置
NODE_ENV=development
VITE_APP_ENV=development
VITE_API_BASE_URL=http://localhost:3000
VITE_ENABLE_DEBUG=true
VITE_LOG_LEVEL=debug

# 数据库配置
DB_PATH=./data/database/guild-manager-dev.db

# 开发工具
VITE_DEVTOOLS=true
VITE_REACT_STRICT_MODE=true
'@ | Set-Content -Path '.env.local' -Encoding UTF8
  }
}

function Run-Verification {
  Write-Host "🧪 执行验证流程..."
  npm run type-check
  npm run lint
  npm run test -- --run
  npm run build
  Write-Host "✅ 核心验证通过"
}

param(
  [switch]$WithSeedData
)

Write-Host "==============================================="
Write-Host "《公会管理》开发环境初始化脚本 v1.0"
Write-Host "==============================================="

Test-SystemRequirements
Install-Dependencies
Setup-DevTools
New-DevConfig
Initialize-Database -WithSeed:$WithSeedData
Run-Verification

Write-Host ""
Write-Host "🎉 开发环境已准备就绪"
Write-Host "➡️ 接下来可执行："
Write-Host "   npm run dev"
Write-Host "   npm run test"
Write-Host "   npm run build"
Write-Host ""
Write-Host "📚 参考资料：README.md、docs/、docs/onboarding/"
Write-Host ""
Write-Host "如遇问题请联系架构团队或查阅常见问题章节。"
```

#### 7.4.2 鐭ヨ瘑浼犻€掓満鍒?(Knowledge Transfer)

\*_鐭ヨ瘑搴撶鐞嗙郴缁?_

```typescript
// src/core/knowledge/KnowledgeManager.ts
export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type:
    | 'document'
    | 'video'
    | 'code-example'
    | 'best-practice'
    | 'troubleshooting';
  category: string[];
  tags: string[];
  author: string;
  createdAt: number;
  updatedAt: number;
  version: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedReadTime: number; // 鍒嗛挓
  relatedItems: string[]; // 鐩稿叧鐭ヨ瘑椤笽D
  feedback: KnowledgeFeedback[];
}

export interface KnowledgeFeedback {
  id: string;
  userId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment?: string;
  helpful: boolean;
  timestamp: number;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  parent?: string;
  children: string[];
  itemCount: number;
}

// 鐭ヨ瘑绠＄悊绯荤粺
export class KnowledgeManager {
  private knowledgeBase: Map<string, KnowledgeItem> = new Map();
  private categories: Map<string, KnowledgeCategory> = new Map();
  private searchIndex: Map<string, string[]> = new Map(); // 鍏抽敭璇?-> 鐭ヨ瘑椤笽D鍒楄〃

  constructor() {
    this.initializeCategories();
    this.initializeKnowledgeBase();
  }

  // 鍒濆鍖栫煡璇嗗垎绫?  private initializeCategories(): void {
    const categories: KnowledgeCategory[] = [
      {
        id: 'architecture',
        name: '鎶€鏈灦鏋?,
        description: '绯荤粺鏋舵瀯璁捐銆佹ā寮忓拰鏈€浣冲疄璺?,
        icon: '馃彈锔?,
        children: ['system-design', 'data-flow', 'security'],
        itemCount: 0,
      },
      {
        id: 'development',
        name: '寮€鍙戝疄璺?,
        description: '缂栫爜瑙勮寖銆佸紑鍙戞祦绋嬪拰宸ュ叿浣跨敤',
        icon: '馃捇',
        children: ['coding-standards', 'testing', 'debugging'],
        itemCount: 0,
      },
      {
        id: 'deployment',
        name: '閮ㄧ讲杩愮淮',
        description: '鏋勫缓銆侀儴缃层€佺洃鎺у拰杩愮淮鐩稿叧鐭ヨ瘑',
        icon: '馃殌',
        children: ['build-process', 'monitoring', 'troubleshooting'],
        itemCount: 0,
      },
      {
        id: 'business',
        name: '涓氬姟鐭ヨ瘑',
        description: '浜у搧闇€姹傘€佺敤鎴锋晠浜嬪拰涓氬姟閫昏緫',
        icon: '馃搳',
        children: ['product-features', 'user-scenarios', 'business-rules'],
        itemCount: 0,
      },
      {
        id: 'team-process',
        name: '鍥㈤槦娴佺▼',
        description: '鍗忎綔娴佺▼銆佷細璁埗搴﹀拰娌熼€氳鑼?,
        icon: '馃懃',
        children: ['collaboration', 'meetings', 'communication'],
        itemCount: 0,
      },
    ];

    categories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  // 鍒濆鍖栫煡璇嗗簱
  private initializeKnowledgeBase(): void {
    const knowledgeItems: KnowledgeItem[] = [
      {
        id: 'electron-security-guide',
        title: 'Electron瀹夊叏閰嶇疆瀹屽叏鎸囧崡',
        content: this.loadKnowledgeContent('electron-security-guide'),
        type: 'document',
        category: ['architecture', 'security'],
        tags: ['electron', 'security', 'configuration', 'best-practices'],
        author: '瀹夊叏鏋舵瀯甯?,
        createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7澶╁墠
        updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1澶╁墠
        version: '1.2.0',
        status: 'published',
        difficulty: 'intermediate',
        estimatedReadTime: 15,
        relatedItems: ['security-checklist', 'electron-best-practices'],
        feedback: [],
      },
      {
        id: 'react-19-migration',
        title: 'React 19鍗囩骇杩佺Щ鎸囧崡',
        content: this.loadKnowledgeContent('react-19-migration'),
        type: 'document',
        category: ['development', 'frontend'],
        tags: ['react', 'migration', 'upgrade', 'breaking-changes'],
        author: '鍓嶇鏋舵瀯甯?,
        createdAt: Date.now() - 14 * 24 * 60 * 60 * 1000, // 14澶╁墠
        updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2澶╁墠
        version: '2.1.0',
        status: 'published',
        difficulty: 'advanced',
        estimatedReadTime: 25,
        relatedItems: ['react-hooks-guide', 'frontend-testing'],
        feedback: [
          {
            id: 'feedback-1',
            userId: 'developer-1',
            rating: 5,
            comment: '闈炲父璇︾粏鐨勮縼绉绘寚鍗楋紝甯姪寰堝ぇ锛?,
            helpful: true,
            timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
          },
        ],
      },
      {
        id: 'ai-debugging-techniques',
        title: 'AI寮曟搸璋冭瘯鎶€宸у拰宸ュ叿',
        content: this.loadKnowledgeContent('ai-debugging-techniques'),
        type: 'troubleshooting',
        category: ['development', 'ai'],
        tags: ['ai', 'debugging', 'web-worker', 'performance'],
        author: 'AI宸ョ▼甯?,
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5澶╁墠
        updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
        version: '1.0.0',
        status: 'published',
        difficulty: 'intermediate',
        estimatedReadTime: 12,
        relatedItems: ['performance-profiling', 'worker-communication'],
        feedback: [],
      },
      {
        id: 'code-review-checklist',
        title: '浠ｇ爜瀹℃煡妫€鏌ユ竻鍗?,
        content: this.loadKnowledgeContent('code-review-checklist'),
        type: 'best-practice',
        category: ['development', 'quality'],
        tags: ['code-review', 'quality', 'checklist', 'best-practices'],
        author: '鎶€鏈富绠?,
        createdAt: Date.now() - 21 * 24 * 60 * 60 * 1000, // 21澶╁墠
        updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3澶╁墠
        version: '1.3.0',
        status: 'published',
        difficulty: 'beginner',
        estimatedReadTime: 8,
        relatedItems: ['coding-standards', 'testing-guidelines'],
        feedback: [],
      },
    ];

    knowledgeItems.forEach(item => {
      this.knowledgeBase.set(item.id, item);
      this.updateSearchIndex(item);
    });
  }

  // 鎼滅储鐭ヨ瘑椤?  searchKnowledge(
    query: string,
    options?: {
      category?: string;
      type?: KnowledgeItem['type'];
      difficulty?: KnowledgeItem['difficulty'];
      tags?: string[];
    }
  ): KnowledgeItem[] {
    const searchTerms = query.toLowerCase().split(' ');
    const matchingIds = new Set<string>();

    // 鍩轰簬鍏抽敭璇嶆悳绱?    searchTerms.forEach(term => {
      const ids = this.searchIndex.get(term) || [];
      ids.forEach(id => matchingIds.add(id));
    });

    let results = Array.from(matchingIds)
      .map(id => this.knowledgeBase.get(id)!)
      .filter(item => item.status === 'published');

    // 搴旂敤杩囨护鏉′欢
    if (options?.category) {
      results = results.filter(item =>
        item.category.includes(options.category!)
      );
    }

    if (options?.type) {
      results = results.filter(item => item.type === options.type);
    }

    if (options?.difficulty) {
      results = results.filter(item => item.difficulty === options.difficulty);
    }

    if (options?.tags && options.tags.length > 0) {
      results = results.filter(item =>
        options.tags!.some(tag => item.tags.includes(tag))
      );
    }

    // 鎸夌浉鍏虫€у拰鏇存柊鏃堕棿鎺掑簭
    return results.sort((a, b) => {
      // 璁＄畻鐩稿叧鎬у緱鍒?      const scoreA = this.calculateRelevanceScore(a, query);
      const scoreB = this.calculateRelevanceScore(b, query);

      if (scoreA !== scoreB) {
        return scoreB - scoreA;
      }

      // 鐩稿叧鎬х浉鍚屾椂锛屾寜鏇存柊鏃堕棿鎺掑簭
      return b.updatedAt - a.updatedAt;
    });
  }

  // 鑾峰彇鎺ㄨ崘鐭ヨ瘑椤?  getRecommendations(userId: string, currentItemId?: string): KnowledgeItem[] {
    // 鍩轰簬鐢ㄦ埛琛屼负鍜屽綋鍓嶆祻瑙堝唴瀹规帹鑽?    const userHistory = this.getUserReadingHistory(userId);
    const currentItem = currentItemId
      ? this.knowledgeBase.get(currentItemId)
      : null;

    let candidates = Array.from(this.knowledgeBase.values()).filter(
      item => item.status === 'published'
    );

    // 濡傛灉鏈夊綋鍓嶉」锛屼紭鍏堟帹鑽愮浉鍏抽」
    if (currentItem) {
      const relatedItems = currentItem.relatedItems
        .map(id => this.knowledgeBase.get(id))
        .filter(Boolean) as KnowledgeItem[];

      const similarCategoryItems = candidates.filter(
        item =>
          item.id !== currentItem.id &&
          item.category.some(cat => currentItem.category.includes(cat))
      );

      const similarTagItems = candidates.filter(
        item =>
          item.id !== currentItem.id &&
          item.tags.some(tag => currentItem.tags.includes(tag))
      );

      candidates = [
        ...relatedItems,
        ...similarCategoryItems.slice(0, 3),
        ...similarTagItems.slice(0, 2),
      ];
    }

    // 鍩轰簬鐢ㄦ埛鍘嗗彶鎺ㄨ崘
    const userInterests = this.analyzeUserInterests(userHistory);
    candidates = candidates.concat(
      this.getItemsByInterests(userInterests).slice(0, 3)
    );

    // 鍘婚噸骞舵帓搴?    const uniqueItems = Array.from(
      new Map(candidates.map(item => [item.id, item])).values()
    );

    return uniqueItems
      .sort(
        (a, b) =>
          this.calculateRecommendationScore(b, userId) -
          this.calculateRecommendationScore(a, userId)
      )
      .slice(0, 5);
  }

  // 娣诲姞鐭ヨ瘑椤?  addKnowledgeItem(
    item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>
  ): string {
    const id = `knowledge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const knowledgeItem: KnowledgeItem = {
      ...item,
      id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      feedback: [],
    };

    this.knowledgeBase.set(id, knowledgeItem);
    this.updateSearchIndex(knowledgeItem);
    this.updateCategoryItemCount(item.category);

    return id;
  }

  // 鏇存柊鐭ヨ瘑椤?  updateKnowledgeItem(id: string, updates: Partial<KnowledgeItem>): boolean {
    const item = this.knowledgeBase.get(id);
    if (!item) return false;

    const updatedItem = { ...item, ...updates, updatedAt: Date.now() };
    this.knowledgeBase.set(id, updatedItem);
    this.updateSearchIndex(updatedItem);

    return true;
  }

  // 娣诲姞鍙嶉
  addFeedback(
    itemId: string,
    feedback: Omit<KnowledgeFeedback, 'id' | 'timestamp'>
  ): boolean {
    const item = this.knowledgeBase.get(itemId);
    if (!item) return false;

    const feedbackItem: KnowledgeFeedback = {
      ...feedback,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    item.feedback.push(feedbackItem);
    item.updatedAt = Date.now();

    return true;
  }

  // 鐢熸垚鐭ヨ瘑搴撴姤鍛?  generateKnowledgeReport(): KnowledgeReport {
    const items = Array.from(this.knowledgeBase.values());
    const categories = Array.from(this.categories.values());

    return {
      totalItems: items.length,
      publishedItems: items.filter(i => i.status === 'published').length,
      draftItems: items.filter(i => i.status === 'draft').length,
      categories: categories.length,
      averageRating: this.calculateAverageRating(items),
      mostPopularCategories: this.getMostPopularCategories(),
      recentlyUpdated: items
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          title: item.title,
          updatedAt: item.updatedAt,
        })),
      topRatedItems: items
        .filter(item => item.feedback.length > 0)
        .sort((a, b) => this.getAverageRating(b) - this.getAverageRating(a))
        .slice(0, 5)
        .map(item => ({
          id: item.id,
          title: item.title,
          rating: this.getAverageRating(item),
          feedbackCount: item.feedback.length,
        })),
    };
  }

  // 绉佹湁杈呭姪鏂规硶
  private updateSearchIndex(item: KnowledgeItem): void {
    const searchableText = [
      item.title,
      item.content,
      ...item.tags,
      ...item.category,
      item.author,
    ]
      .join(' ')
      .toLowerCase();

    const words = searchableText.split(/\s+/).filter(word => word.length > 2);

    words.forEach(word => {
      if (!this.searchIndex.has(word)) {
        this.searchIndex.set(word, []);
      }
      const itemIds = this.searchIndex.get(word)!;
      if (!itemIds.includes(item.id)) {
        itemIds.push(item.id);
      }
    });
  }

  private calculateRelevanceScore(item: KnowledgeItem, query: string): number {
    const queryTerms = query.toLowerCase().split(' ');
    let score = 0;

    queryTerms.forEach(term => {
      if (item.title.toLowerCase().includes(term)) score += 3;
      if (item.tags.some(tag => tag.toLowerCase().includes(term))) score += 2;
      if (item.category.some(cat => cat.toLowerCase().includes(term)))
        score += 2;
      if (item.content.toLowerCase().includes(term)) score += 1;
    });

    return score;
  }

  private getAverageRating(item: KnowledgeItem): number {
    if (item.feedback.length === 0) return 0;
    const totalRating = item.feedback.reduce(
      (sum, feedback) => sum + feedback.rating,
      0
    );
    return totalRating / item.feedback.length;
  }
}
```

#### 7.4.3 鎶€鏈垎浜埗搴?(Technical Sharing)

\*_鎶€鏈垎浜鐞嗙郴缁?_

```typescript
// src/core/sharing/TechSharingManager.ts
export interface TechSharingSession {
  id: string;
  title: string;
  description: string;
  presenter: string;
  presenterId: string;
  type: 'lightning-talk' | 'deep-dive' | 'demo' | 'workshop' | 'retrospective';
  category: string[];
  scheduledDate: number;
  duration: number; // 鍒嗛挓
  location: 'online' | 'office' | 'hybrid';
  meetingLink?: string;
  materials: SharingMaterial[];
  attendees: string[];
  maxAttendees?: number;
  status: 'draft' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  feedback: SessionFeedback[];
  recording?: {
    url: string;
    duration: number;
    transcription?: string;
  };
  followUpTasks: string[];
}

export interface SharingMaterial {
  type: 'slides' | 'code' | 'document' | 'video' | 'demo-link';
  title: string;
  url: string;
  description?: string;
}

export interface SessionFeedback {
  id: string;
  attendeeId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content?: string;
  usefulness: 1 | 2 | 3 | 4 | 5;
  clarity: 1 | 2 | 3 | 4 | 5;
  pacing: 1 | 2 | 3 | 4 | 5;
  suggestions?: string;
  timestamp: number;
}

export interface SharingTopic {
  id: string;
  title: string;
  description: string;
  suggestedBy: string;
  category: string[];
  priority: 'low' | 'medium' | 'high';
  complexity: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  prerequisites?: string[];
  learningObjectives: string[];
  votes: number;
  voterIds: string[];
  assignedTo?: string;
  status: 'suggested' | 'planned' | 'in-preparation' | 'completed';
  createdAt: number;
}

// 鎶€鏈垎浜鐞嗗櫒
export class TechSharingManager {
  private sessions: Map<string, TechSharingSession> = new Map();
  private topics: Map<string, SharingTopic> = new Map();
  private schedule: Map<string, string[]> = new Map(); // 鏃ユ湡 -> session IDs

  // 鍒嗕韩浼氳瘽妯℃澘
  private readonly SESSION_TEMPLATES = {
    'lightning-talk': {
      duration: 15,
      description: '蹇€熷垎浜竴涓妧鏈偣銆佸伐鍏锋垨缁忛獙',
      format: '5鍒嗛挓婕旂ず + 10鍒嗛挓璁ㄨ',
    },
    'deep-dive': {
      duration: 45,
      description: '娣卞叆鎺㈣鏌愪釜鎶€鏈富棰樼殑璁捐鍜屽疄鐜?,
      format: '30鍒嗛挓婕旂ず + 15鍒嗛挓璁ㄨ',
    },
    demo: {
      duration: 30,
      description: '婕旂ず鏂板姛鑳姐€佸伐鍏锋垨鎶€鏈殑瀹為檯浣跨敤',
      format: '20鍒嗛挓婕旂ず + 10鍒嗛挓璁ㄨ',
    },
    workshop: {
      duration: 90,
      description: '鍔ㄦ墜瀹炶返宸ヤ綔鍧婏紝杈瑰杈瑰仛',
      format: '15鍒嗛挓浠嬬粛 + 60鍒嗛挓瀹炶返 + 15鍒嗛挓鎬荤粨',
    },
    retrospective: {
      duration: 60,
      description: '椤圭洰鎴栨妧鏈疄鏂界殑鍥為【鍜岀粡楠屾€荤粨',
      format: '20鍒嗛挓鍥為【 + 30鍒嗛挓璁ㄨ + 10鍒嗛挓琛屽姩璁″垝',
    },
  };

  // 鍒涘缓鍒嗕韩浼氳瘽
  createSharingSession(sessionData: {
    title: string;
    description: string;
    presenterId: string;
    type: TechSharingSession['type'];
    category: string[];
    scheduledDate: number;
    location: TechSharingSession['location'];
    maxAttendees?: number;
  }): string {
    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const template = this.SESSION_TEMPLATES[sessionData.type];

    const session: TechSharingSession = {
      id,
      ...sessionData,
      presenter: this.getUserName(sessionData.presenterId),
      duration: template.duration,
      materials: [],
      attendees: [sessionData.presenterId], // 婕旇鑰呰嚜鍔ㄥ弬鍔?      status: 'draft',
      feedback: [],
      followUpTasks: [],
    };

    this.sessions.set(id, session);
    this.addToSchedule(sessionData.scheduledDate, id);

    // 鍙戦€佸垱寤洪€氱煡
    this.notifySessionCreated(session);

    return id;
  }

  // 寤鸿鍒嗕韩涓婚
  suggestTopic(topicData: {
    title: string;
    description: string;
    suggestedBy: string;
    category: string[];
    priority?: SharingTopic['priority'];
    complexity?: SharingTopic['complexity'];
    estimatedDuration?: number;
    prerequisites?: string[];
    learningObjectives: string[];
  }): string {
    const id = `topic-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const topic: SharingTopic = {
      id,
      priority: 'medium',
      complexity: 'intermediate',
      estimatedDuration: 30,
      ...topicData,
      votes: 1, // 寤鸿鑰呰嚜鍔ㄦ姇绁?      voterIds: [topicData.suggestedBy],
      status: 'suggested',
      createdAt: Date.now(),
    };

    this.topics.set(id, topic);

    // 鍙戦€佸缓璁€氱煡
    this.notifyTopicSuggested(topic);

    return id;
  }

  // 涓轰富棰樻姇绁?  voteForTopic(topicId: string, voterId: string): boolean {
    const topic = this.topics.get(topicId);
    if (!topic || topic.voterIds.includes(voterId)) {
      return false;
    }

    topic.votes += 1;
    topic.voterIds.push(voterId);

    this.topics.set(topicId, topic);
    return true;
  }

  // 璁ら涓婚杩涜鍑嗗
  claimTopic(topicId: string, presenterId: string): boolean {
    const topic = this.topics.get(topicId);
    if (!topic || topic.status !== 'suggested') {
      return false;
    }

    topic.assignedTo = presenterId;
    topic.status = 'in-preparation';

    this.topics.set(topicId, topic);

    // 鍙戦€佽棰嗛€氱煡
    this.notifyTopicClaimed(topic, presenterId);

    return true;
  }

  // 鍙傚姞鍒嗕韩浼氳瘽
  joinSession(sessionId: string, attendeeId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (
      !session ||
      session.status === 'cancelled' ||
      session.status === 'completed'
    ) {
      return false;
    }

    if (session.attendees.includes(attendeeId)) {
      return true; // 宸茬粡鍙傚姞浜?    }

    if (
      session.maxAttendees &&
      session.attendees.length >= session.maxAttendees
    ) {
      return false; // 浜烘暟宸叉弧
    }

    session.attendees.push(attendeeId);
    this.sessions.set(sessionId, session);

    // 鍙戦€佸弬鍔犵‘璁?    this.notifyAttendeeJoined(session, attendeeId);

    return true;
  }

  // 娣诲姞鍒嗕韩鏉愭枡
  addSessionMaterial(sessionId: string, material: SharingMaterial): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.materials.push(material);
    this.sessions.set(sessionId, session);

    // 閫氱煡鍙備笌鑰呮潗鏂欏凡娣诲姞
    this.notifyMaterialAdded(session, material);

    return true;
  }

  // 寮€濮嬪垎浜細璇?  startSession(sessionId: string, startedBy: string): boolean {
    const session = this.sessions.get(sessionId);
    if (
      !session ||
      session.presenterId !== startedBy ||
      session.status !== 'scheduled'
    ) {
      return false;
    }

    session.status = 'in-progress';
    this.sessions.set(sessionId, session);

    // 鍙戦€佸紑濮嬮€氱煡
    this.notifySessionStarted(session);

    return true;
  }

  // 瀹屾垚鍒嗕韩浼氳瘽
  completeSession(
    sessionId: string,
    completedBy: string,
    recording?: TechSharingSession['recording']
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (
      !session ||
      session.presenterId !== completedBy ||
      session.status !== 'in-progress'
    ) {
      return false;
    }

    session.status = 'completed';
    if (recording) {
      session.recording = recording;
    }

    this.sessions.set(sessionId, session);

    // 鍙戦€佸畬鎴愰€氱煡鍜屽弽棣堥個璇?    this.notifySessionCompleted(session);
    this.requestFeedback(session);

    return true;
  }

  // 娣诲姞浼氳瘽鍙嶉
  addSessionFeedback(
    sessionId: string,
    feedback: Omit<SessionFeedback, 'id' | 'timestamp'>
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.attendees.includes(feedback.attendeeId)) {
      return false;
    }

    const feedbackItem: SessionFeedback = {
      ...feedback,
      id: `feedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    session.feedback.push(feedbackItem);
    this.sessions.set(sessionId, session);

    return true;
  }

  // 鑾峰彇浼氳瘽鏃ョ▼瀹夋帓
  getSchedule(startDate: number, endDate: number): ScheduleItem[] {
    const schedule: ScheduleItem[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = start; date <= end; date.setDate(date.getDate() + 1)) {
      const dateKey = date.toISOString().split('T')[0];
      const sessionIds = this.schedule.get(dateKey) || [];

      sessionIds.forEach(sessionId => {
        const session = this.sessions.get(sessionId);
        if (session && session.status !== 'cancelled') {
          schedule.push({
            date: dateKey,
            session: {
              id: session.id,
              title: session.title,
              presenter: session.presenter,
              type: session.type,
              duration: session.duration,
              attendeeCount: session.attendees.length,
              maxAttendees: session.maxAttendees,
            },
          });
        }
      });
    }

    return schedule.sort((a, b) => a.date.localeCompare(b.date));
  }

  // 鑾峰彇鐑棬涓婚
  getPopularTopics(limit: number = 10): SharingTopic[] {
    return Array.from(this.topics.values())
      .filter(topic => topic.status === 'suggested')
      .sort((a, b) => {
        // 鍏堟寜绁ㄦ暟鎺掑簭
        if (a.votes !== b.votes) {
          return b.votes - a.votes;
        }
        // 绁ㄦ暟鐩稿悓鎸変紭鍏堢骇鎺掑簭
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, limit);
  }

  // 鐢熸垚鍒嗕韩鎶ュ憡
  generateSharingReport(period: { start: number; end: number }): SharingReport {
    const sessions = Array.from(this.sessions.values()).filter(
      session =>
        session.scheduledDate >= period.start &&
        session.scheduledDate <= period.end
    );

    const completedSessions = sessions.filter(s => s.status === 'completed');
    const totalAttendees = sessions.reduce(
      (total, session) => total + session.attendees.length,
      0
    );
    const totalFeedback = completedSessions.reduce(
      (total, session) => total + session.feedback.length,
      0
    );
    const averageRating =
      completedSessions.reduce((sum, session) => {
        const sessionAvg =
          session.feedback.length > 0
            ? session.feedback.reduce((s, f) => s + f.rating, 0) /
              session.feedback.length
            : 0;
        return sum + sessionAvg;
      }, 0) / (completedSessions.length || 1);

    return {
      period,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      cancelledSessions: sessions.filter(s => s.status === 'cancelled').length,
      totalAttendees,
      averageAttendeesPerSession: totalAttendees / (sessions.length || 1),
      totalFeedback,
      averageRating,
      topPresenters: this.getTopPresenters(completedSessions),
      popularCategories: this.getPopularCategories(sessions),
      sessionTypes: this.getSessionTypeDistribution(sessions),
      upcomingSessions: this.getUpcomingSessions(),
      suggestedTopics: Array.from(this.topics.values()).filter(
        t => t.status === 'suggested'
      ).length,
    };
  }

  // 绉佹湁杈呭姪鏂规硶
  private addToSchedule(date: number, sessionId: string): void {
    const dateKey = new Date(date).toISOString().split('T')[0];
    if (!this.schedule.has(dateKey)) {
      this.schedule.set(dateKey, []);
    }
    this.schedule.get(dateKey)!.push(sessionId);
  }

  private notifySessionCreated(session: TechSharingSession): void {
    // 瀹炵幇浼氳瘽鍒涘缓閫氱煡閫昏緫
    console.log(`馃搮 鏂板垎浜細璇濆垱寤? ${session.title} by ${session.presenter}`);
  }

  private notifyTopicSuggested(topic: SharingTopic): void {
    // 瀹炵幇涓婚寤鸿閫氱煡閫昏緫
    console.log(`馃挕 鏂颁富棰樺缓璁? ${topic.title}`);
  }

  private requestFeedback(session: TechSharingSession): void {
    // 鍚戝弬涓庤€呭彂閫佸弽棣堣姹?    session.attendees.forEach(attendeeId => {
      console.log(`馃摑 璇蜂负浼氳瘽 "${session.title}" 鎻愪緵鍙嶉`);
    });
  }
}

// 鍒嗕韩浼氳瘽宸ュ巶绫?export class SharingSessionFactory {
  static createLightningTalk(data: {
    title: string;
    presenterId: string;
    techStack: string[];
    keyTakeaway: string;
  }): Partial<TechSharingSession> {
    return {
      title: data.title,
      description: `鈿?蹇€熷垎浜? ${data.keyTakeaway}`,
      type: 'lightning-talk',
      category: data.techStack,
      duration: 15,
    };
  }

  static createTechDeepDive(data: {
    title: string;
    presenterId: string;
    technology: string;
    architecture: string[];
    problems: string[];
    solutions: string[];
  }): Partial<TechSharingSession> {
    return {
      title: data.title,
      description:
        `馃攳 娣卞叆鎺㈣ ${data.technology} 鐨勮璁″拰瀹炵幇\n\n` +
        `瑙ｅ喅鐨勯棶棰?\n${data.problems.map(p => `鈥?${p}`).join('\n')}\n\n` +
        `鎶€鏈柟妗?\n${data.solutions.map(s => `鈥?${s}`).join('\n')}`,
      type: 'deep-dive',
      category: [data.technology, ...data.architecture],
      duration: 45,
    };
  }

  static createHandsOnWorkshop(data: {
    title: string;
    presenterId: string;
    skills: string[];
    tools: string[];
    prerequisites: string[];
    outcomes: string[];
  }): Partial<TechSharingSession> {
    return {
      title: data.title,
      description:
        `馃洜锔?鍔ㄦ墜宸ヤ綔鍧奬n\n` +
        `瀛︿範鐩爣:\n${data.outcomes.map(o => `鈥?${o}`).join('\n')}\n\n` +
        `浣跨敤宸ュ叿:\n${data.tools.map(t => `鈥?${t}`).join('\n')}\n\n` +
        `鍓嶇疆瑕佹眰:\n${data.prerequisites.map(p => `鈥?${p}`).join('\n')}`,
      type: 'workshop',
      category: data.skills,
      duration: 90,
    };
  }
}
```

## 绗?绔狅細鍔熻兘绾靛垏锛堣瀺鍚堝浗闄呭寲鏀寔+鍓嶇鏋舵瀯璁捐锛?

> **璁捐鍘熷垯**: 瀹炵幇瀹屾暣鐨勫姛鑳界旱鍒囷紝浠庡墠绔疷I鍒板悗绔暟鎹紝纭繚鍥介檯鍖栨敮鎸佸拰鍝嶅簲寮忚璁★紝涓篈I浠ｇ爜鐢熸垚鎻愪緵娓呮櫚鐨勫姛鑳借竟鐣?

### 8.1 鍥介檯鍖栨敮鎸佹灦鏋?

#### 8.1.1 i18next瀹屾暣閰嶇疆

```typescript
// src/core/i18n/i18nConfig.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-fs-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// 鏀寔鐨勮瑷€鍒楄〃
export const SUPPORTED_LANGUAGES = {
  'zh-CN': {
    name: '绠€浣撲腑鏂?,
    flag: '馃嚚馃嚦',
    direction: 'ltr',
  },
  'zh-TW': {
    name: '绻侀珨涓枃',
    flag: '馃嚬馃嚰',
    direction: 'ltr',
  },
  en: {
    name: 'English',
    flag: '馃嚭馃嚫',
    direction: 'ltr',
  },
  ja: {
    name: '鏃ユ湰瑾?,
    flag: '馃嚡馃嚨',
    direction: 'ltr',
  },
  ko: {
    name: '頃滉淡鞏?,
    flag: '馃嚢馃嚪',
    direction: 'ltr',
  },
  es: {
    name: 'Espa帽ol',
    flag: '馃嚜馃嚫',
    direction: 'ltr',
  },
  fr: {
    name: 'Fran莽ais',
    flag: '馃嚝馃嚪',
    direction: 'ltr',
  },
  de: {
    name: 'Deutsch',
    flag: '馃嚛馃嚜',
    direction: 'ltr',
  },
  ru: {
    name: '袪褍褋褋泻懈泄',
    flag: '馃嚪馃嚭',
    direction: 'ltr',
  },
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// i18n閰嶇疆
i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // 榛樿璇█
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',

    // 璋冭瘯妯″紡
    debug: process.env.NODE_ENV === 'development',

    // 鍛藉悕绌洪棿
    defaultNS: 'common',
    ns: [
      'common', // 閫氱敤缈昏瘧
      'ui', // UI鐣岄潰
      'game', // 娓告垙鍐呭
      'guild', // 鍏細绯荤粺
      'combat', // 鎴樻枟绯荤粺
      'economy', // 缁忔祹绯荤粺
      'social', // 绀句氦绯荤粺
      'settings', // 璁剧疆鐣岄潰
      'errors', // 閿欒淇℃伅
      'validation', // 琛ㄥ崟楠岃瘉
    ],

    // 璇█妫€娴嬮厤缃?    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },

    // 鍚庣閰嶇疆锛堟枃浠剁郴缁燂級
    backend: {
      loadPath: './src/assets/locales/{{lng}}/{{ns}}.json',
    },

    // 鎻掑€奸厤缃?    interpolation: {
      escapeValue: false, // React宸茬粡杞箟
      format: (value, format, lng) => {
        if (format === 'number') {
          return new Intl.NumberFormat(lng).format(value);
        }
        if (format === 'currency') {
          return new Intl.NumberFormat(lng, {
            style: 'currency',
            currency: 'CNY', // 榛樿璐у竵
          }).format(value);
        }
        if (format === 'date') {
          return new Intl.DateTimeFormat(lng).format(new Date(value));
        }
        if (format === 'time') {
          return new Intl.DateTimeFormat(lng, {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(value));
        }
        return value;
      },
    },

    // React閰嶇疆
    react: {
      useSuspense: true,
      bindI18n: 'languageChanged',
      bindI18nStore: 'added removed',
    },
  });

export default i18n;
```

#### 8.1.2 璇█璧勬簮鏂囦欢缁撴瀯

```json
// src/assets/locales/zh-CN/common.json
{
  "app": {
    "name": "鍏細缁忕悊",
    "version": "鐗堟湰 {{version}}",
    "loading": "鍔犺浇涓?..",
    "error": "鍙戠敓閿欒",
    "success": "鎿嶄綔鎴愬姛",
    "confirm": "纭",
    "cancel": "鍙栨秷",
    "save": "淇濆瓨",
    "delete": "鍒犻櫎",
    "edit": "缂栬緫",
    "create": "鍒涘缓",
    "search": "鎼滅储",
    "filter": "绛涢€?,
    "sort": "鎺掑簭",
    "refresh": "鍒锋柊"
  },
  "navigation": {
    "dashboard": "浠〃鏉?,
    "guild": "鍏細绠＄悊",
    "combat": "鎴樻枟涓績",
    "economy": "缁忔祹绯荤粺",
    "social": "绀句氦浜掑姩",
    "settings": "绯荤粺璁剧疆"
  },
  "time": {
    "now": "鍒氬垰",
    "minutesAgo": "{{count}}鍒嗛挓鍓?,
    "hoursAgo": "{{count}}灏忔椂鍓?,
    "daysAgo": "{{count}}澶╁墠",
    "weeksAgo": "{{count}}鍛ㄥ墠",
    "monthsAgo": "{{count}}涓湀鍓?
  },
  "units": {
    "gold": "閲戝竵",
    "experience": "缁忛獙鍊?,
    "level": "绛夌骇",
    "member": "鎴愬憳",
    "member_other": "鎴愬憳"
  }
}

// src/assets/locales/zh-CN/guild.json
{
  "guild": {
    "name": "鍏細鍚嶇О",
    "description": "鍏細鎻忚堪",
    "level": "鍏細绛夌骇",
    "experience": "鍏細缁忛獙",
    "memberCount": "鎴愬憳鏁伴噺",
    "memberLimit": "鎴愬憳涓婇檺",
    "treasury": "鍏細閲戝簱",
    "created": "鍒涘缓鏃堕棿"
  },
  "actions": {
    "createGuild": "鍒涘缓鍏細",
    "joinGuild": "鍔犲叆鍏細",
    "leaveGuild": "閫€鍑哄叕浼?,
    "disbandGuild": "瑙ｆ暎鍏細",
    "inviteMember": "閭€璇锋垚鍛?,
    "kickMember": "韪㈠嚭鎴愬憳",
    "promoteMember": "鎻愬崌鎴愬憳",
    "demoteMember": "闄嶇骇鎴愬憳"
  },
  "roles": {
    "leader": "浼氶暱",
    "viceLeader": "鍓細闀?,
    "officer": "骞蹭簨",
    "elite": "绮捐嫳鎴愬憳",
    "member": "鏅€氭垚鍛?
  },
  "messages": {
    "guildCreated": "鍏細銆妠{name}}銆嬪垱寤烘垚鍔燂紒",
    "memberJoined": "{{name}} 鍔犲叆浜嗗叕浼?,
    "memberLeft": "{{name}} 绂诲紑浜嗗叕浼?,
    "memberPromoted": "{{name}} 琚彁鍗囦负 {{role}}",
    "insufficientPermissions": "鏉冮檺涓嶈冻",
    "guildFull": "鍏細宸叉弧鍛?,
    "alreadyInGuild": "鎮ㄥ凡缁忓湪鍏細涓?
  }
}

// src/assets/locales/en/common.json
{
  "app": {
    "name": "Guild Manager",
    "version": "Version {{version}}",
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Operation successful",
    "confirm": "Confirm",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "refresh": "Refresh"
  },
  "navigation": {
    "dashboard": "Dashboard",
    "guild": "Guild Management",
    "combat": "Combat Center",
    "economy": "Economic System",
    "social": "Social Interaction",
    "settings": "Settings"
  }
}
```

#### 8.1.3 澶氳瑷€Hook涓庣粍浠?

```typescript
// src/hooks/useTranslation.ts - 澧炲己鐨勭炕璇慔ook
import { useTranslation as useI18nTranslation, UseTranslationOptions } from 'react-i18next';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '@/core/i18n/i18nConfig';
import { useMemo } from 'react';

export interface ExtendedTranslationOptions extends UseTranslationOptions {
  // 鍚敤鏍煎紡鍖栧姛鑳?  enableFormatting?: boolean;
  // 榛樿鎻掑€煎弬鏁?  defaultInterpolation?: Record<string, any>;
}

export function useTranslation(
  ns?: string | string[],
  options?: ExtendedTranslationOptions
) {
  const { t, i18n, ready } = useI18nTranslation(ns, options);

  // 澧炲己鐨勭炕璇戝嚱鏁?  const translate = useMemo(() => {
    return (key: string, params?: any) => {
      const defaultParams = options?.defaultInterpolation || {};
      const mergedParams = { ...defaultParams, ...params };

      // 濡傛灉鍚敤鏍煎紡鍖栵紝鑷姩娣诲姞璇█鐜
      if (options?.enableFormatting) {
        mergedParams.lng = i18n.language;
      }

      return t(key, mergedParams);
    };
  }, [t, i18n.language, options?.defaultInterpolation, options?.enableFormatting]);

  // 璇█鍒囨崲鍑芥暟
  const changeLanguage = async (lng: SupportedLanguage) => {
    await i18n.changeLanguage(lng);

    // 淇濆瓨鍒版湰鍦板瓨鍌?    localStorage.setItem('i18nextLng', lng);

    // 鏇存柊鏂囨。璇█
    document.documentElement.lang = lng;

    // 鏇存柊鏂囨。鏂瑰悜锛圧TL鏀寔锛?    document.documentElement.dir = SUPPORTED_LANGUAGES[lng].direction;
  };

  // 鑾峰彇褰撳墠璇█淇℃伅
  const currentLanguage = useMemo(() => {
    const lng = i18n.language as SupportedLanguage;
    return SUPPORTED_LANGUAGES[lng] || SUPPORTED_LANGUAGES['zh-CN'];
  }, [i18n.language]);

  // 鏍煎紡鍖栨暟瀛?  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) => {
    return new Intl.NumberFormat(i18n.language, options).format(value);
  };

  // 鏍煎紡鍖栬揣甯?  const formatCurrency = (value: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat(i18n.language, {
      style: 'currency',
      currency
    }).format(value);
  };

  // 鏍煎紡鍖栨棩鏈?  const formatDate = (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => {
    return new Intl.DateTimeFormat(i18n.language, options).format(new Date(date));
  };

  // 鏍煎紡鍖栫浉瀵规椂闂?  const formatRelativeTime = (date: Date | string | number) => {
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' });
    const now = Date.now();
    const target = new Date(date).getTime();
    const diffInSeconds = (target - now) / 1000;

    const intervals = [
      { unit: 'year', seconds: 31536000 },
      { unit: 'month', seconds: 2592000 },
      { unit: 'week', seconds: 604800 },
      { unit: 'day', seconds: 86400 },
      { unit: 'hour', seconds: 3600 },
      { unit: 'minute', seconds: 60 }
    ] as const;

    for (const { unit, seconds } of intervals) {
      const diff = Math.round(diffInSeconds / seconds);
      if (Math.abs(diff) >= 1) {
        return rtf.format(diff, unit);
      }
    }

    return rtf.format(0, 'second');
  };

  return {
    t: translate,
    i18n,
    ready,
    changeLanguage,
    currentLanguage,
    formatNumber,
    formatCurrency,
    formatDate,
    formatRelativeTime
  };
}

// 澶氳瑷€鏂囨湰缁勪欢
export interface TranslationProps {
  i18nKey: string;
  values?: Record<string, any>;
  components?: Record<string, React.ReactElement>;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function Translation({
  i18nKey,
  values,
  components,
  className,
  as: Component = 'span'
}: TranslationProps) {
  const { t } = useTranslation();

  return (
    <Component className={className}>
      {t(i18nKey, { ...values, components })}
    </Component>
  );
}

// 璇█鍒囨崲鍣ㄧ粍浠?export function LanguageSwitcher() {
  const { i18n, changeLanguage, currentLanguage } = useTranslation();

  return (
    <div className="language-switcher">
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value as SupportedLanguage)}
        className="language-select"
      >
        {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
          <option key={code} value={code}>
            {info.flag} {info.name}
          </option>
        ))}
      </select>
    </div>
  );
}

// 澶氳瑷€鏁板瓧鏄剧ず缁勪欢
export interface LocalizedNumberProps {
  value: number;
  style?: 'decimal' | 'currency' | 'percent';
  currency?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  className?: string;
}

export function LocalizedNumber({
  value,
  style = 'decimal',
  currency = 'CNY',
  minimumFractionDigits,
  maximumFractionDigits,
  className
}: LocalizedNumberProps) {
  const { formatNumber, formatCurrency } = useTranslation();

  const formattedValue = useMemo(() => {
    if (style === 'currency') {
      return formatCurrency(value, currency);
    } else if (style === 'percent') {
      return formatNumber(value, {
        style: 'percent',
        minimumFractionDigits,
        maximumFractionDigits
      });
    } else {
      return formatNumber(value, {
        minimumFractionDigits,
        maximumFractionDigits
      });
    }
  }, [value, style, currency, minimumFractionDigits, maximumFractionDigits, formatNumber, formatCurrency]);

  return <span className={className}>{formattedValue}</span>;
}

// 澶氳瑷€鏃ユ湡鏄剧ず缁勪欢
export interface LocalizedDateProps {
  date: Date | string | number;
  format?: 'full' | 'long' | 'medium' | 'short' | 'relative';
  className?: string;
}

export function LocalizedDate({ date, format = 'medium', className }: LocalizedDateProps) {
  const { formatDate, formatRelativeTime } = useTranslation();

  const formattedDate = useMemo(() => {
    if (format === 'relative') {
      return formatRelativeTime(date);
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      full: { dateStyle: 'full', timeStyle: 'short' },
      long: { dateStyle: 'long', timeStyle: 'short' },
      medium: { dateStyle: 'medium', timeStyle: 'short' },
      short: { dateStyle: 'short', timeStyle: 'short' }
    }[format] || { dateStyle: 'medium' };

    return formatDate(date, formatOptions);
  }, [date, format, formatDate, formatRelativeTime]);

  return <time className={className}>{formattedDate}</time>;
}
```

### 8.2 React 19鍓嶇鏋舵瀯

#### 8.2.1 鐘舵€佺鐞嗘灦鏋?

```typescript
// src/stores/useGameStore.ts - Zustand鐘舵€佺鐞?import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// 娓告垙鐘舵€佹帴鍙?interface GameState {
  // 鐢ㄦ埛淇℃伅
  user: {
    id: string;
    username: string;
    level: number;
    experience: number;
    coins: number;
  } | null;

  // 鍏細淇℃伅
  guild: {
    id: string;
    name: string;
    level: number;
    memberCount: number;
    memberLimit: number;
    resources: Record<string, number>;
  } | null;

  // UI鐘舵€?  ui: {
    activeTab: string;
    sidebarCollapsed: boolean;
    theme: 'light' | 'dark' | 'system';
    notifications: Notification[];
    modals: Modal[];
  };

  // 娓告垙璁剧疆
  settings: {
    language: string;
    soundEnabled: boolean;
    musicVolume: number;
    effectVolume: number;
    autoSave: boolean;
    notifications: {
      desktop: boolean;
      sound: boolean;
    };
  };

  // 缂撳瓨鏁版嵁
  cache: {
    guilds: Guild[];
    members: GuildMember[];
    battles: Battle[];
    lastUpdated: Record<string, number>;
  };
}

// 鐘舵€佹搷浣滄帴鍙?interface GameActions {
  // 鐢ㄦ埛鎿嶄綔
  setUser: (user: GameState['user']) => void;
  updateUserCoins: (amount: number) => void;
  updateUserExperience: (amount: number) => void;

  // 鍏細鎿嶄綔
  setGuild: (guild: GameState['guild']) => void;
  updateGuildResources: (resources: Record<string, number>) => void;

  // UI鎿嶄綔
  setActiveTab: (tab: string) => void;
  toggleSidebar: () => void;
  setTheme: (theme: GameState['ui']['theme']) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  openModal: (modal: Modal) => void;
  closeModal: (id: string) => void;

  // 璁剧疆鎿嶄綔
  updateSettings: (settings: Partial<GameState['settings']>) => void;

  // 缂撳瓨鎿嶄綔
  updateCache: <T extends keyof GameState['cache']>(
    key: T,
    data: GameState['cache'][T]
  ) => void;
  invalidateCache: (key?: keyof GameState['cache']) => void;

  // 閲嶇疆鎿嶄綔
  resetGame: () => void;
}

type GameStore = GameState & GameActions;

// 鍒濆鐘舵€?const initialState: GameState = {
  user: null,
  guild: null,
  ui: {
    activeTab: 'dashboard',
    sidebarCollapsed: false,
    theme: 'system',
    notifications: [],
    modals: [],
  },
  settings: {
    language: 'zh-CN',
    soundEnabled: true,
    musicVolume: 0.7,
    effectVolume: 0.8,
    autoSave: true,
    notifications: {
      desktop: true,
      sound: true,
    },
  },
  cache: {
    guilds: [],
    members: [],
    battles: [],
    lastUpdated: {},
  },
};

// 鍒涘缓store
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        // 鐢ㄦ埛鎿嶄綔瀹炵幇
        setUser: user =>
          set(state => {
            state.user = user;
          }),

        updateUserCoins: amount =>
          set(state => {
            if (state.user) {
              state.user.coins = Math.max(0, state.user.coins + amount);
            }
          }),

        updateUserExperience: amount =>
          set(state => {
            if (state.user) {
              state.user.experience += amount;

              // 鑷姩鍗囩骇閫昏緫
              const newLevel = Math.floor(state.user.experience / 1000) + 1;
              if (newLevel > state.user.level) {
                state.user.level = newLevel;

                // 鍙戦€佸崌绾ч€氱煡
                state.ui.notifications.push({
                  id: `level-up-${Date.now()}`,
                  type: 'success',
                  title: '绛夌骇鎻愬崌',
                  message: `鎭枩锛佹偍鐨勭瓑绾ф彁鍗囧埌浜?${newLevel}`,
                  timestamp: Date.now(),
                });
              }
            }
          }),

        // 鍏細鎿嶄綔瀹炵幇
        setGuild: guild =>
          set(state => {
            state.guild = guild;
          }),

        updateGuildResources: resources =>
          set(state => {
            if (state.guild) {
              Object.assign(state.guild.resources, resources);
            }
          }),

        // UI鎿嶄綔瀹炵幇
        setActiveTab: tab =>
          set(state => {
            state.ui.activeTab = tab;
          }),

        toggleSidebar: () =>
          set(state => {
            state.ui.sidebarCollapsed = !state.ui.sidebarCollapsed;
          }),

        setTheme: theme =>
          set(state => {
            state.ui.theme = theme;

            // 搴旂敤涓婚鍒版枃妗?            const root = document.documentElement;
            if (theme === 'dark') {
              root.classList.add('dark');
            } else if (theme === 'light') {
              root.classList.remove('dark');
            } else {
              // 绯荤粺涓婚
              const isDark = window.matchMedia(
                '(prefers-color-scheme: dark)'
              ).matches;
              root.classList.toggle('dark', isDark);
            }
          }),

        addNotification: notification =>
          set(state => {
            state.ui.notifications.push({
              ...notification,
              id: notification.id || `notification-${Date.now()}`,
              timestamp: notification.timestamp || Date.now(),
            });

            // 闄愬埗閫氱煡鏁伴噺
            if (state.ui.notifications.length > 10) {
              state.ui.notifications = state.ui.notifications.slice(-10);
            }
          }),

        removeNotification: id =>
          set(state => {
            const index = state.ui.notifications.findIndex(n => n.id === id);
            if (index !== -1) {
              state.ui.notifications.splice(index, 1);
            }
          }),

        openModal: modal =>
          set(state => {
            state.ui.modals.push({
              ...modal,
              id: modal.id || `modal-${Date.now()}`,
            });
          }),

        closeModal: id =>
          set(state => {
            const index = state.ui.modals.findIndex(m => m.id === id);
            if (index !== -1) {
              state.ui.modals.splice(index, 1);
            }
          }),

        // 璁剧疆鎿嶄綔瀹炵幇
        updateSettings: newSettings =>
          set(state => {
            Object.assign(state.settings, newSettings);
          }),

        // 缂撳瓨鎿嶄綔瀹炵幇
        updateCache: (key, data) =>
          set(state => {
            state.cache[key] = data;
            state.cache.lastUpdated[key] = Date.now();
          }),

        invalidateCache: key =>
          set(state => {
            if (key) {
              delete state.cache.lastUpdated[key];
            } else {
              state.cache.lastUpdated = {};
            }
          }),

        // 閲嶇疆鎿嶄綔
        resetGame: () =>
          set(() => ({
            ...initialState,
            settings: get().settings, // 淇濈暀璁剧疆
          })),
      })),
      {
        name: 'game-store',
        partialize: state => ({
          user: state.user,
          guild: state.guild,
          settings: state.settings,
        }),
      }
    ),
    {
      name: 'game-store',
    }
  )
);

// 閫夋嫨鍣℉ook
export const useUser = () => useGameStore(state => state.user);
export const useGuild = () => useGameStore(state => state.guild);
export const useUI = () => useGameStore(state => state.ui);
export const useSettings = () => useGameStore(state => state.settings);
```

#### 8.2.2 React Query鏁版嵁鑾峰彇

```typescript
// src/hooks/useQueries.ts - React Query鏁版嵁鑾峰彇
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useGameStore } from '@/stores/useGameStore';
import * as api from '@/api';

// 鏌ヨ閿伐鍘?export const queryKeys = {
  all: ['game'] as const,
  guilds: () => [...queryKeys.all, 'guilds'] as const,
  guild: (id: string) => [...queryKeys.guilds(), id] as const,
  guildMembers: (guildId: string) =>
    [...queryKeys.guild(guildId), 'members'] as const,
  battles: () => [...queryKeys.all, 'battles'] as const,
  battle: (id: string) => [...queryKeys.battles(), id] as const,
  economy: () => [...queryKeys.all, 'economy'] as const,
  auctions: () => [...queryKeys.economy(), 'auctions'] as const,
  user: () => [...queryKeys.all, 'user'] as const,
  userStats: () => [...queryKeys.user(), 'stats'] as const,
};

// 鍏細鐩稿叧鏌ヨ
export function useGuilds() {
  return useQuery({
    queryKey: queryKeys.guilds(),
    queryFn: api.getGuilds,
    staleTime: 5 * 60 * 1000, // 5鍒嗛挓
    gcTime: 10 * 60 * 1000, // 10鍒嗛挓
  });
}

export function useGuild(guildId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.guild(guildId!),
    queryFn: () => api.getGuild(guildId!),
    enabled: !!guildId,
    staleTime: 2 * 60 * 1000, // 2鍒嗛挓
  });
}

export function useGuildMembers(guildId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.guildMembers(guildId!),
    queryFn: () => api.getGuildMembers(guildId!),
    enabled: !!guildId,
    staleTime: 1 * 60 * 1000, // 1鍒嗛挓
  });
}

// 鍏細鍙樻洿鎿嶄綔
export function useCreateGuild() {
  const queryClient = useQueryClient();
  const { setGuild } = useGameStore();

  return useMutation({
    mutationFn: api.createGuild,
    onSuccess: newGuild => {
      // 鏇存柊鏈湴鐘舵€?      setGuild(newGuild);

      // 浣跨紦瀛樺け鏁?      queryClient.invalidateQueries({ queryKey: queryKeys.guilds() });

      // 娣诲姞鎴愬姛閫氱煡
      useGameStore.getState().addNotification({
        type: 'success',
        title: '鍏細鍒涘缓鎴愬姛',
        message: `鍏細銆?{newGuild.name}銆嬪垱寤烘垚鍔燂紒`,
      });
    },
    onError: error => {
      useGameStore.getState().addNotification({
        type: 'error',
        title: '鍏細鍒涘缓澶辫触',
        message: error.message,
      });
    },
  });
}

export function useJoinGuild() {
  const queryClient = useQueryClient();
  const { setGuild } = useGameStore();

  return useMutation({
    mutationFn: ({ guildId, userId }: { guildId: string; userId: string }) =>
      api.joinGuild(guildId, userId),
    onSuccess: (guild, { guildId }) => {
      // 鏇存柊鏈湴鐘舵€?      setGuild(guild);

      // 鏇存柊鐩稿叧缂撳瓨
      queryClient.invalidateQueries({ queryKey: queryKeys.guild(guildId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.guildMembers(guildId),
      });

      // 娣诲姞鎴愬姛閫氱煡
      useGameStore.getState().addNotification({
        type: 'success',
        title: '鍔犲叆鍏細鎴愬姛',
        message: `鎴愬姛鍔犲叆鍏細銆?{guild.name}銆媊,
      });
    },
    onError: error => {
      useGameStore.getState().addNotification({
        type: 'error',
        title: '鍔犲叆鍏細澶辫触',
        message: error.message,
      });
    },
  });
}

// 鎴樻枟鐩稿叧鏌ヨ
export function useBattles() {
  return useQuery({
    queryKey: queryKeys.battles(),
    queryFn: api.getBattles,
    staleTime: 30 * 1000, // 30绉?    refetchInterval: 60 * 1000, // 1鍒嗛挓鑷姩鍒锋柊
  });
}

export function useBattle(battleId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.battle(battleId!),
    queryFn: () => api.getBattle(battleId!),
    enabled: !!battleId,
    staleTime: 10 * 1000, // 10绉?    refetchInterval: data => {
      // 濡傛灉鎴樻枟杩樺湪杩涜涓紝姣?绉掑埛鏂?      return data?.status === 'active' ? 5 * 1000 : false;
    },
  });
}

// 鎴樻枟鎿嶄綔
export function useInitiateBattle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.initiateBattle,
    onSuccess: battle => {
      // 浣挎垬鏂楀垪琛ㄧ紦瀛樺け鏁?      queryClient.invalidateQueries({ queryKey: queryKeys.battles() });

      // 娣诲姞鏂版垬鏂楀埌缂撳瓨
      queryClient.setQueryData(queryKeys.battle(battle.id), battle);

      // 娣诲姞鎴愬姛閫氱煡
      useGameStore.getState().addNotification({
        type: 'success',
        title: '鎴樻枟寮€濮?,
        message: '鎴樻枟宸叉垚鍔熷彂璧凤紒',
      });
    },
    onError: error => {
      useGameStore.getState().addNotification({
        type: 'error',
        title: '鍙戣捣鎴樻枟澶辫触',
        message: error.message,
      });
    },
  });
}

// 缁忔祹绯荤粺鏌ヨ
export function useAuctions() {
  return useQuery({
    queryKey: queryKeys.auctions(),
    queryFn: api.getAuctions,
    staleTime: 30 * 1000, // 30绉?    refetchInterval: 60 * 1000, // 1鍒嗛挓鑷姩鍒锋柊
  });
}

export function usePlaceBid() {
  const queryClient = useQueryClient();
  const { updateUserCoins } = useGameStore();

  return useMutation({
    mutationFn: ({
      auctionId,
      bidAmount,
    }: {
      auctionId: string;
      bidAmount: number;
    }) => api.placeBid(auctionId, bidAmount),
    onSuccess: (result, { bidAmount }) => {
      // 鏇存柊鐢ㄦ埛閲戝竵锛堜箰瑙傛洿鏂帮級
      updateUserCoins(-bidAmount);

      // 浣挎媿鍗栫紦瀛樺け鏁?      queryClient.invalidateQueries({ queryKey: queryKeys.auctions() });

      // 娣诲姞鎴愬姛閫氱煡
      useGameStore.getState().addNotification({
        type: 'success',
        title: '绔炰环鎴愬姛',
        message: `鎴愬姛鍑轰环 ${bidAmount} 閲戝竵`,
      });
    },
    onError: (error, { bidAmount }) => {
      // 鍥炴粴涔愯鏇存柊
      updateUserCoins(bidAmount);

      useGameStore.getState().addNotification({
        type: 'error',
        title: '绔炰环澶辫触',
        message: error.message,
      });
    },
  });
}

// 鐢ㄦ埛缁熻鏌ヨ
export function useUserStats() {
  const user = useUser();

  return useQuery({
    queryKey: queryKeys.userStats(),
    queryFn: () => api.getUserStats(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5鍒嗛挓
  });
}

// 棰勫姞杞紿ook
export function usePrefetch() {
  const queryClient = useQueryClient();

  const prefetchGuild = (guildId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.guild(guildId),
      queryFn: () => api.getGuild(guildId),
      staleTime: 2 * 60 * 1000,
    });
  };

  const prefetchBattle = (battleId: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.battle(battleId),
      queryFn: () => api.getBattle(battleId),
      staleTime: 10 * 1000,
    });
  };

  return {
    prefetchGuild,
    prefetchBattle,
  };
}
```

杩欎釜鏂囦欢5瀹屾垚浜嗗紑鍙戠幆澧冧笌鍔熻兘瀹炵幇鐨勮缁嗗唴瀹癸紝鍖呭惈浜嗗畬鏁寸殑寮€鍙戝伐鍏烽摼閰嶇疆銆佸浗闄呭寲鏀寔鏋舵瀯銆丷eact 19鐘舵€佺鐞嗙瓑鏍稿績鍐呭銆傜幇鍦ㄨ鎴戝垱寤烘渶鍚庝竴涓枃浠?銆?
<function_calls>
<invoke name="TodoWrite">
<parameter name="todos">[{"content": "\u521b\u5efa\u589e\u5f3a\u7248AI\u4f18\u5148\u67b6\u6784\u6587\u6863\uff0c\u6574\u5408\u539f\u724819\u7ae0\u6240\u6709\u5185\u5bb9", "status": "in_progress", "id": "create_enhanced_ai_first_doc"}, {"content": "\u6587\u4ef61\uff1a\u57fa\u7840\u7ea6\u675f\u4e0e\u5b89\u5168\u9632\u62a4\uff08\u7b2c1-2\u7ae0\uff09", "status": "completed", "id": "create_file1_constraints_security"}, {"content": "\u7ea6\u675f\u4e0e\u76ee\u6807\uff08\u878d\u5408\u98ce\u9669\u8bc4\u4f30+\u5f00\u53d1\u89c4\u8303\uff09", "status": "completed", "id": "enhance_chapter1_constraints"}, {"content": "\u5a01\u80c1\u6a21\u578b\u4e0e\u5b89\u5168\u57fa\u7ebf\uff08\u878d\u5408\u5b89\u5168\u8bbe\u8ba1+Electron\u62a4\u680f\uff09", "status": "completed", "id": "enhance_chapter2_security"}, {"content": "\u6587\u4ef62\uff1a\u8d28\u91cf\u6cd5\u89c4\u4e0e\u6d4b\u8bd5\u7b56\u7565\uff08\u7b2c3\u7ae0\uff09", "status": "completed", "id": "create_file2_testing"}, {"content": "\u6d4b\u8bd5\u7b56\u7565\u4e0e\u8d28\u91cf\u95e8\u7981\uff08\u76f4\u63a5\u91c7\u7528\u6df7\u5408\u4f18\u5316\u7248\u6cd5\u89c4\u4e2d\u5fc3\uff09", "status": "completed", "id": "insert_chapter3_testing"}, {"content": "\u6587\u4ef63\uff1a\u7cfb\u7edf\u67b6\u6784\u4e0e\u6570\u636e\u8bbe\u8ba1\uff08\u7b2c4-5\u7ae0\uff09", "status": "completed", "id": "create_file3_system_data"}, {"content": "\u7cfb\u7edf\u4e0a\u4e0b\u6587\u4e0eC4+\u4e8b\u4ef6\u6d41\uff08\u878d\u5408API\u67b6\u6784\u7cfb\u5217\uff09", "status": "completed", "id": "enhance_chapter4_context"}, {"content": "\u6570\u636e\u6a21\u578b\u4e0e\u5b58\u50a8\u7aef\u53e3\uff08\u878d\u5408\u6570\u636e\u5e93\u8bbe\u8ba1+\u4e1a\u52a1\u903b\u8f91\uff09", "status": "completed", "id": "enhance_chapter5_data"}, {"content": "\u6587\u4ef64\uff1a\u6838\u5fc3\u5b9e\u73b0\u4e0eAI\u5f15\u64ce\uff08\u7b2c6\u7ae0\uff09", "status": "completed", "id": "create_file4_runtime_ai"}, {"content": "\u8fd0\u884c\u65f6\u89c6\u56fe\uff08\u878d\u5408\u6e38\u620f\u6838\u5fc3\u7cfb\u7edf+AI\u5f15\u64ce\u8be6\u7ec6\u67b6\u6784\uff09", "status": "completed", "id": "enhance_chapter6_runtime"}, {"content": "\u6587\u4ef65\uff1a\u5f00\u53d1\u73af\u5883\u4e0e\u529f\u80fd\u5b9e\u73b0\uff08\u7b2c7-8\u7ae0\uff09", "status": "completed", "id": "create_file5_dev_features"}, {"content": "\u5f00\u53d1\u73af\u5883\u4e0e\u6784\u5efa\uff08\u878d\u5408\u7ef4\u62a4\u7b56\u7565+\u90e8\u7f72\u8fd0\u7ef4\uff09", "status": "completed", "id": "enhance_chapter7_devenv"}, {"content": "\u529f\u80fd\u7eb5\u5207\uff08\u878d\u5408\u56fd\u9645\u5316\u652f\u6301+\u524d\u7aef\u67b6\u6784\u8bbe\u8ba1\uff09", "status": "completed", "id": "enhance_chapter8_vertical"}, {"content": "\u6587\u4ef66\uff1a\u6027\u80fd\u89c4\u5212\u4e0e\u8fd0\u7ef4\u4fdd\u969c\uff08\u7b2c9\u7ae0\uff09", "status": "in_progress", "id": "create_file6_performance"}, {"content": "\u6027\u80fd\u4e0e\u5bb9\u91cf\u89c4\u5212\uff08\u878d\u5408\u6027\u80fd\u4f18\u5316\u65b9\u6848+\u98ce\u9669\u8bc4\u4f30\u5e94\u5bf9\uff09", "status": "pending", "id": "enhance_chapter9_performance"}]
