# Task Plan

## Goal

Evolve the documented internal OpenClaw digital-employee control plane into a working MVP that can be deployed to the Windows server, with admin CRUD, runtime triggers, and durable records.

## Deliverables

1. Updated spec and planning documents aligned to the internal control-plane scope
2. Runnable monorepo with admin web, control API, and shared types
3. Windows deployment scripts and verified server rollout
4. Incremental runtime features with verification evidence

## Phases

| Phase | Status | Notes |
|---|---|---|
| Documentation package | complete | Three main documents and control outline aligned to internal product direction |
| Environment baseline | complete | GitHub repo, server access, and Windows deployment path established |
| MVP scaffold | complete | Admin web, control API, shared package, and deploy scripts are in repo and deployed |
| Object management | complete | Agent create, Skill create, and Agent-Skill binding are working |
| Runtime execution loop | complete | Manual run trigger, durable run records, and UI execution entry are verified |
| Deployment verification | complete | Redeployed latest slice and verified the runtime flow on `192.168.31.189` |
| Deployment hardening | in_progress | Keep stabilizing Windows deployment automation and remove GitHub-sync friction |

## Key Decisions

- Product is an internal digital-employee management backend for the team itself, not an external SaaS.
- The first production baseline targets the existing Windows 11 host and accepts native Node deployment.
- Docker Compose remains preferred long term, but Docker registry auth issues are currently non-blocking.
- User prefers non-blocking questions to be collected instead of interrupting implementation flow.

## Risks / Open Items

| Item | Status | Action |
|---|---|---|
| Docker Desktop image-pull credentials on the server | open | Keep Node fallback as active path; return with concrete remediation steps later |
| GitHub auth mode for server-side pull | open | Collect concrete options when deployment automation matures |
| Local HTTPS push to GitHub is hanging in this session | open | Continue local commit discipline and direct server sync; come back with concrete auth remediation |

## Files In Scope

- `大纲.md`
- `产品背景与框架.md`
- `技术方案与开发清单.md`
- `阶段性总结与测试用例草案.md`
- `待确认问题.md`
- `task_plan.md`
- `findings.md`
- `progress.md`
- `apps/admin-web/src/App.tsx`
- `apps/admin-web/src/api.ts`
- `apps/control-api/src/index.ts`
- `apps/control-api/src/store.ts`
- `apps/control-api/test/store.test.ts`
- `packages/shared/src/index.ts`
- `infra/scripts/windows/deploy-node.ps1`
- `infra/scripts/windows/start-control-api.ps1`
- `infra/scripts/windows/start-admin-web.ps1`

## Completion Notes

- The documentation phase is closed; this file now tracks engineering delivery.
- Current implementation baseline is a monorepo deployed to the Windows server with Node-process fallback.
- The latest completed milestone converted `Runs` from static display into an executable, durable control-plane flow.
- The current follow-up focus is reducing operational friction around Windows deployment persistence and GitHub synchronization.
