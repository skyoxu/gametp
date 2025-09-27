import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import { execSync } from 'node:child_process';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

describe('Release Feed Management', () => {
  type ReleaseFile = { url: string; sha512: string; size: number };
  type ReleaseFeed = {
    version?: string;
    path?: string;
    sha512?: string;
    releaseDate?: string;
    stagingPercentage?: number;
    files?: ReleaseFile[];
    healthMetrics?: {
      crashFreeSessions?: number;
      crashFreeUsers?: number;
      lastUpdated?: string;
    };
  };
  const testDistDir = 'test-dist';
  const testFeedFile = path.join(testDistDir, 'latest.yml');
  const testManifestFile = path.join(testDistDir, 'manifest.json');

  beforeEach(() => {
    //
    if (!fs.existsSync(testDistDir)) {
      fs.mkdirSync(testDistDir, { recursive: true });
    }
  });

  afterEach(() => {
    //
    if (fs.existsSync(testDistDir)) {
      fs.rmSync(testDistDir, { recursive: true, force: true });
    }
  });

  describe('patch-staging-percentage', () => {
    test('should set stagingPercentage to specified value', () => {
      //  feed
      const initialFeed = {
        version: '1.2.3',
        path: 'app.exe',
        sha512: 'sha512-testHash123==',
        releaseDate: '2025-08-29T10:00:00.000Z',
      };
      fs.writeFileSync(testFeedFile, yaml.dump(initialFeed), 'utf8');

      //
      const result = execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 25`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      //
      const updatedFeed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(updatedFeed.stagingPercentage).toBe(25);
      expect(updatedFeed.version).toBe('1.2.3');
      expect(updatedFeed.path).toBe('app.exe');
      expect(updatedFeed.sha512).toBe('sha512-testHash123==');

      //  JSON
      const jsonResult = JSON.parse(result);
      expect(jsonResult.ok).toBe(true);
      expect(jsonResult.stagingPercentage).toBe(25);
      expect(jsonResult.feedFile).toBe(testFeedFile);
      expect(jsonResult.timestamp).toBeDefined();
    });

    test('should handle percentage boundary values', () => {
      const initialFeed = { version: '1.0.0', path: 'app.exe', sha512: 'test' };
      fs.writeFileSync(testFeedFile, yaml.dump(initialFeed), 'utf8');

      //  0%
      execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 0`
      );
      let feed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(0);

      //  100%
      execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 100`
      );
      feed = yaml.load(fs.readFileSync(testFeedFile, 'utf8')) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(100);

      //
      execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 150`
      );
      feed = yaml.load(fs.readFileSync(testFeedFile, 'utf8')) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(100);

      execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} -10`
      );
      feed = yaml.load(fs.readFileSync(testFeedFile, 'utf8')) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(0);
    });

    test('should create feed file if it does not exist', () => {
      expect(fs.existsSync(testFeedFile)).toBe(false);

      const result = execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 50`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      expect(fs.existsSync(testFeedFile)).toBe(true);
      const feed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(50);

      const jsonResult = JSON.parse(result);
      expect(jsonResult.ok).toBe(true);
    });
  });

  describe('rollback-feed', () => {
    beforeEach(() => {
      //
      const testManifest = {
        '1.1.0': {
          path: 'app-1.1.0.exe',
          sha512: 'sha512-oldHash123==',
          size: 50331648,
          releaseDate: '2025-08-28T10:00:00.000Z',
          files: [
            {
              url: 'app-1.1.0.exe',
              sha512: 'sha512-oldHash123==',
              size: 50331648,
            },
          ],
        },
        '1.2.0': {
          path: 'app-1.2.0.exe',
          sha512: 'sha512-newHash456==',
          size: 52428800,
          releaseDate: '2025-08-29T09:00:00.000Z',
          files: [
            {
              url: 'app-1.2.0.exe',
              sha512: 'sha512-newHash456==',
              size: 52428800,
            },
          ],
        },
      };
      fs.writeFileSync(
        testManifestFile,
        JSON.stringify(testManifest, null, 2),
        'utf8'
      );
    });

    test('should rollback feed to specified version', () => {
      //  feed 1.2.0
      const currentFeed = {
        version: '1.2.0',
        path: 'app-1.2.0.exe',
        sha512: 'sha512-newHash456==',
        releaseDate: '2025-08-29T09:00:00.000Z',
        stagingPercentage: 50,
        files: [
          {
            url: 'app-1.2.0.exe',
            sha512: 'sha512-newHash456==',
            size: 52428800,
          },
        ],
      };
      fs.writeFileSync(testFeedFile, yaml.dump(currentFeed), 'utf8');

      //  1.1.0
      const result = execSync(
        `node scripts/release/rollback-feed.mjs ${testFeedFile} ${testManifestFile} 1.1.0`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      //
      const rolledBackFeed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(rolledBackFeed.version).toBe('1.1.0');
      expect(rolledBackFeed.path).toBe('app-1.1.0.exe');
      expect(rolledBackFeed.sha512).toBe('sha512-oldHash123==');
      expect(rolledBackFeed.stagingPercentage).toBe(0); //
      expect(rolledBackFeed.files).toBeDefined();
      expect(rolledBackFeed.files[0].url).toBe('app-1.1.0.exe');

      //  JSON
      const jsonResult = JSON.parse(result);
      expect(jsonResult.ok).toBe(true);
      expect(jsonResult.rolledBackTo).toBe('1.1.0');
      expect(jsonResult.feedFile).toBe(testFeedFile);
      expect(jsonResult.timestamp).toBeDefined();
    });

    test('should fail when target version not found in manifest', () => {
      const currentFeed = { version: '1.2.0', path: 'app.exe', sha512: 'test' };
      fs.writeFileSync(testFeedFile, yaml.dump(currentFeed), 'utf8');

      //
      expect(() => {
        execSync(
          `node scripts/release/rollback-feed.mjs ${testFeedFile} ${testManifestFile} 0.9.0`,
          { stdio: 'pipe' }
        );
      }).toThrow();
    });
  });

  describe('manage-manifest integration', () => {
    test('should add version to manifest and be usable for rollback', () => {
      //
      const testAppFile = path.join(testDistDir, 'app-1.3.0.exe');
      fs.writeFileSync(testAppFile, 'dummy app content for testing', 'utf8');

      //
      execSync(
        `node scripts/release/manage-manifest.mjs add --manifest=${testManifestFile} --version=1.3.0 --path=${testAppFile}`,
        { stdio: 'pipe' }
      );

      //
      const manifest = JSON.parse(fs.readFileSync(testManifestFile, 'utf8'));
      expect(manifest['1.3.0']).toBeDefined();
      expect(manifest['1.3.0'].path).toBe('app-1.3.0.exe'); //
      expect(manifest['1.3.0'].sha512).toBeDefined();

      //  feed
      const testFeed = {
        version: '1.4.0',
        path: 'app-1.4.0.exe',
        sha512: 'temp',
      };
      fs.writeFileSync(testFeedFile, yaml.dump(testFeed), 'utf8');

      execSync(
        `node scripts/release/rollback-feed.mjs ${testFeedFile} ${testManifestFile} 1.3.0`,
        { stdio: 'pipe' }
      );

      const rolledBackFeed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(rolledBackFeed.version).toBe('1.3.0');
      expect(rolledBackFeed.path).toBe('app-1.3.0.exe'); //
      expect(rolledBackFeed.sha512).toBe(manifest['1.3.0'].sha512);
    });
  });

  describe('execute-rollback integration', () => {
    beforeEach(() => {
      //
      const testManifest = {
        '1.0.0': {
          path: 'app-1.0.0.exe',
          sha512: 'sha512-stableHash==',
          size: 48234496,
          releaseDate: '2025-08-27T10:00:00.000Z',
          files: [
            {
              url: 'app-1.0.0.exe',
              sha512: 'sha512-stableHash==',
              size: 48234496,
            },
          ],
        },
      };
      fs.writeFileSync(
        testManifestFile,
        JSON.stringify(testManifest, null, 2),
        'utf8'
      );
    });

    test('should execute emergency rollback (stop only)', () => {
      //  feed
      const activeFeed = {
        version: '1.1.0',
        path: 'app-1.1.0.exe',
        sha512: 'sha512-currentHash==',
        stagingPercentage: 25,
      };
      fs.writeFileSync(testFeedFile, yaml.dump(activeFeed), 'utf8');

      //
      const result = execSync(
        `node scripts/release/execute-rollback.mjs --feed=${testFeedFile} --reason="Test emergency stop"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      //
      const stoppedFeed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(stoppedFeed.stagingPercentage).toBe(0);
      expect(stoppedFeed.version).toBe('1.1.0'); //

      const jsonResult = JSON.parse(result);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.steps).toBeDefined();
      expect(
        Array.isArray(jsonResult.steps) &&
          jsonResult.steps.some(
            (step: { step?: string }) => step.step === 'emergency_stop'
          )
      ).toBe(true);
    });

    test('should execute complete rollback with version revert', () => {
      //  feed
      const currentFeed = {
        version: '1.1.0',
        path: 'app-1.1.0.exe',
        sha512: 'sha512-currentHash==',
        stagingPercentage: 50,
      };
      fs.writeFileSync(testFeedFile, yaml.dump(currentFeed), 'utf8');

      //  +
      const result = execSync(
        `node scripts/release/execute-rollback.mjs --feed=${testFeedFile} --previous-version=1.0.0 --manifest=${testManifestFile} --reason="Test complete rollback"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      //
      const rolledBackFeed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(rolledBackFeed.stagingPercentage).toBe(0);
      expect(rolledBackFeed.version).toBe('1.0.0'); //
      expect(rolledBackFeed.path).toBe('app-1.0.0.exe');
      expect(rolledBackFeed.sha512).toBe('sha512-stableHash==');

      const jsonResult = JSON.parse(result);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.steps).toBeDefined();
      expect(
        Array.isArray(jsonResult.steps) &&
          jsonResult.steps.some(
            (step: { step?: string }) => step.step === 'emergency_stop'
          )
      ).toBe(true);
      expect(
        Array.isArray(jsonResult.steps) &&
          jsonResult.steps.some(
            (step: { step?: string }) => step.step === 'version_rollback'
          )
      ).toBe(true);
    });
  });

  describe('Staged Rollout Integration', () => {
    test('should handle full staged rollout lifecycle', () => {
      // 1.  feed (5% staging)
      const initialFeed = {
        version: '1.3.0',
        path: 'app-1.3.0.exe',
        sha512: 'sha512-newVersionHash==',
        releaseDate: '2025-08-29T12:00:00.000Z',
        stagingPercentage: 5,
      };
      fs.writeFileSync(testFeedFile, yaml.dump(initialFeed), 'utf8');

      // 2.
      let feed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(5);

      // 3.  25%
      execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 25`
      );
      feed = yaml.load(fs.readFileSync(testFeedFile, 'utf8')) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(25);

      // 4.  50%
      execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 50`
      );
      feed = yaml.load(fs.readFileSync(testFeedFile, 'utf8')) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(50);

      // 5.  100%
      execSync(
        `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 100`
      );
      feed = yaml.load(fs.readFileSync(testFeedFile, 'utf8')) as ReleaseFeed;
      expect(feed.stagingPercentage).toBe(100);
      expect(feed.version).toBe('1.3.0'); //
    });

    test('should support emergency rollback during staged rollout', () => {
      //  feed (25% staging)
      const partialFeed = {
        version: '1.4.0',
        path: 'app-1.4.0.exe',
        sha512: 'sha512-problematicVersion==',
        stagingPercentage: 25,
      };
      fs.writeFileSync(testFeedFile, yaml.dump(partialFeed), 'utf8');

      //  Crash-Free Sessions
      const result = execSync(
        `node scripts/release/execute-rollback.mjs --feed=${testFeedFile} --reason="Crash-Free Sessions below threshold"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      //
      const stoppedFeed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(stoppedFeed.stagingPercentage).toBe(0); //
      expect(stoppedFeed.version).toBe('1.4.0'); //

      const jsonResult = JSON.parse(result);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.reason).toContain('Crash-Free Sessions');
    });

    test('should validate feed file integrity during operations', () => {
      //  feed
      fs.writeFileSync(testFeedFile, 'invalid yaml content: [', 'utf8');

      //
      expect(() => {
        execSync(
          `node scripts/release/patch-staging-percentage.mjs ${testFeedFile} 50`,
          { stdio: 'pipe' }
        );
      }).toThrow();
    });
  });

  describe('Release Health Monitoring', () => {
    test('should track release metrics in feed metadata', () => {
      const feedWithMetrics = {
        version: '1.5.0',
        path: 'app-1.5.0.exe',
        sha512: 'sha512-metricsVersion==',
        stagingPercentage: 10,
        releaseDate: '2025-08-29T14:00:00.000Z',
        healthMetrics: {
          crashFreeSessions: 0.98,
          crashFreeUsers: 0.95,
          lastUpdated: '2025-08-29T14:30:00.000Z',
        },
      };
      fs.writeFileSync(testFeedFile, yaml.dump(feedWithMetrics), 'utf8');

      //
      const feed = yaml.load(
        fs.readFileSync(testFeedFile, 'utf8')
      ) as ReleaseFeed;
      expect(feed.healthMetrics).toBeDefined();
      expect(feed.healthMetrics.crashFreeSessions).toBe(0.98);
      expect(feed.healthMetrics.crashFreeUsers).toBe(0.95);
    });

    test('should support rollback triggers based on health thresholds', () => {
      //
      const unhealthyFeed = {
        version: '1.6.0',
        path: 'app-1.6.0.exe',
        sha512: 'sha512-unhealthyVersion==',
        stagingPercentage: 15,
        healthMetrics: {
          crashFreeSessions: 0.85, //  90%
          crashFreeUsers: 0.82, //  88%
        },
      };
      fs.writeFileSync(testFeedFile, yaml.dump(unhealthyFeed), 'utf8');

      //
      //
      const result = execSync(
        `node scripts/release/execute-rollback.mjs --feed=${testFeedFile} --reason="Health metrics below threshold: Sessions=85%, Users=82%"`,
        { encoding: 'utf8', stdio: 'pipe' }
      );

      const jsonResult = JSON.parse(result);
      expect(jsonResult.success).toBe(true);
      expect(jsonResult.reason).toContain('Health metrics below threshold');
    });
  });
});
