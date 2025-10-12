#!/usr/bin/env node
/**
 * Translate Chinese inline comments in UI/Game layer files to English.
 * - Only touches comments: line (//) and block (JSDoc) comments
 * - Skips strings to avoid changing UI text
 * - Keeps ASCII-only output; writes backups under logs/<date>/translate/
 *
 * Usage (Windows):
 *   node scripts/translate_comments_ui_game.mjs <file> [...files]
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';

function dateFolder(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Known phrase mappings (common patterns observed in repo)
const PHRASE_MAP = new Map([
  // GameCanvas.tsx
  ['使用EventBus桥接React-Phaser通信', 'Bridge React <-> Phaser via EventBus'],
  ['处理游戏事件', 'Handle game events'],
  ['仅处理游戏相关事件', 'Process only game/phaser/react domain events'],
  [
    '更新游戏状态：使用低优先级更新保持交互流畅',
    'Update game state using low-priority transition to keep UX responsive',
  ],
  [
    '转发事件给外部（不在关键路径，延后）',
    'Forward event to external consumer (off critical path)',
  ],
  ['初始化游戏引擎', 'Initialize game engine'],
  ['创建游戏引擎实例', 'Create engine instance'],
  ['绑定容器', 'Bind container'],
  ['订阅事件', 'Subscribe to events'],
  ['初始化游戏配置', 'Initialize game config'],
  ['启动游戏', 'Start game if requested'],
  ['自动启动游戏', 'Auto start'],
  ['清理资源', 'Cleanup on unmount'],
  [
    '使用EventBus监听游戏状态变更',
    'Listen for game state changes via EventBus',
  ],
  ['监听游戏错误事件', 'Listen for error/warning events'],
  ['监听Phaser响应', 'Listen for Phaser responses'],
  [
    '游戏控制函数 - 通过EventBus发布',
    'Game control helpers (EventBus commands)',
  ],
  ['渲染加载状态', 'Render loading state'],
  ['渲染错误状态', 'Render error state'],

  // factory.ts
  ['游戏引擎工具函数库', 'Game engine utilities'],
  [
    '提供统一的游戏引擎创建与使用方法',
    'Provide unified helpers to create and use the game engine',
  ],
  ['转发事件', 'Forward events'],
  ['订阅错误回调', 'Subscribe error callback'],
  ['默认游戏配置', 'Default game config'],
  ['初始化游戏', 'Initialize game'],
  ['释放资源', 'Release resources'],
  ['游戏配置的预设', 'Preset game configurations'],
  ['简单模式配置', 'Easy mode preset'],
  ['标准模式配置', 'Medium mode preset'],
  ['困难模式配置', 'Hard mode preset'],
  ['开发调参模式', 'Development preset (for debugging)'],
  ['使用预设配置创建游戏引擎', 'Create engine with a named preset'],

  // ports
  ['游戏端口定义', 'Game engine ports'],
  ['分层架构', 'layered architecture'],
  ['游戏状态接口', 'Game state interface'],
  ['位置结构', 'Position'],
  ['游戏配置', 'Game configuration'],
  ['游戏引擎输入端口', 'Game engine input port'],
  ['供外部系统调用游戏引擎的接口', 'External system interface to engine'],
  ['开始游戏会话', 'Start game session'],
  ['暂停游戏', 'Pause game'],
  ['恢复游戏', 'Resume game'],
  ['保存游戏状态', 'Save game state'],
  ['读取游戏状态', 'Load game state'],
  ['处理用户输入', 'Handle user input'],
  ['获取当前游戏状态', 'Get current game state'],
  ['订阅游戏事件', 'Subscribe to game events'],
  ['取消订阅游戏事件', 'Unsubscribe from game events'],
  ['结束游戏', 'End game'],
  ['游戏输入', 'Game input'],
  ['游戏结果', 'Game result'],
  ['游戏统计信息', 'Game statistics'],
  ['游戏引擎输出端口', 'Game engine output port'],
  ['渲染游戏画面', 'Render frame'],
  ['播放音频', 'Play audio'],
  ['写数据到存储', 'Save data'],
  ['从存储读取数据', 'Load data'],
  ['发送网络请求', 'Send network request'],
  ['发布领域事件', 'Publish event'],
  ['记录日志', 'Log message'],
  ['渲染数据', 'Render data'],
  ['精灵数据', 'Sprite data'],
  ['UI 数据', 'UI data'],
  ['特效数据', 'Effect data'],
  ['相机数据', 'Camera data'],
  ['音频数据', 'Audio data'],
  ['请求', 'Request'],
  ['响应', 'Response'],
]);

function translateText(text) {
  let out = text;
  for (const [zh, en] of PHRASE_MAP) {
    out = out.replaceAll(zh, en);
  }
  // If still contains non-ASCII, collapse to a generic English marker
  if (/[^\x00-\x7F]/.test(out)) {
    out = out
      .replace(/[^\x00-\x7F]+/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();
    if (!out) out = 'Comment';
  }
  return out;
}

function processComments(source) {
  let i = 0;
  let out = '';
  const n = source.length;
  let inStr = false,
    strQuote = '';
  let inLine = false;
  let inBlock = false;

  while (i < n) {
    const ch = source[i];
    const next = i + 1 < n ? source[i + 1] : '';

    if (!inLine && !inBlock) {
      // string handling
      if (!inStr && (ch === '"' || ch === "'" || ch === '`')) {
        inStr = true;
        strQuote = ch;
        out += ch;
        i++;
        continue;
      }
      if (inStr) {
        out += ch;
        if (ch === '\\') {
          // escape
          if (i + 1 < n) {
            out += source[i + 1];
            i += 2;
            continue;
          }
        } else if (ch === strQuote) {
          inStr = false;
          strQuote = '';
        }
        i++;
        continue;
      }
      // start line comment
      if (ch === '/' && next === '/') {
        inLine = true;
        out += '//';
        i += 2;
        // capture until end of line
        const start = i;
        while (i < n && source[i] !== '\n') i++;
        const commentText = source.slice(start, i);
        if (/[^\x00-\x7F]/.test(commentText)) {
          const prefix = commentText.match(/^\s*/)?.[0] ?? '';
          const body = commentText.slice(prefix.length);
          const translated = translateText(body);
          out += prefix + translated;
        } else {
          out += commentText;
        }
        inLine = false; // reset at EOL
        continue;
      }
      // start block comment
      if (ch === '/' && next === '*') {
        inBlock = true;
        out += '/*';
        i += 2;
        let chunk = '';
        while (
          i < n &&
          !(source[i] === '*' && i + 1 < n && source[i + 1] === '/')
        ) {
          chunk += source[i++];
        }
        // translate per line inside block
        const lines = chunk.split(/(\r?\n)/);
        for (let j = 0; j < lines.length; j++) {
          const ln = lines[j];
          if (/^\r?\n$/.test(ln)) {
            out += ln;
            continue;
          }
          // keep leading stars and spaces
          const m = ln.match(/^(\s*\*?\s*)(.*)$/);
          if (m) {
            const lead = m[1];
            const body = m[2];
            if (/[^\x00-\x7F]/.test(body)) {
              out += lead + translateText(body);
            } else {
              out += lead + body;
            }
          } else {
            out += ln;
          }
        }
        // close */ if present
        if (i < n) {
          out += '*/';
          i += 2;
        }
        inBlock = false;
        continue;
      }
      // default
      out += ch;
      i++;
      continue;
    }

    // fallback (should not get here frequently)
    out += ch;
    i++;
  }
  return out;
}

async function run() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error(
      'Usage: node scripts/translate_comments_ui_game.mjs <file> [...files]'
    );
    process.exit(2);
  }
  const logDir = path.join('logs', dateFolder(), 'translate');
  await fs.mkdir(logDir, { recursive: true });
  const report = [];
  for (const f of files) {
    try {
      const src = await fs.readFile(f, 'utf8');
      const dst = processComments(src);
      if (dst !== src) {
        const bak = path.join(logDir, f.replace(/[\\/]/g, '__') + '.bak');
        await fs.writeFile(bak, src, 'utf8');
        await fs.writeFile(f, dst, 'utf8');
        report.push(`[CHANGED] ${f} | backup=${bak}`);
      } else {
        report.push(`[OK] ${f} (no changes)`);
      }
    } catch (e) {
      report.push(`[ERROR] ${f} => ${String(e)}`);
    }
  }
  const logPath = path.join(logDir, 'translate.log');
  await fs.writeFile(logPath, report.join('\n') + '\n', 'utf8');
  console.log(`Translate report written: ${logPath}`);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
