import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Brain,
  Calendar,
  MessageSquareText,
  Pause,
  Pencil,
  Play,
  Save,
  Settings,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mockAgentDetail } from "@/data/mock-agents";
import {
  collectMockNotes,
  fetchControlCenterAgentDetail,
  takeMockItems,
  toMockProvenance,
  withMockProvenance,
  type AgentDetail as AgentDetailRecord,
} from "@/lib/control-center-api";

type DrawerSection = "skills" | "knowledge" | "schedules" | "runs" | "audit";

const drawerMeta: Record<
  DrawerSection,
  {
    title: string;
    description: string;
    icon: typeof Sparkles;
  }
> = {
  skills: {
    title: "Skill 绑定",
    description: "查看当前数字员工绑定的技能清单，并保留后续配置入口。",
    icon: Sparkles,
  },
  knowledge: {
    title: "知识 / 记忆",
    description: "查看记忆库与 workspace 知识文件，后续在此处承接同步与配置。",
    icon: Brain,
  },
  schedules: {
    title: "定时任务",
    description: "查看当前数字员工下的定时任务，后续在此处启停、保存。",
    icon: Calendar,
  },
  runs: {
    title: "工作记录",
    description: "查看对话与工作记录摘要，并进入明细记录。",
    icon: MessageSquareText,
  },
  audit: {
    title: "审计变更",
    description: "查看档案、配置和运行面相关的变更记录。",
    icon: ShieldCheck,
  },
};

function buildFallbackAgent(agentId: string): AgentDetailRecord {
  return {
    ...mockAgentDetail,
    id: agentId,
    ...toMockProvenance("数字员工详情接口暂不可用，当前展示演示员工档案。"),
    channels: withMockProvenance(
      takeMockItems(mockAgentDetail.channels),
      "通道情况当前使用演示数据，仅保留 1 条样例",
    ),
    skills: withMockProvenance(takeMockItems(mockAgentDetail.skills), "Skill 绑定当前使用演示数据，仅保留 1 条样例"),
    knowledgeSources: withMockProvenance(
      takeMockItems(mockAgentDetail.knowledgeSources),
      "知识摘要当前使用演示聚合，仅保留 1 条样例",
    ),
    schedules: withMockProvenance(takeMockItems(mockAgentDetail.schedules), "定时任务列表当前使用演示数据，仅保留 1 条样例"),
    recentRuns: withMockProvenance(
      takeMockItems(mockAgentDetail.recentRuns) as Array<{
        id: string;
        taskName: string;
        status: AgentDetailRecord["recentRuns"][number]["status"];
        time: string;
        duration: string;
      }>,
      "工作记录当前使用演示数据，仅保留 1 条样例",
    ),
    auditLog: withMockProvenance(takeMockItems(mockAgentDetail.auditLog), "审计记录当前使用演示数据，仅保留 1 条样例"),
  };
}

function DetailSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof User;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border bg-card p-4 shadow-sm">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function GovernanceSheet({
  agent,
  section,
  open,
  onOpenChange,
}: {
  agent: AgentDetailRecord;
  section: DrawerSection | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const meta = section ? drawerMeta[section] : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        {meta ? (
          <>
            <SheetHeader>
              <SheetTitle>{meta.title}</SheetTitle>
              <SheetDescription>{meta.description}</SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {section === "skills" ? (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">Skill</TableHead>
                        <TableHead className="text-xs">来源</TableHead>
                        <TableHead className="text-xs">状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.skills.map((skill) => (
                        <TableRow key={skill.id}>
                          <TableCell className="text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <span>{skill.name}</span>
                              <DataSourceBadge item={skill} className="px-1.5 py-0 text-[9px]" />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{skill.category}</TableCell>
                          <TableCell>
                            <StatusBadge
                              variant={skill.status === "active" ? "running" : "paused"}
                              label={skill.status === "active" ? "启用" : "停用"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {section === "knowledge" ? (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">名称</TableHead>
                        <TableHead className="text-xs">类型</TableHead>
                        <TableHead className="text-xs">最近同步</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.knowledgeSources.map((knowledge) => (
                        <TableRow key={knowledge.id}>
                          <TableCell className="text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <span>{knowledge.name}</span>
                              <DataSourceBadge item={knowledge} className="px-1.5 py-0 text-[9px]" />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">{knowledge.type}</TableCell>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">
                            {knowledge.lastSync}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {section === "schedules" ? (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">任务</TableHead>
                        <TableHead className="text-xs">Cron</TableHead>
                        <TableHead className="text-xs">下次执行</TableHead>
                        <TableHead className="text-xs">状态</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.schedules.map((schedule) => (
                        <TableRow key={schedule.id}>
                          <TableCell className="text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <span>{schedule.name}</span>
                              <DataSourceBadge item={schedule} className="px-1.5 py-0 text-[9px]" />
                            </div>
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">{schedule.cron}</TableCell>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">
                            {schedule.nextRun}
                          </TableCell>
                          <TableCell>
                            <StatusBadge
                              variant={schedule.enabled ? "running" : "paused"}
                              label={schedule.enabled ? "启用" : "停用"}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {section === "runs" ? (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">工作记录</TableHead>
                        <TableHead className="text-xs">状态</TableHead>
                        <TableHead className="text-xs">时间</TableHead>
                        <TableHead className="text-xs text-right">耗时</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.recentRuns.map((run) => (
                        <TableRow key={run.id}>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-2">
                              <Link to={`/runs/${run.id}`} className="hover:text-primary">
                                {run.taskName}
                              </Link>
                              <DataSourceBadge item={run} className="px-1.5 py-0 text-[9px]" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <StatusBadge variant={run.status} />
                          </TableCell>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">{run.time}</TableCell>
                          <TableCell className="text-right text-xs tabular-nums text-muted-foreground">
                            {run.duration}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              {section === "audit" ? (
                <div className="overflow-hidden rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs">操作人</TableHead>
                        <TableHead className="text-xs">动作</TableHead>
                        <TableHead className="text-xs">详情</TableHead>
                        <TableHead className="text-xs">时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agent.auditLog.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <span>{log.user}</span>
                              <DataSourceBadge item={log} className="px-1.5 py-0 text-[9px]" />
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{log.action}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{log.detail}</TableCell>
                          <TableCell className="text-xs tabular-nums text-muted-foreground">{log.time}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : null}

              <div className="flex justify-end">
                <Button className="gap-1.5">
                  <Save className="h-4 w-4" />
                  保存配置
                </Button>
              </div>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const agentId = id || mockAgentDetail.id;
  const [activeDrawer, setActiveDrawer] = useState<DrawerSection | null>(null);
  const agentQuery = useQuery({
    queryKey: ["control-center", "agent", agentId],
    queryFn: () => fetchControlCenterAgentDetail(agentId),
    enabled: Boolean(agentId),
  });

  const agent = agentQuery.data ?? buildFallbackAgent(agentId);
  const mockNotes = useMemo(
    () => [
      ...collectMockNotes([agent]),
      ...collectMockNotes(agent.channels),
      ...collectMockNotes(agent.skills),
      ...collectMockNotes(agent.knowledgeSources),
      ...collectMockNotes(agent.schedules),
      ...collectMockNotes(agent.recentRuns),
      ...collectMockNotes(agent.auditLog),
    ],
    [agent],
  );

  if (agentQuery.isError) {
    mockNotes.unshift("数字员工详情接口访问失败，当前页面已回退到演示数据。");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-5 p-6">
        <div>
          <Link
            to="/agents"
            className="mb-3 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            返回数字员工列表
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
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
                  {agent.position} · {agent.department} · {agent.machine.name}
                </p>
                <p className="mt-0.5 text-xs italic text-muted-foreground/70">"{agent.motto}"</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                <Link to={`/agents/${agent.id}/bot`}>
                  <Activity className="h-3.5 w-3.5" />
                  通道运行面
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Play className="h-3.5 w-3.5" />
                手动触发
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                编辑档案
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                {agent.status === "paused" ? (
                  <>
                    <Play className="h-3.5 w-3.5" />
                    启用
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5" />
                    暂停
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{agent.description}</p>
        </div>

        <MockDataNotice notes={[...new Set(mockNotes)]} />

        <div className="grid grid-cols-6 gap-3">
          {[
            { label: "所属机器", value: agent.machine.name },
            { label: "OpenClaw", value: String(agent.openclawCount) },
            { label: "通道数", value: String(agent.channelCount) },
            { label: "Skills", value: String(agent.skillCount) },
            { label: "成功率", value: `${agent.successRate}%` },
            { label: "最近活跃", value: agent.lastRunTime },
          ].map((item) => (
            <div key={item.label} className="rounded-md border bg-card p-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <DetailSection title="个性化信息" icon={User}>
            <div className="space-y-4 text-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <span className="text-2xl font-medium text-foreground">{agent.avatar}</span>
                </div>
                <div>
                  <p className="text-base font-semibold text-foreground">{agent.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {agent.position} · {agent.department}
                  </p>
                  <p className="text-xs italic text-muted-foreground/70">"{agent.motto}"</p>
                </div>
              </div>

              <div className="grid gap-2 text-sm text-muted-foreground">
                <div className="flex justify-between gap-4">
                  <span>沟通风格</span>
                  <span className="text-right text-foreground">{agent.communicationStyle}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>工作信条</span>
                  <span className="max-w-[320px] text-right text-foreground">{agent.workCreed}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>负责人</span>
                  <span className="text-right text-foreground">{agent.owner}</span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">专长标签</p>
                <div className="flex flex-wrap gap-2">
                  {agent.specialties.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DetailSection>

          <DetailSection title="Prompt / 行为" icon={Settings}>
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">系统提示词</p>
                <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                  {agent.systemPrompt}
                </pre>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-muted-foreground">行为原则</p>
                <ul className="space-y-1.5">
                  {agent.behaviorRules.map((rule, index) => (
                    <li key={rule} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 shrink-0 rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums">
                        {index + 1}
                      </span>
                      {rule}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">输出风格</p>
                <p className="text-sm text-muted-foreground">{agent.outputStyle}</p>
              </div>
            </div>
          </DetailSection>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <div className="mb-3">
            <h3 className="text-sm font-medium text-foreground">治理与配置</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              这些项目不再占据主页面版面，点击后从右侧抽屉展开查看、编辑和保存。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(drawerMeta) as DrawerSection[]).map((section) => {
              const meta = drawerMeta[section];
              const Icon = meta.icon;
              return (
                <Button
                  key={section}
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setActiveDrawer(section)}
                >
                  <Icon className="h-4 w-4" />
                  {meta.title}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">通道情况</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                下方展示该数字员工在不同对话入口下的 OpenClaw 通道实例。
              </p>
            </div>
            <Badge variant="outline" className="text-xs">
              {agent.channelCount} 个通道
            </Badge>
          </div>

          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">通道</TableHead>
                  <TableHead className="text-xs">平台</TableHead>
                  <TableHead className="text-xs">状态</TableHead>
                  <TableHead className="text-xs">最近消息</TableHead>
                  <TableHead className="text-center text-xs">会话数</TableHead>
                  <TableHead className="text-xs">模型</TableHead>
                  <TableHead className="text-xs">成功率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agent.channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{channel.name}</span>
                            <DataSourceBadge item={channel} className="px-1.5 py-0 text-[9px]" />
                          </div>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {channel.openclawAgentId} · {channel.channelType}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{channel.platform}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <StatusBadge variant={channel.status} />
                        {channel.alertCount > 0 ? (
                          <p className="text-[10px] text-[hsl(var(--status-danger))]">{channel.alertCount} 条告警</p>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[320px] text-xs text-muted-foreground">
                      <p className="truncate">{channel.lastMessage}</p>
                      <p className="mt-0.5 tabular-nums text-[10px] text-muted-foreground/80">
                        最近活跃 {channel.lastActive}
                      </p>
                    </TableCell>
                    <TableCell className="text-center text-sm tabular-nums">{channel.sessionCount}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">{channel.model}</TableCell>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">{channel.successRate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <GovernanceSheet
        agent={agent}
        section={activeDrawer}
        open={Boolean(activeDrawer)}
        onOpenChange={(open) => setActiveDrawer(open ? activeDrawer : null)}
      />
    </DashboardLayout>
  );
}
