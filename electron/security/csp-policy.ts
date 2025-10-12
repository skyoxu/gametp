/**
 * Unified CSP Policy Manager
 *
 * Purpose:
 * - Generate consistent CSP for development/production environments
 * - Support nonce-based script hardening
 * - Provide validation and compatibility checks
 * - Capture common security risks for audit
 */

interface CSPDirectives {
  'default-src': string[];
  'script-src': string[];
  'style-src': string[];
  'img-src': string[];
  'connect-src': string[];
  'font-src': string[];
  'object-src': string[];
  'frame-ancestors': string[];
  'base-uri': string[];
  'form-action': string[];
}

interface CSPConfig {
  environment: 'development' | 'production';
  nonce?: string;
  sentryDsn?: string;
}

export class CSPManager {
  private static readonly BASE_POLICY: CSPDirectives = {
    'default-src': ["'none'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'connect-src': ["'self'"],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-ancestors': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'self'"],
  };

  private static readonly REQUIRED_DIRECTIVES = [
    'default-src',
    'script-src',
    'object-src',
    'frame-ancestors',
    'base-uri',
  ];

  /**
   * Generate CSP string from base directives and environment
   */
  static generateCSP(config: CSPConfig): string {
    const policy = { ...this.BASE_POLICY };

    // Development allowances
    if (config.environment === 'development') {
      policy['script-src'] = [
        "'self'",
        "'unsafe-inline'", // Allow only during dev; prefer nonce
        'localhost:*',
        '127.0.0.1:*',
      ];
      policy['connect-src'] = [
        "'self'",
        'localhost:*',
        '127.0.0.1:*',
        'ws:',
        'wss:', // Vite HMR
      ];
    }

    // Nonce support (recommended for production)
    if (config.nonce) {
      policy['script-src'] = policy['script-src']
        .filter(src => src !== "'unsafe-inline'")
        .concat([`'nonce-${config.nonce}'`]);
    }

    // Sentry allow-list (connect-src)
    if (config.sentryDsn) {
      const sentryDomain = new URL(config.sentryDsn).origin;
      policy['connect-src'].push(sentryDomain, `${sentryDomain}/*`);
    }

    return this.formatPolicy(policy);
  }

  /**
   * Development CSP (typically via response header)
   */
  static generateDevelopmentCSP(nonce?: string): string {
    return this.generateCSP({
      environment: 'development',
      nonce,
      sentryDsn: process.env.SENTRY_DSN,
    });
  }

  /**
   * Production CSP (e.g., index.html meta tag)
   */
  static generateProductionCSP(): string {
    return this.generateCSP({
      environment: 'production',
      sentryDsn: process.env.SENTRY_DSN,
    });
  }

  /**
   * Validate CSP string for required directives and common risks
   */
  static validateCSP(csp: string): {
    isValid: boolean;
    missingDirectives: string[];
    risks: string[];
  } {
    const missingDirectives = this.REQUIRED_DIRECTIVES.filter(
      directive => !csp.includes(directive)
    );

    const risks: string[] = [];

    // Common pitfalls
    if (csp.includes("'unsafe-inline'") && !csp.includes('nonce-')) {
      risks.push("'unsafe-inline' without nonce increases XSS risk");
    }

    if (csp.includes("'unsafe-eval'")) {
      risks.push("'unsafe-eval' permits dynamic code execution");
    }

    if (csp.includes('*') && !csp.includes('data:')) {
      risks.push("Wildcard '*' is overly permissive; restrict sources");
    }

    return {
      isValid: missingDirectives.length === 0,
      missingDirectives,
      risks,
    };
  }

  /**
   * Compare two CSP strings for compatibility and conflicts
   */
  static checkPolicyCompatibility(
    policy1: string,
    policy2: string
  ): {
    compatible: boolean;
    conflicts: string[];
    suggestions: string[];
  } {
    const conflicts: string[] = [];
    const suggestions: string[] = [];

    // Parse policies into directive maps
    const directives1 = this.parsePolicy(policy1);
    const directives2 = this.parsePolicy(policy2);

    for (const directive of this.REQUIRED_DIRECTIVES) {
      const values1 = directives1[directive] || [];
      const values2 = directives2[directive] || [];

      if (
        values1.length !== values2.length ||
        !values1.every(val => values2.includes(val))
      ) {
        conflicts.push(
          `${directive} differs: [${values1.join(', ')}] vs [${values2.join(', ')}]`
        );
      }
    }

    if (conflicts.length > 0) {
      suggestions.push(
        'Use CSPManager.generateCSP() to unify policy generation'
      );
      suggestions.push('Ensure environments/devices use the same base policy');
    }

    return {
      compatible: conflicts.length === 0,
      conflicts,
      suggestions,
    };
  }

  /**
   * Lightweight preset for automated tests
   */
  static generateTestingConfig(): {
    cspEnabled: boolean;
    policies: string[];
    nonceGeneration: boolean;
  } {
    return {
      cspEnabled: true,
      policies: [
        "default-src 'none'",
        "script-src 'self' 'nonce-*'",
        "style-src 'self'",
        "img-src 'self' data: blob:",
        "connect-src 'self'",
        "font-src 'self'",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "form-action 'self'",
      ],
      nonceGeneration: true,
    };
  }

  /**
   * Format directives map into CSP string
   */
  private static formatPolicy(policy: CSPDirectives): string {
    return Object.entries(policy)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Parse CSP string into directives map
   */
  private static parsePolicy(csp: string): Record<string, string[]> {
    const directives: Record<string, string[]> = {};

    csp.split(';').forEach(directive => {
      const trimmed = directive.trim();
      if (trimmed) {
        const [key, ...values] = trimmed.split(' ');
        directives[key] = values;
      }
    });

    return directives;
  }
}

/**
 * CSP manager singleton
 */
export const cspManager = new CSPManager();
