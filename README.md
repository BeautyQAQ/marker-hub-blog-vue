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

## 个人博客功能与接口

访客可分页浏览已发布文章和详情；登录后可新建、保存草稿、发布、修改和删除自己的文章。
“我的文章”支持草稿/已发布筛选、分页管理，筛选与页码保留在 URL 中。
草稿仅作者可见，删除采用后端软删除；删除须确认，失败后保留页面内容并可重试。
编辑器保留未保存离开提醒，失败时保留正文；工具栏保存会保持当前草稿/发布状态。

| 页面行为 | 请求 |
| --- | --- |
| 登录 | POST /login；响应 Authorization 头携带令牌，data 为用户信息 |
| 恢复身份 | GET /me；返回当前用户安全资料，不含密码 |
| 公开文章列表 | GET /blogs?currentPage=1&pageSize=5；仅已发布，data 包含 records/current/total/size |
| 作者管理列表 | GET /my/blogs?currentPage=1&pageSize=5&status=0；status 可选，0 草稿、1 已发布，不传为全部 |
| 文章详情 | GET /blog/:blogId；已发布公开，草稿仅本人，data 包含 id/userId/title/description/content/status |
| 创建或修改 | POST /blog/edit；新建省略 id，修改传 id；显式传 status=0 或 1 |
| 删除 | DELETE /blog/:blogId；仅作者可操作，删除后不再出现在列表或详情 |
| 退出 | POST /logout；后端同时作废令牌并结束会话，GET 仅为兼容旧客户端 |

标题必填且不超过 255 个字符；摘要可空，最多 1000 个字符；正文必填，最多 1 MiB（UTF-8 字节数）。
新建文章默认草稿，前端始终显式传保存状态；更新时工具栏保存保留已有状态。
列表默认每页 5 篇，后端最大每页 20 篇，列表记录不包含正文。

API 返回沿用 { code, msg, data }，接受数字 200、字符串 200、20000、20001 为成功。
令牌和用户信息统一存储在 localStorage；启动时使用 GET /me 核验缓存身份。
核验超时或网络失败会保留缓存，/me 明确返回 401 或账号禁用 403 才清理身份；普通请求的 401 会跳转登录并保留回跳地址。
密码错误直接展示登录接口的错误信息，不清理其他有效会话。
退出前先处理编辑器未保存提示；确认后调用 POST /logout，后端不可用时仍结束本地会话。
权限由后端验证，前端守卫和作者判断用于交互提示，不能替代服务端鉴权。

联调前按配套后端 README 配置 MySQL、Redis、JWT 密钥并执行数据库迁移，再启动后端到 8080。
Redis 用于服务端会话及令牌失效控制；生产必须配置持久可靠的服务与 HTTPS。
浏览器不内置测试账户或模拟文章；业务测试数据与浏览器夹具不打包进生产产物。

## 升级依据

- [Vue 3 快速开始](https://vuejs.org/guide/quick-start.html)
- [Vite 环境要求](https://vite.dev/guide/)
- [Vue Router 4 迁移](https://router.vuejs.org/guide/migration/)
- [Vuex 4 迁移](https://vuex.vuejs.org/guide/migrating-to-4-0-from-3-x.html)
- [Element Plus 安装](https://element-plus.org/en-US/guide/installation.html)
- [md-editor-v3 API](https://imzbf.github.io/md-editor-v3/en-US/api)
