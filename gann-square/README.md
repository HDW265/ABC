# 江恩九方图 · Square of Nine（网页版）

纯静态网页：调起始值、步长、环数即可生成江恩九方图。支持价格/时间模式、角度高亮、价格反查、Constellate 跑图/推演、手工批注画线、左右侧栏拖拽变宽、导出与分享链接。

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

适合：方式 B 双击异常、想本地调试、或习惯用 `localhost` 访问。

下面以 **Windows 10/11** 为主（你当前环境：`E:\ABC\ABC-main`），macOS / Linux 步骤附在文末。

---

### 第 0 步：确认文件夹位置

解压后的目录应类似：

```text
E:\ABC\ABC-main\
├── README.md
└── gann-square\
    ├── index.html
    ├── css\
    └── js\
```

**重要：** 终端要进入 **`ABC-main` 这一层**（能看到 `gann-square` 文件夹），不要进到 `gann-square` 里面。

---

### 第 1 步：检查是否已安装 Python

1. 按键盘 `Win + R`，输入 `cmd`，回车，打开 **命令提示符**  
   （也可以用 **PowerShell**，步骤相同）

2. 输入下面命令并回车：

   ```bat
   python --version
   ```

3. 若显示类似 `Python 3.11.x` → 已安装，跳到 **第 2 步**

4. 若提示 `'python' 不是内部或外部命令` → 需要安装 Python：  
   - 打开 https://www.python.org/downloads/  
   - 下载 Windows 安装包  
   - 安装时 **勾选 “Add Python to PATH”**（非常重要）  
   - 安装完成后 **关闭并重新打开** cmd，再执行 `python --version`

---

### 第 2 步：进入项目目录

在 cmd 里输入（根据你的实际路径修改）：

```bat
E:
cd \ABC\ABC-main
```

确认当前目录：

```bat
dir
```

应能看到 `gann-square` 文件夹和 `README.md`。

也可以一条命令进入：

```bat
cd /d E:\ABC\ABC-main
```

> `cd /d` 可以同时切换盘符和目录（从 C 盘跳到 E 盘时常用）。

---

### 第 3 步：启动本地服务器

在 **同一窗口** 输入：

```bat
python -m http.server 8080
```

若 `python` 不行，试：

```bat
py -m http.server 8080
```

**成功时**，窗口会显示类似：

```text
Serving HTTP on :: port 8080 (http://[::]:8080/) ...
```

或：

```text
Serving HTTP on 0.0.0.0 port 8080 ...
```

**注意：**
- 这个黑色窗口 **不要关**，关了服务就停了  
- `8080` 是端口号，可以改成 `8888` 等，只要浏览器地址里一致即可

---

### 第 4 步：用浏览器打开页面

1. 打开 Chrome / Edge  
2. 地址栏输入（复制粘贴）：

   ```text
   http://localhost:8080/gann-square/
   ```

   或：

   ```text
   http://127.0.0.1:8080/gann-square/
   ```

3. 回车后应看到 **江恩九方图** 界面（左侧参数、中间格子、右侧解读）

**不要** 写成 `file:///...`，方式 C 用的是 `http://localhost:...`

---

### 第 5 步：用完后关闭服务

回到 cmd 窗口，按：

```text
Ctrl + C
```

提示 `Terminate batch job (Y/N)?` 时输入 `Y` 回车，或直接再按一次 `Ctrl + C`。

---

### 方式 C 完整命令一览（复制即用）

假设项目在 `E:\ABC\ABC-main`：

```bat
cd /d E:\ABC\ABC-main
python -m http.server 8080
```

浏览器打开：`http://localhost:8080/gann-square/`

---

### 常见问题

| 现象 | 处理 |
|------|------|
| `Address already in use` / 端口被占用 | 换端口：`python -m http.server 8888`，浏览器改开 `http://localhost:8888/gann-square/` |
| 页面 404 | 检查是否进错目录；必须在有 `gann-square` 文件夹的那一层启动 |
| 页面空白 | 确认 URL 末尾是 `/gann-square/` 或 `/gann-square/index.html` |
| 改了代码没变化 | 浏览器 `Ctrl + F5` 强制刷新 |
| 防火墙弹窗 | 选「允许访问」（仅本机 localhost，一般安全） |

---

### macOS / Linux 用户

```bash
cd ~/Downloads/ABC-main
python3 -m http.server 8080
```

浏览器打开：`http://localhost:8080/gann-square/`

停止服务：`Ctrl + C`

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

6b. **侧栏宽度**  
   - 宽屏下拖动参数/解读与画布之间的分隔条可变宽；双击恢复默认；宽度会记住  

7. **Constellate（星座）跑图**  
   - 填起点价 / 目标价 →「Constellate跑图法」
   - 单线展示前缀：**Constellate · 角十角**；推演秘诀前缀：**Constellate · 完整推演**
   - 右侧可「复制 完整Constellate」  
   - 方向由高低点自动判定（高→低向下，低→高向上；相同则提示调整）  
   - 输出：默认 **单线 + 推演**（可改仅单线 / 仅推演）；推演段数默认 4，上限 40（自动适配）  
   - 右侧：秘诀串、价位芯片；画布推演默认打点（已下线通道明细）  
   - **算法定稿归档：** [PATH_ALGORITHM.md](./PATH_ALGORITHM.md)

7b. **风车跑图法**  
   - 与 Constellate 共用 Begin / Step / Rings；**起点价 / 目标价独立**（不共用）  
   - **阶段 1 · 构图**：「风车构图」→ 8 条骨架虚线（十字/对角）+ 8 条叶实线；锚点环从第 3 环起每隔 1 环至 N  
   - **阶段 2 · 骨架跑图**：起点在十字/对角骨架上 → 骨架轴对穿；**中心起点**按目标选水平/垂直/对角骨架（如 `1→19` 水平、`1→16` 垂直最接近 15、`1→13`/`1→25` 对角）  
   - **阶段 3 · 叶区显示**：八叶区主名 + 夹轨副名；轨迹端点标 1–4；点选高亮（叶轨格不进叶区集合）  
   - **阶段 4 · 叶区/叶轨跑图**：非骨架起点按家族跑——东/西水平180°、北/南垂直180°、东北西南与轨1–2 为45°、西北东南与轨3–4 为45°；允许对顶来回；最接近即停。统一按钮「风车跑图」自动路由  
   - 可与 Constellate 路径叠加对照  

8. **手工批注画图（画布顶栏）**  
   - `✎` 开/关画笔；工具条默认展开，可 `«` 收缩  
   - 选择 / 直线 / 折线 / 圆标 / 橡皮；角度循环 **45° → 90° → 180° → 自由**  
   - 颜色、线型（实/虚/点）、线宽；撤销与清空；本地保存  
   - 折线：连续点格，双击或 Enter 结束；快捷键 `D` 画笔、`A` 角度、`Esc` 退出  

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
├── index.html           ← 入口，打开这个
├── css/styles.css
├── js/square.js         ← 九方图生成
├── js/path.js           ← Constellate 单线（GannPath）
├── js/pinwheel.js       ← 风车构图 + 骨架跑图（GannPinwheel）
├── js/project.js        ← 推演表（GannProject）
├── js/app.js            ← 界面交互
├── PATH_ALGORITHM.md    ← Constellate 算法归档（定稿）
└── README.md            ← 本说明
```

## 版权与引用

© 2026 起 深圳市思科达科技有限公司　开发总监：谢俊昌  
联系：xjcxjc265@gmail.com  
开源仓库：https://github.com/HDW265/ABC  
引用请注明：深圳市思科达科技有限公司 / 谢俊昌，https://github.com/HDW265/ABC
