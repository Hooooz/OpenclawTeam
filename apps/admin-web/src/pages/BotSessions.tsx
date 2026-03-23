import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildBotSessionsData } from "@/lib/bot-operations";
import { collectMockNotes } from "@/lib/control-center-api";
import { useBotPageData } from "@/lib/use-bot-page-data";

export default function BotSessions() {
  const { id } = useParams<{ id: string }>();
  const agentId = id || "a1";
  const [search, setSearch] = useState("");
  const { agent, runs, settings, mockNotes } = useBotPageData(agentId);
  const sessions = buildBotSessionsData(agent, runs);
  const filtered = useMemo(
    () =>
      sessions.filter(
        (session) =>
          !search || session.topic.includes(search) || session.sessionId.includes(search) || session.platform.includes(search),
      ),
    [search, sessions],
  );
  const pageMockNotes = [
    ...mockNotes,
    ...collectMockNotes(sessions),
    ...collectMockNotes(settings.services),
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div>
          <Link
            to={`/agents/${agent.id}/bot`}
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回运行面
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
              <span className="text-sm font-medium">{agent.avatar}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">{agent.name} · Session 管理</h1>
                <DataSourceBadge item={agent} />
              </div>
              <p className="text-xs text-muted-foreground">
                {agent.position} · 共 {sessions.length} 个会话
              </p>
            </div>
          </div>
        </div>

        <MockDataNotice notes={[...new Set(pageMockNotes)]} />

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索会话主题、平台或 ID…"
            className="h-9 pl-9 text-sm"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="overflow-hidden rounded-md border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Session ID</TableHead>
                <TableHead className="text-xs">类型</TableHead>
                <TableHead className="text-xs">平台</TableHead>
                <TableHead className="text-xs">对话主题</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-right text-xs">消息数</TableHead>
                <TableHead className="text-right text-xs">Token</TableHead>
                <TableHead className="text-xs">最近活跃</TableHead>
                <TableHead className="text-xs">记忆更新</TableHead>
                <TableHead className="text-xs">风险</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{session.sessionId}</TableCell>
                  <TableCell>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{session.type}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{session.platform}</span>
                      <DataSourceBadge item={session} className="px-1.5 py-0 text-[9px]" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm font-medium">{session.topic}</TableCell>
                  <TableCell>
                    <StatusBadge
                      variant={session.status === "active" ? "running" : "success"}
                      label={session.status === "active" ? "活跃" : "完成"}
                    />
                  </TableCell>
                  <TableCell className="text-right text-sm tabular-nums">{session.messageCount}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                    {session.tokenUsage.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{session.lastActive}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-xs text-muted-foreground">{session.memorySummary}</TableCell>
                  <TableCell>
                    {session.risk ? (
                      <StatusBadge variant="high" label="风险" />
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
