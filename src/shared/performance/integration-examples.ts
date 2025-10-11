/**
 * User Timing API
 * Note
 */

import React from 'react';
import { userTiming, mark, measure, measureFunction } from './UserTiming.js';

/**
 * React
 */
export class ReactPerformanceIntegration {
  /**
   * Note
   */
  static wrapComponentMount<T>(Component: React.ComponentType<T>) {
    return class extends React.Component<T> {
      componentDidMount() {
        mark('react.component.mount.end');
        measure(
          'react.component.mount',
          'react.component.mount.start',
          'react.component.mount.end'
        );
      }

      componentWillMount() {
        mark('react.component.mount.start');
      }

      render() {
        return React.createElement(Component, this.props);
      }
    };
  }

  /**
   * Note
   */
  static async measureAsyncComponent(loadComponent: () => Promise<any>) {
    return await measureFunction('react.component.async-load', loadComponent);
  }
}

/**
 * (Phaser)
 */
export class PhaserPerformanceIntegration {
  /**
   * Note
   */
  static instrumentScene(scene: Phaser.Scene) {
    const originalCreate = (scene as any).create?.bind(scene);
    const originalPreload = (scene as any).preload?.bind(scene);

    (scene as any).preload = function () {
      mark('phaser.scene.preload.start');
      originalPreload?.();
      mark('phaser.scene.preload.end');
      measure(
        'phaser.scene.preload',
        'phaser.scene.preload.start',
        'phaser.scene.preload.end'
      );
    };

    (scene as any).create = function () {
      mark('phaser.scene.create.start');
      originalCreate?.();
      mark('phaser.scene.create.end');
      measure(
        'phaser.scene.create',
        'phaser.scene.create.start',
        'phaser.scene.create.end'
      );
    };
  }

  /**
   * Note
   */
  static async measureTurnProcess(turnHandler: () => Promise<void>) {
    return await measureFunction('game.turn.process', turnHandler);
  }
}

/**
 * Electron IPC
 */
export class ElectronIPCPerformance {
  /**
   * IPC
   */
  static async measureIPCCall<T>(channel: string, args: any[]): Promise<T> {
    const result = await measureFunction(
      `electron.ipc.call.${channel}`,
      async () => {
        // @ts-ignore - window.electronAPI preload
        return await window.electronAPI.invoke(channel, ...args);
      }
    );
    return result as T;
  }

  /**
   * IPC
   */
  static async measureMultipleIPCCalls(
    calls: Array<{ channel: string; args: any[] }>
  ) {
    const results = [];

    mark('electron.ipc.batch.start');

    for (const call of calls) {
      const result = await this.measureIPCCall(call.channel, call.args);
      results.push(result);
    }

    mark('electron.ipc.batch.end');
    measure(
      'electron.ipc.batch',
      'electron.ipc.batch.start',
      'electron.ipc.batch.end'
    );

    return results;
  }
}

/**
 * Note
 */
export class DataPersistencePerformance {
  /**
   * Note
   */
  static async measureDataSave(saveOperation: () => Promise<void>) {
    return await measureFunction('data.save', saveOperation);
  }

  /**
   * Note
   */
  static async measureDataLoad<T>(loadOperation: () => Promise<T>): Promise<T> {
    const result = await measureFunction('data.load', loadOperation);
    return result.result;
  }

  /**
   * Note
   */
  static async measureBatchOperation<T>(
    operationName: string,
    operations: Array<() => Promise<T>>
  ): Promise<T[]> {
    const results: T[] = [];

    mark(`${operationName}.batch.start`);

    for (let i = 0; i < operations.length; i++) {
      const result = await measureFunction(
        `${operationName}.item.${i}`,
        operations[i]
      );
      results.push(result.result);
    }

    mark(`${operationName}.batch.end`);
    measure(
      `${operationName}.batch`,
      `${operationName}.batch.start`,
      `${operationName}.batch.end`
    );

    return results;
  }
}

/**
 * Note
 */
export class AppStartupPerformance {
  private static startupMarks: string[] = [];

  /**
   * Note
   */
  static markStartupPhase(phase: string) {
    const markName = `app.startup.${phase}`;
    mark(markName);
    this.startupMarks.push(markName);
  }

  /**
   * Note
   */
  static measureStartupComplete() {
    if (this.startupMarks.length < 2) {
      console.warn('[UserTiming] 2');
      return null;
    }

    const firstMark = this.startupMarks[0];
    const lastMark = this.startupMarks[this.startupMarks.length - 1];

    return measure('app.startup', firstMark, lastMark);
  }

  /**
   * Note
   */
  static getStartupReport() {
    const report: any = {
      phases: [],
      totalTime: null,
    };

    // Note
    for (let i = 1; i < this.startupMarks.length; i++) {
      const phaseName = this.startupMarks[i].replace('app.startup.', '');
      const measurement = measure(
        `app.startup.phase.${phaseName}`,
        this.startupMarks[i - 1],
        this.startupMarks[i]
      );

      if (measurement) {
        report.phases.push({
          name: phaseName,
          duration: measurement.duration,
        });
      }
    }

    // Note
    const totalMeasurement = this.measureStartupComplete();
    if (totalMeasurement) {
      report.totalTime = totalMeasurement.duration;
    }

    return report;
  }
}

/**
 * UI
 */
export class UIInteractionPerformance {
  /**
   * Note
   */
  static measureModalOperation(
    operation: 'open' | 'close',
    handler: () => Promise<void>
  ) {
    return measureFunction(`ui.modal.${operation}`, handler);
  }

  /**
   * Note
   */
  static measureFormSubmit(formId: string, submitHandler: () => Promise<void>) {
    return measureFunction(`ui.form.submit.${formId}`, submitHandler);
  }

  /**
   * Note
   */
  static measureNavigation(
    from: string,
    to: string,
    handler: () => Promise<void>
  ) {
    return measureFunction(`ui.navigation.${from}-to-${to}`, handler);
  }
}

/**
 * Note
 */
export class PerformanceReporter {
  /**
   * Note
   */
  static generateReport() {
    return userTiming.getPerformanceReport();
  }

  /**
   * P95
   */
  static checkThresholds() {
    return userTiming.assertP95Thresholds();
  }

  /**
   * CSV
   */
  static generateCSVReport(): string {
    const report = this.generateReport();
    const lines = ['Name,Count,Avg,Min,Max,P95,P99,Status'];

    for (const [name, stats] of Object.entries(report)) {
      if (typeof stats === 'object' && stats.count) {
        lines.push(
          [
            name,
            stats.count,
            stats.avg,
            stats.min,
            stats.max,
            stats.p95 || 'N/A',
            stats.p99 || 'N/A',
            stats.status,
          ].join(',')
        );
      }
    }

    return lines.join('\n');
  }

  /**
   * Note
   */
  static logReport() {
    const report = this.generateReport();
    console.group(' User Timing Performance Report');

    for (const [name, stats] of Object.entries(report)) {
      if (typeof stats === 'object' && stats.count) {
        const statusIcon =
          stats.status === 'good'
            ? ''
            : stats.status === 'warning'
              ? ''
              : stats.status === 'critical'
                ? ''
                : '';

        console.log(
          `${statusIcon} ${name}: P95=${stats.p95}ms (${stats.count} samples)`
        );
      }
    }

    console.groupEnd();
  }
}
