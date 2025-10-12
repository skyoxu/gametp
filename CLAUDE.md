# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GameTP is a Windows-only desktop game application built with:

- **Electron 37.x** (main process, IPC, and security)
- **React 19** (UI components and rendering)
- **Phaser 3** (game engine and canvas)
- **Vite 7.x** (build tool and dev server)
- **TypeScript 5.8** (type system)
- **Tailwind CSS 4.x** (styling)

This is a production-quality template with enterprise-grade CI/CD, security hardening, observability, and quality gates.

## Architecture

### Layer Structure

- **src/main/** - Electron main process (window management, IPC)
- **src/preload/** - Electron preload scripts (secure bridge)
- **src/shared/** - Shared types, contracts, observability, middleware
- **src/components/** - React UI components
- **src/game/** - Phaser 3 game engine integration
- **src/hooks/** - React hooks for state and events
- **src/adapters/** - Data access layer and external integrations

### Key Architectural Patterns

- **Ports & Adapters** - Clean architecture with interface-first design
- **Event-Driven** - Domain events with CloudEvents compliance
- **Type-Safe Contracts** - Unified type definitions in `src/shared/contracts/`
- **Security-First** - Sandboxed renderer, IPC whitelist, CSP policies

### Import Aliases

```typescript
import { ... } from '@/components/...'     // ./src/
import { ... } from '@shared/contracts'   // ./src/shared/
import { ... } from '@core/...'           // ./src/core/
import { ... } from '@domain/...'         // ./src/domain/
import { ... } from '@infra/...'          // ./src/infra/
```

## Development Commands

### Core Development

```bash
npm run dev                    # Start Vite dev server (React app)
npm run dev:electron          # Build + start Electron app
npm run build                 # Production build (all targets)
npm run build:win:dir         # Windows build without packaging
```

### Type Checking (Multiple Configs)

```bash
npm run typecheck             # Main app (tsconfig.json)
npm run typecheck:shared      # Shared contracts
npm run typecheck:services   # Service layer
npm run typecheck:middleware # Middleware layer
npm run typecheck:events     # Event system
npm run typecheck:security   # Security components
```

### Testing

```bash
npm run test:unit            # Unit tests (Vitest)
npm run test:unit:watch      # Unit tests in watch mode
npm run test:coverage        # Generate coverage report
npm run test:e2e             # E2E tests (Playwright)
npm run test:e2e:smoke       # Smoke tests only (@smoke tag)
npm run test:e2e:security    # Security-specific E2E tests
```

### Code Quality

```bash
npm run lint                 # ESLint (src + tests)
npm run lint:baseline        # Enforce ESLint warning baseline
npm run format               # Prettier format
npm run format:check         # Check formatting without changes
```

### Security & Compliance

```bash
npm run security:scan        # Electronegativity security scan
npm run security:audit       # npm audit with gates
npm run security:fuses:prod  # Apply Electron fuses (production)
npm run cloudevents:check    # Validate CloudEvents compliance
```

### Quality Gates (CI Pipeline)

```bash
npm run guard:ci             # Full CI pipeline locally
npm run guard:quality        # Quality metrics gate
npm run guard:performance    # Performance benchmarks
npm run size:ci              # Bundle size analysis
```

### Release & Deployment

```bash
npm run build:electron       # Build + package with electron-builder
npm run latest:yml           # Generate update manifest
npm run release:stage:25     # Staged rollout (25% users)
npm run release:health-check # Monitor release health
```

## Testing Strategy

### Unit Tests (Vitest)

- Location: `src/**/*.{test,spec}.{ts,tsx}` and `tests/unit/`
- Coverage target: 80%+ for business logic
- Excludes: UI components, Electron main/preload, observability

### E2E Tests (Playwright)

- Location: `tests/e2e/`
- Tags: Use `@smoke` for critical path tests
- Projects: `electron-security-audit`, `framerate-stability`, `scene-transition`

### Performance Tests

- Framerate stability: `npm run test:e2e:framerate`
- Scene transitions: `npm run test:e2e:scene-transition`
- Bundle size: Enforced via `.size-limit.json`

## Code Standards

### File Organization

- Keep tests in `tests/` directories, not alongside source files
- Use `claudedocs/` for AI analysis reports and documentation
- Follow existing naming conventions (camelCase for TS/React)

### Type Safety

- All shared types go in `src/shared/contracts/`
- Use discriminated unions for domain events
- Enforce CloudEvents schema compliance

### Security Requirements

- Never expose Node.js APIs directly to renderer
- All IPC channels must be explicitly whitelisted
- Use `contextBridge.exposeInMainWorld` for secure API exposure
- Follow Electron security best practices (sandbox, context isolation)

## Quality Gates

The CI pipeline (`npm run guard:ci`) enforces:

- TypeScript compilation across all configs
- ESLint with warning baseline
- Security audits and vulnerability scanning
- E2E test suite including performance checks
- Bundle size limits
- CloudEvents compliance
- Release health monitoring

## Observability

### Monitoring Stack

- **Sentry** - Error tracking and release health
- **PostHog** - Analytics and feature flags
- **Web Vitals** - Core performance metrics
- **Custom Metrics** - Game-specific telemetry

### Configuration

- Sentry DSN: Set `SENTRY_DSN` in environment/secrets
- Release health: Automatic via `src/shared/observability/`
- Structured logging: JSON format with trace correlation

## Common Issues

1. **E2E test failures**: Run `npx playwright install --with-deps` (Windows doesn't need --with-deps)
2. **Build failures**: Run `npm run build` before `npm run dev:electron`
3. **Type errors**: Check multiple tsconfig files, run all `typecheck:*` scripts
4. **Bundle size warnings**: Review `.size-limit.json` and run `npm run size:ci`
5. **Security scan failures**: Review Electronegativity output and update whitelist

## Notes

- This is a Windows-only template with Windows-specific CI workflows
- All quality gates must pass before merging
- Use ADR (Architecture Decision Records) for significant changes
- Follow the Base-Clean architecture pattern documented in `docs/`
