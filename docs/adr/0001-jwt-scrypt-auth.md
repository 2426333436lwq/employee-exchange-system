# ADR-0001: 采用 JWT + scrypt 的自实现鉴权（零新增依赖）

- 状态：已接受
- 日期：2026-10-13

## 背景

系统从纯前端演示演进为前后台主从架构（PC_project 后台 + Mobile_Project 前台 + server 后端）。此前 23 条 API 全部无鉴权，任何人可直接删除商品、查看全部订单。

需要引入认证与权限控制。约束条件：

1. 三端分离部署（PC 8082 / 移动端 5173 / 后端 3000），跨域场景；
2. 本机 npm 曾出现缓存目录权限故障（E:\nodejs\node_cache 不可写），新增依赖有实际安装风险；
3. 项目处于学生/内部系统阶段，预期负载低，无服务端主动踢人需求。

## 决策

1. **认证方式：JWT（HS256），经 Authorization: Bearer 头传输**。替代方案是 Session + Cookie，后者在跨域部署下需额外配置 CORS 凭证与 CSRF 防护，复杂度更高。
2. **JWT 为自实现（server/src/auth.js，约 60 行）**，仅实现签发与校验所需的最小逻辑。替代方案是 jsonwebtoken 库。
3. **密码哈希：Node 内置 crypto.scrypt**，存储格式 `scrypt$<salt-hex>$<hash-hex>`，校验用 timingSafeEqual 防时序攻击。替代方案是 bcrypt（需新增依赖）。
4. **角色两级：admin / employee**，权限校验全部在服务端中间件强制（requireAuth / requireAdmin / requireSelfOrAdmin），前端路由守卫仅为体验优化。
5. **防越权不信任前端传参**：下单人、订单归属均以登录身份（token 中的 sub）为准，忽略请求体中的 userId。

## 理由

零新增依赖直接规避了已知的 npm 安装风险；scrypt 是密码哈希的现代标准算法，安全性满足内部系统要求；自实现 JWT 在此规模下（一个签发点、一个校验点、单一密钥）出错面小于引入依赖的配置面。

## 后果

**正面**

- 无新依赖，安装/升级面不变；
- 权限逻辑集中在 auth.js 与路由挂载点，易审计；
- 47 项权限边界断言 + 17 项端到端断言全通过。

**负面 / 限制（生产部署前须处理）**

- 自实现 JWT **无密钥轮换、无注销（revoke）**：token 泄露后只能等其过期（默认 7 天，JWT_TTL 可调）；
- 必须设置环境变量 `JWT_SECRET`，否则使用开发默认密钥（启动时会告警）；
- 自实现代码缺少社区审计，若走向公网建议替换为 jsonwebtoken 并加 token 黑名单；
- dev/reset 接口仅由 admin 角色保护，生产环境应移除。

## 验证

- server/src/auth.js：口令校验、token 签发/篡改拒绝（单测脚本实测）；
- 权限边界：伪造 token / 篡改 payload 提权 / 伪造 userId 三类攻击均被拒（47/47）；
- 端到端：员工与管理员双链路联调（17/17）。