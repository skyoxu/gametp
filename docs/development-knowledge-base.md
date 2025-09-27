# Vitegame 椤圭洰寮€鍙戠煡璇嗗簱

## MCP 閰嶇疆涓庢晠闅滄帓闄?
### 1. MCP 閰嶇疆灞傛浼樺厛绾э紙鏉ユ簮锛歮cpsetup.md锛?
**鍏抽敭鍙戠幇**锛氶」鐩骇閰嶇疆 > 鍏ㄥ眬閰嶇疆

- `.claude.json` > `claude_desktop_config.json`
- 椤圭洰鐩綍瀛樺湪 `.claude.json` 鏃讹紝瀹屽叏瑕嗙洊鍏ㄥ眬閰嶇疆锛堜笉鏄悎骞讹級

**Windows 鐜閰嶇疆鏍煎紡**锛?
```json
{
  "mcp": {
    "servers": {
      "server-name": {
        "command": "cmd",
        "args": ["/c", "npx", "<package-name>", "<args>"]
      }
    }
  }
}
```

**鏁呴殰鎺掗櫎娴佺▼**锛?
1. 妫€鏌ラ厤缃枃浠朵紭鍏堢骇
2. 楠岃瘉鍖呭畨瑁呯姸鎬侊細`npm list <package-name>`
3. 閲嶅惎Claude Code楠岃瘉
4. 浣跨敤 `/mcp` 鍛戒护妫€鏌ュ彲鐢ㄥ伐鍏?
### 2. OpenMemory MCP 瑙ｅ喅鏂规

**闂**锛氬畼鏂?`openmemory` npm鍖呭湪Windows涓婼QLite3缂栬瘧澶辫触

**瑙ｅ喅鏂规**锛氳嚜瀹氫箟Python鏈嶅姟锛坄start_openmemory.py`锛?
- 鍩轰簬 `mem0ai` 搴擄紙v0.1.117锛?- 鎻愪緵SSE绔偣锛歚http://localhost:8765/mcp/claude/sse/claude-user`
- 瀹屽叏鍏煎 `.mcp.json` 閰嶇疆

**鍚姩鍛戒护**锛?
```powershell
py start_openmemory.py
```

## CI/CD 鏈€浣冲疄璺碉紙鏉ユ簮锛歝itest/ciinfo.md锛?
### 1. GitHub Actions 鍩虹瑙勫垯

**YAML 璇硶**锛?
- 澶氳鍛戒护鐢?`|`锛堥€愯淇濈暀锛夋垨 `>`锛堟姌鍙犳垚绌烘牸锛?- 閬垮厤琛屽熬鍙嶆枩鏉犱笌鎻掑€兼悶鍧廦AML
- 鍚慗ob Summary杈撳嚭缁熶竴鐢?`$GITHUB_STEP_SUMMARY`

**Shell 鑴氭湰瑙勮寖**锛?
- 涓€娆￠噸瀹氬悜锛歚{ 鈥? } >> "$file"` 浠ｆ浛澶氭 `>> "$file"`
- 鎵€鏈夊彉閲忎竴寰嬪弻寮曞彿锛堟秷闄C2086锛?- Windows job涓鍐橞ash璇硶闇€鏄惧紡 `shell: bash`

### 2. npm 瀹夎绛栫暐

**鏋勫缓/娴嬭瘯/鏍￠獙**锛氱敤 `npm ci`锛堝寘鍚玠ev渚濊禆锛?**閮ㄧ讲**锛歚npm ci --omit=dev`
**娉ㄦ剰**锛氳缃?`NODE_ENV=production` 浼氳烦杩嘾evDependencies

### 3. Electron 瀹夊叏瑕佺偣

**澶栭儴瀵艰埅鍙岄椄**锛?
```javascript
// webRequest.onBeforeRequest
{ urls: ['http://*/*', 'https://*/*'] } 鈫?cancel: true

// will-navigate
event.preventDefault() + shell.openExternal(url)
```

**CSP璁剧疆**锛?
- 鐢熶骇锛氬搷搴斿ご锛堟帹鑽愶級
- 娴嬭瘯/file://锛歚<meta http-equiv="Content-Security-Policy">`

**鑷畾涔夊崗璁?*锛氭敞鍐屼负 `standard + secure`锛屽姞杞?`app://index.html`

### 4. 娴嬭瘯鐜閰嶇疆

**Vitest 鐜鍒嗘祦**锛?
- Node涓撶敤锛氭枃浠跺ご鍔?`// @vitest-environment node`
- DOM闇€瑕侊細`// @vitest-environment jsdom`
- 鎵归噺閰嶇疆锛歚vitest.config` 涓?`environmentMatchGlobs`

**Playwright Electron**锛?
- 鍚姩锛歚electron.launch() / firstWindow()`
- 绛夊緟锛歚document.readyState` 鍒ゆ柇灏辩华
- 閬垮厤鍗″湪閿欒椤甸潰

### 5. ESLint 闂ㄧ绛栫暐

**鍒嗙洰褰曢槇鍊?*锛?
- `src/**`锛歚--max-warnings 0`锛堜弗鏍硷級
- `tests/**`锛氳瀹芥澗闃堝€硷紙濡?0锛夋垨鏀逛负warn

**甯歌淇**锛?
- 缁?`page.evaluate<T>()` 鏍囨敞杩斿洖娉涘瀷
- 鐢?`unknown/Record<string,unknown>` 浠ｆ浛 `any`
- 闀挎祴璇曟媶鎴?`test.step()` 鎴栧涓?`test()`

### 6. Sentry 闆嗘垚瑙勮寖

**Release 娴佺▼**锛?
```powershell
sentry-cli releases new 鈫?set-commits --auto 鈫?(鍙€?sourcemaps upload) 鈫?releases finalize 鈫?deploys new
```

**蹇呴渶鐜鍙橀噺**锛?
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `SENTRY_AUTH_TOKEN`

**Deploy 鏃堕棿鍙傛暟**锛?
- 浣跨敤 `--started/--finished <unix绉?` 鎴?`-t <鑰楁椂绉?`
- 涓嶈浼營SO瀛楃涓?
### 7. 鐢熸垚宸ヤ欢鏈€浣冲疄璺?
**纭畾鎬ц緭鍑?*锛?
- 鐢?`json-stable-stringify` 璁＄畻鍐呭鍝堝笇
- 缁熶竴琛屽熬锛歚.gitattributes` 璁?`*.json text eol=lf`
- 缂栬緫鍣細`.editorconfig` 璁?`end_of_line=lf`

### 8. Windows 鐜娉ㄦ剰浜嬮」

**Shell 閫夋嫨**锛?
- 闇€瑕丅ash璇硶锛歚shell: bash`
- 鍚﹀垯榛樿PowerShell

**CRLF 澶勭悊**锛?
```powershell
git config --global core.autocrlf input
```

**Job Summary 鍐欏叆**锛氱粺涓€浣跨敤 `$GITHUB_STEP_SUMMARY`

## 椤圭洰鎶€鏈爤鍐崇瓥

### 鏍稿績鎶€鏈€夊瀷

- **妗岄潰瀹瑰櫒**锛欵lectron锛堣法骞冲彴鎵撳寘 & Node API闆嗘垚锛?- **娓告垙寮曟搸**锛歅haser 3锛圵ebGL娓叉煋 & 鍦烘櫙绠＄悊锛?- **UI妗嗘灦**锛歊eact 19锛堝鏉傜晫闈㈢粍浠跺紑鍙戯級
- **鏋勫缓宸ュ叿**锛歏ite锛圖ev鏈嶅姟鍣?& 鐢熶骇鎵撳寘锛?- **寮€鍙戣瑷€**锛歍ypeScript锛堝叏鏍堝己绫诲瀷鏀寔锛?- **鏁版嵁鏈嶅姟**锛歋QLite锛堥珮鎬ц兘鏈湴鏁版嵁搴擄級
- **鏍峰紡鏂规**锛歍ailwind CSS v4锛堝師瀛愬寲CSS寮€鍙戯級

### 寮哄埗绾︽潫

1. **React锛氬己鍒?v19**锛堢姝?v18 鍙婁互涓嬶級
2. **Tailwind CSS锛氬己鍒?v4**锛堢姝?v3 鍙婁互涓嬶級
3. **妯″潡绯荤粺锛氱姝?CommonJS**锛涗竴寰嬩娇鐢?**ESM**
4. **TypeScript 浼樺厛**锛氶粯璁や互 TypeScript 瀹炵幇

## 甯哥敤淇妯℃澘

### YAML/GitHub Actions

```
鎶婂琛屽懡浠ゆ敼涓?run: | 鎴?run: >锛岀粺涓€鎶?Markdown/澶у潡鏂囨湰鏀?heredoc锛?淇帀 actionlint 鐨?YAML 绾ч敊璇悗鍐嶇湅 ShellCheck銆?```

### Bash 閲嶅畾鍚?
```
鎶婂娆?>> "$GITHUB_STEP_SUMMARY" 鍚堝苟涓?{ 鈥? } >> "$GITHUB_STEP_SUMMARY"锛?鎵€鏈夊彉閲忓姞鍙屽紩鍙枫€?```

### npm 瀹夎

```
鏋勫缓/娴嬭瘯闃舵浣跨敤 npm ci锛堝寘鍚?dev锛夛紱
涓嶈璁剧疆 NODE_ENV=production 鎴?--omit=dev銆?```

### Electron 瀵艰埅涓?CSP

```
鍦ㄤ富杩涚▼鍚屾椂鍔?onBeforeRequest(cancel) 涓?will-navigate.preventDefault()锛?鐢熶骇鐢ㄥ搷搴斿ご CSP锛屾祴璇曞姞 <meta> 鍏滃簳锛?鑷畾涔夊崗璁敞鍐屼负 standard + secure銆?```

## 寮€鍙戝伐浣滄祦绋?
### 璐ㄩ噺闂ㄧ

```powershell
npm run guard:ci  # 瀹屾暣CI妫€鏌ラ摼
```

鍖呭惈锛?
- `typecheck`锛歍ypeScript 绫诲瀷妫€鏌?- `lint`锛欵SLint 浠ｇ爜璐ㄩ噺
- `test:unit`锛歏itest 鍗曞厓娴嬭瘯
- `guard:dup`锛氶噸澶嶄唬鐮佹鏌ワ紙2%闃堝€硷級
- `guard:complexity`锛氬鏉傚害妫€鏌ワ紙Cyclomatic 鈮?10锛?- `guard:deps`锛氫緷璧栧叧绯绘鏌ワ紙鏃犲惊鐜緷璧栵級
- `test:e2e`锛歅laywright E2E娴嬭瘯

### 浠ｇ爜璐ㄩ噺鍘熷垯

- **DRY**锛氭娊璞″叕鍏卞姛鑳斤紝娑堥櫎閲嶅
- **KISS**锛氱畝鍗曡儨杩囧鏉?- **YAGNI**锛氬彧瀹炵幇褰撳墠闇€姹?- **SOLID**锛氬崟涓€鑱岃矗銆佸紑闂師鍒欑瓑

### Git 宸ヤ綔娴?
- 濮嬬粓鍦╢eature鍒嗘敮宸ヤ綔锛屼笉鐩存帴鍦╩ain鍒嗘敮淇敼
- 灏忔鎻愪氦锛宮eaningful commit messages
- 鎻愪氦鍓嶈繍琛屽畬鏁寸殑璐ㄩ噺闂ㄧ妫€鏌?
## 鏁呴殰鎺掗櫎娓呭崟

### MCP 闂

1. 妫€鏌ラ厤缃枃浠朵紭鍏堢骇锛堥」鐩骇 > 鍏ㄥ眬绾э級
2. 楠岃瘉鍖呭畨瑁呯姸鎬?3. 閲嶅惎Claude Code
4. 浣跨敤 `/mcp` 鍛戒护楠岃瘉

### CI 闂

1. YAML璇硶妫€鏌ワ紙actionlint锛?2. Shell鑴氭湰瑙勮寖妫€鏌ワ紙ShellCheck锛?3. 鐜鍙橀噺璁剧疆妫€鏌?4. 鏉冮檺閰嶇疆妫€鏌?
### 鏋勫缓闂

1. 渚濊禆瀹夎锛歚npm ci`
2. 绫诲瀷妫€鏌ワ細`npm run typecheck`
3. 浠ｇ爜妫€鏌ワ細`npm run lint`
4. 娴嬭瘯杩愯锛歚npm run test`

---

_鏈€鍚庢洿鏂帮細2025-09-21_
_鏉ユ簮锛歮cpsetup.md, citest/ciinfo.md, 椤圭洰瀹炶返缁忛獙_

