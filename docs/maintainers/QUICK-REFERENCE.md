# CI/CD 蹇€熷弬鑰冨崱

> 提示（Windows-only）：命令示例以 PowerShell 为准；若需要 Linux 参考，请看 `docs/maintainers/POWERSHELL_EQUIVALENTS.md`。

> 馃毃 \*_绱ф€ユ儏鍐?_: 濡傛灉鍒嗘敮淇濇姢澶辨晥鎴?CI 鍏ㄩ潰鏁呴殰锛岀珛鍗宠仈绯绘妧鏈礋璐ｄ汉

## 馃敟 搴旀€ュ鐞?

### 鍒嗘敮淇濇姢澶辨晥锛堭煍?楂樹紭鍏堢骇锛?

```powershell
# 1. 绔嬪嵆妫€鏌ュ綋鍓嶄繚鎶ょ姸鎬?gh api repos/:owner/:repo/branches/main/protection

# 2. 蹇€熸仮澶嶆爣鍑嗛厤缃?gh api repos/:owner/:repo/branches/main/protection \
  --method PATCH \
  --field required_status_checks[contexts][0]="quality-gates" \
  --field required_status_checks[contexts][1]="unit-tests-core" \
  --field required_status_checks[contexts][2]="coverage-gate" \
  --field required_status_checks[contexts][3]="electron-security-gate"
```

### 杞棬绂佽闃绘柇锛堭煙?涓紭鍏堢骇锛?

```powershell
# 妫€鏌ヨ蒋闂ㄧ鐘舵€?gh api repos/:owner/:repo/actions/runs?branch=main | jq '.workflow_runs[0].jobs_url'

# 鎵嬪姩璁剧疆涓€х姸鎬侊紙濡傞渶瑕侊級
# 鑱旂郴鎶€鏈礋璐ｄ汉澶勭悊
```

## 馃搵 鍏抽敭 Job 鍚嶇О

**缁濆涓嶅彲鏇存敼**锛堝垎鏀繚鎶や緷璧栵級:

- `quality-gates`
- `unit-tests-core`
- `coverage-gate`
- `electron-security-gate`

\*_鏇存敼闇€瑕佸悓姝ュ垎鏀繚鎶?_:

- `workflow-guardian` (鎺ㄨ崘淇濇姢)

## 馃洜锔?甯哥敤妫€鏌ュ懡浠?

```powershell
# 妫€鏌ュ伐浣滄祦璇硶
actionlint .github/workflows/*.yml

# 妫€鏌ヤ緷璧栧畬鏁存€?node scripts/ci/workflow-guardian.mjs

# 妫€鏌ュ垎鏀繚鎶ゅ悓姝?node scripts/ci/branch-protection-guardian.mjs

# 鏌ョ湅褰撳墠淇濇姢瑙勫垯
gh api repos/:owner/:repo/branches/main/protection | jq '.required_status_checks.contexts'
```

## 馃摓 鑱旂郴淇℃伅

**鎶€鏈礋璐ｄ汉**: [寰呭～鍐橾  
**GitHub 浠撳簱**: [褰撳墠浠撳簱]  
**鏂囨。浣嶇疆**: `docs/maintainers/CI-CD-MAINTENANCE.md`

---

**鏇存柊棰戠巼**: 姣忔鍏抽敭鍙樻洿鍚庣珛鍗虫洿鏂?
