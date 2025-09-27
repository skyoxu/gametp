# 鍒嗘敮淇濇姢瑙勫垯鎺ㄨ崘閰嶇疆

## 鏍稿績鍘熷垯

1. **Windows涓撴敞**锛欳I鐜涓嶹indows閮ㄧ讲鐩爣瀵归綈锛屾彁楂樼ǔ瀹氭€у拰璋冭瘯鏁堢巼
2. **绋冲畾鎬т紭鍏?*锛氫娇鐢ㄧǔ瀹氱殑鑻辨枃浣滀笟ID浣滀负蹇呴渶鐘舵€佹鏌ワ紝閬垮厤渚濊禆鏄剧ず鍚嶇О
3. **鏉′欢浣滀笟鎺掗櫎**锛氭湁鏉′欢鎵ц锛坕f鏉′欢锛夌殑浣滀笟涓嶅簲璁句负蹇呴渶妫€鏌?4. **闂ㄧ鍘婚噸**锛氶伩鍏嶉噸澶嶇殑瀹夊叏闂ㄧ閫犳垚鍒嗘敮淇濇姢娣蜂贡

## 鎺ㄨ崘鐨勫繀闇€鐘舵€佹鏌?
### 涓籆I娴佹按绾?(ci.yml) - Windows涓撴敞绛栫暐

```
CI/CD Pipeline / 馃洝锔?Workflow Guardian Check           (workflow-guardian)
CI/CD Pipeline / Quality Gates Check                    (quality-gates)
CI/CD Pipeline / Unit Tests (windows-latest, Node 20)  (unit-tests-core)
CI/CD Pipeline / Coverage Gate                          (coverage-gate)
CI/CD Pipeline / Build Verification Core               (build-verification-core)
CI/CD Pipeline / Release Health Gate                    (release-health-gate)
CI/CD Pipeline / Electron Security Gate                 (electron-security-gate)
```

### 缁熶竴瀹夊叏妫€鏌?(security-unified.yml)

```
Security Gate (Unified) / 馃殾 缁熶竴瀹夊叏闂ㄧ             (unified-security-gate)
```

**Windows涓撴敞浼樺娍**:

- CI鐜涓嶹indows閮ㄧ讲鐜瀹屽叏涓€鑷?- 娑堥櫎Linux鐗瑰畾渚濊禆闂锛堝optionalDependencies锛?- 绠€鍖栨晠闅滄帓鏌ュ拰鏈湴澶嶇幇
- 鎻愰珮Electron鍜?NET鎶€鏈爤鍏煎鎬?
## 涓嶅缓璁涓哄繀闇€妫€鏌ョ殑浣滀笟

浠ヤ笅浣滀笟鐢变簬鏈夋潯浠舵墽琛岋紝寤鸿**涓嶈**璁句负蹇呴渶鐘舵€佹鏌ワ細

### 鎵╁睍娴嬭瘯浣滀笟锛堟湁璺宠繃鏉′欢锛?
- `deployment-readiness` - 浠呭湪main鍒嗘敮鎵ц
- `unit-tests-extended` - 鏈夌壒瀹氳Е鍙戞潯浠?- `performance-benchmarks` - 鏈夎烦杩囨潯浠?- `build-verification-extended` - 鏈夎烦杩囨潯浠?
### 閲嶅闂ㄧ浣滀笟锛堥伩鍏嶉噸澶嶏級

- `electron-security-gate` - 涓巙nified-security-gate閲嶅锛屽缓璁彧浣跨敤缁熶竴瀹夊叏闂ㄧ

### 闈炴牳蹇冮棬绂佷綔涓?
- `dependency-audit` - 淇℃伅鎬ф鏌ワ紝涓嶅簲闃诲鍚堝苟
- `observability-verification` - 鐩戞帶楠岃瘉锛岄潪闃诲鎬?
## 浣滀笟ID绋冲畾鎬х瓥鐣?
### 褰撳墠鑹ソ瀹炶返 鉁?
鎵€鏈夋牳蹇冧綔涓氶兘浣跨敤浜嗙ǔ瀹氱殑鑻辨枃ID锛?
- 浣跨敤杩炲瓧绗﹀垎闅?(`unit-tests-core`, `coverage-gate`)
- 閬垮厤鐗规畩瀛楃鍜屼腑鏂?- 璇箟娓呮櫚涓旂畝娲?
### 鍛藉悕瑙勮寖

```yaml
jobs:
  # 濂界殑绀轰緥 鉁?- Windows涓撴敞
  unit-tests-core:
    name: 'Unit Tests (windows-latest, Node 20)'

  coverage-gate:
    name: 'Coverage Gate'

  electron-security-gate:
    name: 'Electron Security Gate'

  # 閬垮厤鐨勭ず渚?鉂?  鍗曞厓娴嬭瘯鏍稿績: # 涓枃ID
    name: 'Unit Tests'

  unit_tests_123: # 鏁板瓧鍚庣紑涓嶇ǔ瀹?    name: 'Unit Tests'
```

## 鍒嗘敮淇濇姢瑙勫垯鏇存柊寤鸿

鍦℅itHub浠撳簱璁剧疆涓紝寤鸿閰嶇疆浠ヤ笅蹇呴渶鐘舵€佹鏌ワ細

1. 杩涘叆 Settings > Branches
2. 缂栬緫 `main` 鍒嗘敮淇濇姢瑙勫垯
3. 鍦?"Require status checks to pass before merging" 涓坊鍔狅細

```
鉁?CI/CD Pipeline / 馃洝锔?Workflow Guardian Check
鉁?CI/CD Pipeline / Quality Gates Check
鉁?CI/CD Pipeline / Unit Tests (windows-latest, Node 20)
鉁?CI/CD Pipeline / Coverage Gate
鉁?CI/CD Pipeline / Build Verification Core
鉁?CI/CD Pipeline / Release Health Gate
鉁?CI/CD Pipeline / Electron Security Gate
鉁?Security Gate (Unified) / 馃殾 缁熶竴瀹夊叏闂ㄧ
```

4. 纭繚**涓嶈**娣诲姞浠ヤ笅鏉′欢鎬т綔涓氾細

```
鉂?CI/CD Pipeline / deployment-readiness
鉂?CI/CD Pipeline / unit-tests-extended
鉂?CI/CD Pipeline / performance-benchmarks
鉂?CI/CD Pipeline / build-verification-extended
```

## 楠岃瘉宸ュ叿

浣跨敤 `scripts/ci/workflow-consistency-check.mjs` 楠岃瘉閰嶇疆锛?
```powershell
node scripts/ci/workflow-consistency-check.mjs
```

璇ヨ剼鏈細锛?
- 楠岃瘉 needs 鈫?jobs 渚濊禆涓€鑷存€?- 妫€鏌ユ帹鑽愮殑蹇呴渶鐘舵€佹鏌ユ槸鍚﹀瓨鍦?- 璇嗗埆涓嶅簲璁句负蹇呴渶妫€鏌ョ殑鏉′欢鎬т綔涓?- 鎻愪緵淇寤鸿

## 鏇存柊娴佺▼

褰撻渶瑕佷慨鏀逛綔涓氭椂锛?
1. **浠呬慨鏀?name 瀛楁**锛堟樉绀哄悕锛夛紝淇濇寔 job ID 涓嶅彉
2. 杩愯涓€鑷存€ф鏌ヨ剼鏈獙璇?3. 鏇存柊鍒嗘敮淇濇姢瑙勫垯涓殑鏄剧ず鍚嶇О锛堝鏋滃繀瑕侊級

```yaml
# 鎺ㄨ崘鐨勬洿鏂版柟寮?鉁?jobs:
  unit-tests-core:  # ID淇濇寔涓嶅彉
    name: "Unit Tests (ubuntu-latest, Node 20.x)" # 浠呮洿鏂版樉绀哄悕

# 閬垮厤鐨勬洿鏂版柟寮?鉂?jobs:
  unit-tests-core-v2:  # 鏇存敼浜咺D锛屼細鐮村潖鍒嗘敮淇濇姢瑙勫垯
    name: "Unit Tests (ubuntu-latest, Node 20)"
```

杩欐牱鍙互纭繚鍒嗘敮淇濇姢瑙勫垯鐨勭ǔ瀹氭€э紝鍚屾椂淇濇寔鏄剧ず鍚嶇О鐨勭伒娲绘€с€?
