# 江恩九方图 · Square of Nine（网页版）

纯静态网页：调起始值、步长、环数即可生成江恩九方图。支持价格/时间模式、角度高亮、价格反查、导出与分享链接。

**不需要安装 Node.js / npm，也没有构建步骤。**

---

## 一句话结论

| 你的情况 | 用哪种方式 |
|----------|------------|
| 想发给别人一个网址打开 | 方式 A：GitHub Pages（推荐） |
| 文件已经在电脑上，只想自己看一眼 | 方式 B：双击打开 `index.html` |
| 方式 B 显示异常，或要本机调试 | 方式 C：本机小服务器 |

---

## 方式 A：部署后用链接打开（不用每次下载）

适合：希望用浏览器网址访问，自己和别人都能打开。

### A1. 先合并代码到 `main`（若还在 PR 里）

1. 打开仓库：https://github.com/HDW265/ABC  
2. 打开 Pull Request，合并到 `main`  
3. 确认仓库里能看到文件夹 `gann-square/`

### A2. 开启 GitHub Pages

1. 打开：https://github.com/HDW265/ABC/settings/pages  
2. **Build and deployment → Source** 选 `Deploy from a branch`  
3. **Branch** 选 `main`  
4. **Folder** 选 `/ (root)`  
5. 点 **Save**，等待 1–2 分钟部署完成  

### A3. 打开网页

浏览器访问：

```text
https://hdw265.github.io/ABC/gann-square/
```

> 若提示 404：再等一会，或确认 `main` 上已有 `gann-square/index.html`。

### （可选）Netlify 拖拽上线

1. 打开 https://app.netlify.com/drop  
2. 把本地的整个 `gann-square` 文件夹拖进去  
3. 用 Netlify 生成的链接打开即可  

---

## 方式 B：浏览器直接打开本地文件（最快）

适合：代码已在电脑上，只想立刻看到界面。

### 步骤

1. **拿到文件**（任选一种）  
   - 克隆仓库：  
     ```bash
     git clone https://github.com/HDW265/ABC.git
     ```  
   - 或在 GitHub 网页点绿色 **Code → Download ZIP**，解压  

2. 进入文件夹：`ABC/gann-square/`  

3. 找到 `index.html`  

4. 用浏览器打开：  
   - **Windows**：双击 `index.html`，或右键 → 打开方式 → Chrome / Edge  
   - **macOS**：右键 → 打开方式 → Chrome / Safari  
   - 也可以把 `index.html` 拖进已打开的浏览器窗口  

5. 看到标题「江恩九方图」和中间数字格子，即成功。

### 注意

- 地址栏通常是 `file:///.../gann-square/index.html`  
- 若样式丢失或按钮无反应，改用下面的 **方式 C**（更稳定）

---

## 方式 C：本机小服务器预览（最稳）

适合：本地开发、调试，或方式 B 打不开。

### 前提

电脑已安装 **Python 3**（多数系统自带）。终端执行：

```bash
python3 --version
```

能看到版本号即可。

### 步骤

1. 打开终端（Terminal / PowerShell / CMD）  

2. 进入**仓库根目录**（里面有 `gann-square` 文件夹的那一层）：  

   ```bash
   cd /你的路径/ABC
   ```

   Windows 示例：

   ```bash
   cd C:\Users\你的用户名\Downloads\ABC
   ```

3. 启动服务：  

   ```bash
   python3 -m http.server 8080
   ```

   Windows 若 `python3` 不可用，试：

   ```bash
   python -m http.server 8080
   ```

4. 保持终端窗口不要关，用浏览器打开：  

   ```text
   http://localhost:8080/gann-square/
   ```

5. 用完后在终端按 `Ctrl + C` 停止服务。

---

## 打开后怎么操作（功能用法）

1. **左侧参数**  
   - **起始值 Begin**：方阵中心起始数字  
   - **步长 Step**：每格递增多少（也可点 0.01 / 0.1 / 1 / 5 / 10）  
   - **环数 Rings**：越大格子越多（环数 6 → 11×11）  

2. **模式**  
   - **价格**：显示数值方阵  
   - **时间**：按起始日期 + 日/周/月向外螺旋  

3. **显示开关**  
   - 十字轴、对角线、完全平方数高亮  

4. **价格反查**  
   - 输入价格 → 点「定位」→ 跳到最接近的格子  

5. **点格子**  
   - 右侧显示角度、环数、同轴关联位、邻近格  

6. **顶栏**  
   - 预设模板、复制链接、导出 CSV / PNG  

---

## 常见问题

**Q：一定要下载源码吗？**  
A：不一定。用方式 A 部署后，只记网址就能开；方式 B/C 才需要本地文件。

**Q：方式 A 打开是 404？**  
A：常见原因有两个：  
1. **代码还没在 `main` 分支** — 只有 `main` 上的文件才会被 GitHub Pages 发布。请确认仓库里能看到 `gann-square/index.html`。  
2. **刚推送完还没部署完** — 等 1–2 分钟再刷新。  
正确地址：`https://hdw265.github.io/ABC/gann-square/`

**Q：方式 B 解压后只有 README，没有 `gann-square` 文件夹？**  
A：说明你下载的是**旧版 ZIP**（当时 `main` 里还没有网页代码）。请重新下载：  
1. 打开 https://github.com/HDW265/ABC  
2. 确认分支选的是 **`main`**（不是别的分支）  
3. 点绿色 **Code → Download ZIP**  
4. 解压后应看到：`ABC-main/gann-square/index.html`

**Q：为什么我双击打开是空白/样式乱？**  
A：改用方式 C（`python3 -m http.server`）。

**Q：要不要装 Node？**  
A：不要。

---

## 目录说明

```text
gann-square/
├── index.html      ← 入口，打开这个
├── css/styles.css
├── js/square.js    ← 九方图生成
├── js/app.js       ← 界面交互
└── README.md       ← 本说明
```
