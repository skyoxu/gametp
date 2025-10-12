# 鎬濊€冩ā寮忓畬鏁寸粍鍚堟寚鍗?

## 姒傝堪

鏈寚鍗楁兜鐩栦簡 Claude 鍐呯疆鎬濊€冩ā寮忋€乑en MCP 鎬濊€冨伐鍏蜂互鍙?Sequential Thinking 鐨勬墍鏈夊彲鑳界粍鍚堬紝涓哄鏉傞棶棰樿В鍐虫彁渚涚郴缁熷寲鐨勬柟娉曢€夋嫨妗嗘灦銆?

## 妯″紡鎸囧畾鏂规硶

### 鑷姩妯″紡閫夋嫨 vs 鎵嬪姩鎸囧畾

- **鑷姩妯″紡**: Claude 鏍规嵁闂澶嶆潅搴﹁嚜鍔ㄩ€夋嫨鍚堥€傜殑鍐呯疆鎬濊€冩ā寮?- **鎵嬪姩鎸囧畾**: 鐢ㄦ埛鍙互鏄惧紡鎸囧畾浣跨敤鐗瑰畾鐨勬€濊€冩ā寮忕粍鍚?

### 鎸囧畾璇硶瑙勫垯

#### 1. Claude 鍐呯疆鎬濊€冩ā寮忔寚瀹?

```powershell
# 璇硶锛氬湪闂鍓嶅姞涓婃ā寮忔寚浠?[think] 浣犵殑闂
[think hard] 浣犵殑闂
[think harder] 浣犵殑闂
[ultrathink] 浣犵殑闂

# 绀轰緥
[think hard] 鍒嗘瀽杩欐浠ｇ爜鐨勬€ц兘闂
[ultrathink] 璁捐涓€涓潻鍛芥€х殑娓告垙寮曟搸鏋舵瀯
```

#### 2. Zen MCP 宸ュ叿鎸囧畾

````powershell
# 璇硶锛氳姹備娇鐢ㄧ壒瀹氬伐鍏峰拰thinking_mode
璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: "high"
璇蜂娇鐢?mcp__zen-mcp-server__chat锛宼hinking_mode: "medium"

# 绀轰緥
璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: "max" 鏉ュ垎鏋愯繖涓灦鏋勯棶棰?璇蜂娇鐢?mcp__zen-mcp-server__chat锛宼hinking_mode: "low" 鏉ュ揩閫熻璁鸿繖涓兂娉?```

#### 3. Sequential Thinking 宸ュ叿鎸囧畾

```powershell
# 璇硶锛氭槑纭姹備娇鐢╯equential thinking
璇蜂娇鐢?mcp__sequential-thinking__sequentialthinking 鏉ラ€愭瑙ｅ喅杩欎釜闂

# 绀轰緥
璇蜂娇鐢?mcp__sequential-thinking__sequentialthinking 鏉ュ垎姝ヨ璁＄敤鎴疯璇佺郴缁?```

#### 4. 缁勫悎妯″紡鎸囧畾

```powershell
# 璇硶锛氬悓鏃舵寚瀹氬涓ā寮?[think harder] + 璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: "high" + sequential thinking

# 绀轰緥
[ultrathink] + 璇蜂娇鐢?mcp__zen-mcp-server__chat锛宼hinking_mode: "max" + sequential thinking 鏉ュ垱鏂版€у湴瑙ｅ喅杩欎釜鎶€鏈毦棰?```

## 1. 鍩虹缁勫悎鐭╅樀 (Claude鍐呯疆 脳 Zen MCP)

### think + minimal 缁勫悎 猸愨瓙猸愨瓙猸?
**閫傜敤鍦烘櫙**: 绠€鍗曟煡璇紝蹇€熷洖绛?**鑷姩瑙﹀彂绀轰緥**:

```powershell
鐢ㄦ埛锛?npm run dev 鍛戒护鏄粈涔堜綔鐢紵"
Claude鑷姩閫夋嫨锛歵hink + minimal妯″紡
缁撴灉锛氱洿鎺ュ洖绛?鍚姩Vite寮€鍙戞湇鍔″櫒杩涜鐑噸杞藉紑鍙?
````

**鎵嬪姩鎸囧畾绀轰緥**:

````powershell
鐢ㄦ埛锛?[think] 璇疯В閲妌pm run dev鍛戒护鐨勪綔鐢?
Claude鎸夋寚瀹氭墽琛岋細浣跨敤鍩虹鎬濊€冩ā寮?缁撴灉锛氱畝娲佸洖绛旇€屼笉浼氳繃搴﹀垎鏋?```

### think + low 缁勫悎 猸愨瓙猸愨瓙

**閫傜敤鍦烘櫙**: 鍩虹鍒嗘瀽浠诲姟
**绀轰緥**:

```powershell
闂锛?涓轰粈涔堟垜鐨凾ailwind鏍峰紡娌℃湁鐢熸晥锛?
浣跨敤锛氭鏌ラ厤缃枃浠躲€丆SS瀵煎叆鍜屾瀯寤鸿缃?缁撴灉锛氬彂鐜癟ailwind v4閰嶇疆鏂瑰紡涓巚3涓嶅悓锛岀粰鍑哄叿浣撲慨澶嶆楠?```

### think + medium 缁勫悎 猸愨瓙猸?
**閫傜敤鍦烘櫙**: 涓€鑸紑鍙戦棶棰?**绀轰緥**:

```powershell
闂锛?濡備綍浼樺寲Phaser娓告垙鐨勬覆鏌撴€ц兘锛?
浣跨敤锛氬垎鏋愭覆鏌撶绾裤€佺汗鐞嗙鐞嗗拰瀵硅薄姹犵瓥鐣?缁撴灉锛氭彁渚?涓叿浣撲紭鍖栧缓璁拰浠ｇ爜绀轰緥
````

### think + high 缁勫悎 猸愨瓙

**閫傜敤鍦烘櫙**: 澶嶆潅浣嗕笉闇€娣卞害鎺ㄧ悊鐨勪换鍔?**绀轰緥**:

```powershell
闂锛?璁捐涓€涓畬鏁寸殑鐢ㄦ埛璁よ瘉绯荤粺鏋舵瀯"
浣跨敤锛氳鐩朖WT銆丱Auth銆佹潈闄愮鐞嗙瓑澶氫釜鏂归潰
缁撴灉锛氳缁嗘灦鏋勫浘鍜屽疄鐜拌矾绾垮浘锛屼絾鍙兘杩囦簬澶嶆潅
```

### think + max 缁勫悎 猸?(涓嶆帹鑽?

**閫傜敤鍦烘櫙**: 娴垂璧勬簮鐨勭粍鍚?**绀轰緥**:

````powershell
闂锛?濡備綍瀹夎涓€涓猲pm鍖咃紵"
浣跨敤锛氳繃搴﹀垎鏋愬寘绠＄悊銆佷緷璧栨爲銆佸畨鍏ㄦ€х瓑
缁撴灉锛氱畝鍗曢棶棰樺緱鍒拌繃浜庡鏉傜殑鍥炵瓟锛屾晥鐜囦綆涓?```

### think hard + minimal 缁勫悎 猸?(涓嶆帹鑽?

**閫傜敤鍦烘櫙**: 涓嶅尮閰嶇殑缁勫悎
**绀轰緥**:

```powershell
闂锛?鍒嗘瀽杩欎釜澶嶆潅鐨勭姸鎬佺鐞哹ug"
浣跨敤锛氭繁搴︽€濊€冧絾杈撳嚭鏋佺畝
缁撴灉锛氭€濊€冨厖鍒嗕絾杈撳嚭涓嶅畬鏁达紝娴垂璁＄畻璧勬簮
````

### think hard + low 缁勫悎 猸愨瓙猸?

**閫傜敤鍦烘櫙**: 涓瓑澶嶆潅搴﹁皟璇?**绀轰緥**:

````powershell
闂锛?React缁勪欢娓叉煋寮傚父锛屾€ц兘涓嬮檷涓ラ噸"
浣跨敤锛氭繁鍏ュ垎鏋愮粍浠剁敓鍛藉懆鏈熷拰娓叉煋杩囩▼
缁撴灉锛氬畾浣嶅埌useEffect渚濊禆闂鍜岄噸澶嶆覆鏌撳師鍥?```

### think hard + medium 缁勫悎 猸愨瓙猸愨瓙猸?
**閫傜敤鍦烘櫙**: 鏋舵瀯璁捐闂
**鑷姩瑙﹀彂绀轰緥**:

```powershell
鐢ㄦ埛锛?璁捐Electron涓昏繘绋嬩笌娓叉煋杩涚▼鐨勯€氫俊鏋舵瀯"
Claude鑷姩閫夋嫨锛歵hink hard + medium杈撳嚭
缁撴灉锛氬畬鏁寸殑閫氫俊鍗忚璁捐锛屽寘鍚敊璇鐞嗗拰瀹夊叏绛栫暐
````

**鎵嬪姩鎸囧畾绀轰緥**:

````powershell
鐢ㄦ埛锛?[think hard] 璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: 'medium' 鏉ヨ璁lectron鐨処PC閫氫俊鏋舵瀯"
Claude鎸夋寚瀹氭墽琛岋細娣卞害鎬濊€?+ 涓瓑璇﹀害鐨勭郴缁熷寲鍒嗘瀽
缁撴灉锛氱粨鏋勫寲鐨勫姝ラ鏋舵瀯璁捐杩囩▼锛屽寘鍚皟鏌モ啋璁捐鈫掗獙璇侀樁娈?```

### think hard + high 缁勫悎 猸愨瓙猸愨瓙

**閫傜敤鍦烘櫙**: 澶嶆潅绯荤粺鍒嗘瀽
**绀轰緥**:

```powershell
闂锛?鍒嗘瀽寰湇鍔℃媶鍒嗙瓥鐣ュ拰鏁版嵁涓€鑷存€?
浣跨敤锛氭繁鍏ュ垎鏋愰鍩熻竟鐣屻€佷簨鍔℃ā寮忓拰涓€鑷存€т繚璇?缁撴灉锛氳缁嗙殑鎷嗗垎鏂规銆佹暟鎹悓姝ョ瓥鐣ュ拰瀹归敊鏈哄埗
````

### think hard + max 缁勫悎 猸愨瓙猸?

**閫傜敤鍦烘櫙**: 鏋佸叾澶嶆潅鐨勬灦鏋勫喅绛?**绀轰緥**:

````powershell
闂锛?璁捐鏀寔鐧句竾鐢ㄦ埛鐨勫疄鏃舵父鎴忔湇鍔″櫒鏋舵瀯"
浣跨敤锛氭繁搴﹀垎鏋愯礋杞藉潎琛°€佺姸鎬佸悓姝ャ€佺綉缁滀紭鍖栫瓑
缁撴灉锛氫紒涓氱骇鏋舵瀯鏂规锛屼絾鍙兘杩囧害宸ョ▼鍖?```

### think harder + minimal 缁勫悎 猸?(涓ラ噸涓嶅尮閰?

**閫傜敤鍦烘櫙**: 涓嶆帹鑽愪娇鐢?**绀轰緥**:

```powershell
闂锛?瑙ｅ喅鍒嗗竷寮忕郴缁熺殑鏁版嵁涓€鑷存€ч棶棰?
浣跨敤锛氭瀬娣卞害鎬濊€冧絾鏋佺畝杈撳嚭
缁撴灉锛氬ぇ閲忚绠楄祫婧愭氮璐癸紝杈撳嚭涓嶅畬鏁?```

### think harder + low 缁勫悎 猸?(涓嶅尮閰?

**閫傜敤鍦烘櫙**: 涓嶆帹鑽愪娇鐢?**绀轰緥**:

```powershell
闂锛?浼樺寲澶嶆潅鐨勫浘褰㈡覆鏌撶畻娉?
浣跨敤锛氭繁灞傜畻娉曞垎鏋愪絾杈撳嚭鍙楅檺
缁撴灉锛氭€濊€冩繁搴︿笌杈撳嚭璇﹀害涓嶅尮閰?```

### think harder + medium 缁勫悎 猸愨瓙猸?
**閫傜敤鍦烘櫙**: 澶嶆潅瀹夊叏鍒嗘瀽
**绀轰緥**:

```powershell
闂锛?鍒嗘瀽Electron搴旂敤鐨勫畨鍏ㄥ▉鑳佹ā鍨?
浣跨敤锛氭繁鍏ュ垎鏋愭敾鍑诲悜閲忋€侀槻鎶ょ瓥鐣ュ拰鍚堣瑕佹眰
缁撴灉锛氬叏闈㈢殑瀹夊叏璇勪及鎶ュ憡鍜屽姞鍥哄缓璁?```

### think harder + high 缁勫悎 猸愨瓙猸愨瓙猸?
**閫傜敤鍦烘櫙**: 澶氱郴缁熼泦鎴愰棶棰?**绀轰緥**:

```powershell
闂锛?璁捐璺ㄥ钩鍙版父鎴忓紩鎿庣殑鎻掍欢绯荤粺鏋舵瀯"
浣跨敤锛氭繁搴﹀垎鏋愭彃浠堕殧绂汇€丄PI璁捐銆佺儹鍔犺浇鏈哄埗
缁撴灉锛氬畬鏁寸殑鎻掍欢妗嗘灦璁捐锛屽寘鍚紑鍙戣€呭伐鍏烽摼
````

### think harder + max 缁勫悎 猸愨瓙猸愨瓙

**閫傜敤鍦烘櫙**: 浼佷笟绾ф灦鏋勮璁?**绀轰緥**:

````powershell
闂锛?璁捐鏀寔澶氱鎴风殑浜戝師鐢熸父鎴忓钩鍙?
浣跨敤锛氭繁搴﹀垎鏋愬鍣ㄥ寲銆佹湇鍔＄綉鏍笺€佹暟鎹殧绂荤瓑
缁撴灉锛氬畬鏁寸殑浜戝钩鍙版灦鏋勶紝鍖呭惈杩愮淮鍜岀洃鎺т綋绯?```

### ultrathink + minimal 缁勫悎 猸?(涓ラ噸娴垂)

**閫傜敤鍦烘櫙**: 涓嶆帹鑽愪娇鐢?**绀轰緥**:

```powershell
闂锛?鍒涙柊鎬х殑AI杈呭姪娓告垙璁捐鐞嗗康"
浣跨敤锛氱獊鐮存€ф€濊€冧絾鏋佺畝杈撳嚭
缁撴灉锛氬ぇ閲忓垱鏂版€濊€冭鍘嬬缉鍒版瀬绠€鍥炵瓟涓?```

### ultrathink + low 缁勫悎 猸?(涓嶅尮閰?

**閫傜敤鍦烘櫙**: 涓嶆帹鑽愪娇鐢?**绀轰緥**:

```powershell
闂锛?閲嶆柊瀹氫箟娓告垙寮曟搸鏋舵瀯鑼冨紡"
浣跨敤锛氶潻鍛芥€ф€濊€冧絾杈撳嚭鍙楅檺
缁撴灉锛氬垱鏂版綔鍔涜杈撳嚭闄愬埗鍓婂急
````

### ultrathink + medium 缁勫悎 猸?(涓嶅尮閰?

**閫傜敤鍦烘櫙**: 涓嶆帹鑽愪娇鐢?**绀轰緥**:

````powershell
闂锛?璁捐涓嬩竴浠ｇ紪绋嬭寖寮?
浣跨敤锛氭瀬娣卞眰鎬濊€冧絾涓瓑杈撳嚭
缁撴灉锛氱獊鐮存€ф兂娉曟棤娉曞畬鏁磋〃杈?```

### ultrathink + high 缁勫悎 猸愨瓙猸?
**閫傜敤鍦烘櫙**: 鍓嶆部鎶€鏈爺绌?**绀轰緥**:

```powershell
闂锛?鎺㈢储WebAssembly鍦ㄦ父鎴忓紩鎿庝腑鐨勯潻鍛芥€у簲鐢?
浣跨敤锛氱獊鐮存€ф€濊€冨垎鏋愭柊鎶€鏈寖寮?缁撴灉锛氬墠娌挎妧鏈簲鐢ㄦ柟妗堝拰瀹為獙鎬ф灦鏋勮璁?```

### ultrathink + max 缁勫悎 猸愨瓙猸愨瓙猸?
**閫傜敤鍦烘櫙**: 绐佺牬鎬ф灦鏋勫垱鏂?**鑷姩瑙﹀彂绀轰緥**:

```powershell
鐢ㄦ埛锛?璁捐鍩轰簬閲忓瓙璁＄畻鐨勬父鎴忕墿鐞嗗紩鎿庢蹇垫鏋?
Claude鑷姩璇嗗埆锛氭瀬楂樺鏉傚害鍒涙柊闂
缁撴灉锛氱獊鐮存€х殑鐞嗚妗嗘灦鍜屾妧鏈矾绾垮浘
````

**鎵嬪姩鎸囧畾绀轰緥**:

````powershell
鐢ㄦ埛锛?[ultrathink] 璇蜂娇鐢?mcp__zen-mcp-server__chat锛宼hinking_mode: 'max' 鏉ユ帰绱㈤噺瀛愯绠楀湪娓告垙鐗╃悊寮曟搸涓殑闈╁懡鎬у簲鐢?
Claude鎸夋寚瀹氭墽琛岋細绐佺牬鎬ф€濊€?+ 鏈€澶ф繁搴﹁緭鍑?+ 鍗忎綔璁ㄨ妯″紡
缁撴灉锛氳灏界殑鐞嗚鎺㈢储銆佹妧鏈彲琛屾€у垎鏋愩€佸疄鏂借矾绾垮浘鍜岄闄╄瘎浼?```

## 2. 澧炲己缁勫悎 (+Sequential Thinking)

### 缁勫悎1: think hard + zen medium + sequential 猸愨瓙猸愨瓙猸?
**閫傜敤**: 娓告垙鍔熻兘妯″潡璁捐銆丳RD鍒嗚В
**鑷姩瑙﹀彂绀轰緥**:

```powershell
鐢ㄦ埛锛?璁捐瀹屾暣鐨勫伐浼氱鐞嗙郴缁?
Claude璇嗗埆锛氬鏉傚姝ラ璁捐浠诲姟锛岃嚜鍔ㄩ€夋嫨缁勫悎妯″紡
缁撴灉锛氬畬鏁寸殑鍔熻兘妯″潡璁捐鏂囨。锛屽寘鍚墍鏈夊疄鐜扮粏鑺?```

**鎵嬪姩鎸囧畾绀轰緥**:

```powershell
鐢ㄦ埛锛?[think hard] 璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: 'medium'锛屽苟浣跨敤 mcp__sequential-thinking__sequentialthinking 鏉ヨ璁″伐浼氱鐞嗙郴缁?
Claude鎸夋寚瀹氭墽琛岋細娣卞害鎬濊€?+ 涓瓑澶嶆潅搴︾郴缁熷寲璋冩煡 + 閫愭鎺ㄧ悊
鎵ц娴佺▼锛?1. Sequential Step 1: 娣卞害鍒嗘瀽闇€姹傚拰鐢ㄦ埛鏁呬簨
2. Sequential Step 2: 绯荤粺鍖栬璁℃暟鎹ā鍨嬪拰API
3. Sequential Step 3: 閫愭瑙勫垝UI缁勪欢鍜屼氦浜掓祦绋?4. Sequential Step 4: 鍒跺畾瀹屾暣娴嬭瘯绛栫暐鍜岄獙鏀舵爣鍑?缁撴灉锛氱粨鏋勫寲鐨勫闃舵璁捐鏂囨。锛屾瘡涓楠ら兘鏈夎缁嗙殑璋冩煡鍜岄獙璇佽繃绋?```

### 缁勫悎2: think harder + zen high + sequential 猸愨瓙猸愨瓙猸?
**閫傜敤**: 绯荤粺鏋舵瀯閲嶆瀯銆佹妧鏈€夊瀷鍒嗘瀽
**绀轰緥**:

```powershell
闂锛?浠嶦lectron杩佺Щ鍒癟auri鐨勫畬鏁存柟妗?
姝ラ锛?1. 璇勪及鐜版湁鏋舵瀯渚濊禆 (sequential step 1)
2. 鍒嗘瀽杩佺Щ椋庨櫓鍜屾垚鏈?(sequential step 2)
3. 璁捐鍒嗛樁娈佃縼绉荤瓥鐣?(sequential step 3)
4. 鍒跺畾鍥炴粴鍜屾祴璇曡鍒?(sequential step 4)
缁撴灉锛氳缁嗙殑鎶€鏈縼绉昏矾绾垮浘鍜岄闄╂帶鍒舵柟妗?```

### 缁勫悎3: ultrathink + zen max + sequential 猸愨瓙猸愨瓙猸?
**閫傜敤**: 鍏ㄦ柊鎶€鏈爤璁捐銆佺獊鐮存€у姛鑳藉疄鐜?**绀轰緥**:

```powershell
闂锛?璁捐鍩轰簬WebXR鐨勪笅涓€浠ｆ父鎴忓紑鍙戞鏋?
姝ラ锛?1. 鎺㈢储WebXR鎶€鏈竟鐣屽拰鍙兘鎬?(sequential step 1)
2. 璁捐闈╁懡鎬х殑寮€鍙戣€呬綋楠?(sequential step 2)
3. 鏋勫缓鏍稿績妗嗘灦鏋舵瀯 (sequential step 3)
4. 瑙勫垝鐢熸€佺郴缁熷拰绀惧尯绛栫暐 (sequential step 4)
缁撴灉锛氱獊鐮存€х殑鎶€鏈鏋跺拰瀹屾暣鐨勭敓鎬佽鍒?```

### 缁勫悎4: think hard + zen medium + sequential 猸愨瓙猸愨瓙

**閫傜敤**: 澶嶆潅bug瀹氫綅銆佹€ц兘浼樺寲鍒嗘瀽
**绀轰緥**:

```powershell
闂锛?娓告垙鍦ㄧ壒瀹氬満鏅笅甯х巼鎬ュ墽涓嬮檷"
姝ラ锛?1. 鏀堕泦鎬ц兘鏁版嵁鍜岄敊璇棩蹇?(sequential step 1)
2. 鍒嗘瀽娓叉煋绠＄嚎鍜屽唴瀛樹娇鐢?(sequential step 2)
3. 瀹氫綅鍏蜂綋鐨勬€ц兘鐡堕 (sequential step 3)
4. 瀹炴柦浼樺寲鏂规鍜岄獙璇?(sequential step 4)
缁撴灉锛氱郴缁熷寲鐨勬€ц兘闂瑙ｅ喅鏂规
````

### 缁勫悎5: think harder + zen high + sequential 猸愨瓙猸愨瓙

**閫傜敤**: 澶у瀷椤圭洰鏋舵瀯銆佸洟闃熷崗浣滄祦绋?**绀轰緥**:

```powershell
闂锛?寤虹珛100浜烘父鎴忓紑鍙戝洟闃熺殑鎶€鏈崗浣滀綋绯?
姝ラ锛?1. 鍒嗘瀽鍥㈤槦缁撴瀯鍜屾妧鑳藉垎甯?(sequential step 1)
2. 璁捐浠ｇ爜浠撳簱鍜屽垎鏀瓥鐣?(sequential step 2)
3. 寤虹珛CI/CD鍜岃川閲忛棬绂?(sequential step 3)
4. 鍒跺畾鏂囨。鍜岀煡璇嗙鐞嗚鑼?(sequential step 4)
缁撴灉锛氬畬鏁寸殑浼佷笟绾у紑鍙戞祦绋嬪拰鍗忎綔瑙勮寖
```

## 3. 涓撶敤宸ュ叿缁勫悎寤鸿

### Electron瀹夊叏鍒嗘瀽: ultrathink + zen max + thinkdeep + sequential

**绀轰緥鍦烘櫙**: "寤虹珛Electron搴旂敤鐨勯浂淇′换瀹夊叏鏋舵瀯"

```powershell
宸ヤ綔娴侊細
1. thinkdeep璋冩煡鐜版湁瀹夊叏濞佽儊
2. ultrathink鎺㈢储闆朵俊浠诲畨鍏ㄦā鍨?3. sequential瑙勫垝瀹炴柦姝ラ
4. zen max杈撳嚭瀹屾暣瀹夊叏绛栫暐
```

### Phaser娓告垙鏋舵瀯: think harder + zen high + chat + sequential

**绀轰緥鍦烘櫙**: "璁捐鏀寔鐧句竾鐢ㄦ埛鐨勫疄鏃跺浜烘父鎴忔灦鏋?

```powershell
宸ヤ綔娴侊細
1. chat鍗忎綔璁ㄨ鎶€鏈€夊瀷
2. think harder娣卞害鍒嗘瀽鏋舵瀯妯″紡
3. sequential鍒嗘璁捐瀹炵幇
4. zen high杈撳嚭璇︾粏鏋舵瀯鏂囨。
```

### React 19 + Tailwind v4 杩佺Щ: think hard + zen medium + thinkdeep

**绀轰緥鍦烘櫙**: "浠嶳eact 18 + Tailwind v3杩佺Щ鍒版渶鏂扮増鏈?

```powershell
宸ヤ綔娴侊細
1. thinkdeep璋冩煡杩佺Щ褰卞搷鑼冨洿
2. think hard鍒嗘瀽鍏煎鎬ч棶棰?3. zen medium杈撳嚭杩佺Щ鎸囧崡
```

### BMAD绯荤粺闆嗘垚: think + zen low + chat

**绀轰緥鍦烘櫙**: "蹇€熼泦鎴怋MAD浠ｇ悊鍒板紑鍙戝伐浣滄祦"

```powershell
宸ヤ綔娴侊細
1. chat浜嗚ВBMAD鍔熻兘
2. think鍒嗘瀽闆嗘垚鏂瑰紡
3. zen low杈撳嚭閰嶇疆姝ラ
```

### 璐ㄩ噺闂ㄧ璁捐: think harder + zen high + sequential

**绀轰緥鍦烘櫙**: "寤虹珛鍏ㄩ潰鐨勪唬鐮佽川閲忓拰瀹夊叏妫€鏌ヤ綋绯?

```powershell
宸ヤ綔娴侊細
1. sequential鍒嗘璁捐妫€鏌ユ祦绋?2. think harder娣卞害鍒嗘瀽璐ㄩ噺鎸囨爣
3. zen high杈撳嚭瀹屾暣闂ㄧ閰嶇疆
```

## 4. 鎴愭湰鏁堢泭鍒嗘瀽琛?

| 缁勫悎绫诲瀷        | 璁＄畻鎴愭湰 | 鏃堕棿鎴愭湰     | 杈撳嚭璐ㄩ噺 | 閫傜敤鍦烘櫙 | ROI璇勭骇       |
| ------------------- | ------------ | ---------------- | ------------ | ------------ | --------------- |
| think + minimal     | 鏋佷綆       | 鏋佸揩(绉掔骇)   | 涓瓑        | 鏃ュ父鏌ヨ  | 猸愨瓙猸愨瓙猸? |
| think hard + medium | 涓瓑        | 涓瓑(鍒嗛挓绾?  | 楂?          | 鍔熻兘寮€鍙? | 猸愨瓙猸愨瓙    |
| think harder + high | 楂?          | 鎱?鍗佸垎閽熺骇) | 鏋侀珮       | 鏋舵瀯璁捐  | 猸愨瓙猸?       |
| ultrathink + max    | 鏋侀珮       | 鏋佹參(灏忔椂绾? | 鍗撹秺       | 鎶€鏈垱鏂?  | 猸愨瓙          |

## 5. 瀹為檯浣跨敤鍐崇瓥鏍?

```mermaid
flowchart TD
    A[闂澶嶆潅搴﹁瘎浼癩 --> B{绠€鍗曟煡璇?}
    B -->|鏄瘄 C[think + zen minimal]
    B -->|鍚 D{涓瓑澶嶆潅?}
    D -->|鏄瘄 E[think hard + zen medium]
    D -->|鍚 F{楂樺害澶嶆潅?}
    F -->|鏄瘄 G[think harder + zen high]
    F -->|鍚 H{闇€瑕佸垱鏂?}
    H -->|鏄瘄 I[ultrathink + zen max]
    H -->|鍚 J[think hard + zen medium]

    E --> K{闇€瑕佸姝ラ?}
    G --> K
    I --> K
    K -->|鏄瘄 L[+ sequential thinking]
    K -->|鍚 M[鐩存帴鎵ц]
```

## 6. 閬垮厤鐨勫弽妯″紡

### 鉂?璧勬簮娴垂鍨嬪弽妯″紡

\*_ultrathink + minimal 鍙嶆ā寮?_

```powershell
閿欒绀轰緥锛?濡備綍鍒涘缓涓€涓猟iv鍏冪礌锛?
娴垂锛氱敤绐佺牬鎬ф€濊€冭В鍐冲熀纭€闂
姝ｇ‘锛歵hink + minimal
```

\*_think + max 鍙嶆ā寮?_

```powershell
閿欒绀轰緥锛?npm install鏄粈涔堬紵"
娴垂锛氬熀纭€鎬濊€冮厤杩囧害璇︾粏杈撳嚭
姝ｇ‘锛歵hink + minimal
```

### 鉂?涓嶅钩琛″瀷鍙嶆ā寮?

\*_think harder + minimal 鍙嶆ā寮?_

```powershell
閿欒绀轰緥锛?璁捐鍒嗗竷寮忕郴缁熸灦鏋?
闂锛氭繁搴︽€濊€冧絾杈撳嚭杩囩畝
姝ｇ‘锛歵hink harder + high + sequential
```

### 鉂?杩囧害宸ョ▼鍨嬪弽妯″紡

**鎵€鏈夐棶棰橀兘鐢╱ltrathink + max**

````powershell
閿欒锛氬皢鏈€楂樼骇缁勫悎搴旂敤浜庢墍鏈夐棶棰?鍚庢灉锛氳祫婧愭氮璐广€佸搷搴旂紦鎱€佹垚鏈珮鏄?姝ｇ‘锛氭牴鎹棶棰樺鏉傚害閫夋嫨鍚堥€傜粍鍚?```

## 7. 鏈€浣冲疄璺靛缓璁?
### 璧峰绛栫暐

1. **鏂版墜鎺ㄨ崘**: 浠?`think hard + zen medium` 寮€濮?2. **閫愭鍗囩骇**: 鏍规嵁闂澶嶆潅搴﹁皟鏁?3. **鎴愭湰鎺у埗**: 浼樺厛浣跨敤楂楻OI缁勫悎

### 椤圭洰鐗瑰畾寤鸿

**Electron + Phaser 娓告垙椤圭洰**:

- 鏃ュ父寮€鍙? `think + zen low`
- 鍔熻兘璁捐: `think hard + zen medium + sequential`
- 鏋舵瀯鍐崇瓥: `think harder + zen high + sequential`
- 鎶€鏈垱鏂? `ultrathink + zen max + sequential`

### 鍥㈤槦鍗忎綔寤鸿

- 鍒跺畾鍥㈤槦鍐呯殑鎬濊€冩ā寮忎娇鐢ㄨ鑼?- 寤虹珛鎴愭湰棰勭畻鍜屾晥鏋滆瘎浼版満鍒?- 鍩硅鍥㈤槦鎴愬憳閫夋嫨鍚堥€傜殑缁勫悎

## 8. 蹇€熸寚瀹氭寚鍗?
### 甯哥敤鎸囧畾妯℃澘

#### 绠€鍗曢棶棰樺揩閫熷鐞?
```powershell
[think] 浣犵殑绠€鍗曢棶棰?# 绀轰緥锛歔think] 濡備綍瀹夎npm鍖咃紵
````

#### 涓瓑澶嶆潅搴︽爣鍑嗗鐞?

```powershell
[think hard] 璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: "medium" 鏉ュ垎鏋愯繖涓棶棰?# 绀轰緥锛歔think hard] 璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: "medium" 鏉ヤ紭鍖栬繖涓猂eact缁勪欢鐨勬€ц兘
```

#### 澶嶆潅鏋舵瀯璁捐

```powershell
[think harder] 璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: "high" 骞朵娇鐢?mcp__sequential-thinking__sequentialthinking 鏉ヨВ鍐宠繖涓灦鏋勯棶棰?# 绀轰緥锛歔think harder] 璇蜂娇鐢?mcp__zen-mcp-server__thinkdeep锛宼hinking_mode: "high" 骞朵娇鐢?sequential thinking 鏉ヨ璁″井鏈嶅姟鎷嗗垎鏂规
```

#### 鍒涙柊鎬ф妧鏈帰绱?

````powershell
[ultrathink] 璇蜂娇鐢?mcp__zen-mcp-server__chat锛宼hinking_mode: "max" 骞朵娇鐢?mcp__sequential-thinking__sequentialthinking 鏉ュ垱鏂版€у湴瑙ｅ喅杩欎釜闂
# 绀轰緥锛歔ultrathink] 璇蜂娇鐢?mcp__zen-mcp-server__chat锛宼hinking_mode: "max" 骞朵娇鐢?sequential thinking 鏉ユ帰绱ebAssembly鍦ㄦ父鎴忓紩鎿庝腑鐨勯潻鍛芥€у簲鐢?```

### 鎸囧畾鐨勪紭鍔?
#### 绮剧‘鎺у埗

- **鎴愭湰鎺у埗**: 閬垮厤杩囧害浣跨敤楂樻垚鏈ā寮?- **鏃堕棿鎺у埗**: 鏍规嵁绱ф€ョ▼搴﹂€夋嫨鍚堥€傞€熷害
- **璐ㄩ噺鎺у埗**: 閲嶈鍐崇瓥浣跨敤楂樿川閲忔ā寮?
#### 瀛︿範浼樺寲

- **鏁堟灉瀵规瘮**: 鍚屼竴闂灏濊瘯涓嶅悓妯″紡瀵规瘮鏁堟灉
- **涓汉鍋忓ソ**: 鎵惧埌鏈€閫傚悎鑷繁鐨勬ā寮忕粍鍚?- **鍥㈤槦瑙勮寖**: 寤虹珛鍥㈤槦缁熶竴鐨勬ā寮忎娇鐢ㄦ爣鍑?
#### 鐗规畩鍦烘櫙閫傞厤

- **婕旂ず鍦烘櫙**: 闇€瑕佽缁嗚繃绋嬪睍绀烘椂浣跨敤sequential thinking
- **澶磋剳椋庢毚**: 浣跨敤chat妯″紡杩涜鍗忎綔鎬濊€?- **娣卞害璋冪爺**: 浣跨敤thinkdeep杩涜绯荤粺鍖栬皟鏌?
### 妯″紡閫夋嫨鍐崇瓥琛?
| 闂鐗瑰緛    | 鎺ㄨ崘鎸囧畾鏂瑰紡                                   | 鍘熷洜                   |
| ----------- | ---------------------------------------------- | ---------------------- |
| 绠€鍗曟煡璇?   | `[think]`                                      | 蹇€熼珮鏁堬紝鏃犻渶杩囧害鍒嗘瀽 |
| 鍔熻兘寮€鍙?   | `[think hard] + thinkdeep medium`              | 骞宠　娣卞害涓庢晥鐜?        |
| 鏋舵瀯璁捐    | `[think harder] + thinkdeep high + sequential` | 闇€瑕佺郴缁熷寲澶氭楠ゅ垎鏋?  |
| 鎶€鏈垱鏂?   | `[ultrathink] + chat max + sequential`         | 绐佺牬鎬ф€濊€冧笌鍗忎綔楠岃瘉   |
| 绱ф€ug淇 | `[think hard] + thinkdeep medium`              | 娣卞害鍒嗘瀽浣嗗揩閫熻緭鍑?    |
| 闀挎湡瑙勫垝    | `[think harder] + chat high + sequential`      | 闇€瑕佹繁鎬濈啛铏戝拰鍒嗘瑙勫垝 |

---

**鏂囨。鐗堟湰**: v1.1
**鏈€鍚庢洿鏂?*: 2025-08-20
**缁存姢鑰?*: Claude Code + BMAD 鍗忎綔绯荤粺
**鏇存柊鍐呭**: 鏂板妯″紡鎵嬪姩鎸囧畾鏂规硶鍜屽揩閫熸寚瀹氭寚鍗?
````
