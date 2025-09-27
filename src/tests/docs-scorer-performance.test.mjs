// @vitest-environment node
/**
 * docs-scorer.mjs
 * AST
 * Nodewindow
 */

import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
//
let analyzeDocument, DocumentAnalyzer, ASTCache;

beforeAll(async () => {
  const module = await import('../../scripts/docs-scorer.mjs');
  analyzeDocument = module.analyzeDocument;
  DocumentAnalyzer = module.DocumentAnalyzer;
  // ASTCache ,mock
  ASTCache = {
    cache: new Map(),
    clear() {
      this.cache.clear();
    },
  };
});

describe('docs-scorer Performance Tests', () => {
  const performanceThresholds = {
    smallDoc: 100, // <5KB,100ms
    mediumDoc: 300, // 5-20KB,300ms
    largeDoc: 1000, // >20KB,1000ms
    cacheHit: 10, // 10ms
  };

  function measureTime(fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    return { result, duration: end - start };
  }

  async function measureTimeAsync(fn) {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    return { result, duration: end - start };
  }

  function getDocSize(filePath) {
    const stats = fs.statSync(filePath);
    return stats.size;
  }

  function categorizeDoc(size) {
    if (size < 5 * 1024) return 'small';
    if (size < 20 * 1024) return 'medium';
    return 'large';
  }

  beforeEach(() => {
    // AST()
    if (ASTCache?.cache) {
      ASTCache.cache.clear();
    }
  });

  test('', async () => {
    const testFile =
      'docs/architecture/base/04-system-context-c4-event-flows.optimized.md';

    if (!fs.existsSync(testFile)) {
      console.warn(`: ${testFile},`);
      return;
    }

    const fileSize = getDocSize(testFile);
    const category = categorizeDoc(fileSize);
    const threshold = performanceThresholds[category + 'Doc'];

    console.log(`: ${testFile}`);
    console.log(`: ${(fileSize / 1024).toFixed(2)}KB (${category})`);
    console.log(`: ${threshold}ms`);

    const { result, duration } = await measureTimeAsync(() =>
      analyzeDocument(testFile)
    );

    console.log(`: ${duration.toFixed(2)}ms`);
    console.log(`: ${result.scores.total}/23`);

    expect(duration).toBeLessThan(threshold);
    expect(result.scores.total).toBeGreaterThan(0);
  });

  test('AST', async () => {
    const testFile =
      'docs/architecture/base/04-system-context-c4-event-flows.optimized.md';

    if (!fs.existsSync(testFile)) {
      console.warn(`: ${testFile},`);
      return;
    }

    // ()
    const { duration: coldDuration } = await measureTimeAsync(() =>
      analyzeDocument(testFile)
    );
    console.log(`: ${coldDuration.toFixed(2)}ms`);

    // ()
    const { duration: cachedDuration } = await measureTimeAsync(() =>
      analyzeDocument(testFile)
    );
    console.log(`: ${cachedDuration.toFixed(2)}ms`);

    //
    expect(cachedDuration).toBeLessThan(performanceThresholds.cacheHit);
    expect(cachedDuration).toBeLessThan(coldDuration * 0.1); // 10
  });

  test('', async () => {
    const pattern = 'docs/architecture/base/04-*.md';
    const files = await glob(pattern);

    if (files.length === 0) {
      console.warn(`: ${pattern},`);
      return;
    }

    console.log(`: ${files.length}`);

    const { result: results, duration } = await measureTimeAsync(async () => {
      const results = [];
      for (const file of files) {
        const result = await analyzeDocument(file);
        results.push(result);
      }
      return results;
    });

    const avgTimePerDoc = duration / files.length;
    console.log(`: ${duration.toFixed(2)}ms`);
    console.log(`: ${avgTimePerDoc.toFixed(2)}ms`);

    //
    expect(avgTimePerDoc).toBeLessThan(500); // 500ms
    expect(results.length).toBe(files.length);
    results.forEach(result => {
      expect(result.scores.total).toBeGreaterThanOrEqual(0);
      expect(result.scores.total).toBeLessThanOrEqual(23);
    });
  });

  test('', async () => {
    const testFile =
      'docs/architecture/base/04-system-context-c4-event-flows.optimized.md';

    if (!fs.existsSync(testFile)) {
      console.warn(`: ${testFile},`);
      return;
    }

    const beforeMemory = process.memoryUsage();

    //
    for (let i = 0; i < 10; i++) {
      await analyzeDocument(testFile);
    }

    const afterMemory = process.memoryUsage();
    const memoryIncrease = afterMemory.heapUsed - beforeMemory.heapUsed;

    console.log(`: ${(beforeMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`: ${(afterMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`);

    // (10MB)
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
  });

  test('', async () => {
    const pattern = 'docs/architecture/base/04-*.md';
    const files = await glob(pattern);

    if (files.length === 0) {
      console.warn(`: ${pattern},`);
      return;
    }

    console.log(`: ${files.length}`);

    //
    const { duration: serialDuration } = await measureTimeAsync(async () => {
      for (const file of files) {
        await analyzeDocument(file);
      }
    });

    //
    ASTCache.cache.clear();

    //
    const { duration: parallelDuration } = await measureTimeAsync(async () => {
      await Promise.all(files.map(file => analyzeDocument(file)));
    });

    console.log(`: ${serialDuration.toFixed(2)}ms`);
    console.log(`: ${parallelDuration.toFixed(2)}ms`);
    console.log(`: ${(serialDuration / parallelDuration).toFixed(2)}x`);

    // (,)
    if (files.length > 1) {
      expect(parallelDuration).toBeLessThan(serialDuration);
    }
  });

  test('', async () => {
    //
    const largeContent = `---
title: Large Document Test
adr_refs: [ADR-0001, ADR-0002, ADR-0004, ADR-0005]
placeholders: \${APP_NAME}, \${PRODUCT_NAME}, \${DOMAIN_PREFIX}
---

# Large Document Performance Test

${'## Section '.repeat(100)}

\`\`\`mermaid
C4Context
    title System Context (Base)
    Person(player, "Player")
    System(app, "\${PRODUCT_NAME} (Electron App)")
\`\`\`

\`\`\`mermaid  
C4Container
    title Container View (Base)
    Container(main, "Main Process", "Node/Electron")
    Container(renderer, "Renderer UI", "React + Phaser")
\`\`\`

\`\`\`ts
export interface CloudEventV1<T=unknown> { 
  id: string; source: string; type: string; time: string;
  specversion: "1.0"; datacontenttype?: "application/json"; data?: T;
}
\`\`\`

${'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(1000)}
`;

    const testFilePath = path.join(process.cwd(), 'test-large-doc.md');

    //
    fs.writeFileSync(testFilePath, largeContent);

    try {
      const fileSize = getDocSize(testFilePath);
      console.log(`: ${(fileSize / 1024).toFixed(2)}KB`);

      const { result, duration } = await measureTimeAsync(() =>
        analyzeDocument(testFilePath)
      );

      console.log(`: ${duration.toFixed(2)}ms`);
      console.log(`: ${result.scores.total}/23`);

      //
      expect(duration).toBeLessThan(2000); // 2
      expect(result.scores.total).toBeGreaterThan(0);
    } finally {
      //
      if (fs.existsSync(testFilePath)) {
        fs.unlinkSync(testFilePath);
      }
    }
  });
});

//
function generatePerformanceReport() {
  console.log('\n docs-scorer.mjs ');
  console.log('='.repeat(50));
  console.log(' :');
  console.log('  - (<5KB): <100ms');
  console.log('  - (5-20KB): <300ms');
  console.log('  - (>20KB): <1000ms');
  console.log('  - : <10ms');
  console.log('  - : <10MB');
  console.log('\n :');
  console.log('  1. AST');
  console.log('  2. ');
  console.log('  3. ');
  console.log('  4. (remark)');
}

//
afterAll(() => {
  generatePerformanceReport();
});
