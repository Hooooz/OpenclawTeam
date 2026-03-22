import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import { NavLink, Route, Routes } from "react-router-dom";
import { fetchDashboardSnapshot } from "./api";
const navItems = [
    { to: "/", label: "控制台" },
    { to: "/agents", label: "数字员工" },
    { to: "/skills", label: "Skills" },
    { to: "/runs", label: "运行记录" },
    { to: "/deploy", label: "部署基线" }
];
export function App() {
    const [state, setState] = useState({ status: "loading" });
    useEffect(() => {
        let cancelled = false;
        fetchDashboardSnapshot()
            .then((data) => {
            if (!cancelled) {
                setState({ status: "ready", data });
            }
        })
            .catch((error) => {
            if (!cancelled) {
                setState({ status: "error", message: error.message });
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);
    return (_jsxs("div", { className: "shell", children: [_jsxs("aside", { className: "sidebar", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "OpenClawTeam" }), _jsx("h1", { children: "\u6570\u5B57\u5458\u5DE5\u7BA1\u7406\u540E\u53F0" }), _jsx("p", { className: "muted", children: "\u5185\u90E8\u63A7\u5236\u9762\uFF0C\u7EDF\u4E00\u7BA1\u7406 Agent\u3001Skills\u3001\u8C03\u5EA6\u548C\u6267\u884C\u5BA1\u8BA1\u3002" })] }), _jsx("nav", { className: "nav", children: navItems.map((item) => (_jsx(NavLink, { className: ({ isActive }) => isActive ? "nav-link nav-link-active" : "nav-link", to: item.to, children: item.label }, item.to))) }), _jsxs("div", { className: "sidebar-card", children: [_jsx("p", { className: "sidebar-label", children: "\u90E8\u7F72\u76EE\u6807" }), _jsx("strong", { children: "192.168.31.189" }), _jsx("p", { className: "muted", children: "Windows 11 + Docker Compose" })] })] }), _jsxs("main", { className: "main", children: [state.status === "loading" && (_jsx("div", { className: "panel", children: _jsx("p", { className: "muted", children: "\u6B63\u5728\u52A0\u8F7D\u63A7\u5236\u9762\u5FEB\u7167..." }) })), state.status === "error" && (_jsxs("div", { className: "panel panel-danger", children: [_jsx("h2", { children: "\u63A7\u5236\u9762 API \u4E0D\u53EF\u7528" }), _jsx("p", { children: state.message })] })), state.status === "ready" && (_jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(DashboardPage, { snapshot: state.data }) }), _jsx(Route, { path: "/agents", element: _jsx(AgentsPage, { agents: state.data.agents }) }), _jsx(Route, { path: "/skills", element: _jsx(SkillsPage, { skills: state.data.skills }) }), _jsx(Route, { path: "/runs", element: _jsx(RunsPage, { runs: state.data.runs }) }), _jsx(Route, { path: "/deploy", element: _jsx(DeployPage, { snapshot: state.data }) })] }))] })] }));
}
function DashboardPage({ snapshot }) {
    return (_jsxs("div", { className: "page-grid", children: [_jsxs("section", { className: "hero", children: [_jsx("p", { className: "eyebrow", children: "Control Plane" }), _jsx("h2", { children: "\u628A OpenClaw \u6536\u655B\u6210\u4E00\u4E2A\u80FD\u8FD0\u8425\u7684\u5185\u90E8\u7CFB\u7EDF" }), _jsx("p", { className: "muted", children: "\u5F53\u524D\u9AA8\u67B6\u805A\u7126 5 \u6761\u7EBF\uFF1A\u5BF9\u8C61\u7BA1\u7406\u3001\u4EFB\u52A1\u6267\u884C\u3001\u8C03\u5EA6\u3001\u65E5\u5FD7\u5BA1\u8BA1\u3001\u670D\u52A1\u5668\u90E8\u7F72\u3002" })] }), _jsx("section", { className: "stat-grid", children: snapshot.stats.map((stat) => (_jsxs("article", { className: "stat-card", children: [_jsx("p", { className: "stat-label", children: stat.label }), _jsx("strong", { className: "stat-value", children: stat.value }), _jsx("p", { className: "muted", children: stat.detail })] }, stat.label))) }), _jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-header", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Focus" }), _jsx("h3", { children: "\u5F53\u524D\u5B9E\u65BD\u91CD\u70B9" })] }) }), _jsx("ul", { className: "focus-list", children: snapshot.focus.map((item) => (_jsxs("li", { children: [_jsx("strong", { children: item.title }), _jsx("span", { children: item.detail })] }, item.title))) })] })] }));
}
function AgentsPage({ agents }) {
    return (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Registry" }), _jsx("h3", { children: "\u6570\u5B57\u5458\u5DE5" })] }), _jsxs("span", { className: "badge", children: [agents.length, " \u4E2A\u5BF9\u8C61"] })] }), _jsxs("div", { className: "table", children: [_jsxs("div", { className: "table-head", children: [_jsx("span", { children: "\u540D\u79F0" }), _jsx("span", { children: "\u72B6\u6001" }), _jsx("span", { children: "\u6A21\u578B" }), _jsx("span", { children: "Skills" }), _jsx("span", { children: "\u8BF4\u660E" })] }), agents.map((agent) => (_jsxs("div", { className: "table-row", children: [_jsx("span", { children: agent.name }), _jsx("span", { children: agent.status }), _jsx("span", { children: agent.model }), _jsx("span", { children: agent.skillCount }), _jsx("span", { children: agent.summary })] }, agent.id)))] })] }));
}
function SkillsPage({ skills }) {
    return (_jsxs("section", { className: "panel", children: [_jsxs("div", { className: "panel-header", children: [_jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Capability" }), _jsx("h3", { children: "Skills" })] }), _jsxs("span", { className: "badge", children: [skills.length, " \u4E2A\u80FD\u529B"] })] }), _jsx("div", { className: "card-grid", children: skills.map((skill) => (_jsxs("article", { className: "mini-card", children: [_jsxs("div", { className: "mini-card-top", children: [_jsx("strong", { children: skill.name }), _jsx("span", { className: "badge badge-outline", children: skill.category })] }), _jsx("p", { className: "muted", children: skill.description }), _jsxs("div", { className: "mini-card-meta", children: [_jsxs("span", { children: ["\u7248\u672C ", skill.version] }), _jsx("span", { children: skill.status })] })] }, skill.id))) })] }));
}
function RunsPage({ runs }) {
    return (_jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-header", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Runtime" }), _jsx("h3", { children: "\u8FD0\u884C\u8BB0\u5F55" })] }) }), _jsx("div", { className: "timeline", children: runs.map((run) => (_jsxs("article", { className: "timeline-item", children: [_jsx("div", { className: "timeline-mark" }), _jsxs("div", { className: "timeline-content", children: [_jsxs("div", { className: "timeline-header", children: [_jsx("strong", { children: run.agentName }), _jsx("span", { className: `badge ${run.status === "failed" ? "badge-danger" : ""}`, children: run.status })] }), _jsx("p", { children: run.summary }), _jsxs("div", { className: "mini-card-meta", children: [_jsx("span", { children: run.triggerType }), _jsx("span", { children: run.startedAt }), _jsx("span", { children: run.traceId })] })] })] }, run.id))) })] }));
}
function DeployPage({ snapshot }) {
    return (_jsxs("section", { className: "panel", children: [_jsx("div", { className: "panel-header", children: _jsxs("div", { children: [_jsx("p", { className: "eyebrow", children: "Deploy" }), _jsx("h3", { children: "\u90E8\u7F72\u57FA\u7EBF" })] }) }), _jsxs("div", { className: "deploy-grid", children: [_jsxs("article", { className: "mini-card", children: [_jsx("strong", { children: "\u76EE\u6807\u4E3B\u673A" }), _jsx("p", { className: "muted", children: snapshot.server.host })] }), _jsxs("article", { className: "mini-card", children: [_jsx("strong", { children: "\u64CD\u4F5C\u7CFB\u7EDF" }), _jsx("p", { className: "muted", children: snapshot.server.os })] }), _jsxs("article", { className: "mini-card", children: [_jsx("strong", { children: "\u5BB9\u5668\u8FD0\u884C\u65F6" }), _jsx("p", { className: "muted", children: snapshot.server.containerRuntime })] }), _jsxs("article", { className: "mini-card", children: [_jsx("strong", { children: "GitHub \u4ED3\u5E93" }), _jsx("p", { className: "muted", children: snapshot.server.repository })] })] })] }));
}
