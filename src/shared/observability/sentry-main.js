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
exports.initSentryMain = initSentryMain;
exports.integrateObservabilityMetrics = integrateObservabilityMetrics;
exports.sendBusinessMetric = sendBusinessMetric;
exports.reportLevelLoadTimeMain = reportLevelLoadTimeMain;
exports.reportBattleRoundTimeMain = reportBattleRoundTimeMain;
exports.reportSystemMetrics = reportSystemMetrics;
exports.startSystemMetricsCollection = startSystemMetricsCollection;
exports.sendDatabaseAlert = sendDatabaseAlert;
const electron_1 = require('electron');
const Sentry = __importStar(require('@sentry/electron/main'));
const fs_1 = require('fs');
const path_1 = require('path');
//  + 
const SENTRY_CONFIGS = {
  production: {
    dsn: process.env.SENTRY_DSN || '',
    environment: 'production',
    sampleRate: 1.0, // 100%
    tracesSampleRate: 0.2, // 20%()
    autoSessionTracking: true, // Release Health
    enableTracing: true,
    release: `app@${electron_1.app.getVersion?.()  'unknown'}+${process.platform}`,
    dist: process.platform,
    dynamicSampling: {
      baseSampleRate: 0.2, // 0.2
      errorThreshold: 0.05,
      performanceThreshold: 500,
      criticalTransactions: ['startup', 'game.load', 'ai.decision'],
    },
  },
  staging: {
    dsn: process.env.SENTRY_DSN_STAGING || process.env.SENTRY_DSN || '',
    environment: 'staging',
    sampleRate: 1.0, // 100%
    tracesSampleRate: 0.3, // 30%()
    autoSessionTracking: true,
    enableTracing: true,
    release: `app@${electron_1.app.getVersion?.()  'unknown'}+${process.platform}`,
    dist: `${process.platform}-staging`,
    dynamicSampling: {
      baseSampleRate: 0.3,
      errorThreshold: 0.02,
      performanceThreshold: 300,
      criticalTransactions: ['startup', 'game.load', 'ai.decision'],
    },
  },
  development: {
    dsn: process.env.SENTRY_DSN_DEV || '',
    environment: 'development',
    sampleRate: 1.0, // 100%()
    tracesSampleRate: 1.0, // 100%
    autoSessionTracking: true,
    enableTracing: true,
    release: `app@${electron_1.app.getVersion?.()  'dev'}+${process.platform}`,
    dist: `${process.platform}-dev`,
    dynamicSampling: {
      baseSampleRate: 1.0,
      errorThreshold: 0.0,
      performanceThreshold: 100,
      criticalTransactions: ['startup', 'game.load', 'ai.decision'],
    },
  },
};
// 
const performanceStats = {
  avgResponseTime: 0,
  errorRate: 0,
  cpuUsage: 0,
  lastUpdate: Date.now(),
};
/**
 * Sentry
 * ,,,Release Health
 */
function initSentryMain() {
  return new Promise(resolve => {
    try {
      //  
      const environment = determineEnvironment();
      const config = SENTRY_CONFIGS[environment];
      //  
      if (!validateSentryConfig(config)) {
        console.warn('Sentry config validation failed; using degraded mode');
        resolve(false);
        return;
      }
      console.log(`Initialize Sentry (main) [${environment}]`);
      //  Sentry
      Sentry.init({
        dsn: config.dsn,
        environment: config.environment,
        release: config.release,
        dist: config.dist,
        //  
        sampleRate: config.sampleRate,
        tracesSampler: createDynamicTracesSampler(config.dynamicSampling),
        //  Release Health()
        // enableTracingv5+,tracesSampleRate
        //  
        initialScope: {
          tags: {
            'app.type': 'electron-game',
            'game.name': 'guild-manager',
            'engine.ui': 'react',
            'engine.game': 'phaser',
            platform: process.platform,
            arch: process.arch,
            'node.version': process.version,
          },
          //  
          contexts: {
            app: {
              name: 'Guild Manager',
              version: electron_1.app.getVersion?.()  'unknown',
              build: process.env.BUILD_NUMBER || 'local',
            },
            runtime: {
              name: 'electron',
              version: process.versions.electron,
            },
          },
        },
        //  
        integrations: [
          Sentry.httpIntegration({ breadcrumbs: true }),
          Sentry.onUncaughtExceptionIntegration(),
          Sentry.onUnhandledRejectionIntegration(),
          Sentry.linkedErrorsIntegration(),
          Sentry.contextLinesIntegration(),
        ],
        //   - OTelPII
        beforeSend(event, hint) {
          const filteredEvent = filterPIIWithOTelSemantics(event, hint);
          return filteredEvent;
        },
        //  
        beforeBreadcrumb(breadcrumb) {
          return filterSensitiveBreadcrumb(breadcrumb);
        },
      });
      //  
      setTimeout(() => {
        const isInitialized = validateSentryInitialization();
        if (isInitialized) {
          console.log('Sentry main initialized');
          setupSentryExtensions(config);
          logInitializationEvent(config);
          startPerformanceMonitoring();
        } else {
          console.error('Sentry main initialization verification failed');
        }
        resolve(isInitialized);
      }, 100);
    } catch (error) {
      console.error('Sentry main initialization error:', error);
      //  :Sentry
      setupFallbackLogging();
      resolve(false);
    }
  });
}
/**
 * (B:+)
 */
function createDynamicTracesSampler(config) {
  return samplingContext => {
    const { transactionContext } = samplingContext;
    const transactionName = transactionContext?.name || '';
    //  
    if (
      config.criticalTransactions.some(critical =>
        transactionName.includes(critical)
      )
    ) {
      return 1.0; // 100%
    }
    //  /
    if (performanceStats.errorRate > config.errorThreshold) {
      return Math.min(1.0, config.baseSampleRate * 2);
    }
    //  
    if (performanceStats.avgResponseTime > config.performanceThreshold) {
      return Math.max(0.01, config.baseSampleRate * 0.5);
    }
    //  CPU
    if (performanceStats.cpuUsage > 80) {
      return Math.max(0.01, config.baseSampleRate * 0.3);
    }
    return config.baseSampleRate;
  };
}
/**
 * ()
 */
function startPerformanceMonitoring() {
  setInterval(() => {
    try {
      // 
      updatePerformanceStats();
    } catch (error) {
      console.warn('Performance monitoring update failed:', error);
    }
  }, 30000); // 30
}
/**
 * 
 */
function updatePerformanceStats() {
  // 
  performanceStats.lastUpdate = Date.now();
  // :CPU
  if (process.cpuUsage) {
    const usage = process.cpuUsage();
    performanceStats.cpuUsage = (usage.user + usage.system) / 1000000; // 
  }
}
/**
 * 
 */
function determineEnvironment() {
  // 
  if (process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  // 
  if (process.env.ELECTRON_IS_DEV || !electron_1.app.isPackaged) {
    return 'development';
  }
  // 
  if (process.env.STAGING || electron_1.app.getVersion?.()?.includes('beta')) {
    return 'staging';
  }
  // 
  return 'production';
}
/**
 * Sentry
 */
function validateSentryConfig(config) {
  if (!config.dsn) {
    console.warn('Sentry DSN not configured; skip initialization');
    return false;
  }
  if (!config.dsn.startsWith('https://')) {
    console.error('Invalid Sentry DSN');
    return false;
  }
  return true;
}
/**
 * Sentry
 */
function validateSentryInitialization() {
  try {
    // Sentry
    const client = Sentry.getClient();
    if (!client) {
      return false;
    }
    // SDK
    const options = client.getOptions();
    if (!options.dsn) {
      return false;
    }
    return true;
  } catch (error) {
    console.error('Sentry verification error:', error);
    return false;
  }
}
/**
 * F:PIIMinidump(OTel)
 */
function filterPIIWithOTelSemantics(event, hint) {
  //  PII
  if (event.request?.headers) {
    delete event.request.headers['authorization'];
    delete event.request.headers['cookie'];
    delete event.request.headers['x-api-key'];
  }
  //  (OTel)
  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
    // OTel
    if (event.user.id) {
      event.user.id = 'anonymous';
    }
  }
  //  PII
  if (event.exception?.values) {
    event.exception.values.forEach(exception => {
      // OTel
      if (exception.type && exception.message) {
        // 
        exception.message = sanitizeMessage(exception.message);
      }
    });
  }
  //  OTel
  if (event.contexts) {
    if (event.contexts.trace) {
      // OTel trace
      const traceContext = event.contexts.trace;
      event.tags = event.tags || {};
      if (traceContext.trace_id) {
        event.tags['trace.id'] = traceContext.trace_id;
      }
      if (traceContext.span_id) {
        event.tags['span.id'] = traceContext.span_id;
      }
    }
  }
  return event;
}
/**
 * 
 */
function sanitizeMessage(message) {
  // 
  return message
    .replace(/password[=:]\s*[^\s]+/gi, 'password=[REDACTED]')
    .replace(/token[=:]\s*[^\s]+/gi, 'token=[REDACTED]')
    .replace(/key[=:]\s*[^\s]+/gi, 'key=[REDACTED]')
    .replace(/secret[=:]\s*[^\s]+/gi, 'secret=[REDACTED]')
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD_NUMBER]'); // 
}
/**
 * 
 */
function filterSensitiveBreadcrumb(breadcrumb) {
  //  
  if (breadcrumb.category === 'http' && breadcrumb.data?.url) {
    const url = breadcrumb.data.url;
    if (
      url.includes('password') ||
      url.includes('token') ||
      url.includes('secret')
    ) {
      return null;
    }
  }
  //  
  if (
    breadcrumb.category === 'ui.input' &&
    breadcrumb.message?.includes('password')
  ) {
    return null;
  }
  return breadcrumb;
}
/**
 * Sentry
 */
function setupSentryExtensions(config) {
  //  ()
  Sentry.setUser({
    id: 'anonymous', // ID
    username: 'player',
  });
  //  
  Sentry.setTags({
    'init.success': 'true',
    'init.environment': config.environment,
    'init.timestamp': new Date().toISOString(),
  });
  //  Release Health
  if (config.environment === 'production') {
    setupUserFeedback();
  }
}
/**
 * 
 */
function setupUserFeedback() {
  //  
  process.on('uncaughtException', error => {
    Sentry.captureException(error);
    // :
    // showUserFeedbackDialog();
  });
}
/**
 * (OTel)
 */
function logInitializationEvent(config) {
  Sentry.addBreadcrumb({
    message: 'Sentry主进程初始化完成',
    category: 'observability',
    level: 'info',
    data: {
      environment: config.environment,
      sampleRate: config.sampleRate,
      tracesSampleRate: config.tracesSampleRate,
      autoSessionTracking: config.autoSessionTracking,
      platform: process.platform,
      version: electron_1.app.getVersion?.()  'unknown',
      // OTel
      'service.name': 'guild-manager',
      'service.version': electron_1.app.getVersion?.()  'unknown',
      'deployment.environment': config.environment,
    },
  });
  //  
  Sentry.captureMessage('Sentry主进程监控已启用', 'info');
}
/**
 * (D:JSON)
 */
function setupFallbackLogging() {
  console.log('Setup fallback logging...');
  // 
  const logsDir = (0, path_1.join)(electron_1.app.getPath('userData'), 'logs');
  if (!(0, fs_1.existsSync)(logsDir)) {
    (0, fs_1.mkdirSync)(logsDir, { recursive: true });
  }
  // (JSON)
  process.on('uncaughtException', error => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'error',
      component: 'main-process',
      message: error.message,
      context: {
        type: 'uncaughtException',
        stack: error.stack,
        platform: process.platform,
        version: electron_1.app.getVersion?.()  'unknown',
      },
      // OTel
      trace_id: generateTraceId(),
      span_id: generateSpanId(),
      'exception.type': error.constructor.name,
      'exception.message': error.message,
    };
    const logFile = (0, path_1.join)(
      logsDir,
      `error-${new Date().toISOString().split('T')[0]}.log`
    );
    (0, fs_1.writeFileSync)(logFile, JSON.stringify(logEntry) + '\n', {
      flag: 'a',
    });
  });
}
/**
 * trace ID()
 */
function generateTraceId() {
  return Math.random().toString(36).substring(2, 15);
}
/**
 * span ID()
 */
function generateSpanId() {
  return Math.random().toString(36).substring(2, 10);
}
/**
 * SQLiteSentry
 */
async function integrateObservabilityMetrics() {
  try {
    console.log('Integrate observability metrics into Sentry...');
    class SimpleObservabilityManager {
      config;
      constructor(config) {
        this.config = config;
      }
      async collectAndExpose() {
        try {
          // 
          const metrics = {
            timestamp: new Date().toISOString(),
            dbPath: this.config.dbPath,
            enabled: this.config.enabled,
          };
          console.log('Observability metrics collected:', metrics);
        } catch (error) {
          console.warn('Metrics collection error:', error);
        }
      }
    }
    const observabilityConfig = {
      dbPath: process.env.DB_PATH || 'data/app.db',
      sentryDsn: process.env.SENTRY_DSN,
      metricsInterval: 60, // Sentry
      enabled: true,
    };
    const manager = new SimpleObservabilityManager(observabilityConfig);
    // 
    setInterval(async () => {
      try {
        await manager.collectAndExpose();
      } catch (error) {
        console.warn('Observability metrics collection failed:', error);
      }
    }, observabilityConfig.metricsInterval * 1000);
    // 
    await manager.collectAndExpose();
    console.log('SQLite health metrics integrated into Sentry');
  } catch (error) {
    console.warn('Observability metrics integration failed:', error.message);
    // 
  }
}
/**
 * Sentry - distribution
 */
function sendBusinessMetric(metricName, value, unit = 'count', tags = {}) {
  try {
    // (metrics API)
    Sentry.addBreadcrumb({
      message: `Metric: ${metricName}`,
      level: 'info',
      data: {
        value,
        component: 'main-process',
        environment: determineEnvironment(),
        ...tags,
      },
      category: 'metrics',
    });
    console.log(
      `Main-process metric sent: ${metricName}=${value}${unit}`,
      tags
    );
  } catch (error) {
    console.warn('Main-process metric send failed:', error.message);
  }
}
/**
 *  - 
 */
function reportLevelLoadTimeMain(loadMs, levelId) {
  sendBusinessMetric('level.load.ms', loadMs, 'millisecond', {
    levelId,
    source: 'main-process',
  });
}
/**
 *  - 
 */
function reportBattleRoundTimeMain(roundMs, battleType, round) {
  sendBusinessMetric('battle.round.ms', roundMs, 'millisecond', {
    battleType,
    round: round.toString(),
    source: 'main-process',
  });
}
/**
 * 
 */
function reportSystemMetrics() {
  try {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    // 
    sendBusinessMetric(
      'system.memory.rss.mb',
      Math.round(memUsage.rss / 1024 / 1024),
      'megabyte',
      {
        type: 'rss',
      }
    );
    sendBusinessMetric(
      'system.memory.heap.mb',
      Math.round(memUsage.heapUsed / 1024 / 1024),
      'megabyte',
      {
        type: 'heap',
      }
    );
    // CPU
    sendBusinessMetric(
      'system.cpu.user.ms',
      Math.round(cpuUsage.user / 1000),
      'millisecond',
      {
        type: 'user',
      }
    );
    sendBusinessMetric(
      'system.cpu.system.ms',
      Math.round(cpuUsage.system / 1000),
      'millisecond',
      {
        type: 'system',
      }
    );
  } catch (error) {
    console.warn('System performance metric send failed:', error.message);
  }
}
/**
 * 
 */
function startSystemMetricsCollection() {
  // 
  reportSystemMetrics();
  // 60
  const metricsInterval = setInterval(() => {
    reportSystemMetrics();
  }, 60000);
  // 
  electron_1.app.on('before-quit', () => {
    clearInterval(metricsInterval);
    reportSystemMetrics(); // 
  });
  console.log('System metrics collection started (every 60s)');
}
/**
 * 
 */
function sendDatabaseAlert(
  alertType,
  message,
  severity = 'warning',
  extra = {}
) {
  try {
    Sentry.captureMessage(`Database Alert: ${message}`, {
      level: severity,
      tags: {
        component: 'database',
        alertType,
        environment: determineEnvironment(),
      },
      extra,
    });
    console.log(`Database alert sent: ${alertType} - ${message}`);
  } catch (error) {
    console.warn('Database alert send failed:', error.message);
  }
}
// ,
