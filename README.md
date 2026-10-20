# Points Exchange System · 积分兑换系统（早期静态版）

企业员工积分兑换系统的**早期纯静态实现**（HTML / CSS / 原生 JS，无构建步骤、无后端）。

> 这是本项目的历史版本。完整的前后端系统见同级目录
> [`employee-exchange-system`](../employee-exchange-system/)。

## 运行

直接用浏览器打开 `index.html`，或用任意静态服务器：

```bash
python -m http.server 8080
```

## 目录结构

```
points-exchange-system/
├── index.html      # 登录入口
├── admin/          # 管理员端页面
├── employee/       # 员工端页面
├── css/            # 样式
├── js/             # 脚本与数据层
└── Enterprise employee points redemption sy.txt   # 需求说明
```

## 技术栈

- 原生 HTML / CSS / JavaScript
- 数据持久化：浏览器 LocalStorage

## 历史

本仓库从原 `project` monorepo 拆分而来，保留了完整提交历史（2 个提交）。
