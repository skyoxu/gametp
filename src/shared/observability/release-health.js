'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.releaseHealthManager = exports.ReleaseHealthManager = void 0;
const Sentry = __importStar(require('@sentry/electron/main'));
const electron_1 = require('electron');
const RELEASE_HEALTH_THRESHOLDS = {
  crashFreeSessionsRate: 99.5, // 99.5%
  crashFreeUsersRate: 99.8, // 99.8%
  adoptionRate7d: 50.0, // 750%
  adoptionRateMin14d: 30.0, // 1430%
};
/**
 * Release Health
 * DevCIProd
 */
class ReleaseHealthManager {
  static instance;
  healthMetrics = new Map();
  sessionStartTime = Date.now();
  releaseMetrics = new Map();
  static getInstance() {
    if (!ReleaseHealthManager.instance) {
      ReleaseHealthManager.instance = new ReleaseHealthManager();
    }
    return ReleaseHealthManager.instance;
  }
  /**
   * Release Health
   */
  initializeReleaseHealth() {
    console.log('🏥 初始化Release Health监控...');
    //  
    this.startHealthSession();
    //  
    this.setupAppEventMonitoring();
    //  
    this.setupHealthReporting();
    //  
    this.setupGameHealthMonitoring();
    //  Release
    this.setupReleaseHealthGating();
  }
  /**
   * Release
   */
  setupReleaseHealthGating() {
    console.log('🚨 设置Release健康门槛监控...');
    // 
    setInterval(
      () => {
        this.checkReleaseHealthThresholds();
      },
      10 * 60 * 1000
    ); // 10
    // 
    this.setupCriticalEventTriggers();
  }
  /**
   * Release
   */
  checkReleaseHealthThresholds() {
    const currentMetrics = this.calculateCurrentHealthMetrics();
    //  
    if (
      currentMetrics.crashFreeSessionsRate <
      RELEASE_HEALTH_THRESHOLDS.crashFreeSessionsRate
    ) {
      this.triggerHealthAlert('crash_sessions_threshold', {
        current: currentMetrics.crashFreeSessionsRate,
        threshold: RELEASE_HEALTH_THRESHOLDS.crashFreeSessionsRate,
        severity: 'critical',
      });
    }
    if (
      currentMetrics.crashFreeUsersRate <
      RELEASE_HEALTH_THRESHOLDS.crashFreeUsersRate
    ) {
      this.triggerHealthAlert('crash_users_threshold', {
        current: currentMetrics.crashFreeUsersRate,
        threshold: RELEASE_HEALTH_THRESHOLDS.crashFreeUsersRate,
        severity: 'critical',
      });
    }
    //  
    this.checkAdoptionRates(currentMetrics);
  }
  /**
   * 
   */
  checkAdoptionRates(metrics) {
    const currentRelease = electron_1.app.getVersion?.()  'unknown';
    const daysSinceRelease = this.getDaysSinceRelease(currentRelease);
    if (
      daysSinceRelease === 7 &&
      metrics.adoptionRate < RELEASE_HEALTH_THRESHOLDS.adoptionRate7d
    ) {
      this.triggerHealthAlert('adoption_7d_threshold', {
        current: metrics.adoptionRate,
        threshold: RELEASE_HEALTH_THRESHOLDS.adoptionRate7d,
        daysSinceRelease: 7,
        severity: 'warning',
      });
    }
    if (
      daysSinceRelease === 14 &&
      metrics.adoptionRate < RELEASE_HEALTH_THRESHOLDS.adoptionRateMin14d
    ) {
      this.triggerHealthAlert('adoption_14d_threshold', {
        current: metrics.adoptionRate,
        threshold: RELEASE_HEALTH_THRESHOLDS.adoptionRateMin14d,
        daysSinceRelease: 14,
        severity: 'critical',
      });
    }
  }
  /**
   * 
   */
  triggerHealthAlert(alertType, data) {
    console.error(`🚨 Release健康门槛触发: ${alertType}`, data);
    Sentry.captureMessage(`Release健康门槛违规: ${alertType}`, {
      level: data.severity,
      tags: {
        'alert.type': alertType,
        'release.version': electron_1.app.getVersion?.()  'unknown',
        'alert.severity': data.severity,
      },
      extra: data,
    });
    // 
    if (data.severity === 'critical') {
      this.considerRollback(alertType, data);
    }
  }
  /**
   * 
   */
  considerRollback(alertType, data) {
    console.warn('🔄 检测到关键健康问题，考虑版本回滚...');
    // 
    // :CI/CD,
    Sentry.addBreadcrumb({
      message: '考虑版本回滚',
      category: 'release.health',
      level: 'warning',
      data: {
        alertType,
        reason: 'health_threshold_violation',
        ...data,
      },
    });
  }
  /**
   * 
   */
  calculateCurrentHealthMetrics() {
    const totalSessions = this.healthMetrics.get('sessions.total') || 1;
    const crashedSessions = this.healthMetrics.get('crashes.total') || 0;
    const totalUsers = this.healthMetrics.get('users.total') || 1;
    const crashedUsers = this.healthMetrics.get('users.crashed') || 0;
    return {
      crashFreeSessionsRate:
        ((totalSessions - crashedSessions) / totalSessions) * 100,
      crashFreeUsersRate: ((totalUsers - crashedUsers) / totalUsers) * 100,
      adoptionRate: this.calculateAdoptionRate(),
      totalSessions,
      crashedSessions,
      totalUsers,
      crashedUsers,
    };
  }
  /**
   * ()
   */
  calculateAdoptionRate() {
    // 
    // 
    return Math.random() * 100;
  }
  /**
   * 
   */
  getDaysSinceRelease(version) {
    // 
    // 
    const releaseDate = this.releaseMetrics.get(`release.${version}.date`);
    if (!releaseDate) return 0;
    return Math.floor((Date.now() - releaseDate) / (24 * 60 * 60 * 1000));
  }
  /**
   * 
   */
  setupCriticalEventTriggers() {
    // 
    process.on('uncaughtException', () => {
      this.incrementMetric('crashes.total');
      this.checkReleaseHealthThresholds();
    });
    // 
    electron_1.app.on('ready', () => {
      this.incrementMetric('sessions.total');
    });
  }
  /**
   * (D:OTel)
   */
  startHealthSession() {
    const sessionId = this.generateSessionId();
    Sentry.addBreadcrumb({
      message: '应用健康会话开始',
      category: 'session',
      level: 'info',
      data: {
        sessionId,
        timestamp: new Date().toISOString(),
        platform: process.platform,
        version: electron_1.app.getVersion?.()  'unknown',
        // OTel
        'service.name': 'guild-manager',
        'service.version': electron_1.app.getVersion?.()  'unknown',
        'deployment.environment': process.env.NODE_ENV || 'production',
      },
    });
    // 
    this.healthMetrics.set('session.started', 1);
    this.healthMetrics.set('session.start_time', this.sessionStartTime);
    this.healthMetrics.set(
      'sessions.total',
      (this.healthMetrics.get('sessions.total') || 0) + 1
    );
  }
  /**
   * 
   */
  setupAppEventMonitoring() {
    //  
    electron_1.app.on('ready', () => {
      const readyTime = Date.now() - this.sessionStartTime;
      this.healthMetrics.set('app.ready_time', readyTime);
      Sentry.setTag('app.ready_time', `${readyTime}ms`);
      Sentry.addBreadcrumb({
        message: '应用启动完成',
        category: 'app',
        level: 'info',
        data: {
          readyTime: `${readyTime}ms`,
          'duration.startup': readyTime,
          'event.name': 'app.ready',
        },
      });
    });
    //  
    electron_1.app.on('activate', () => {
      this.incrementMetric('app.activations');
    });
    //  
    electron_1.app.on('browser-window-created', (_event, window) => {
      this.incrementMetric('windows.created');
      // 
      window.webContents.on('render-process-gone', (_event, details) => {
        this.recordCrashEvent('renderer', { details });
      });
      // 
      window.on('unresponsive', () => {
        this.recordUnresponsiveEvent();
      });
    });
  }
  /**
   * 
   */
  setupHealthReporting() {
    //  5
    setInterval(
      () => {
        this.reportHealthMetrics();
      },
      5 * 60 * 1000
    );
    //  
    electron_1.app.on('before-quit', () => {
      this.reportFinalHealthMetrics();
    });
  }
  /**
   * 
   */
  setupGameHealthMonitoring() {
    //  
    this.monitorGameSessionQuality();
    //  
    this.monitorCriticalGameFlows();
    //  
    this.monitorPerformanceMetrics();
  }
  /**
   * 
   */
  monitorGameSessionQuality() {
    // 
    setInterval(() => {
      const gameMetrics = this.collectGameMetrics();
      // 
      if (gameMetrics.sessionIntegrityRate < 99.5) {
        Sentry.captureMessage('游戏会话完整性低于阈值', 'warning');
      }
    }, 60 * 1000); // 
  }
  /**
   * 
   */
  collectGameMetrics() {
    return {
      sessionIntegrityRate: 99.8, // 
      phaserEngineErrors: 0,
      uiGameCommunicationErrors: 0,
    };
  }
  /**
   * 
   */
  monitorCriticalGameFlows() {
    // 
    // :,,,
    // EventBus
    // :
    this.monitorStartupFlow();
  }
  /**
   * 
   */
  monitorStartupFlow() {
    const startupStages = [
      'electron.ready',
      'react.mounted',
      'phaser.initialized',
      'game.loaded',
    ];
    const stageTimings = new Map();
    startupStages.forEach(stage => {
      // 
      // 
      setTimeout(() => {
        stageTimings.set(stage, Date.now());
        if (stageTimings.size === startupStages.length) {
          this.reportStartupPerformance(stageTimings);
        }
      }, Math.random() * 3000);
    });
  }
  /**
   * 
   */
  reportStartupPerformance(timings) {
    const startupData = Object.fromEntries(timings);
    Sentry.addBreadcrumb({
      message: '启动性能报告',
      category: 'performance',
      level: 'info',
      data: {
        ...startupData,
        'performance.category': 'startup',
        'measurement.unit': 'milliseconds',
      },
    });
  }
  /**
   * 
   */
  monitorPerformanceMetrics() {
    //  
    setInterval(() => {
      const memUsage = process.memoryUsage();
      this.healthMetrics.set('performance.memory.rss', memUsage.rss);
      this.healthMetrics.set('performance.memory.heapUsed', memUsage.heapUsed);
      //  
      if (memUsage.heapUsed > 500 * 1024 * 1024) {
        // 500MB
        Sentry.captureMessage('内存使用过高', 'warning');
      }
    }, 30 * 1000); // 30
  }
  /**
   * 
   */
  recordCrashEvent(type, details) {
    this.incrementMetric('crashes.total');
    this.incrementMetric(`crashes.${type}`);
    Sentry.captureException(new Error(`${type} process crashed`), {
      tags: {
        'crash.type': type,
        'error.category': 'crash',
      },
      extra: details,
    });
    // 
    this.checkReleaseHealthThresholds();
  }
  /**
   * 
   */
  recordUnresponsiveEvent() {
    this.incrementMetric('unresponsive.total');
    Sentry.captureMessage('应用无响应', 'warning');
  }
  /**
   * 
   */
  incrementMetric(key) {
    this.healthMetrics.set(key, (this.healthMetrics.get(key) || 0) + 1);
  }
  /**
   * (OTel)
   */
  reportHealthMetrics() {
    const metrics = Object.fromEntries(this.healthMetrics);
    const sessionDuration = Date.now() - this.sessionStartTime;
    const healthSummary = this.calculateCurrentHealthMetrics();
    Sentry.addBreadcrumb({
      message: '健康状态报告',
      category: 'health',
      level: 'info',
      data: {
        ...metrics,
        sessionDuration: `${Math.round(sessionDuration / 1000)}s`,
        // OTel
        'metric.name': 'app.health.report',
        'metric.unit': 'count',
        'service.health.status': this.determineHealthStatus(healthSummary),
      },
    });
  }
  /**
   * 
   */
  determineHealthStatus(metrics) {
    if (
      metrics.crashFreeSessionsRate <
        RELEASE_HEALTH_THRESHOLDS.crashFreeSessionsRate ||
      metrics.crashFreeUsersRate < RELEASE_HEALTH_THRESHOLDS.crashFreeUsersRate
    ) {
      return 'unhealthy';
    }
    if (
      metrics.crashFreeSessionsRate < 99.8 ||
      metrics.crashFreeUsersRate < 99.9
    ) {
      return 'degraded';
    }
    return 'healthy';
  }
  /**
   * 
   */
  reportFinalHealthMetrics() {
    const sessionDuration = Date.now() - this.sessionStartTime;
    const metrics = Object.fromEntries(this.healthMetrics);
    const finalHealthSummary = this.calculateCurrentHealthMetrics();
    Sentry.setContext('session_summary', {
      duration: sessionDuration,
      ...metrics,
      healthSummary: finalHealthSummary,
      ended_at: new Date().toISOString(),
      // OTel
      'session.duration': sessionDuration,
      'session.end.reason': 'normal',
    });
    Sentry.captureMessage('会话结束健康报告', 'info');
  }
  /**
   * ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * 
   */
  getHealthThresholds() {
    return RELEASE_HEALTH_THRESHOLDS;
  }
  /**
   * 
   */
  getCurrentHealth() {
    return this.calculateCurrentHealthMetrics();
  }
}
exports.ReleaseHealthManager = ReleaseHealthManager;
// 
exports.releaseHealthManager = ReleaseHealthManager.getInstance();
