export const seedAgents = [
    {
        id: "agent-ops-daily",
        name: "运营日报助手",
        status: "active",
        model: "gpt-5.4-mini",
        skillCount: 4,
        summary: "定时汇总内部素材并生成日报。"
    },
    {
        id: "agent-skill-audit",
        name: "Skill 巡检助手",
        status: "active",
        model: "gpt-5.4",
        skillCount: 3,
        summary: "检查技能调用状态和最近失败记录。"
    },
    {
        id: "agent-doc-backfill",
        name: "文档补全助手",
        status: "paused",
        model: "gpt-5.4-mini",
        skillCount: 2,
        summary: "辅助维护项目文档和待办清单。"
    }
];
export const seedSkills = [
    {
        id: "skill-docx",
        name: "docx",
        category: "document",
        version: "1.0.0",
        status: "active",
        description: "处理专业文档的创建、编辑和结构化输出。"
    },
    {
        id: "skill-xlsx",
        name: "xlsx",
        category: "spreadsheet",
        version: "1.0.0",
        status: "active",
        description: "用于表格分析、结构化数据写回和批量更新。"
    },
    {
        id: "skill-browser",
        name: "agent-browser",
        category: "browser",
        version: "1.0.0",
        status: "active",
        description: "用于网页登录、测试和流程自动化。"
    },
    {
        id: "skill-research",
        name: "research",
        category: "analysis",
        version: "1.0.0",
        status: "draft",
        description: "多来源检索和带引用研究输出。"
    }
];
export const seedRuns = [
    {
        id: "run-20260322-001",
        agentName: "运营日报助手",
        triggerType: "schedule",
        status: "success",
        summary: "日报生成完成，已写入内部工作区。",
        startedAt: "2026-03-22 10:00",
        traceId: "trace-ops-1000"
    },
    {
        id: "run-20260322-002",
        agentName: "Skill 巡检助手",
        triggerType: "manual",
        status: "running",
        summary: "正在检查最近 24 小时失败调用。",
        startedAt: "2026-03-22 14:12",
        traceId: "trace-skill-1412"
    },
    {
        id: "run-20260322-003",
        agentName: "文档补全助手",
        triggerType: "manual",
        status: "failed",
        summary: "知识源未绑定，任务中止。",
        startedAt: "2026-03-22 13:48",
        traceId: "trace-doc-1348"
    }
];
export const seedServerInfo = {
    host: "192.168.31.189",
    os: "Windows 11 Pro",
    containerRuntime: "Docker 29.2.0 / Compose v5.0.2",
    repository: "https://github.com/Hooooz/OpenclawTeam.git"
};
export function createDashboardSnapshot() {
    return {
        stats: [
            { label: "数字员工", value: String(seedAgents.length), detail: "当前已登记的可管理对象" },
            { label: "Skills", value: String(seedSkills.length), detail: "已纳入控制面的能力单元" },
            { label: "近 24h Runs", value: String(seedRuns.length), detail: "含成功、失败与运行中任务" },
            { label: "部署主机", value: "1", detail: "Windows 单机部署基线已确认" }
        ],
        focus: [
            {
                title: "后台对象管理",
                detail: "先把 Agent、Skill、Run Record 三个对象做成可见可管。"
            },
            {
                title: "执行闭环",
                detail: "从手动运行到错误回执先跑通，再扩调度和知识。"
            },
            {
                title: "Windows 部署基线",
                detail: "围绕 Docker Compose 形成首个稳定部署包。"
            }
        ],
        agents: seedAgents,
        skills: seedSkills,
        runs: seedRuns,
        server: seedServerInfo
    };
}
