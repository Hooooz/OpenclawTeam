import { ArrowLeft, Play, Server } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buildBotModelData } from "@/lib/bot-operations";
import { collectMockNotes } from "@/lib/control-center-api";
import { useBotPageData } from "@/lib/use-bot-page-data";

export default function BotModel() {
  const { id } = useParams<{ id: string }>();
  const agentId = id || "a1";
  const { agent, runs, settings, mockNotes } = useBotPageData(agentId);
  const modelData = buildBotModelData(agent, runs, settings);
  const pageMockNotes = [
    ...mockNotes,
    ...collectMockNotes(modelData.models),
    ...collectMockNotes(modelData.platforms),
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
                <h1 className="text-lg font-semibold text-foreground">{agent.name} · 模型与平台</h1>
                <DataSourceBadge item={agent} />
              </div>
              <p className="text-xs text-muted-foreground">{agent.position}</p>
            </div>
          </div>
        </div>

        <MockDataNotice notes={[...new Set(pageMockNotes)]} />

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <Server className="h-4 w-4" />
            模型配置
          </h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">模型</TableHead>
                <TableHead className="text-xs">Provider</TableHead>
                <TableHead className="text-xs">角色</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">延迟</TableHead>
                <TableHead className="text-xs">最近测试</TableHead>
                <TableHead className="text-center text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelData.models.map((model) => (
                <TableRow key={model.id}>
                  <TableCell className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">{model.name}</span>
                      <DataSourceBadge item={model} className="px-1.5 py-0 text-[9px]" />
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{model.provider}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{model.role}</TableCell>
                  <TableCell>
                    <StatusBadge variant={model.status} />
                  </TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{model.latency}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{model.lastTest}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" disabled>
                      <Play className="h-3 w-3" />
                      测试
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-medium">平台绑定</h3>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">平台</TableHead>
                <TableHead className="text-xs">状态</TableHead>
                <TableHead className="text-xs">活跃会话</TableHead>
                <TableHead className="text-xs">最近消息</TableHead>
                <TableHead className="text-center text-xs">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {modelData.platforms.map((platform) => (
                <TableRow key={platform.id}>
                  <TableCell className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span>{platform.name}</span>
                      <DataSourceBadge item={platform} className="px-1.5 py-0 text-[9px]" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      variant={platform.status === "connected" ? "success" : "error"}
                      label={platform.status === "connected" ? "已连接" : "断开"}
                    />
                  </TableCell>
                  <TableCell className="text-sm tabular-nums">{platform.sessions}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{platform.lastMsg}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" disabled>
                      <Play className="h-3 w-3" />
                      测试连通
                    </Button>
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
