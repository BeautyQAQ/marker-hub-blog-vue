# 博客前端

基于 Vue 3、Vite、Vue Router 4、Vuex 4、Element Plus 和 md-editor-v3，保留 Options API。
Markdown 编辑器支持工具栏、实时预览和 HTML 净化，全屏使用本地 screenfull。
未使用的 Mermaid、KaTeX、ECharts、高亮、Prettier 和图片上传/裁剪插件均禁用，避免隐式 CDN 加载。

## 环境与启动

使用 Node.js 24.15+（推荐 Node 24 LTS）及 npm，依赖由 package-lock.json 锁定。

```powershell
npm ci
npm run dev
```

开发地址默认 http://127.0.0.1:5173。npm run serve 保留为开发命令的别名。
可复制 .env.example 为 .env.local 并调整配置：

| 变量 | 默认值 | 用途 |
| --- | --- | --- |
| VITE_API_BASE_URL | /api | 浏览器请求的 API 前缀 |
| VITE_PROXY_TARGET | http://localhost:8080 | Vite 开发服务器代理目标，仅开发生效 |

默认开发代理会将 /api/blogs 转发到 http://localhost:8080/blogs。
如直接配置跨域 API 地址，后端须允许对应来源及 Authorization 请求头，
并暴露登录响应中的 Authorization 头。

## 验证与生产构建

```powershell
npm test
npm run build
npm run preview -- --port 4173
```

CI 在 main 分支 push 和 PR 时使用 Node 24 执行 npm ci、行为测试和生产构建。
生产文件在 dist/。生产服务器须将 /api/ 反向代理到后端（转发时去掉 /api 前缀），
并为 history 路由配置回退到 index.html；Vite 的开发代理不参与生产部署。
preview 仅检查构建产物，不提供 /api 代理。

## 后端联调边界

现有页面沿用以下接口约定，**当前配套后端尚未实现登录和文章接口，业务闭环仍待开发**。
页面遇到缺失接口或停机时展示真实错误，不内置模拟业务数据。

| 页面行为 | 请求 |
| --- | --- |
| 登录 | POST /login；响应 Authorization 头携带令牌，data 为用户信息 |
| 文章列表 | GET /blogs?currentPage=1；data 包含 records/current/total/size |
| 文章详情 | GET /blog/:blogId；data 包含 id/userId/title/description/content |
| 创建或修改 | POST /blog/edit |
| 退出 | GET /logout |

API 返回沿用 { code, msg, data }，接受数字 200、字符串 200、20000、20001 为成功。
令牌和用户信息统一存储在 localStorage；401 清理会话并跳转登录，登录后返回原页面。
前端守卫和作者判断只改善交互，服务端仍须验证身份与文章所属关系。

## 升级依据

- [Vue 3 快速开始](https://vuejs.org/guide/quick-start.html)
- [Vite 环境要求](https://vite.dev/guide/)
- [Vue Router 4 迁移](https://router.vuejs.org/guide/migration/)
- [Vuex 4 迁移](https://vuex.vuejs.org/guide/migrating-to-4-0-from-3-x.html)
- [Element Plus 安装](https://element-plus.org/en-US/guide/installation.html)
- [md-editor-v3 API](https://imzbf.github.io/md-editor-v3/en-US/api)
