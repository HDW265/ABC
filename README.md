# ABC

## 扣带自动排版

输入布宽、扣径、间距、成品长（全部 mm），自动生成多种排版方案图纸。

| 方式 | 打开哪里 |
|------|----------|
| **在线** | **https://hdw265.github.io/ABC/button-tape/** |
| **本地文件** | `button-tape/index.html` |
| **本机服务** | `http://localhost:8080/button-tape/` |

说明见 **[button-tape/README.md](./button-tape/README.md)**。

## 江恩九方图网页版

完整逐步说明见：**[gann-square/README.md](./gann-square/README.md)**  
**Constellate（星座）跑图法** 定稿归档见：**[gann-square/PATH_ALGORITHM.md](./gann-square/PATH_ALGORITHM.md)**

### 快速对照

| 方式 | 做什么 | 打开哪里 |
|------|--------|----------|
| **A. 在线** | 直接打开（Pages 已配置在 `main`） | **https://hdw265.github.io/ABC/gann-square/** |
| **B. 直接打开** | 从 `main` 分支重新 Download ZIP，双击文件 | `gann-square/index.html` |
| **C. 本机服务** | 在仓库根目录运行下面命令 | `http://localhost:8080/gann-square/` |

> 若 A 刚更新后仍 404，等 1–2 分钟再试。若 B 解压后只有 README，说明 ZIP 是旧版，请重新从 `main` 下载。

### 方式 C 详细步骤（Windows 示例）

假设已解压到 `E:\ABC\ABC-main`：

1. `Win + R` → 输入 `cmd` → 回车  
2. 执行：
   ```bat
   cd /d E:\ABC\ABC-main
   python -m http.server 8080
   ```
3. 浏览器打开：**http://localhost:8080/gann-square/**  
4. 用完在 cmd 按 `Ctrl + C` 停止  

完整图文说明见 [gann-square/README.md](./gann-square/README.md#方式-c本机小服务器预览最稳)

**结论：不必为了“能用网页”而必须下载源码**——部署到 GitHub Pages 后，用链接即可；本机预览才需要本地文件。
