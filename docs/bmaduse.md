# BMAD 绯荤粺闆嗘垚涓庝娇鐢?

## BMAD 瀹夎鐘舵€?

- **鏍稿績绯荤粺**: bmad-method v4.37.0锛堝凡瀹夎骞跺彲鍗囩骇鍒皏4.39.2锛?- \*_娓告垙寮€鍙戞墿灞?_: Phaser 2D (bmad-2d-phaser-game-dev)
- **鍏朵粬鎵╁睍**: Infrastructure DevOps 鎵╁睍鍖?- **Claude Code闆嗘垚**: 閫氳繃鑷畾涔塻lash鍛戒护绯荤粺瀹屽叏闆嗘垚

## BMAD 宸ヤ綔鏈哄埗

BMAD鍦–laude Code涓€氳繃**鑷畾涔塻lash鍛戒护**绯荤粺宸ヤ綔锛岃€岄潪MCP鏈嶅姟鍣ㄣ€傛瘡涓唬鐞嗗搴斾竴涓猻lash鍛戒护锛?

### 鍙敤鐨凚MAD Slash鍛戒护

\*_鏍稿績浠ｇ悊鍛戒护锛?_

- `/bmad-master` - 涓绘帶浠ｇ悊锛屼竾鑳戒换鍔℃墽琛屽櫒
- `/analyst` - 涓氬姟鍒嗘瀽甯堜唬鐞?- `/architect` - 杞欢鏋舵瀯甯堜唬鐞?- `/dev` - 寮€鍙戝伐绋嬪笀浠ｇ悊
- `/pm` - 浜у搧缁忕悊浠ｇ悊
- `/qa` - 璐ㄩ噺淇濊瘉浠ｇ悊
- `/sm` - 鏁呬簨绠＄悊鍛樹唬鐞?- `/ux-expert` - UX涓撳浠ｇ悊

**娓告垙寮€鍙戜唬鐞嗗懡浠わ細**

- `/game-designer` - 娓告垙璁捐甯堜唬鐞嗭紙Phaser涓撶敤锛?- `/game-developer` - 娓告垙寮€鍙戣€呬唬鐞嗭紙鏀寔Phaser鍜孶nity锛?- `/game-architect` - 娓告垙鏋舵瀯甯堜唬鐞嗭紙Unity涓撶敤锛?

### BMAD 浠ｇ悊浣跨敤鏂规硶

1. **鍚姩浠ｇ悊**: 杈撳叆slash鍛戒护锛堝`/bmad-master`锛?2. **浠ｇ悊浼氭縺娲诲苟闂€欑敤鎴凤紝鎻愬強`*help`鍛戒护**
2. **浣跨敤鍐呴儴鍛戒护**: 浠ｇ悊婵€娲诲悗鍙娇鐢ㄤ互涓嬪唴閮ㄥ懡浠わ細
   - `*help` - 鏄剧ず鍙敤鍛戒护鍒楄〃
   - `*task` - 鎵ц浠诲姟锛堟棤鍙傛暟鏄剧ず鍙敤浠诲姟锛? - `*create-doc` - 鍒涘缓鏂囨。锛堟棤鍙傛暟鏄剧ず鍙敤妯℃澘锛? - `*execute-checklist` - 鎵ц妫€鏌ユ竻鍗? - `*shard-doc` - 鏂囨。鍒嗙墖澶勭悊
   - `*kb` - 鍒囨崲鐭ヨ瘑搴撴ā寮? - `*exit` - 閫€鍑轰唬鐞嗘ā寮?

### 鍏稿瀷宸ヤ綔娴佺▼

\*_娓告垙寮€鍙戝伐浣滄祦锛?_

```powershell
/game-designer     # 鍚姩娓告垙璁捐甯?*help              # 鏌ョ湅鍙敤鍛戒护
*create-doc        # 鏌ョ湅鍙敤妯℃澘
*task              # 鏌ョ湅鍙敤浠诲姟
```

**鏋舵瀯璁捐宸ヤ綔娴侊細**

````powershell
/architect         # 鍚姩鏋舵瀯甯堜唬鐞?*help              # 鏌ョ湅鍙敤鍛戒护
*create-doc architecture-tmpl.yaml  # 鍒涘缓鏋舵瀯鏂囨。
*execute-checklist architect-checklist.md  # 鎵ц鏋舵瀯妫€鏌ユ竻鍗?```

**椤圭洰绠＄悊宸ヤ綔娴侊細**

```powershell
/pm                # 鍚姩浜у搧缁忕悊浠ｇ悊
*create-doc prd-tmpl.yaml  # 鍒涘缓PRD鏂囨。
/sm                # 鍒囨崲鍒版晠浜嬬鐞嗗憳
*task create-next-story    # 鍒涘缓涓嬩竴涓晠浜?```

## BMAD 鏂囦欢缁撴瀯

- **鍛戒护瀹氫箟**: `.claude/commands/BMad/`, `.claude/commands/bmad2dp/`, `.claude/commands/bmad2du/`
- **浠ｇ悊閰嶇疆**: 姣忎釜浠ｇ悊閮芥湁瀹屾暣鐨刌AML閰嶇疆锛屽寘鍚鑹插畾涔夈€佸懡浠ゅ拰渚濊禆
- **浠诲姟搴?*: 15+涓瀹氫箟浠诲姟锛坈reate-doc, execute-checklist, shard-doc绛夛級
- **妯℃澘搴?*: 8+涓枃妗ｆā鏉匡紙prd-tmpl, architecture-tmpl绛夛級
- **妫€鏌ユ竻鍗?*: 5+涓川閲忔鏌ユ竻鍗曪紙architect-checklist, pm-checklist绛夛級

## BMAD 缁存姢鍛戒护

```powershell
# 妫€鏌MAD鐘舵€?bmad status

# 鍗囩骇BMAD鍒版渶鏂扮増鏈?bmad update --full --ide claude-code

# 瀹夎鏂扮殑鎵╁睍鍖?bmad install --expansion-packs <pack-name>

# 鍒楀嚭鍙敤鎵╁睍鍖?bmad list:expansions
````

## 閲嶈鎻愰啋

- BMAD浠ｇ悊鍦ㄨ婵€娲绘椂浼?\*瀹屽叏鎺ョ瀵硅瘽\*\*锛屾寜鐓у叾瑙掕壊瀹氫箟宸ヤ綔
- 姣忎釜浠ｇ悊鏈?*鐙珛鐨勫伐浣滄祦绋?*鍜?\*涓撻棬鐨勪换鍔￠泦\*\*
- 浣跨敤`*exit`鍛戒护閫€鍑轰唬鐞嗘ā寮忚繑鍥炴甯窩laude Code瀵硅瘽
- 浠ｇ悊閰嶇疆鏂囦欢浣嶄簬`.claude/commands/`锛屽彲浠ヨ嚜瀹氫箟鍜屾墿灞?
