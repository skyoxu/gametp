# GitHub Actions 缂栫爜鏈€浣冲疄璺?- P2浼樺寲鎸囧崡

## 姒傝堪

纭繚Windows runner鐜涓婼tep Summary鍜屽伐浠惰緭鍑虹殑UTF-8缂栫爜涓€鑷存€э紝閬垮厤涔辩爜鍜屾樉绀洪棶棰樸€?
## 鏍稿績鍘熷垯

### 1. Shell閫夋嫨浼樺厛绾?
```yaml
# 鉁?鎺ㄨ崘锛氫娇鐢╞ash纭繚璺ㄥ钩鍙颁竴鑷存€?- name: 鐢熸垚鎶ュ憡
  shell: bash
  run: |
    cat >> $GITHUB_STEP_SUMMARY << 'EOF'
    ## 馃搳 鏋勫缓鎶ュ憡
    - 鐘舵€? 鉁?鎴愬姛
    EOF

# 鉁?鍙€夛細闇€瑕乄indows鐗瑰畾鍔熻兘鏃朵娇鐢╬wsh
- name: Windows鐗瑰畾鎿嶄綔
  shell: pwsh
  run: |
    $content = "## 馃搳 Windows鏋勫缓鎶ュ憡`n- 鐘舵€? 鉁?鎴愬姛"
    $content | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8NoBom -Append
```

### 2. Step Summary缂栫爜妯″紡

#### Bash妯″紡锛堟帹鑽愶級

```yaml
- name: 鐢熸垚Step Summary
  shell: bash
  run: |
    cat >> $GITHUB_STEP_SUMMARY << 'EOF'
    ## 馃洝锔?瀹夊叏妫€鏌ユ姤鍛?
    ### 鉁?妫€鏌ョ粨鏋?    - **婕忔礊鎵弿**: 閫氳繃
    - **渚濊禆瀹¤**: 閫氳繃
    - **浠ｇ爜璐ㄩ噺**: 浼樼

    ### 馃搳 缁熻鏁版嵁
    - 妫€鏌ユ枃浠? 156涓?    - 鍙戠幇闂: 0涓?    - 淇寤鸿: 3涓?    EOF
```

#### PowerShell妯″紡锛堢壒娈婂満鏅級

```yaml
- name: Windows鐗瑰畾Step Summary
  shell: pwsh
  run: |
    $summary = @"
    ## 馃枼锔?Windows鏋勫缓鎶ュ憡

    ### 鉁?缂栬瘧缁撴灉  
    - **涓荤▼搴?*: 缂栬瘧鎴愬姛
    - **渚濊禆椤?*: 瑙ｆ瀽瀹屾垚
    - **鎵撳寘**: 鐢熸垚瀹屾垚

    ### 馃搧 杈撳嚭鏂囦欢
    - ViteGame.exe (52.4 MB)
    - 閰嶇疆鏂囦欢 (1.2 MB)
    "@

    # 鍏抽敭锛氫娇鐢╱tf8NoBom缂栫爜
    $summary | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8NoBom -Append
```

### 3. 鏂囦欢杈撳嚭缂栫爜瑙勮寖

#### JSON/XML閰嶇疆鏂囦欢

```yaml
- name: 鐢熸垚閰嶇疆鏂囦欢
  shell: pwsh
  run: |
    $config = @{
      version = "${{ github.run_number }}"
      platform = "windows"
      timestamp = Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ"
    } | ConvertTo-Json -Depth 10

    $config | Out-File -FilePath "config/build-info.json" -Encoding utf8NoBom
```

#### 宸ヤ欢鍏冩暟鎹?
```yaml
- name: 鍒涘缓宸ヤ欢娓呭崟
  shell: bash
  run: |
    cat > manifest.json << EOF
    {
      "build_id": "${{ github.run_number }}",
      "commit": "${{ github.sha }}",
      "branch": "${{ github.ref_name }}",
      "platform": "windows",
      "artifacts": [
        {
          "name": "vitegame.exe",
          "size": "$(stat -c%s dist/vitegame.exe)",
          "hash": "$(sha256sum dist/vitegame.exe | cut -d' ' -f1)"
        }
      ]
    }
    EOF
```

## 闂鎺掓煡鎸囧崡

### 甯歌缂栫爜闂

#### 鉂?闂锛歅owerShell閲嶅畾鍚戜贡鐮?
```yaml
# 閿欒绀轰緥
- shell: powershell
  run: echo "鍚腑鏂囧唴瀹? > $env:GITHUB_STEP_SUMMARY
```

#### 鉁?瑙ｅ喅鏂规

```yaml
# 姝ｇ‘鏂规硶
- shell: pwsh
  run: |
    "鍚腑鏂囧唴瀹? | Out-File -FilePath $env:GITHUB_STEP_SUMMARY -Encoding utf8NoBom -Append
```

#### 鉂?闂锛歮ixed shell鐜

```yaml
# 閬垮厤鍦ㄥ悓涓€浣滀笟涓贩鐢╯hell绫诲瀷
jobs:
  build:
    runs-on: windows-latest
    steps:
      - shell: bash
        run: echo "bash content" >> $GITHUB_STEP_SUMMARY
      - shell: powershell # 鍙兘瀵艰嚧缂栫爜涓嶄竴鑷?        run: echo "ps content" >> $env:GITHUB_STEP_SUMMARY
```

#### 鉁?瑙ｅ喅鏂规锛氱粺涓€shell绫诲瀷

```yaml
jobs:
  build:
    runs-on: windows-latest
    steps:
      - shell: bash
        run: echo "bash content" >> $GITHUB_STEP_SUMMARY
      - shell: bash # 淇濇寔涓€鑷?        run: echo "more bash content" >> $GITHUB_STEP_SUMMARY
```

## 楠岃瘉娓呭崟

- [ ] Step Summary浣跨敤bash鎴杙wsh锛堥伩鍏峱owershell锛?- [ ] PowerShell杈撳嚭浣跨敤`-Encoding utf8NoBom`
- [ ] 鍚屼竴浣滀笟鍐卻hell绫诲瀷淇濇寔涓€鑷?- [ ] 涓枃鍐呭鍦⊿tep Summary涓纭樉绀?- [ ] 宸ヤ欢鏂囦欢浣跨敤UTF-8缂栫爜
- [ ] JSON/XML鏂囦欢涓嶅寘鍚獴OM

## P2浼樺寲鏍囧噯

| 鍦烘櫙             | 鎺ㄨ崘Shell | 缂栫爜鏂瑰紡                       | 绀轰緥                                   |
| ---------------- | --------- | ------------------------------ | -------------------------------------- |
| 閫氱敤Step Summary | `bash`    | heredoc + 閲嶅畾鍚?              | `cat >> $GITHUB_STEP_SUMMARY << 'EOF'` |
| Windows鐗瑰畾鍔熻兘  | `pwsh`    | `Out-File -Encoding utf8NoBom` | 涓婅堪PowerShell绀轰緥                     |
| JSON閰嶇疆鐢熸垚     | `pwsh`    | `ConvertTo-Json + Out-File`    | 閰嶇疆鏂囦欢绀轰緥                           |
| 宸ヤ欢娓呭崟鍒涘缓     | `bash`    | heredoc                        | manifest.json绀轰緥                      |

---

_姝ゆ枃妗ｄ綔涓篜2浼樺寲闃舵缂栫爜涓€鑷存€ф爣鍑嗭紝纭繚鎵€鏈塆itHub Actions杈撳嚭鍦╓indows鐜涓嬫纭樉绀恒€俖
