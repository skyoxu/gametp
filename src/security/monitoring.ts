/* Security monitoring and alerting system */

interface SecurityEvent {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: 'auth' | 'network' | 'file' | 'process' | 'memory' | 'general';
  message: string;
  details?: Record<string, any>;
  source?: string;
}

interface SecurityMetrics {
  failedLoginAttempts: number;
  suspiciousNetworkRequests: number;
  fileAccessViolations: number;
  memoryUsage: number;
  activeConnections: number;
}

class SecurityMonitor {
  private events: SecurityEvent[] = [];
  private metrics: SecurityMetrics = {
    failedLoginAttempts: 0,
    suspiciousNetworkRequests: 0,
    fileAccessViolations: 0,
    memoryUsage: 0,
    activeConnections: 0,
  };

  private readonly MAX_EVENTS = 1000;
  private readonly ALERT_THRESHOLDS = {
    failedLoginAttempts: 5,
    suspiciousNetworkRequests: 10,
    fileAccessViolations: 3,
    memoryUsage: 85, // percentage
    activeConnections: 100,
  };

  /**
   * Record a security event
   */
  logSecurityEvent(event: Omit<SecurityEvent, 'timestamp'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(securityEvent);

    // Keep event list size within limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // Check whether to trigger alert
    this.checkAlertConditions(securityEvent);

    // Write to log
    this.writeToLog(securityEvent);
  }

  /**
   * Update security metrics
   */
  updateMetrics(partialMetrics: Partial<SecurityMetrics>): void {
    this.metrics = { ...this.metrics, ...partialMetrics };

    // Check metric thresholds
    this.checkMetricsThresholds();
  }

  /**
   * Get security events
   */
  getSecurityEvents(
    category?: SecurityEvent['category'],
    level?: SecurityEvent['level'],
    since?: Date
  ): SecurityEvent[] {
    let filteredEvents = this.events;

    if (category) {
      filteredEvents = filteredEvents.filter(e => e.category === category);
    }

    if (level) {
      filteredEvents = filteredEvents.filter(e => e.level === level);
    }

    if (since) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= since);
    }

    return filteredEvents.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );
  }

  /**
   * Get security metrics
   */
  getSecurityMetrics(): SecurityMetrics {
    return { ...this.metrics };
  }

  /**
   * Check alert conditions
   */
  private checkAlertConditions(event: SecurityEvent): void {
    if (event.level === 'critical') {
      this.triggerAlert('Critical security event detected', event);
    }

    // Check specific conditions per event category
    switch (event.category) {
      case 'auth':
        if (
          this.metrics.failedLoginAttempts >=
          this.ALERT_THRESHOLDS.failedLoginAttempts
        ) {
          this.triggerAlert('Multiple failed login attempts detected', event);
        }
        break;

      case 'network':
        if (
          this.metrics.suspiciousNetworkRequests >=
          this.ALERT_THRESHOLDS.suspiciousNetworkRequests
        ) {
          this.triggerAlert('Suspicious network activity detected', event);
        }
        break;

      case 'file':
        if (
          this.metrics.fileAccessViolations >=
          this.ALERT_THRESHOLDS.fileAccessViolations
        ) {
          this.triggerAlert('Multiple file access violations detected', event);
        }
        break;
    }
  }

  /**
   * Check metric thresholds
   */
  private checkMetricsThresholds(): void {
    Object.entries(this.ALERT_THRESHOLDS).forEach(([metric, threshold]) => {
      const currentValue = this.metrics[metric as keyof SecurityMetrics];
      if (currentValue >= threshold) {
        this.triggerAlert(
          `Security metric threshold exceeded: ${metric} = ${currentValue} (threshold: ${threshold})`
        );
      }
    });
  }

  /**
   * Trigger security alert
   */
  private triggerAlert(message: string, event?: SecurityEvent): void {
    const alert = {
      timestamp: new Date(),
      message,
      event,
      metrics: this.getSecurityMetrics(),
    };

    // Write alert log
    this.writeToAlertLog(alert);

    // Additional alert mechanisms can be added here
    // - Send email
    // - Push notification
    // - Write to database
    // - Call external monitoring system API

    console.error(' SECURITY ALERT:', alert);
  }

  /**
   * Write security log
   */
  private writeToLog(event: SecurityEvent): void {
    const logEntry = {
      timestamp: event.timestamp.toISOString(),
      level: event.level,
      category: event.category,
      message: event.message,
      details: event.details,
      source: event.source,
    };

    // In production, write to file or send to a log collector
    console.log(' Security Event:', JSON.stringify(logEntry, null, 2));
  }

  /**
   * Write alert log
   */
  private writeToAlertLog(alert: any): void {
    // In production, write to a dedicated alert log file
    console.error(' Security Alert:', JSON.stringify(alert, null, 2));
  }

  /**
   * Generate security report
   */
  generateSecurityReport(periodHours: number = 24): {
    summary: {
      totalEvents: number;
      criticalEvents: number;
      warningEvents: number;
      topCategories: string[];
    };
    events: SecurityEvent[];
    metrics: SecurityMetrics;
  } {
    const since = new Date(Date.now() - periodHours * 60 * 60 * 1000);
    const periodEvents = this.getSecurityEvents(undefined, undefined, since);

    const criticalEvents = periodEvents.filter(
      e => e.level === 'critical'
    ).length;
    const warningEvents = periodEvents.filter(
      e => e.level === 'warning'
    ).length;

    const categoryCount: Record<string, number> = {};
    periodEvents.forEach(event => {
      categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    return {
      summary: {
        totalEvents: periodEvents.length,
        criticalEvents,
        warningEvents,
        topCategories,
      },
      events: periodEvents,
      metrics: this.getSecurityMetrics(),
    };
  }
}

// Create global security monitor instance
export const securityMonitor = new SecurityMonitor();

// Export common security event logging function
export function logSecurityEvent(
  level: SecurityEvent['level'],
  category: SecurityEvent['category'],
  message: string,
  details?: Record<string, any>
) {
  securityMonitor.logSecurityEvent({ level, category, message, details });
}

// Export security metrics update function
export function updateSecurityMetrics(metrics: Partial<SecurityMetrics>) {
  securityMonitor.updateMetrics(metrics);
}
