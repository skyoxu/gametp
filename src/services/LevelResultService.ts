/**
 *  -
 *  SQLite WAL  CloudEvents
 */

import type { GameDomainEvent } from '../shared/contracts/events/GameEvents';
import type { StorageResult, GameStoragePort } from '../ports/storage.port';

/**
 *
 */
export interface LevelCompletionResult {
  id: string;
  levelId: string;
  playerId?: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  score: number;
  totalMoves: number;
  completionReason: string;
  gameEvents: GameDomainEvent[];
  metadata: {
    version: string;
    testType: 'vertical-slice' | 'normal';
    webVitals?: Record<string, any>;
    sessionId: string;
  };
  timestamp: Date;
}

/**
 *
 */
export interface LevelPersistenceStats {
  totalResults: number;
  lastBackupTime?: Date;
  dbSize: number;
  avgScore: number;
  totalTestRuns: number;
}

/**
 *
 */
interface LevelResultServiceConfig {
  enableBackup: boolean;
  backupInterval: number; //
  maxStoredResults: number;
  enableCompression: boolean;
  fallbackToLocalStorage: boolean;
}

/**
 *
 */
export class LevelResultService {
  private config: LevelResultServiceConfig;
  private storageAdapter?: GameStoragePort;
  private backupTimer?: NodeJS.Timeout;
  private isElectronEnvironment: boolean;

  constructor(config: Partial<LevelResultServiceConfig> = {}) {
    this.config = {
      enableBackup: true,
      backupInterval: 30000, // 30()
      maxStoredResults: 1000,
      enableCompression: true,
      fallbackToLocalStorage: true,
      ...config,
    };

    this.isElectronEnvironment =
      typeof window !== 'undefined' && window.electronAPI !== undefined;

    this.initializeService();
  }

  /**
   *
   */
  private async initializeService(): Promise<void> {
    try {
      console.log('🏗️ 初始化 LevelResultService...');

      // ()
      // this.storageAdapter = await this.createStorageAdapter();

      //
      if (this.config.enableBackup) {
        this.startBackupTimer();
      }

      console.log('✅ LevelResultService 初始化完成');
    } catch (error) {
      console.error('❌ LevelResultService 初始化失败:', error);
      throw error;
    }
  }

  /**
   *
   */
  async saveLevelResult(
    levelResult: Omit<LevelCompletionResult, 'id' | 'timestamp'>
  ): Promise<StorageResult<string>> {
    try {
      console.log('💾 保存关卡结果...', levelResult);

      const completeResult: LevelCompletionResult = {
        id: this.generateResultId(),
        timestamp: new Date(),
        ...levelResult,
      };

      //
      const validationResult = this.validateResult(completeResult);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      //
      const saveResult = await this.persistResult(completeResult);

      if (saveResult.success) {
        // ()
        if (this.config.enableBackup) {
          await this.triggerBackup(completeResult);
        }

        //
        await this.cleanupOldResults();

        console.log('✅ 关卡结果保存成功, ID:', completeResult.id);
      }

      return saveResult;
    } catch (error) {
      console.error('❌ 保存关卡结果失败:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   *
   */
  async getLevelResults(filters?: {
    levelId?: string;
    limit?: number;
    offset?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<StorageResult<LevelCompletionResult[]>> {
    try {
      console.log('📊 获取关卡结果历史...', filters);

      let results: LevelCompletionResult[] = [];

      if (this.storageAdapter) {
        // ()
        // const queryResult = await this.storageAdapter.find('level_results', filters);
        // results = queryResult.data || [];
      } else {
        //  localStorage
        results = await this.getResultsFromLocalStorage(filters);
      }

      console.log(`✅ 获取到 ${results.length} 条关卡结果`);

      return {
        success: true,
        data: results,
        metadata: {
          size: results.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('❌ 获取关卡结果失败:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   *
   */
  async getStats(): Promise<StorageResult<LevelPersistenceStats>> {
    try {
      const results = await this.getLevelResults();

      if (!results.success || !results.data) {
        return {
          success: false,
          error: 'Failed to get results for stats calculation',
        };
      }

      const data = results.data;
      const stats: LevelPersistenceStats = {
        totalResults: data.length,
        lastBackupTime: await this.getLastBackupTime(),
        dbSize: await this.calculateDbSize(),
        avgScore:
          data.length > 0
            ? data.reduce((sum, r) => sum + r.score, 0) / data.length
            : 0,
        totalTestRuns: data.filter(
          r => r.metadata.testType === 'vertical-slice'
        ).length,
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error) {
      console.error('❌ 获取统计信息失败:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   *
   */
  async createBackup(): Promise<StorageResult<string>> {
    try {
      console.log('🔄 手动触发数据库备份...');

      if (!this.isElectronEnvironment) {
        return {
          success: false,
          error: 'Backup only available in Electron environment',
        };
      }

      //
      const backupId = `vertical-slice-backup-${Date.now()}`;

      //  Electron API
      try {
        // :executeScript electronAPI
        //  reportEvent
        if (window.electronAPI?.reportEvent) {
          window.electronAPI.reportEvent({
            type: 'backup_requested',
            data: {
              backupId,
              script: 'node scripts/db/backup.mjs',
              args: ['--compress', '--verify'],
            },
          });

          // executeScript,fallback
          throw new Error('executeScript method not available, using fallback');
        }
      } catch (electronError) {
        console.warn('⚠️ Electron备份失败，回退到本地备份:', electronError);
      }

      //
      const exportData = await this.exportToFile(backupId);

      return {
        success: true,
        data: backupId,
        metadata: {
          size: exportData.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0',
        },
      };
    } catch (error) {
      console.error('❌ 备份失败:', error);
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   *
   */
  dispose(): void {
    console.log('🧹 清理 LevelResultService 资源...');

    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = undefined;
    }

    if (this.storageAdapter) {
      // :
    }
  }

  // ===============  ===============

  /**
   * ID
   */
  private generateResultId(): string {
    return `level_result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   *
   */
  private validateResult(result: LevelCompletionResult): StorageResult<void> {
    if (!result.levelId || !result.startTime || !result.endTime) {
      return {
        success: false,
        error: 'Missing required fields: levelId, startTime, or endTime',
      };
    }

    if (result.duration < 0 || result.score < 0 || result.totalMoves < 0) {
      return {
        success: false,
        error: 'Invalid negative values for duration, score, or totalMoves',
      };
    }

    if (result.endTime <= result.startTime) {
      return {
        success: false,
        error: 'endTime must be after startTime',
      };
    }

    return { success: true };
  }

  /**
   *
   */
  private async persistResult(
    result: LevelCompletionResult
  ): Promise<StorageResult<string>> {
    try {
      if (this.storageAdapter) {
        // ()
        // return await this.storageAdapter.insert('level_results', result);
      }

      //  localStorage
      return await this.saveToLocalStorage(result);
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   *  localStorage
   */
  private async saveToLocalStorage(
    result: LevelCompletionResult
  ): Promise<StorageResult<string>> {
    try {
      const key = `level_results`;
      const existingData = localStorage.getItem(key);
      const results: LevelCompletionResult[] = existingData
        ? JSON.parse(existingData)
        : [];

      results.push(result);

      //
      results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      if (results.length > this.config.maxStoredResults) {
        results.splice(this.config.maxStoredResults);
      }

      localStorage.setItem(key, JSON.stringify(results));

      return {
        success: true,
        data: result.id,
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   *  localStorage
   */
  private async getResultsFromLocalStorage(
    filters?: any
  ): Promise<LevelCompletionResult[]> {
    try {
      const key = `level_results`;
      const data = localStorage.getItem(key);

      if (!data) return [];

      const results: LevelCompletionResult[] = JSON.parse(data);

      //
      let filtered = results;

      if (filters?.levelId) {
        filtered = filtered.filter(r => r.levelId === filters.levelId);
      }

      if (filters?.startDate) {
        filtered = filtered.filter(
          r => new Date(r.timestamp) >= filters.startDate
        );
      }

      if (filters?.endDate) {
        filtered = filtered.filter(
          r => new Date(r.timestamp) <= filters.endDate
        );
      }

      if (filters?.limit) {
        filtered = filtered.slice(0, filters.limit);
      }

      return filtered;
    } catch (error) {
      console.error('localStorage 读取失败:', error);
      return [];
    }
  }

  /**
   *
   */
  private async triggerBackup(result: LevelCompletionResult): Promise<void> {
    try {
      // ()
      const backupData = {
        type: 'level_completion_backup',
        timestamp: new Date(),
        result: result,
      };

      const backupKey = `backup_${result.id}`;
      localStorage.setItem(backupKey, JSON.stringify(backupData));

      console.log('✅ 结果数据已备份:', backupKey);

      // Electron,
      if (this.isElectronEnvironment && this.isHighValueResult(result)) {
        console.log('🔄 触发完整数据库备份...');
        // ,
        setTimeout(() => this.createBackup(), 1000);
      }
    } catch (error) {
      console.warn('⚠️ 备份失败，但不影响主流程:', error);
    }
  }

  /**
   * ()
   */
  private isHighValueResult(result: LevelCompletionResult): boolean {
    // ,,
    return (
      result.score > 500 ||
      result.duration < 10000 ||
      result.metadata.testType === 'vertical-slice'
    );
  }

  /**
   *
   */
  private startBackupTimer(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(async () => {
      console.log('⏰ 定时备份触发...');
      try {
        await this.createBackup();
      } catch (error) {
        console.warn('⚠️ 定时备份失败:', error);
      }
    }, this.config.backupInterval);

    console.log(`✅ 备份定时器已启动，间隔: ${this.config.backupInterval}ms`);
  }

  /**
   *
   */
  private async cleanupOldResults(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // 30

      if (this.config.fallbackToLocalStorage) {
        const key = `level_results`;
        const data = localStorage.getItem(key);

        if (data) {
          const results: LevelCompletionResult[] = JSON.parse(data);
          const filtered = results.filter(
            r => new Date(r.timestamp) > cutoffDate
          );

          if (filtered.length !== results.length) {
            localStorage.setItem(key, JSON.stringify(filtered));
            console.log(
              `🧹 清理了 ${results.length - filtered.length} 条旧数据`
            );
          }
        }
      }
    } catch (error) {
      console.warn('⚠️ 清理旧数据失败:', error);
    }
  }

  /**
   *
   */
  private async getLastBackupTime(): Promise<Date | undefined> {
    try {
      const backupKeys = Object.keys(localStorage).filter(key =>
        key.startsWith('backup_')
      );

      if (backupKeys.length === 0) return undefined;

      const timestamps = backupKeys.map(key => {
        try {
          const data = localStorage.getItem(key);
          return data ? new Date(JSON.parse(data).timestamp) : new Date(0);
        } catch {
          return new Date(0);
        }
      });

      return new Date(Math.max(...timestamps.map(d => d.getTime())));
    } catch {
      return undefined;
    }
  }

  /**
   * ()
   */
  private async calculateDbSize(): Promise<number> {
    try {
      let totalSize = 0;

      //  localStorage
      for (const key in localStorage) {
        if (key.startsWith('level_results') || key.startsWith('backup_')) {
          const value = localStorage.getItem(key);
          totalSize += value ? value.length : 0;
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  }

  /**
   *
   */
  private async exportToFile(backupId: string): Promise<string> {
    try {
      const results = await this.getLevelResults();
      const exportData = {
        backupId,
        timestamp: new Date(),
        version: '1.0.0',
        data: results.data || [],
      };

      const exportStr = JSON.stringify(exportData, null, 2);

      // ()
      if (typeof window !== 'undefined' && window.document) {
        const blob = new Blob([exportStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // URL
        localStorage.setItem(
          `export_${backupId}`,
          JSON.stringify({
            url,
            timestamp: new Date(),
            size: exportStr.length,
          })
        );
      }

      return exportStr;
    } catch (error) {
      throw new Error(`导出失败: ${(error as Error).message}`);
    }
  }
}
