#!/usr/bin/env node

/**
 * 批量修复剩余PRD分片文件 - 快速版本
 * 专门处理超时后的剩余文件修复
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BatchChunkFixer {
  constructor() {
    this.prdChunksDir = path.join(__dirname, '..', 'docs', 'prd_chunks');
    this.processed = [];
    this.errors = [];
  }

  async fixRemainingChunks() {
    console.log('⚡ 快速批量修复剩余PRD分片...\n');

    const files = fs
      .readdirSync(this.prdChunksDir)
      .filter(
        file =>
          file.startsWith('PRD-Guild-Manager_chunk_') && file.endsWith('.md')
      )
      .sort();

    console.log(`📂 处理 ${files.length} 个文件...\n`);

    for (const file of files) {
      await this.quickFix(file);
    }

    this.printSummary();
  }

  async quickFix(filename) {
    const filePath = path.join(this.prdChunksDir, filename);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      let newContent = content;
      let modified = false;
      const fixes = [];

      // 1. 快速ADR-0002修复
      if (
        content.includes('CRASH_FREE_99.5') &&
        !content.includes('"ADR-0002-electron-security-baseline"')
      ) {
        newContent = this.addADR0002(newContent);
        modified = true;
        fixes.push('ADR-0002添加');
      }

      // 2. 快速CloudEvents修复
      if (content.includes('events:') && !content.includes('source:')) {
        newContent = this.fixCloudEvents(newContent, filename);
        modified = true;
        fixes.push('CloudEvents修复');
      }

      // 3. 快速Release Gates修复
      if (this.needsReleaseGatesFix(content)) {
        newContent = this.fixReleaseGates(newContent);
        modified = true;
        fixes.push('Release Gates重建');
      }

      // 4. 快速CSP修复
      if (content.includes('cspNotes:') && content.includes('默认CSP策略')) {
        newContent = content.replace(
          /cspNotes:\s*"[^"]+"/,
          "cspNotes: \"Electron CSP: script-src 'self'; object-src 'none'; base-uri 'self'\""
        );
        modified = true;
        fixes.push('CSP策略增强');
      }

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        this.processed.push({ file: filename, fixes });
        console.log(`✅ ${filename}: ${fixes.join(', ')}`);
      } else {
        console.log(`⚪ ${filename}: 无需修复`);
      }
    } catch (error) {
      this.errors.push(`${filename}: ${error.message}`);
      console.error(`❌ ${filename}: ${error.message}`);
    }
  }

  addADR0002(content) {
    const adrsRegex = /(ADRs:\s*\n\s+- "[^"]+"\s*\n)/;
    return content.replace(
      adrsRegex,
      '$1  - "ADR-0002-electron-security-baseline"\n'
    );
  }

  fixCloudEvents(content, filename) {
    const chunkNum = filename.match(/chunk_(\d{3})/)?.[1] || '000';

    // Safe line-based scanning to avoid ReDoS-prone regex
    const lines = content.split('\n');
    let start = -1;
    let end = -1;
    let indent = '';
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(/^(\s*)events:\s*$/);
      if (m) { start = i; indent = m[1] || ''; break; }
    }
    if (start === -1) return content;
    for (let j = start + 1; j < lines.length; j++) {
      if (/^\s*interfaces:/.test(lines[j])) { end = j; break; }
    }
    if (end === -1) return content;

    const newEventsContent = `    specversion: "1.0"
    id: "guild-manager-chunk-${chunkNum}-${Date.now().toString(36)}"
    time: "${new Date().toISOString()}"
    type: "com.guildmanager.chunk${chunkNum}.event"
    source: "/guild-manager/chunk-${chunkNum}"
    subject: "guild-management-chunk-${parseInt(chunkNum)}"
    datacontenttype: "application/json"
    dataschema: "src/shared/contracts/guild/chunk-${chunkNum}-events.ts"
`;

    return content.replace(eventsRegex, `$1events:\n${newEventsContent}$3`);
  }

  needsReleaseGatesFix(content) {
    return (
      content.includes('Release_Gates:') &&
      (content.includes('Quality_Gate:\nenabled:') ||
        !content.includes('  Quality_Gate:'))
    );
  }

  fixReleaseGates(content) {
    const standardGates = `  Quality_Gate:
    enabled: true
    threshold: "unit_test_coverage >= 80%"
    blockingFailures:
      - "test_failures"
      - "coverage_below_threshold"
    windowHours: 24
  Security_Gate:
    enabled: true
    threshold: "security_scan_passed == true"
    blockingFailures:
      - "security_vulnerabilities"
      - "dependency_vulnerabilities"
    windowHours: 12
  Performance_Gate:
    enabled: true
    threshold: "p95_response_time <= 100ms"
    blockingFailures:
      - "performance_regression"
      - "memory_leaks"
    windowHours: 6
  Acceptance_Gate:
    enabled: true
    threshold: "acceptance_criteria_met >= 95%"
    blockingFailures:
      - "acceptance_test_failures"
      - "user_story_incomplete"
    windowHours: 48
  API_Contract_Gate:
    enabled: true
    threshold: "api_contract_compliance >= 100%"
    blockingFailures:
      - "contract_violations"
      - "breaking_changes"
    windowHours: 12
  Sentry_Release_Health_Gate:
    enabled: true
    threshold: "crash_free_users >= 99.5% AND crash_free_sessions >= 99.9%"
    blockingFailures:
      - "crash_free_threshold_violation"
      - "insufficient_adoption_data"
      - "release_health_regression"
    windowHours: 24
    params:
      sloRef: "CRASH_FREE_99.5"
      thresholds:
        crashFreeUsers: 99.5
        crashFreeSessions: 99.9
        minAdoptionPercent: 25
        durationHours: 24
`;

    // Replace Release_Gates block using line scanning
    const lines = content.split('\n');
    let s = -1; let e = -1;
    for (let i = 0; i < lines.length; i++) {
      if (/^\s*Release_Gates:\s*$/.test(lines[i])) { s = i; break; }
    }
    if (s === -1) return content;
    for (let j = s + 1; j < lines.length; j++) {
      if (/^\s*Contract_Definitions:/.test(lines[j])) { e = j; break; }
    }
    if (e === -1) return content;
    const nl = lines.slice();
    nl.splice(s + 1, e - (s + 1), standardGates.replace(/\n$/, ''));
    return nl.join('\n');
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 批量修复结果摘要');
    console.log('='.repeat(60));

    console.log(`✅ 成功修复: ${this.processed.length} 个文件`);
    console.log(`❌ 修复失败: ${this.errors.length} 个文件`);

    if (this.processed.length > 0) {
      console.log('\n🔧 修复详情:');
      this.processed.forEach(({ file, fixes }) => {
        console.log(`  ${file}: ${fixes.join(', ')}`);
      });
    }

    if (this.errors.length > 0) {
      console.log('\n❌ 错误详情:');
      this.errors.forEach(error => console.log(`  ${error}`));
    }

    console.log('\n🎉 批量修复完成!');
  }
}

const fixer = new BatchChunkFixer();
fixer.fixRemainingChunks();
