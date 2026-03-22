# OpenClawTeam

OpenClawTeam 是面向内部团队的数字员工管理后台项目。

当前仓库包含两部分内容：

1. 产品、技术和测试文档
2. 后台 MVP 工程骨架

## 目录概览

```text
apps/
  admin-web/        管理后台前端
  control-api/      控制面 API
packages/
  shared/           共享类型与种子数据
infra/
  compose/          Docker Compose 配置
  scripts/          部署脚本
docs/               后续可补充工程文档
```

## 本地开发

```bash
npm install
npm run dev:api
npm run dev:web
```

默认端口：

- Admin Web: `http://localhost:3000`
- Control API: `http://localhost:3001`

## 构建

```bash
npm run build
```

## Windows 服务器部署

目标服务器：

- `Administrator@192.168.31.189`

Git 已可用，Docker 与 Docker Compose 已可用。

后续部署基线：

```powershell
powershell -ExecutionPolicy Bypass -File .\infra\scripts\windows\deploy.ps1
```

## 当前核心文档

- `大纲.md`
- `产品背景与框架.md`
- `技术方案与开发清单.md`
- `阶段性总结与测试用例草案.md`
- `主Agent-子Agent协作产品开发模式.md`
