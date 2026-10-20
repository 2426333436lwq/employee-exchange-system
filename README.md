# 企业员工积分兑换系统

员工通过积分兑换福利商品/服务的完整系统。

**架构为前后台主从模式**：

```
   PC_project（后台管理系统）          Mobile_Project（前台移动端）
   Vue2 + Element UI + Webpack        uni-app + Vue3 + TS + Vite
   管理员：商品/分类/订单管理            员工：浏览/兑换/积分/订单
              │                                    │
              └──────────────┬─────────────────────┘
                             ▼
                      server（后端 REST API）
                      Express + 内存仓库 + 落盘
                      ← 前后台唯一数据源 →
```

> 后台的增删改、上下架、置顶等操作，通过后端单一数据源
> **对前台即时生效**。

---

## 一、项目结构

| 目录 | 类型 | 技术栈 | 说明 |
| :--- | :--- | :--- | :--- |
| `server/` | **后端** | Node 18+ / Express 4 | REST API + 业务规则 + 数据落盘 |
| `shared/` | **共享契约** | TypeScript / JS | 前后台唯一领域模型与展示映射 |
| `PC_project/` | **实现端（后台）** | Vue 2.6 + Element UI 2.15 + Webpack 5 | 管理端 |
| `Mobile_Project/` | **实现端（前台）** | uni-app 3 + Vue 3 + TypeScript + Vite | 员工端 |
| `PC_YX/` | 原型文件 | CDN Vue 2 + Element UI（免构建） | PC 端设计原型 |
| `Mobile_Project_YX/` | 原型文件 | 原生 HTML + Tailwind CDN + 原生 JS | 移动端设计原型 |

> **重要区分**：`server` / `shared` / `PC_project` / `Mobile_Project` 是**需维护的实现部分**；
> `PC_YX` / `Mobile_Project_YX` 是**静态设计原型**，仅作视觉与交互参照，
> **不作为代码基线，不参与功能迭代**。

---

## 二、快速开始

> **启动顺序**：MySQL → 后端 → 前端。

### 0. 数据库（MySQL 8.0+）

首次部署执行两个 SQL（用 Navicat 或 mysql 客户端）：

```bash
mysql -u root -p < server/sql/schema.sql   # 建库 + 创建应用专用账号
mysql -u root -p < server/sql/tables.sql   # 建表（含外键/索引/约束）
```

> `schema.sql` 创建应用账号 `exchange_app`，**只授予该库的增删改查权限**
> （不给 DROP/ALTER）。生产环境请勿用 root 运行应用。

### 1. 后端（必须最先启动）

```bash
cd server
npm install
cp .env.example .env     # 然后按实际环境填写（数据库密码、JWT_SECRET 等）
npm run dev              # http://localhost:3000 （node --watch 热重载）
# npm start              # 生产模式
```

**环境变量**（`server/.env`，已在 `.gitignore` 中排除，切勿提交）：

| 变量 | 必填 | 说明 |
| :--- | :--- | :--- |
| `NODE_ENV` | — | `development` / `production` |
| `DB_HOST` / `DB_PORT` | — | 默认 `127.0.0.1:3306` |
| `DB_USER` / `DB_PASSWORD` | ✅ | 应用账号（**不要用 root**） |
| `DB_NAME` | — | 默认 `employee_exchange` |
| `JWT_SECRET` | ✅ 生产 | 生产环境缺失将**拒绝启动**；生成：<br>`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `CORS_ORIGINS` | ✅ 生产 | 逗号分隔的前端来源白名单，**不允许 `*`** |

> 首次启动时若表为空，会自动灌入种子数据（`server/src/seed.js`）。
> 健康检查 `GET /api/health`（存活）；`GET /api/ready`（就绪，含数据库连通性）。

### 2. PC 管理端

```bash
cd PC_project
npm install
npm run dev      # http://localhost:8082
npm run build    # 生产构建 -> dist/
```

### 3. 移动端

```bash
cd Mobile_Project
npm install
npm run dev:h5        # http://localhost:5173
npm run build:h5      # 构建 -> dist/build/h5/
npm run typecheck     # TypeScript 类型检查
```

### 数据源切换

前后端通过环境变量解耦，可在离线演示与真实后端间无缝切换：

| 端 | 变量 | 取值 | 配置文件 |
| :--- | :--- | :--- | :--- |
| 移动端 | `VITE_DATA_SOURCE` | `api`（默认）/ `mock` | `Mobile_Project/.env.development` |
| PC 端 | `PC_DATA_SOURCE` | `api`（默认）/ `local` | 环境变量（webpack DefinePlugin 注入） |

> `mock` / `local` 模式下使用本地副本，改动**不会**影响另一端，仅用于离线演示。

### 演示账号（鉴权）

系统已启用 JWT 鉴权（详见 [docs/adr/0001-jwt-scrypt-auth.md](docs/adr/0001-jwt-scrypt-auth.md)），
两端均需登录后使用：

| 账号 | 密码 | 角色 | 权限 |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | 管理员 | 商品/分类/订单的一切管理操作 |
| `zhangsan` | `123456` | 员工 | 浏览商城、兑换、查看/取消**自己的**订单与积分 |

- 权限校验**全部在服务端强制**：伪造 token、篡改角色、伪造 userId 均被拒绝（已实测 47 项边界断言）。
- 员工只能看到本人的订单与积分流水（数据隔离）。
- 修改口令：`POST /api/auth/change-password`。
- 生产部署前**必须**设置环境变量 `JWT_SECRET`，并移除 `/api/dev/reset`。

### 已知依赖约束

- 移动端依赖 `esbuild@0.21.5`（已在 devDependencies 显式锁定），
  需与 `vite@5.4.21` 内嵌版本一致，否则构建报
  `Host version does not match binary version`。
- 后端运行时数据落于 `server/data/db.json`（已在 `.gitignore` 忽略），
  可从 `server/src/seed.js` 重建；`POST /api/dev/reset` 可重置为种子数据。

---

## 三、数据模型

### 数据库结构（MySQL 8.0 / InnoDB / utf8mb4）

6 张表，完整 DDL 见 [`server/sql/tables.sql`](server/sql/tables.sql)：

| 表 | 说明 | 关键约束 |
| :--- | :--- | :--- |
| `users` | 用户（员工 + 管理员） | `username` 唯一、`employee_id` 唯一、`points >= 0` |
| `categories` | 商品分类 | `name` 唯一 |
| `products` | 商品（**软删除**） | 外键 → `categories`；`stock >= 0`、`points >= 0` |
| `orders` | 兑换订单 | 外键 → `users` / `products`；`points >= 0` |
| `points_history` | 积分流水 | 外键 → `users`；`earn` 正 / `spend` 负 |
| `audit_logs` | 操作审计日志 | 记录谁在何时改了什么 |

**设计要点**：

- **软删除**：`products.deleted_at`。后台「删除」只打标记——
  前台立即消失、后台不再显示，但历史订单的外键完整性不受破坏。
  若该商品还有未完成订单（`pending`/`shipped`），删除会被拒绝。
- **快照 + 引用**：`orders` 冗余存 `product_name`/`product_image`，
  商品改名或下架后，历史订单信息不失真。
- **用户关联用外键**：`orders.user_id` / `points_history.user_id`。
  （早期版本用 `userName` 昵称字符串关联，多用户时会串号，已修正。）
- **规格参数用 JSON 列**：`products.specs`，MySQL 5.7+ 原生支持。
- **字符集 utf8mb4**：分类图标与商品描述含 emoji（🔥📦🎁💆），
  `utf8mb3` 无法存储。

**索引设计**（覆盖实际查询路径）：

| 表 | 索引 | 服务的查询 |
| :--- | :--- | :--- |
| products | `(status, deleted_at)` | 前台商城列表 |
| products | `(category_id, status)` | 按分类筛选 |
| products | `(is_top, status)` | 首页热门位 |
| orders | `(user_id, exchange_time)` | 员工「我的兑换」 |
| orders | `(status)` | 后台按状态筛选 |
| points_history | `(user_id, time)` | 员工「积分明细」 |

### API 模型（Product）

> 数据库列用 `snake_case`，对外 API 用 `camelCase`，由 `server/src/store.js` 负责转换。

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | number | 商品唯一标识 |
| `name` | string | 商品名称 |
| `categoryId` | number | 分类 ID |
| `categoryName` | string | 分类名称（JOIN 实时获取，非冗余列） |
| `points` | number | 兑换所需积分 |
| `stock` | number | 库存 |
| `monthlySales` | number | 月销量 |
| `brand` | string | 品牌 |
| `rating` / `reviewCount` | number | 评分 / 评价数 |
| `image` | string | 图片 URL |
| `type` | enum | `physical` / `virtual` / `service` |
| `status` | enum | `online` / `offline` |
| `isTop` | boolean | 是否置顶 |
| `sortOrder` | number | 排序序号 |
| `description` | string | 商品描述 |
| `specs` | object | 规格参数（**英文键**，前端经 `keyMap` 映射为中文显示） |

### Order（订单）

| 字段 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | string | 订单号，格式 `ORD` + 时间戳 |
| `productId` / `productName` / `productImage` | - | 商品快照 |
| `points` | number | 消耗积分 |
| `status` | enum | `pending` / `shipped` / `completed` / `cancelled` |
| `statusLabel` | string | 状态中文标签 |
| `exchangeTime` | string | 兑换时间 `YYYY-MM-DD HH:mm:ss` |
| `userName` | string | 兑换人 |

### 其他模型

- **Category**：`id` / `name` / `icon` / `sortOrder` / `status`
  （`productCount` 为前端派生字段，不存储）
- **UserInfo**：`id` / `nickname` / `avatar` / `points` 及职位、部门、工号等可选字段
- **PointsRecord**：`id` / `type`(`earn`|`spend`) / `points` / `description` / `time`

---

## 四、API 接口

统一响应格式：`{ code: 0, data: <数据>, message: "ok" }`，`code !== 0` 表示失败。

| 方法 | 路径 | 说明 |
| :--- | :--- | :--- |
| GET | `/api/health` | 健康检查（公开） |
| POST | `/api/auth/login` | **登录**，返回 `{ token, user }`（公开） |
| GET | `/api/auth/me` | 当前登录用户 |
| POST | `/api/auth/change-password` | 修改本人密码 |
| GET | `/api/categories` | 分类列表（公开） |
| POST | `/api/categories` | 新增分类（管理员） |
| PUT | `/api/categories/:id` | 更新分类（同步商品的 `categoryName`，管理员） |
| DELETE | `/api/categories/:id` | 删除分类（有商品时拒绝，管理员） |
| GET | `/api/products` | 全部商品（管理员） |
| GET | `/api/products/online` | 仅上架商品（**前台商城**，公开） |
| GET | `/api/products/:id` | 商品详情（公开） |
| POST | `/api/products` | 新增商品（管理员） |
| PUT | `/api/products/:id` | 更新商品（管理员） |
| DELETE | `/api/products/:id` | 删除商品（管理员） |
| PATCH | `/api/products/batch-status` | 批量上下架 `{ ids, status }`（管理员） |
| PATCH | `/api/products/:id/top` | 置顶切换 `{ isTop }`（管理员） |
| GET | `/api/orders` | 订单列表（管理员全部；员工仅本人，支持 `?status=` `?keyword=`） |
| GET | `/api/orders/:id` | 订单详情（仅本人或管理员） |
| POST | `/api/orders` | **前台下单**（校验库存/上架/积分；下单人恒为登录用户） |
| PATCH | `/api/orders/:id/status` | **后台推进状态**（管理员） |
| POST | `/api/orders/:id/cancel` | **前台取消**（返还积分 + 回补库存；仅本人或管理员） |
| GET | `/api/users/:id` | 用户信息（仅本人或管理员） |
| PUT | `/api/users/:id` | 更新资料（积分不可改；仅本人或管理员） |
| GET | `/api/points-history` | 积分流水（管理员可查全部，员工仅本人） |
| GET | `/api/stats` | 首页统计 |
| POST | `/api/dev/reset` | 重置为种子数据（开发用，管理员） |

### 业务规则（集中在 `server/src/store.js`）

- **下单**为事务性操作：校验 → 扣库存 → 扣积分 → 记流水 → 建订单，任一步失败整体不落库。
- **取消订单**仅限 `pending`，取消后返还积分并回补库存；重复取消被拒绝（幂等保护）。
- **删除分类**前校验其下无商品。
- **分类改名**会同步商品上的冗余 `categoryName`。

### 错误码

| 状态码 | 场景 |
| :--- | :--- |
| 400 | 参数非法（如非法订单状态） |
| 401 | 未登录 / 登录过期 / 账号或密码错误 |
| 403 | 无权访问（员工访问管理接口、访问他人数据） |
| 404 | 资源不存在 / 接口不存在 |
| 409 | 业务冲突（已下架、积分不足、重复取消、分类下仍有商品） |
| 500 | 服务器内部错误 |

---

## 五、数据持久化

| 端 | 机制 | 说明 |
| :--- | :--- | :--- |
| 后端 | 内存仓库 + 落盘 `server/data/db.json` | **唯一数据源**，重启保留 |
| PC 端 | 无本地持久化 | 全部经 API 读写 |
| 移动端 | 经 API 读写 | `mock` 模式下才走 `uni.setStorageSync` |

> `server/data/db.json` 已加入 `.gitignore`，可由 `server/src/seed.js` 重建。

---

## 六、标准化状态

### 已完成

- [x] **版本控制边界**：`node_modules` / `dist` / IDE 残留移出跟踪
      （本项目跟踪文件 `31573` → `62`）
- [x] **仓库根 `.gitignore`**：覆盖依赖、构建产物、IDE、Python、日志、系统文件、后端运行时数据
- [x] **构建链路修复**：移动端 esbuild 版本错配（此前**完全无法构建**）
- [x] **类型检查**：移动端 `npm run typecheck`（此前 `vue-tsc` 不可用）
- [x] **缺陷修复**：商品描述输入框缺失、订单操作列 `v-if/v-else` 错配
- [x] **代码清理**：调试 `console.log`、死代码 `readonlyAppState`
- [x] **命名规范**：`pc-yx` → `employee-exchange-pc`；`mobile-yx` → `employee-exchange-mobile`
- [x] **共享契约**（阶段 4-1A）：`shared/` 统一领域模型，消除 3 份重复的规格键映射表
- [x] **后端服务**（阶段 4-2）：REST API + 业务规则集中 + 数据落盘
- [x] **管理链路打通**（阶段 4-3）：后台改 → 前台变，已实测闭环
- [x] **页面全量迁移**：两端所有页面接入 API，不再直接依赖 `mockData`
      （前台 7 个页面 + 后台 3 个页面）
- [x] **回归测试**：20 项断言全通过（读取 / 读写 / 跨端链路 / 业务守卫 / 重置）
- [x] **鉴权与权限**（阶段 4-4）：JWT 登录 + 服务端强制角色权限 + 数据隔离
      （权限边界 47 项 + 端到端 17 项断言全通过，决策见 ADR-0001）

### 待办

- [ ] 移动端分页、下拉刷新、图片懒加载
- [ ] 数据库替换内存仓库（`server/src/store.js` 的 `load`/`persist` 为替换点）
- [ ] 移除或归档 `mockData`（当前作为离线演示降级路径保留）
- [ ] 微信小程序端 `appid` 待填写（见 `Mobile_Project/src/manifest.json`）

---

## 六、可恢复方案

标准化改动前的完整还原点（**改动前状态**）：

| 项目 | 位置 |
| :--- | :--- |
| **还原点 tag** | `exchange-std-before-20261013-0930` |
| **完整备份** | `E:\student\project_backup_20261013-0930\` |
| ├ `repo-full.bundle` | git bundle（含全部历史，已验证 `okay`） |
| ├ `git-index.bak` | 改动前的 git 索引 |
| └ `tracked-files-before.txt` | 改动前的 31573 个跟踪文件清单 |

### 恢复方式

```bash
# 方式一：从 tag 恢复工作区
git checkout exchange-std-before-20261013-0930 -- "Employee exchange system"

# 方式二：从 bundle 完整恢复（灾难恢复）
git clone E:/student/project_backup_20261013-0930/repo-full.bundle restored-repo
```

> **注意**：本仓库根位于 `E:\student\project`（monorepo），
> 本项目是其下的 `Employee exchange system/` 子目录。
> 执行 git 操作时请**始终使用路径限定**，避免影响仓库内其他项目：
> `git -C "E:\student\project" <cmd> -- "Employee exchange system"`

---

## 七、相关文档

- [PC 端原型设计文档](PC_project/docs/原型设计文档.md)
- [移动端原型设计文档](Mobile_Project/docs/原型设计文档.md)
- 移动端测试用例：`Mobile_Project/docs/福利管理系统测试用例.xlsx`（30 条，fl-001 ~ fl-030）
