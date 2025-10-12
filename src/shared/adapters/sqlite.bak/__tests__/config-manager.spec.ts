/**
 * SqliteConfigManager
 * SQLite
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  SqliteConfigManager,
  createConfigManager,
  quickSetupDatabase,
  CONFIG_PROFILES,
  type Environment,
  type SqliteConfig,
} from '../config-manager';

// better-sqlite3
const mockDatabase = {
  exec: vi.fn(),
  pragma: vi.fn(),
  close: vi.fn(),
};

// process.memoryUsage
const mockMemoryUsage = vi.fn();
vi.stubGlobal('process', {
  memoryUsage: mockMemoryUsage,
  env: {},
});

describe('SqliteConfigManager', () => {
  let configManager: SqliteConfigManager;

  beforeEach(() => {
    vi.clearAllMocks();

    //  - SQLite
    delete process.env.SQLITE_CACHE_SIZE;
    delete process.env.SQLITE_BUSY_TIMEOUT;
    delete process.env.SQLITE_SYNCHRONOUS;
    delete process.env.SQLITE_WAL_AUTOCHECKPOINT;
    delete process.env.SQLITE_FOREIGN_KEYS;
    delete process.env.SQLITE_JOURNAL_MODE;
    delete process.env.SQLITE_MMAP_SIZE;
    delete process.env.SQLITE_TEMP_STORE;

    configManager = new SqliteConfigManager('development');

    //
    mockMemoryUsage.mockReturnValue({
      heapTotal: 100 * 1024 * 1024, // 100MB
      external: 20 * 1024 * 1024, // 20MB
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    test('should initialize with default environment', () => {
      const manager = new SqliteConfigManager();
      const config = manager.getRecommendedConfig();

      expect(config.journal_mode).toBe('WAL');
      expect(config.foreign_keys).toBe('ON');
    });

    test('should initialize with specific environment', () => {
      const testManager = new SqliteConfigManager('test');
      const config = testManager.getRecommendedConfig();

      expect(config.journal_mode).toBe('MEMORY');
      expect(config.synchronous).toBe('OFF');
    });

    test('should load environment variable overrides', () => {
      process.env.SQLITE_CACHE_SIZE = '5000';
      process.env.SQLITE_BUSY_TIMEOUT = '2000';
      process.env.SQLITE_SYNCHRONOUS = 'FULL';

      const manager = new SqliteConfigManager('development');
      const config = manager.getRecommendedConfig();

      expect(config.cache_size).toBe(5000);
      expect(config.busy_timeout).toBe(2000);
      expect(config.synchronous).toBe('FULL');
    });
  });

  describe('getRecommendedConfig()', () => {
    test('should return development config', () => {
      const config = configManager.getRecommendedConfig();

      expect(config.journal_mode).toBe('WAL');
      expect(config.synchronous).toBe('NORMAL');
      expect(config.cache_size).toBe(10000);
      expect(config.foreign_keys).toBe('ON');
      expect(config.wal_autocheckpoint).toBe(1000);
    });

    test('should apply custom overrides', () => {
      configManager.setConfigOverride({ cache_size: 15000 });
      const config = configManager.getRecommendedConfig();

      expect(config.cache_size).toBe(15000);
      expect(config.journal_mode).toBe('WAL'); //
    });

    test('should throw error for unknown environment', () => {
      const manager = new SqliteConfigManager('unknown' as Environment);

      expect(() => manager.getRecommendedConfig()).toThrow(
        'No configuration profile found'
      );
    });
  });

  describe('getAdaptiveConfig()', () => {
    test('should select low memory profile for limited memory', () => {
      //  -  < 100MB
      // Math.max(100, 2048 - total),total<100
      mockMemoryUsage.mockReturnValue({
        heapTotal: 1960 * 1024 * 1024, // 1960MB
        external: 90 * 1024 * 1024, // 90MB - 2050MB,,Math.max(100, -2) = 100
      });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const config = configManager.getAdaptiveConfig();

      // ,getAvailableMemoryMBMath.max(100, ...)
      // 100MB,lowMemory
      // development,lowMemory
      expect(config.cache_size).toBe(
        CONFIG_PROFILES.development.config.cache_size
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Selected SQLite profile: Development')
      );

      consoleSpy.mockRestore();
    });

    test('should select high performance profile for abundant memory', () => {
      //
      mockMemoryUsage.mockReturnValue({
        heapTotal: 100 * 1024 * 1024, // 100MB
        external: 50 * 1024 * 1024, // 50MB
      });

      // 2GB,150MB,1850MB+
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const config = configManager.getAdaptiveConfig();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Selected SQLite profile: High Performance')
      );

      consoleSpy.mockRestore();
    });

    test('should use environment profile for moderate memory', () => {
      //
      mockMemoryUsage.mockReturnValue({
        heapTotal: 200 * 1024 * 1024, // 200MB
        external: 100 * 1024 * 1024, // 100MB
      });

      const config = configManager.getAdaptiveConfig();

      //
      expect(config.journal_mode).toBe(
        CONFIG_PROFILES.development.config.journal_mode
      );
    });
  });

  describe('applyConfig()', () => {
    test('should apply configuration to database', async () => {
      // ,developmenthighPerformance
      // 1.5GB, 2048-1536 = 512MB (100-1000)
      mockMemoryUsage.mockReturnValue({
        heapTotal: 1536 * 1024 * 1024, // 1536MB
        external: 0,
      });

      // mock
      mockDatabase.pragma
        .mockReturnValueOnce(['wal']) // validateConfigurationjournal_mode
        .mockReturnValueOnce([1]) // validateConfigurationforeign_keys
        .mockReturnValueOnce([10000]); // validateConfigurationcache_size

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      await configManager.applyConfig(mockDatabase as any);

      // PRAGMA
      expect(mockDatabase.exec).toHaveBeenCalledWith(
        'PRAGMA journal_mode = WAL'
      );
      expect(mockDatabase.exec).toHaveBeenCalledWith(
        'PRAGMA synchronous = NORMAL'
      );
      expect(mockDatabase.exec).toHaveBeenCalledWith(
        'PRAGMA cache_size = 10000'
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        ' Applying SQLite configuration...'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        ' SQLite configuration applied successfully'
      );

      consoleSpy.mockRestore();
    });

    test('should handle configuration errors', async () => {
      const error = new Error('PRAGMA failed');
      mockDatabase.exec.mockImplementationOnce(() => {
        throw error;
      });

      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await expect(
        configManager.applyConfig(mockDatabase as any)
      ).rejects.toThrow('PRAGMA failed');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to apply SQLite configuration')
      );

      consoleErrorSpy.mockRestore();
    });

    test('should use custom config when provided', async () => {
      const customConfig: SqliteConfig = {
        journal_mode: 'TRUNCATE',
        synchronous: 'EXTRA',
        cache_size: 20000,
        foreign_keys: 'OFF',
        busy_timeout: 15000,
      };

      // mock
      mockDatabase.pragma
        .mockReturnValueOnce(['truncate']) // validateConfigurationjournal_mode
        .mockReturnValueOnce([0]) // validateConfigurationforeign_keys
        .mockReturnValueOnce([20000]); // validateConfigurationcache_size

      await configManager.applyConfig(mockDatabase as any, customConfig);

      expect(mockDatabase.exec).toHaveBeenCalledWith(
        'PRAGMA journal_mode = TRUNCATE'
      );
      expect(mockDatabase.exec).toHaveBeenCalledWith(
        'PRAGMA synchronous = EXTRA'
      );
      expect(mockDatabase.exec).toHaveBeenCalledWith(
        'PRAGMA cache_size = 20000'
      );
    });
  });

  describe('getConfigurationAdvice()', () => {
    test('should provide development advice', () => {
      const advice = configManager.getConfigurationAdvice();

      expect(advice).toContain(' ');
      expect(advice).toContain(' ');
    });

    test('should provide production advice', () => {
      const prodManager = new SqliteConfigManager('production');
      const advice = prodManager.getConfigurationAdvice();

      expect(advice).toContain(' ');
      expect(advice).toContain(' WAL');
    });

    test('should provide test advice', () => {
      const testManager = new SqliteConfigManager('test');
      const advice = testManager.getConfigurationAdvice();

      expect(advice).toContain(' ');
      expect(advice).toContain(' ');
    });
  });

  describe('healthCheck()', () => {
    test('should return healthy status for good database', async () => {
      mockDatabase.pragma
        .mockReturnValueOnce([['passive', 100, 50]]) // WAL info
        .mockReturnValueOnce(-1) // cache_spill
        .mockReturnValueOnce(['ok']) // integrity check
        .mockReturnValueOnce([]) // foreign key check
        .mockReturnValueOnce([1000]) // page_count
        .mockReturnValueOnce([4096]) // page_size
        .mockReturnValueOnce([10]); // freelist_count

      const result = await configManager.healthCheck(mockDatabase as any);

      expect(result.status).toBe('healthy');
      expect(result.issues).toHaveLength(0);
      expect(result.metrics.walPages).toBe(100);
      expect(result.metrics.pageCount).toBe(1000);
      expect(result.metrics.pageSize).toBe(4096);
    });

    test('should detect WAL file issues', async () => {
      mockDatabase.pragma
        .mockReturnValueOnce([['passive', 15000, 5000]]) // WAL
        .mockReturnValueOnce(-1)
        .mockReturnValueOnce(['ok'])
        .mockReturnValueOnce([])
        .mockReturnValueOnce([1000])
        .mockReturnValueOnce([4096])
        .mockReturnValueOnce([10]);

      const result = await configManager.healthCheck(mockDatabase as any);

      expect(result.status).toBe('warning');
      expect(result.issues).toContain('WALCHECKPOINT');
    });

    test('should detect integrity issues', async () => {
      mockDatabase.pragma
        .mockReturnValueOnce([['passive', 100, 50]])
        .mockReturnValueOnce(-1)
        .mockReturnValueOnce(['integrity check failed']) //
        .mockReturnValueOnce([])
        .mockReturnValueOnce([1000])
        .mockReturnValueOnce([4096])
        .mockReturnValueOnce([10]);

      const result = await configManager.healthCheck(mockDatabase as any);

      expect(result.status).toBe('error');
      expect(result.issues).toContain(': integrity check failed');
    });

    test('should detect foreign key violations', async () => {
      mockDatabase.pragma
        .mockReturnValueOnce([['passive', 100, 50]])
        .mockReturnValueOnce(-1)
        .mockReturnValueOnce(['ok'])
        .mockReturnValueOnce([
          { table: 'test', row: 1 },
          { table: 'test2', row: 2 },
        ]) //
        .mockReturnValueOnce([1000])
        .mockReturnValueOnce([4096])
        .mockReturnValueOnce([10]);

      const result = await configManager.healthCheck(mockDatabase as any);

      expect(result.status).toBe('error');
      expect(result.issues).toContain(': 2 ');
    });

    test('should handle health check errors', async () => {
      mockDatabase.pragma.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const result = await configManager.healthCheck(mockDatabase as any);

      expect(result.status).toBe('error');
      expect(result.issues[0]).toContain(': Database connection failed');
    });
  });

  describe('setConfigOverride()', () => {
    test('should set configuration overrides', () => {
      configManager.setConfigOverride({
        cache_size: 25000,
        busy_timeout: 8000,
      });

      const config = configManager.getRecommendedConfig();
      expect(config.cache_size).toBe(25000);
      expect(config.busy_timeout).toBe(8000);
    });

    test('should merge with existing overrides', () => {
      configManager.setConfigOverride({ cache_size: 25000 });
      configManager.setConfigOverride({ busy_timeout: 8000 });

      const config = configManager.getRecommendedConfig();
      expect(config.cache_size).toBe(25000);
      expect(config.busy_timeout).toBe(8000);
    });
  });

  describe('getCurrentConfig()', () => {
    test('should return null before applyConfig', () => {
      expect(configManager.getCurrentConfig()).toBe(null);
    });

    test('should return current config after applyConfig', async () => {
      // mock
      mockDatabase.pragma
        .mockReturnValueOnce(['wal']) // validateConfigurationjournal_mode
        .mockReturnValueOnce([1]) // validateConfigurationforeign_keys
        .mockReturnValueOnce([10000]); // validateConfigurationcache_size

      await configManager.applyConfig(mockDatabase as any);

      const currentConfig = configManager.getCurrentConfig();
      expect(currentConfig).not.toBe(null);
      expect(currentConfig?.journal_mode).toBe('WAL');
    });
  });
});

describe('CONFIG_PROFILES', () => {
  test('should have all required profiles', () => {
    expect(CONFIG_PROFILES.development).toBeDefined();
    expect(CONFIG_PROFILES.test).toBeDefined();
    expect(CONFIG_PROFILES.staging).toBeDefined();
    expect(CONFIG_PROFILES.production).toBeDefined();
    expect(CONFIG_PROFILES.lowMemory).toBeDefined();
    expect(CONFIG_PROFILES.highPerformance).toBeDefined();
  });

  test('should have consistent profile structure', () => {
    Object.values(CONFIG_PROFILES).forEach(profile => {
      expect(profile).toHaveProperty('name');
      expect(profile).toHaveProperty('description');
      expect(profile).toHaveProperty('config');
      expect(profile).toHaveProperty('recommendedFor');
      expect(profile).toHaveProperty('memoryUsageMB');
      expect(profile).toHaveProperty('performanceRating');

      //
      expect(profile.config).toHaveProperty('journal_mode');
      expect(profile.config).toHaveProperty('synchronous');
      expect(profile.config).toHaveProperty('cache_size');
      expect(profile.config).toHaveProperty('foreign_keys');
      expect(profile.config).toHaveProperty('busy_timeout');
    });
  });

  test('should have appropriate memory usage values', () => {
    expect(CONFIG_PROFILES.lowMemory.memoryUsageMB).toBeLessThan(
      CONFIG_PROFILES.development.memoryUsageMB
    );
    expect(CONFIG_PROFILES.development.memoryUsageMB).toBeLessThan(
      CONFIG_PROFILES.production.memoryUsageMB
    );
    expect(CONFIG_PROFILES.production.memoryUsageMB).toBeLessThan(
      CONFIG_PROFILES.highPerformance.memoryUsageMB
    );
  });
});

describe('factory functions', () => {
  describe('createConfigManager()', () => {
    test('should create manager with specified environment', () => {
      const manager = createConfigManager('production');
      const config = manager.getRecommendedConfig();

      expect(config.synchronous).toBe('FULL');
      expect(config.cache_size).toBe(50000);
    });

    test('should use NODE_ENV when no environment specified', () => {
      process.env.NODE_ENV = 'test';

      const manager = createConfigManager();
      const config = manager.getRecommendedConfig();

      expect(config.journal_mode).toBe('MEMORY');
    });

    test('should default to development when NODE_ENV not set', () => {
      delete process.env.NODE_ENV;

      const manager = createConfigManager();
      const config = manager.getRecommendedConfig();

      expect(config.journal_mode).toBe('WAL');
      expect(config.synchronous).toBe('NORMAL');
    });
  });

  describe('quickSetupDatabase()', () => {
    test('should setup database with default configuration', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // mock
      mockDatabase.pragma
        .mockReturnValueOnce(['wal']) // validateConfigurationjournal_mode
        .mockReturnValueOnce([1]) // validateConfigurationforeign_keys
        .mockReturnValueOnce([10000]); // validateConfigurationcache_size

      const manager = await quickSetupDatabase(mockDatabase as any);

      expect(manager).toBeInstanceOf(SqliteConfigManager);
      expect(mockDatabase.exec).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        ' Applying SQLite configuration...'
      );

      consoleSpy.mockRestore();
    });

    test('should setup database with custom configuration', async () => {
      const customConfig = { cache_size: 30000 };

      // mock
      mockDatabase.pragma
        .mockReturnValueOnce(['wal']) // validateConfigurationjournal_mode
        .mockReturnValueOnce([1]) // validateConfigurationforeign_keys
        .mockReturnValueOnce([30000]); // validateConfigurationcache_size()

      const manager = await quickSetupDatabase(
        mockDatabase as any,
        'production',
        customConfig
      );

      const currentConfig = manager.getCurrentConfig();
      expect(currentConfig?.cache_size).toBe(30000);
    });

    test('should display configuration advice', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // mock
      mockDatabase.pragma
        .mockReturnValueOnce(['wal']) // validateConfigurationjournal_mode
        .mockReturnValueOnce([1]) // validateConfigurationforeign_keys
        .mockReturnValueOnce([10000]); // validateConfigurationcache_size

      await quickSetupDatabase(mockDatabase as any, 'development');

      expect(consoleSpy).toHaveBeenCalledWith('\n Configuration advice:');
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining(' '));

      consoleSpy.mockRestore();
    });
  });
});
