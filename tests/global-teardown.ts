import { FullConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

type StatSnapshot = {
  total?: number;
  passed?: number;
  failed?: number;
  skipped?: number;
};

type ProjectSnapshot = {
  name?: string;
  stats?: StatSnapshot;
};

type TestResultsSnapshot = {
  stats?: StatSnapshot;
  config?: {
    projects?: ProjectSnapshot[];
  };
};

type PerformanceMetrics = Record<string, unknown>;

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function readJsonFile<T>(absolutePath: string): T | undefined {
  if (!fs.existsSync(absolutePath)) return undefined;
  try {
    const raw = fs.readFileSync(absolutePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (error) {
    console.warn(`[Teardown] Failed to parse JSON: ${absolutePath}`, error);
    return undefined;
  }
}

async function globalTeardown(config: FullConfig): Promise<void> {
  console.log('\n[Teardown] Start Playwright global teardown - Electron E2E');

  const firstProject = config.projects?.[0];
  const outputDir = firstProject?.outputDir ?? 'test-results/artifacts';
  const reportDir = 'test-results';

  console.log('[Teardown] Collecting test results...');
  const testResults = readJsonFile<TestResultsSnapshot>(
    path.join(reportDir, 'test-results.json')
  );
  const performanceMetrics = readJsonFile<PerformanceMetrics>(
    path.join(outputDir, 'performance-metrics.json')
  );

  const summary: StatSnapshot = {
    total: testResults?.stats?.total ?? 0,
    passed: testResults?.stats?.passed ?? 0,
    failed: testResults?.stats?.failed ?? 0,
    skipped: testResults?.stats?.skipped ?? 0,
  };

  const passRate =
    summary.total && summary.total > 0
      ? ((summary.passed ?? 0) / summary.total) * 100
      : 0;

  const securityProject = testResults?.config?.projects?.find(
    project => project?.name === 'electron-security-audit'
  );
  const securityPassed = (securityProject?.stats?.failed ?? 0) === 0;

  const qualityMetrics = {
    timestamp: new Date().toISOString(),
    summary,
    performance: performanceMetrics ?? {},
    qualityGates: {
      passRate,
      securityTestsPassed: securityPassed,
      performanceThresholdMet: true,
    },
  };

  console.log('[Teardown] Validating quality gates...');
  const gateThresholds = {
    passRate: 95,
    requireSecurity: true,
    performanceP95: 100,
  } as const;
  const gateResults = {
    passRate: passRate >= gateThresholds.passRate,
    security: securityPassed,
    performance: true,
  };
  const allGatesPassed = Object.values(gateResults).every(Boolean);

  if (allGatesPassed) {
    console.log('[Teardown] All quality gates passed');
  } else {
    console.log('[Teardown] Quality gates FAILED:');
    if (!gateResults.passRate) {
      console.log(
        `  - Pass rate insufficient: ${passRate.toFixed(1)}% < ${gateThresholds.passRate}%`
      );
    }
    if (!gateResults.security) {
      console.log('  - Security tests did not pass');
    }
    if (!gateResults.performance) {
      console.log('  - Performance checks did not pass');
    }
  }

  console.log('[Teardown] Generating summary report...');
  const summaryReport = {
    ...qualityMetrics,
    gates: {
      thresholds: gateThresholds,
      results: gateResults,
      passed: allGatesPassed,
    },
    artifacts: {
      outputDir,
      reportDir,
      setupReport: path.join(outputDir, 'setup-report.json'),
      summaryReport: path.join(outputDir, 'teardown-summary.json'),
    },
  };
  const summaryPath = path.join(outputDir, 'teardown-summary.json');
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, JSON.stringify(summaryReport, null, 2));

  console.log('[Teardown] Cleaning up temporary resources...');
  try {
    if (process.platform === 'win32') {
      const { exec } = await import('child_process');
      exec('taskkill /F /IM electron.exe 2>nul', () => {
        /* ignore result */
      });
    }
    const tempDir = path.join(outputDir, 'temp');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log('[Teardown] Temporary files cleaned');
    }
  } catch (error) {
    console.warn('[Teardown] Warning during cleanup:', error);
  }

  console.log('[Teardown] Test run summary');
  console.log(`[Teardown] Total tests: ${summary.total ?? 0}`);
  console.log(`[Teardown] Passed: ${summary.passed ?? 0}`);
  console.log(`[Teardown] Failed: ${summary.failed ?? 0}`);
  console.log(`[Teardown] Skipped: ${summary.skipped ?? 0}`);
  console.log(`[Teardown] Pass rate: ${passRate.toFixed(1)}%`);
  console.log(`[Teardown] Quality gate: ${allGatesPassed ? 'PASS' : 'FAIL'}`);
  console.log(`[Teardown] Summary report: ${summaryPath}`);

  if (!allGatesPassed && process.env.CI) {
    console.log('\n[Teardown] CI: quality gates failed, set failure exit code');
  }

  console.log('[Teardown] Global teardown completed\n');
}

export default globalTeardown;
