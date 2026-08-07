# ABC

## 江恩九方图网页版

完整逐步说明见：**[gann-square/README.md](./gann-square/README.md)**

### 快速对照

| 方式 | 做什么 | 打开哪里 |
|------|--------|----------|
| **A. 在线** | GitHub → Settings → Pages，选 `main` / root，保存 | `https://hdw265.github.io/ABC/gann-square/` |
| **B. 直接打开** | 下载/克隆仓库后双击文件 | `gann-square/index.html` |
| **C. 本机服务** | 在仓库根目录运行下面命令 | `http://localhost:8080/gann-square/` |

```bash
cd ABC
python3 -m http.server 8080
# 浏览器打开 http://localhost:8080/gann-square/
```

**结论：不必为了“能用网页”而必须下载源码**——部署到 GitHub Pages 后，用链接即可；本机预览才需要本地文件。
