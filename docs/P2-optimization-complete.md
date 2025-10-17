# P2 浼樺寲瀹屾垚鎶ュ憡

## 馃幆 鎵ц鎽樿

鉁?**Diff A** - 涓篽eavy宸ヤ綔娴佸鍔犻《灞傚苟鍙戞帶鍒?
鉁?**Diff B** - 涓篽eavy宸ヤ綔娴佸姞PR璺緞杩囨护  
鉁?**Diff C** - 缁熶竴Artifacts淇濈暀鏈?
鉁?**Diff D** - 缁熶竴鍙戝竷鏋勫缓鐨凷ourceMaps寮€鍚紙宸蹭紭鍖栧疄鐜帮級

---

## 馃搵 璇︾粏瀹炴柦缁撴灉

### Diff A - 骞跺彂鎺у埗锛堚渽 宸插畬鎴愶級

\*_ci.yml 鏇存柊锛?_

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

\*_release.yml 鏇存柊锛?_

````yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: false # 鍙戝竷涓嶅缓璁腑閫斿彇娑?```

**build-and-test.yml锛?* 宸插瓨鍦ㄥ苟鍙戞帶鍒?
### Diff B - PR璺緞杩囨护锛堚渽 宸插畬鎴愶級

**release.yml 鏂板璺緞杩囨护锛?*

```yaml
on:
  push:
    branches: [main, release/*]
    tags: ['v*']
    paths:
      - 'src/**'
      - 'electron/**'
      - 'scripts/**'
      - 'package*.json'
      - 'tsconfig*.json'
      - 'vite.config.ts'
      - '.github/workflows/release.yml'
  pull_request:
    branches: [main]
    paths:
      - 'src/**'
      - 'electron/**'
      - 'scripts/**'
      - 'package*.json'
      - 'tsconfig*.json'
      - 'vite.config.ts'
      - '.github/workflows/release.yml'
````

\*_ci.yml 鍜?build-and-test.yml锛?_ 宸插瓨鍦ㄨ矾寰勮繃婊?

### Diff C - Artifacts淇濈暀鏈熸爣鍑嗗寲锛堚渽 宸插畬鎴愶級

**ci.yml 鍙娴嬫€ф姤鍛婃洿鏂帮細**

```yaml
# 浠?retention-days: 7 鏇存柊涓猴細
retention-days: 14
```

\*_瀹夊叏宸ヤ綔娴佷繚鐣欐湡楠岃瘉锛?_ 鉁?宸茬‘璁?0澶╀繚鐣欐湡绗﹀悎瑙勮寖

### Diff D - SourceMaps閰嶇疆锛堚渽 宸蹭紭鍖栵級

**vite.config.ts 鐜版湁閰嶇疆锛堟洿浼樹簬寤鸿锛夛細**

```typescript
sourcemap:
  process.env.NODE_ENV === 'production' ||
  process.env.GENERATE_SOURCEMAP === 'true',
```

> 馃敡 **浼樺寲璇存槑**锛氬綋鍓嶉厤缃瘮临时建议清单（已清理）寤鸿鏇寸伒娲伙紝鏀寔閫氳繃鐜鍙橀噺GENERATE_SOURCEMAP鎺у埗锛屼繚鎸佺幇鏈夊疄鐜般€?

---

## 馃洝锔?璐ㄩ噺楠岃瘉

```powershell
$ node scripts/ci/workflow-consistency-check.mjs
鉁?Workflow jobs/needs consistency OK
```

## 馃殌 鑾峰緱鐨勬敼杩涙晥鏋?

### 鉁?骞跺彂/璺緞/淇濈暀鏈熺殑P2瀹堟姢鍒颁綅锛?

- \*_閲嶄换鍔′笉鍐嶅洜PR鏂囨。鏀瑰姩鑰岃Е鍙?_ - 鑺傜渷CI璧勬簮
- \*_鍚屽垎鏀笉浼氶噸澶嶆帓闃?_ - 閬垮厤璧勬簮娴垂
- \*_Artifacts鐢熷懡鍛ㄦ湡涓€鑷?_ - 瀛樺偍鎴愭湰鍙帶

### 鉁?宸ヤ綔娴佽嚜妫€绯荤粺瀹屽锛?

- **actionlint + needs鍏崇郴妫€鏌?\* - 宸ヤ綔娴佹敼鍚?渚濊禆婕傜Щ鑳藉嵆鏃舵毚闇?- **闆朵緷璧栦竴鑷存€ф鏌ュ櫒\*\* - 鏃犲閮ㄤ緷璧栵紝鍙潬鎬ч珮

### 鉁?鍙戝竷鏋勫缓涓嶴ourceMaps鏇村彲鎺э細

- **鏅鸿兘SourceMap鐢熸垚** - 鐢熶骇鐜鎴栨樉寮忓惎鐢ㄦ椂鎵嶇敓鎴?- **Sentry闆嗘垚浼樺寲** - 澶辫触瀹氫綅鏇村揩锛堝凡浣跨敤npx sentry-cli锛?

---

## 馃搳 鏈€缁堢姸鎬?

**P2浼樺寲 100% 瀹屾垚**锛屾墍鏈塩ifix.txt寤鸿宸插疄鏂斤細

- 鉁?骞跺彂鎺у埗锛氭墍鏈塰eavy宸ヤ綔娴佸凡閰嶇疆閫傚綋鐨勫苟鍙戠瓥鐣?- 鉁?璺緞杩囨护锛氶噸浠诲姟宸ヤ綔娴佸凡娣诲姞paths闄愬畾
- 鉁?淇濈暀鏈熸爣鍑嗗寲锛氬父瑙?-14澶╋紝鍙戝竷/瀹夊叏30澶?- 鉁?SourceMaps閰嶇疆锛氬凡浼樺寲涓烘櫤鑳界敓鎴愮瓥鐣?- 鉁?宸ヤ綔娴佷竴鑷存€э細鉁?Workflow jobs/needs consistency OK

**璐ㄩ噺闂ㄧ鐘舵€侊細** 馃煝 鍏ㄩ潰灏辩华  
**CI/CD鏁堢巼锛?\* 馃搱 鏄捐憲鎻愬崌  
**璧勬簮鍒╃敤锛?\* 馃挕 宸蹭紭鍖?
