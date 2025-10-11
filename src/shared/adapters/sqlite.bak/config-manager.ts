/**
 * SQLite
 *  CH05
 *
 * :
 * - SQLite
 * - WAL,,
 * -
 * -
 */

import type { Database } from 'better-sqlite3';

// ============================================================================
//
// ============================================================================

export type Environment = 'development' | 'test' | 'staging' | 'production';

export interface SqliteConfig {
  /**  */
  journal_mode: 'DELETE' | 'TRUNCATE' | 'PERSIST' | 'MEMORY' | 'WAL' | 'OFF';
  /**  */
  synchronous: 'OFF' | 'NORMAL' | 'FULL' | 'EXTRA';
  /** (,KB) */
  cache_size: number;
  /**  */
  foreign_keys: 'ON' | 'OFF';
  /** () */
  busy_timeout: number;
  /** WAL() */
  wal_autocheckpoint?: number;
  /** () */
  mmap_size?: number;
  /**  */
  temp_store?: 'DEFAULT' | 'FILE' | 'MEMORY';
  /** () */
  page_size?: number;
}

export interface ConfigProfile {
  name: string;
  description: string;
  config: SqliteConfig;
  recommendedFor: Environment[];
  memoryUsageMB: number;
  performanceRating: 'low' | 'medium' | 'high' | 'ultra';
}

// ============================================================================
//
// ============================================================================

export const CONFIG_PROFILES: Record<string, ConfigProfile> = {
  development: {
    name: 'Development',
    description: '',
    config: {
      journal_mode: 'WAL',
      synchronous: 'NORMAL',
      cache_size: 10000, // ~40MB
      foreign_keys: 'ON',
      busy_timeout: 5000,
      wal_autocheckpoint: 1000,
      mmap_size: 134217728, // 128MB
      temp_store: 'MEMORY',
    },
    recommendedFor: ['development'],
    memoryUsageMB: 40,
    performanceRating: 'medium',
  },

  test: {
    name: 'Test',
    description: '',
    config: {
      journal_mode: 'MEMORY',
      synchronous: 'OFF',
      cache_size: 5000, // ~20MB
      foreign_keys: 'ON',
      busy_timeout: 1000,
      mmap_size: 0, // ,
      temp_store: 'MEMORY',
    },
    recommendedFor: ['test'],
    memoryUsageMB: 20,
    performanceRating: 'high',
  },

  staging: {
    name: 'Staging',
    description: '',
    config: {
      journal_mode: 'WAL',
      synchronous: 'FULL',
      cache_size: 25000, // ~100MB
      foreign_keys: 'ON',
      busy_timeout: 10000,
      wal_autocheckpoint: 1000,
      mmap_size: 268435456, // 256MB
      temp_store: 'DEFAULT',
    },
    recommendedFor: ['staging'],
    memoryUsageMB: 100,
    performanceRating: 'high',
  },

  production: {
    name: 'Production',
    description: '',
    config: {
      journal_mode: 'WAL',
      synchronous: 'FULL',
      cache_size: 50000, // ~200MB
      foreign_keys: 'ON',
      busy_timeout: 30000,
      wal_autocheckpoint: 1000,
      mmap_size: 1073741824, // 1GB
      temp_store: 'DEFAULT',
      page_size: 4096,
    },
    recommendedFor: ['production'],
    memoryUsageMB: 200,
    performanceRating: 'ultra',
  },

  lowMemory: {
    name: 'Low Memory',
    description: '',
    config: {
      journal_mode: 'WAL',
      synchronous: 'NORMAL',
      cache_size: 2000, // ~8MB
      foreign_keys: 'ON',
      busy_timeout: 5000,
      wal_autocheckpoint: 500,
      mmap_size: 67108864, // 64MB
      temp_store: 'FILE',
    },
    recommendedFor: ['development', 'test'],
    memoryUsageMB: 8,
    performanceRating: 'low',
  },

  highPerformance: {
    name: 'High Performance',
    description: '',
    config: {
      journal_mode: 'WAL',
      synchronous: 'NORMAL', //
      cache_size: 100000, // ~400MB
      foreign_keys: 'ON',
      busy_timeout: 15000,
      wal_autocheckpoint: 10000, //
      mmap_size: 2147483648, // 2GB
      temp_store: 'MEMORY',
    },
    recommendedFor: ['production'],
    memoryUsageMB: 400,
    performanceRating: 'ultra',
  },
};

// ============================================================================
// SQLite
// ============================================================================

export class SqliteConfigManager {
  private currentConfig: SqliteConfig | null = null;
  private environment: Environment;
  private customOverrides: Partial<SqliteConfig> = {};

  constructor(environment: Environment = 'development') {
    this.environment = environment;

    //
    this.loadEnvironmentOverrides();
  }

  /**
   *
   */
  getRecommendedConfig(): SqliteConfig {
    const profile = CONFIG_PROFILES[this.environment];
    if (!profile) {
      throw new Error(
        `No configuration profile found for environment: ${this.environment}`
      );
    }

    //
    return { ...profile.config, ...this.customOverrides };
  }

  /**
   *
   */
  getAdaptiveConfig(): SqliteConfig {
    const availableMemoryMB = this.getAvailableMemoryMB();

    //
    let selectedProfile: ConfigProfile;

    if (availableMemoryMB < 100) {
      selectedProfile = CONFIG_PROFILES.lowMemory;
    } else if (availableMemoryMB > 1000) {
      selectedProfile = CONFIG_PROFILES.highPerformance;
    } else {
      selectedProfile =
        CONFIG_PROFILES[this.environment] || CONFIG_PROFILES.development;
    }

    console.log(
      ` Selected SQLite profile: ${selectedProfile.name} (Available Memory: ${availableMemoryMB}MB)`
    );

    return { ...selectedProfile.config, ...this.customOverrides };
  }

  /**
   *
   */
  async applyConfig(db: Database, config?: SqliteConfig): Promise<void> {
    const targetConfig = config || this.getAdaptiveConfig();
    this.currentConfig = targetConfig;

    console.log(' Applying SQLite configuration...');

    try {
      // PRAGMA
      for (const [pragma, value] of Object.entries(targetConfig)) {
        if (value !== undefined) {
          const sql = `PRAGMA ${pragma} = ${value}`;
          db.exec(sql);
          console.log(`   ${pragma} = ${value}`);
        }
      }

      //
      await this.validateConfiguration(db);

      console.log(' SQLite configuration applied successfully');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      console.error(` Failed to apply SQLite configuration: ${errorMessage}`);
      throw error;
    }
  }

  /**
   *
   */
  getConfigurationAdvice(): string[] {
    const advice: string[] = [];

    if (this.environment === 'production') {
      advice.push(' ');
      advice.push(' WAL');
      advice.push(' ');
    }

    if (this.environment === 'development') {
      advice.push(' ');
      advice.push(' ');
    }

    if (this.environment === 'test') {
      advice.push(' ');
      advice.push(' ');
    }

    return advice;
  }

  /**
   *
   */
  async healthCheck(db: Database): Promise<{
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    metrics: Record<string, any>;
  }> {
    const issues: string[] = [];
    const metrics: Record<string, any> = {};

    try {
      // WAL
      const walInfo = db.pragma('wal_checkpoint(PASSIVE)');
      if (Array.isArray(walInfo) && walInfo[0]) {
        metrics.walPages = walInfo[0][1];
        metrics.walCheckpointedPages = walInfo[0][2];

        if (walInfo[0][1] > 10000) {
          issues.push('WALCHECKPOINT');
        }
      }

      //
      const cacheInfo = db.pragma('cache_spill(-1)');
      metrics.cacheSpill = cacheInfo;

      // ()
      const integrityCheck = db.pragma('quick_check');
      if (integrityCheck[0] !== 'ok') {
        issues.push(`: ${integrityCheck[0]}`);
      }

      //
      const foreignKeyCheck = db.pragma('foreign_key_check');
      if (foreignKeyCheck.length > 0) {
        issues.push(`: ${foreignKeyCheck.length} `);
      }

      metrics.pageCount = db.pragma('page_count')[0];
      metrics.pageSize = db.pragma('page_size')[0];
      metrics.freePages = db.pragma('freelist_count')[0];

      // Classify status:
      // - healthy: no issues
      // - warning: only WALCHECKPOINT present (large WAL pages)
      // - error: any other issue (integrity/foreign keys/etc.)
      const status =
        issues.length === 0
          ? 'healthy'
          : issues.every(i => i === 'WALCHECKPOINT')
            ? 'warning'
            : 'error';

      return { status, issues, metrics };
    } catch (error) {
      return {
        status: 'error',
        issues: [
          `: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ],
        metrics: {},
      };
    }
  }

  /**
   *
   */
  setConfigOverride(overrides: Partial<SqliteConfig>): void {
    this.customOverrides = { ...this.customOverrides, ...overrides };
  }

  /**
   *
   */
  getCurrentConfig(): SqliteConfig | null {
    return this.currentConfig;
  }

  // ============================================================================
  //
  // ============================================================================

  private loadEnvironmentOverrides(): void {
    //
    const envOverrides: Partial<SqliteConfig> = {};

    if (process.env.SQLITE_CACHE_SIZE) {
      envOverrides.cache_size = Number(process.env.SQLITE_CACHE_SIZE);
    }

    if (process.env.SQLITE_BUSY_TIMEOUT) {
      envOverrides.busy_timeout = Number(process.env.SQLITE_BUSY_TIMEOUT);
    }

    if (process.env.SQLITE_SYNCHRONOUS) {
      envOverrides.synchronous = process.env.SQLITE_SYNCHRONOUS as any;
    }

    if (process.env.SQLITE_WAL_AUTOCHECKPOINT) {
      envOverrides.wal_autocheckpoint = Number(
        process.env.SQLITE_WAL_AUTOCHECKPOINT
      );
    }

    this.customOverrides = envOverrides;

    if (Object.keys(envOverrides).length > 0) {
      console.log(
        ' Loaded SQLite config overrides from environment variables:',
        envOverrides
      );
    }
  }

  private getAvailableMemoryMB(): number {
    try {
      // Node.js
      if (typeof process !== 'undefined' && process.memoryUsage) {
        const memUsage = process.memoryUsage();
        const totalMB = (memUsage.heapTotal + memUsage.external) / 1024 / 1024;
        return Math.max(100, 2048 - totalMB); // 2GB
      }

      //
      if (typeof navigator !== 'undefined' && 'deviceMemory' in navigator) {
        return ((navigator as any).deviceMemory || 4) * 1024; // GBMB
      }

      // 512MB
      return 512;
    } catch {
      return 512;
    }
  }

  private async validateConfiguration(db: Database): Promise<void> {
    // WAL
    const journalMode = db.pragma('journal_mode')[0];
    if (this.currentConfig?.journal_mode === 'WAL' && journalMode !== 'wal') {
      throw new Error(
        `Failed to enable WAL mode, current mode: ${journalMode}`
      );
    }

    //
    const foreignKeys = db.pragma('foreign_keys')[0];
    if (this.currentConfig?.foreign_keys === 'ON' && foreignKeys !== 1) {
      console.warn('  Foreign key constraints are not enabled');
    }

    //
    const cacheSize = db.pragma('cache_size')[0];
    if (Math.abs(cacheSize) !== Math.abs(this.currentConfig?.cache_size || 0)) {
      console.warn(
        `  Cache size mismatch: expected ${this.currentConfig?.cache_size}, got ${cacheSize}`
      );
    }
  }
}

// ============================================================================
//
// ============================================================================

/**
 *
 */
export function createConfigManager(
  environment?: Environment
): SqliteConfigManager {
  const env =
    environment || (process.env.NODE_ENV as Environment) || 'development';
  return new SqliteConfigManager(env);
}

/**
 * ()
 */
export async function quickSetupDatabase(
  db: Database,
  environment?: Environment,
  customConfig?: Partial<SqliteConfig>
): Promise<SqliteConfigManager> {
  const manager = createConfigManager(environment);

  if (customConfig) {
    manager.setConfigOverride(customConfig);
  }

  await manager.applyConfig(db);

  //
  const advice = manager.getConfigurationAdvice();
  if (advice.length > 0) {
    console.log('\n Configuration advice:');
    advice.forEach(tip => console.log(`  ${tip}`));
  }

  return manager;
}
