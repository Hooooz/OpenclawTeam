import { ArrowLeft, AlertTriangle, Brain, Coins, MessageSquare, Server } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildBotOverviewData } from "@/lib/bot-operations";
import { collectMockNotes } from "@/lib/control-center-api";
import { useBotPageData } from "@/lib/use-bot-page-data";

const quickLinkIcons = {
  "模型与平台": Server,
  "Session 管理": MessageSquare,
  "消息统计": Coins,
  "告警与健康": AlertTriangle,
} as const;

export default function BotOverview() {
  const { id } = useParams<{ id: string }>();
  const agentId = id || "a1";
  const { agent, runs, settings, mockNotes } = useBotPageData(agentId);
  const overview = buildBotOverviewData(agent, runs, settings);
  const pageMockNotes = [
    ...mockNotes,
    ...collectMockNotes(overview.metrics),
    ...collectMockNotes(overview.recentRuns),
    ...collectMockNotes(overview.recentMemory),
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div>
          <Link
            to={`/agents/${agent.id}`}
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回员工详情
          </Link>
          <div className="mb-4 flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
              <span className="text-lg font-medium text-foreground">{agent.avatar}</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-foreground">{agent.name}</h1>
                <StatusBadge variant={agent.status} />
                <DataSourceBadge item={agent} />
              </div>
              <p className="text-sm text-muted-foreground">
                {agent.position} · {agent.department}
              </p>
              <p className="text-xs italic text-muted-foreground/70">"{agent.motto}"</p>
            </div>
            <div className="ml-auto flex flex-wrap gap-2">
              {agent.specialties.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <MockDataNotice notes={[...new Set(pageMockNotes)]} />

        <div className="grid grid-cols-6 gap-3">
          {overview.metrics.map((metric) => (
            <MetricCard key={metric.label} {...metric} />
          ))}
        </div>

        <div className="grid grid-cols-4 gap-3">
          {overview.quickLinks.map((card) => {
            const Icon = quickLinkIcons[card.label as keyof typeof quickLinkIcons];

            return (
              <Link
                key={card.label}
                to={card.to}
                className="group rounded-md border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <Icon className="mb-2 h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" />
                <p className="text-sm font-medium text-foreground">{card.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{card.desc}</p>
              </Link>
            );
          })}
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium">最近 5 次工作</h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">任务</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">时间</TableHead>
                <TableHead className="text-xs text-right">耗时</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {overview.recentRuns.map((run) => (
                <TableRow key={run.id}>
                  <TableCell className="text-sm">
                    <div className="flex items-center gap-2">
                      <span>{run.taskName}</span>
                      <DataSourceBadge item={run} className="px-1.5 py-0 text-[9px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge variant={run.status} />
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{run.time}</TableCell>
                  <TableCell className="text-right text-xs tabular-nums text-muted-foreground">{run.duration}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <Brain className="h-4 w-4" />
            最近记忆更新
          </h3>
          <div className="space-y-2">
            {overview.recentMemory.map((memory) => (
              <div key={`${memory.time}-${memory.summary}`} className="flex items-center gap-3 text-sm">
                <span className="w-32 text-xs tabular-nums text-muted-foreground">{memory.time}</span>
                <span className="text-muted-foreground">{memory.summary}</span>
                <DataSourceBadge item={memory} className="px-1.5 py-0 text-[9px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
