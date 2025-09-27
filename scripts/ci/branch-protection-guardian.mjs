#!/usr/bin/env node

/**
 * 鍒嗘敮淇濇姢瀹堟姢鑴氭湰
 * 妫€鏌ュ垎鏀繚鎶よ鍒欎笌宸ヤ綔娴佹牳蹇冧綔涓氬悕鐨勪竴鑷存€? */

import { execSync } from 'child_process';
import fs from 'fs';

/**
 * 鍏抽敭宸ヤ綔娴佸強鍏舵牳蹇冧綔涓氬悕鏄犲皠 - Windows涓撴敞绛栫暐
 * 杩欎簺鏄垎鏀繚鎶ゅ繀椤绘鏌ョ殑 jobs
 * 閲囩敤Windows涓撴敞CI绛栫暐锛屼笌閮ㄧ讲鐜瀵归綈
 */
const CRITICAL_JOBS = {
  'ci.yml': [
    'workflow-guardian', // 宸ヤ綔娴佸畧鎶ゆ鏌?- 蹇呴』閫氳繃
    'quality-gates', // 璐ㄩ噺闂ㄧ - 蹇呴』閫氳繃
    'unit-tests-core', // 鏍稿績鍗曟祴 (Windows) - 蹇呴』閫氳繃
    'coverage-gate', // 瑕嗙洊鐜囬棬绂?- 蹇呴』閫氳繃
    'build-verification-core', // 鏋勫缓楠岃瘉鏍稿績 - 蹇呴』閫氳繃
    'release-health-gate', // 鍙戝竷鍋ュ悍闂ㄧ - 蹇呴』閫氳繃
    'electron-security-gate', // Electron瀹夊叏妫€鏌?- 蹇呴』閫氳繃
  ],
  'soft-gates.yml': [\n    // 软门禁是中性状态，不应该在 branch protection 中要求\n  ],\n  'validate-workflows.yml': [\n    // 文档与工作流守卫（PR 轻门禁）\n    'docs-shell-pr-gate',\n  ],
};

/**
 * 鑾峰彇褰撳墠鍒嗘敮淇濇姢瑙勫垯
 */
async function getBranchProtectionRules() {
  try {
    console.log('馃攳 鑾峰彇褰撳墠鍒嗘敮淇濇姢瑙勫垯...');

    // 妫€鏌ユ槸鍚﹀畨瑁呬簡 gh CLI
    try {
      execSync('gh --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('鈿狅笍 GitHub CLI 鏈畨瑁咃紝璺宠繃鍒嗘敮淇濇姢妫€鏌?);
      console.log('馃挕 瀹夎鏂规硶: https://cli.github.com/');
      return null;
    }

    // 妫€鏌ユ槸鍚﹀凡璁よ瘉
    try {
      execSync('gh auth status', { stdio: 'pipe' });
    } catch (error) {
      console.log('鈿狅笍 GitHub CLI 鏈璇侊紝璺宠繃鍒嗘敮淇濇姢妫€鏌?);
      console.log('馃挕 璇疯繍琛? gh auth login');
      return null;
    }

    // 鑾峰彇涓诲垎鏀繚鎶よ鍒?    const result = execSync(
      'gh api repos/:owner/:repo/branches/main/protection',
      {
        encoding: 'utf8',
        stdio: 'pipe',
      }
    );

    const protection = JSON.parse(result);
    return protection;
  } catch (error) {
    if (error.status === 404) {
      console.log('鈿狅笍 涓诲垎鏀湭璁剧疆淇濇姢瑙勫垯');
      return null;
    }

    console.log(`鈿狅笍 鑾峰彇鍒嗘敮淇濇姢瑙勫垯澶辫触: ${error.message}`);
    return null;
  }
}

/**
 * 鎻愬彇宸ヤ綔娴佷腑鐨勫叧閿綔涓氬悕
 */
function extractCriticalJobs() {
  const workflowJobs = new Map();

  for (const [workflow, expectedJobs] of Object.entries(CRITICAL_JOBS)) {
    const workflowPath = `.github/workflows/${workflow}`;

    if (!fs.existsSync(workflowPath)) {
      console.log(`鈿狅笍 宸ヤ綔娴佹枃浠朵笉瀛樺湪: ${workflowPath}`);
      continue;
    }

    const content = fs.readFileSync(workflowPath, 'utf8');
    const actualJobs = [];

    // 鎻愬彇 job 鍚嶇О
    const lines = content.split('\n');
    for (const line of lines) {
      const jobMatch = line.match(/^  ([a-zA-Z_][a-zA-Z0-9_-]*):/);
      if (jobMatch && !line.includes('#')) {
        actualJobs.push(jobMatch[1]);
      }
    }

    workflowJobs.set(workflow, {
      expected: expectedJobs,
      actual: actualJobs,
      path: workflowPath,
    });
  }

  return workflowJobs;
}

/**
 * 鐢熸垚鍒嗘敮淇濇姢瑙勫垯寤鸿
 */
function generateProtectionSuggestion(workflowJobs) {
  const requiredChecks = [];

  for (const [workflow, jobs] of workflowJobs.entries()) {
    console.log(`\n馃搵 宸ヤ綔娴? ${workflow}`);
    console.log(`   鏈熸湜鍏抽敭jobs: ${jobs.expected.join(', ')}`);
    console.log(`   瀹為檯jobs: ${jobs.actual.join(', ')}`);

    // 妫€鏌ユ湡鏈涚殑鍏抽敭 jobs 鏄惁瀛樺湪
    for (const expectedJob of jobs.expected) {
      if (jobs.actual.includes(expectedJob)) {
        requiredChecks.push(expectedJob);
        console.log(`   鉁?${expectedJob} - 瀛樺湪涓斿簲绾冲叆淇濇姢`);
      } else {
        console.log(`   鉂?${expectedJob} - 涓嶅瓨鍦紝闇€瑕佹鏌ュ伐浣滄祦瀹氫箟`);
      }
    }
  }

  return requiredChecks;
}

/**
 * 妫€鏌ュ垎鏀繚鎶や竴鑷存€? */
function checkProtectionConsistency(protection, requiredChecks) {
  if (!protection) {
    console.log('\n馃毃 鍒嗘敮淇濇姢寤鸿:');
    console.log('1. 鍚敤鍒嗘敮淇濇姢瑙勫垯');
    console.log('2. 瑕佹眰鐘舵€佹鏌ラ€氳繃');
    console.log('3. 娣诲姞浠ヤ笅蹇呴渶妫€鏌?');
    for (const check of requiredChecks) {
      console.log(`   - ${check}`);
    }
    return false;
  }

  const statusChecks = protection.required_status_checks;
  if (!statusChecks) {
    console.log('\n鈿狅笍 鏈厤缃繀闇€鐘舵€佹鏌?);
    return false;
  }

  const requiredContexts = statusChecks.contexts || [];
  const requiredChecksSet = statusChecks.checks || [];

  console.log('\n馃攳 褰撳墠蹇呴渶妫€鏌?');
  console.log(`   Contexts: ${requiredContexts.join(', ') || '鏃?}`);
  console.log(
    `   Checks: ${requiredChecksSet.map(c => c.context).join(', ') || '鏃?}`
  );

  // 妫€鏌ユ墍鏈夊繀闇€鐨?jobs 鏄惁閮藉湪淇濇姢瑙勫垯涓?  const allProtectedChecks = [
    ...requiredContexts,
    ...requiredChecksSet.map(c => c.context),
  ];
  // 允许匹配 Job 名后缀（GitHub 显示为 "Workflow / job"）
  const normalizedProtected = new Set(allProtectedChecks.flatMap(ctx => {
    const s = String(ctx || "");
    const parts = s.split(" / ");
    return [s, parts.length > 1 ? parts[parts.length - 1] : ""];
  }).filter(Boolean));

  const missingChecks = requiredChecks.filter(
    check => !allProtectedChecks.includes(check)
  );
  // 改为在标准化集合中判定缺失
  const missingChecks = requiredChecks.filter(check => !normalizedProtected.has(check));
  const extraChecks = allProtectedChecks.filter(
    check => !requiredChecks.includes(check) && !check.startsWith('Soft Gates') // 鍏佽杞棬绂佹鏌ュ瓨鍦ㄤ絾涓嶈姹?  );

  let hasIssues = false;

  if (missingChecks.length > 0) {
    console.log('\n鉂?缂哄け鐨勫繀闇€妫€鏌?');
    for (const check of missingChecks) {
      console.log(`   - ${check}`);
    }
    hasIssues = true;
  }

  if (extraChecks.length > 0) {
    console.log('\n鈿狅笍 澶氫綑鐨勬鏌ワ紙鍙兘宸插簾寮冿級:');
    for (const check of extraChecks) {
      console.log(`   - ${check}`);
    }
  }

  return !hasIssues;
}

/**
 * 涓诲嚱鏁? */
async function main() {
  console.log('馃洝锔?鍒嗘敮淇濇姢瀹堟姢妫€鏌?- Windows涓撴敞绛栫暐');
  console.log('='.repeat(50));
  console.log('馃幆 绛栫暐: CI鐜涓嶹indows閮ㄧ讲鐩爣瀵归綈锛屾彁楂樼ǔ瀹氭€?);

  try {
    // 鎻愬彇鍏抽敭浣滀笟
    const workflowJobs = extractCriticalJobs();
    const requiredChecks = generateProtectionSuggestion(workflowJobs);

    console.log(`\n馃搳 姹囨€? 鍙戠幇 ${requiredChecks.length} 涓繀闇€妫€鏌);
    console.log(`蹇呴渶妫€鏌ユ竻鍗? ${requiredChecks.join(', ')}`);

    // 鑾峰彇骞舵鏌ュ垎鏀繚鎶よ鍒?    const protection = await getBranchProtectionRules();
    const isConsistent = checkProtectionConsistency(protection, requiredChecks);

    if (isConsistent) {
      console.log('\n鉁?鍒嗘敮淇濇姢瑙勫垯涓庡伐浣滄祦淇濇寔鍚屾');
    } else {
      console.log('\n鉂?鍒嗘敮淇濇姢瑙勫垯闇€瑕佹洿鏂?);

      console.log('\n馃敡 淇姝ラ (Windows涓撴敞绛栫暐):');
      console.log('1. 鍓嶅線 GitHub 浠撳簱 Settings > Branches');
      console.log('2. 缂栬緫 main 鍒嗘敮淇濇姢瑙勫垯');
      console.log('3. 鍦?"Require status checks to pass" 涓坊鍔?绉婚櫎鐩稿簲妫€鏌?);
      console.log('4. 纭繚鎵€鏈塛indows鏍稿績妫€鏌ラ兘宸插嬀閫?);
      console.log('5. 娉ㄦ剰: 鏇存柊鍚庣殑妫€鏌ュ熀浜巜indows-latest runner');

      // 鍦?CI 鐜涓け璐?      if (process.env.CI === 'true') {
        console.log('\n馃毃 CI鐜涓嬪垎鏀繚鎶や笉涓€鑷达紝鏋勫缓澶辫触');
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('鉂?鎵ц澶辫触:', error.message);
    process.exit(1);
  }
}

// 鍏佽鐩存帴鎵ц鎴栦綔涓烘ā鍧楀鍏?if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  main().catch(console.error);
}

// Windows 璺緞鍏煎鎬у鐞?if (
  process.argv[1] &&
  process.argv[1].includes('branch-protection-guardian.mjs')
) {
  main().catch(console.error);
}

