# 卡兹克内容分类目录

这是 [@Khazix0918](https://x.com/Khazix0918)（卡兹克）公开发帖的分类浏览站点。页面按「体裁 × 主题」筛选，数据来自 `data/catalog.json`。

在线地址（GitHub Pages 启用后）：[https://yhcheng96.github.io/khazix-catalog/](https://yhcheng96.github.io/khazix-catalog/)

仓库：[https://github.com/yhcheng96/khazix-catalog](https://github.com/yhcheng96/khazix-catalog)

## 本地预览

不要直接双击打开 `index.html`。浏览器在 `file://` 下通常无法读取 JSON。

```bash
git clone https://github.com/yhcheng96/khazix-catalog.git
cd khazix-catalog
python3 -m http.server 4173
```

然后打开 [http://127.0.0.1:4173/](http://127.0.0.1:4173/)。也可以运行 `./serve.sh`。

## 谁改哪里

- `data/catalog.json`：由监控自动更新，**不要手改**标题、摘要、分类或条目内容。
- `taxonomy.md`：体裁和主题的定义，改分类规则时看这份。
- `index.html`、`css/app.css`、`js/app.js`：前端页面，可用本地 Codex 继续改筛选、样式和交互。

前端会直接读取 `data/catalog.json` 里的统计、定义和条目。更新数据后刷新页面即可，不必改 HTML。

## 用 Codex 接着改

把本仓库拉到本地后，在项目根目录打开 Codex，并让它先读 `AGENTS.md`。它应只改前端，不改 `data/`。

## 开启 GitHub Pages

代码推到 `main` 后：

1. 打开仓库的 Settings → Pages。
2. Build and deployment 的 Source 选 **GitHub Actions**。
3. 如首次部署需要批准 `github-pages` 环境，在 Actions 或 Environments 里点批准。
4. 稍等一两分钟，打开 [https://yhcheng96.github.io/khazix-catalog/](https://yhcheng96.github.io/khazix-catalog/)。

本仓库已包含 `.github/workflows/pages.yml`。若你更想用「Deploy from a branch」，也可选 `main` 分支的根目录 `/`。
