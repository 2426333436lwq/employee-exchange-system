# 运维手册

面向部署与维护人员。开发环境搭建见 [README](../README.md)。

---

## 一、日常命令速查

```bash
cd server

# 迁移
npm run migrate:status    # 查看各迁移执行状态（不执行变更）
npm run migrate           # 执行所有待执行迁移

# 备份
npm run backup            # 立即备份
npm run backup:list       # 列出已有备份
npm run backup:verify -- <文件名>          # 校验备份完整性
npm run backup:restore -- <文件名> --yes   # 从备份恢复（危险）

# 服务
npm run dev               # 开发（热重载）
npm start                 # 生产
```

---

## 二、数据库迁移

### 为什么需要它

直接手改线上表结构会导致三个问题：**不知道线上是哪个版本**、
**多人执行不一致**、**出错无法回滚**。迁移机制解决这三点。

### 新增一个迁移

1. 在 `server/migrations/` 新建文件，命名规范 **`M###__描述.sql`**：

```
M003__add_product_tags.sql
```

编号必须比现有最大编号大（决定执行顺序）。

2. 写入 SQL。**优先使用幂等写法**，保证意外重跑不报错：

```sql
-- 加列：用 IF NOT EXISTS（MySQL 8.0.29+ 支持）
ALTER TABLE products ADD COLUMN IF NOT EXISTS tags JSON NULL;

-- 加索引：先判断存在性，或接受重复执行报错并手工确认
CREATE INDEX idx_products_brand ON products (brand);
```

3. 本地验证：

```bash
npm run migrate:status    # 应显示新迁移为「待执行」
npm run migrate           # 执行
npm run migrate           # 再执行一次，应显示「没有待执行的迁移」（验证幂等）
```

4. 提交 `migrations/` 目录（**SQL 文件必须入库**）。

### 铁律

| 规则 | 原因 |
|---|---|
| **已执行的迁移不可再修改** | 校验和不匹配会直接报错中止。要修正请**新建**一个迁移 |
| 迁移前先备份 | `npm run backup` |
| 生产迁移使用具备 DDL 权限的账号 | 应用账号 `exchange_app` 只有 DML 权限，故意如此 |
| 大表变更（加索引/改列）避开业务高峰 | MySQL 8 虽支持在线 DDL，但仍会消耗 IO |

### 迁移记录表

```sql
SELECT * FROM schema_migrations ORDER BY version;
```

记录每次迁移的版本、文件名、**校验和**、耗时、执行时间。

---

## 三、备份与恢复

### 备份策略

| 项 | 默认值 | 配置项 |
|---|---|---|
| 备份目录 | `<项目>/backups/` | `BACKUP_DIR` |
| 保留天数 | 14 天 | `BACKUP_KEEP_DAYS` |

每次备份生成两个文件：
- `employee_exchange_<时间戳>.sql` —— 数据本体
- `employee_exchange_<时间戳>.sql.sha256` —— 校验和（验证文件未损坏）

> ⚠️ `backups/` 已在 `.gitignore` 中。
> 备份含**完整数据与口令哈希**，严禁提交到版本库。

### 定时备份（Windows 任务计划程序）

创建基本任务，操作填：

```
程序:   node
参数:   scripts/backup.js
起始于: E:\student\project\Employee exchange system\server
```

触发器设为每天一次（建议业务低峰，如凌晨 3 点）。

> Linux 环境用 crontab：
> `0 3 * * * cd /path/to/server && node scripts/backup.js >> /var/log/exchange-backup.log 2>&1`

### 恢复流程

```bash
# 1. 先校验备份文件是否完好
npm run backup:verify -- employee_exchange_20261013_161747.sql

# 2. 恢复（脚本会自动先备份当前状态，作为后悔药）
npm run backup:restore -- employee_exchange_20261013_161747.sql --yes
```

**恢复脚本会**：
1. 自动把**当前数据库**备份为 `*_before_restore_*.sql`（恢复失败可回滚）
2. 再从指定备份导入

### 恢复演练（必须定期做）

> **没验证过能恢复的备份等于没有备份。**

建议每季度演练一次：

```bash
# 1. 记录基线
mysql -u root -p -e "SELECT COUNT(*) FROM employee_exchange.products;"

# 2. 模拟事故（删一条可安全删除的数据）
mysql -u root -p -e "DELETE FROM employee_exchange.products WHERE id=5;"

# 3. 恢复
npm run backup:restore -- <最近备份> --yes

# 4. 核对数据与索引/外键是否完整恢复
mysql -u root -p -e "
  SELECT COUNT(*) AS products FROM employee_exchange.products;
  SELECT COUNT(*) AS fks FROM information_schema.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA='employee_exchange' AND REFERENCED_TABLE_NAME IS NOT NULL;"
```

**已演练记录**：2026-10-13 完成首次演练 —— 删除商品后从备份恢复，
数据（10 商品）、外键（4 个）、索引（26 个）全部完整恢复。

---

## 四、数据库账号

| 账号 | 权限 | 用途 |
|---|---|---|
| `exchange_app@localhost` | 该库 `SELECT/INSERT/UPDATE/DELETE` | **应用运行**（故意无 DDL 权限） |
| 迁移/备份账号 | DDL + 全量读 | 由 `MIGRATE_DB_USER` / `BACKUP_DB_USER` 配置 |

**为什么分开**：应用若被注入，攻击者也只能改数据，**无法删表或改结构**。
已实测：应用账号执行 `DROP TABLE` 被数据库拒绝（`ERROR 1142`）。

生产环境建议新建专用的 `exchange_migrate` 账号仅授予该库 DDL 权限，
而非直接用 root。创建方式：

```sql
CREATE USER 'exchange_migrate'@'localhost' IDENTIFIED BY '<强密码>';
GRANT ALL PRIVILEGES ON employee_exchange.* TO 'exchange_migrate'@'localhost';
FLUSH PRIVILEGES;
```

---

## 五、故障排查

| 现象 | 排查方向 |
|---|---|
| 启动即退出，日志提示缺少配置 | 检查 `.env` 中 `JWT_SECRET`、`CORS_ORIGINS`（生产必填） |
| `/api/ready` 返回 503 | 数据库不可达：检查 MySQL 服务、账号密码、网络 |
| 登录返回 429 | 触发登录限流（默认 15 分钟 10 次），等待或调整 `LOGIN_RATE_MAX` |
| 请求被 CORS 拒绝 | 前端来源不在 `CORS_ORIGINS` 白名单中 |
| 迁移报「校验和不匹配」 | 有人修改了**已执行**的迁移文件。新建迁移来修正，勿改历史 |
| 删除商品报 409 | 该商品还有未完成订单（`pending`/`shipped`），属保护性设计 |
| 删除分类报 409 | 该分类下还有商品 |

### 日志

服务输出 **JSON 结构化日志**（生产）。关键字段：

- `req.id` —— 请求唯一 ID，可跨日志串联同一次请求
- `level` —— 30=info, 40=warn, 50=error
- 敏感字段（口令、token、cookie）自动输出为 `[REDACTED]`

采集建议：重定向到文件后由日志平台（ELK/Loki）收集。
