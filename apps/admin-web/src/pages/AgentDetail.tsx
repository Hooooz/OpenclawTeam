import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  Calendar,
  MessageSquareText,
  Pause,
  Pencil,
  Play,
  Settings,
  User,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

function buildFallbackAgent(agentId: string): AgentDetailRecord {
  return {
    ...mockAgentDetail,
    id: agentId,
    ...toMockProvenance("数字员工详情接口暂不可用，当前展示演示员工档案。"),
    skills: withMockProvenance(takeMockItems(mockAgentDetail.skills), "Skill 绑定当前使用演示数据，仅保留 1 条样例"),
    knowledgeSources: withMockProvenance(takeMockItems(mockAgentDetail.knowledgeSources), "知识摘要当前使用演示聚合，仅保留 1 条样例"),
    schedules: withMockProvenance(takeMockItems(mockAgentDetail.schedules), "定时任务列表当前使用演示数据，仅保留 1 条样例"),
    recentRuns: withMockProvenance(
      takeMockItems(mockAgentDetail.recentRuns) as Array<{ id: string; taskName: string; status: AgentDetailRecord["recentRuns"][number]["status"]; time: string; duration: string }>,
      "工作记录当前使用演示数据，仅保留 1 条样例",
    ),
    auditLog: withMockProvenance(takeMockItems(mockAgentDetail.auditLog), "审计记录当前使用演示数据，仅保留 1 条样例"),
  };
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const agentId = id || mockAgentDetail.id;
  const agentQuery = useQuery({
    queryKey: ["control-center", "agent", agentId],
    queryFn: () => fetchControlCenterAgentDetail(agentId),
    enabled: Boolean(agentId),
  });

  const agent = agentQuery.data ?? buildFallbackAgent(agentId);
  const mockNotes = [
    ...collectMockNotes([agent]),
    ...collectMockNotes(agent.skills),
    ...collectMockNotes(agent.knowledgeSources),
    ...collectMockNotes(agent.schedules),
    ...collectMockNotes(agent.recentRuns),
    ...collectMockNotes(agent.auditLog),
  ];

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
            返回列表
          </Link>
          <div className="flex items-center justify-between">
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
                  {agent.position} · {agent.department}
                </p>
                <p className="mt-0.5 text-xs italic text-muted-foreground/70">"{agent.motto}"</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
                <Link to={`/agents/${agent.id}/bot`}>
                  <Activity className="h-3.5 w-3.5" />
                  运行面
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Play className="h-3.5 w-3.5" />
                手动触发
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" />
                编辑
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
            { label: "职责", value: agent.role },
            { label: "负责人", value: agent.owner },
            { label: "模型", value: agent.model },
            { label: "Skills", value: String(agent.skillCount) },
            { label: "成功率", value: `${agent.successRate}%` },
            { label: "创建于", value: agent.createdAt },
          ].map((item) => (
            <div key={item.label} className="rounded-md border bg-card p-3 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{item.label}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{item.value}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="persona" className="space-y-4">
          <TabsList>
            <TabsTrigger value="persona" className="gap-1.5 text-xs">
              <User className="h-3.5 w-3.5" />
              个性化信息
            </TabsTrigger>
            <TabsTrigger value="prompt" className="gap-1.5 text-xs">
              <Settings className="h-3.5 w-3.5" />
              Prompt / 行为
            </TabsTrigger>
            <TabsTrigger value="skills" className="text-xs">
              Skill 绑定
            </TabsTrigger>
            <TabsTrigger value="knowledge" className="gap-1.5 text-xs">
              <BookOpen className="h-3.5 w-3.5" />
              知识 / 记忆
            </TabsTrigger>
            <TabsTrigger value="schedules" className="gap-1.5 text-xs">
              <Calendar className="h-3.5 w-3.5" />
              定时任务
            </TabsTrigger>
            <TabsTrigger value="runs" className="gap-1.5 text-xs">
              <MessageSquareText className="h-3.5 w-3.5" />
              工作记录
            </TabsTrigger>
            <TabsTrigger value="audit" className="text-xs">
              审计变更
            </TabsTrigger>
          </TabsList>

          <TabsContent value="persona" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3 rounded-md border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-medium">员工档案</h3>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                    <span className="text-2xl font-medium text-foreground">{agent.avatar}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-base font-semibold text-foreground">{agent.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.position} · {agent.department}
                    </p>
                    <p className="text-xs italic text-muted-foreground/70">"{agent.motto}"</p>
                  </div>
                </div>
                <div className="space-y-2 pt-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">沟通风格</span>
                    <span className="text-right text-foreground">{agent.communicationStyle}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">工作信条</span>
                    <span className="max-w-[260px] text-right text-foreground">{agent.workCreed}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3 rounded-md border bg-card p-4 shadow-sm">
                <h3 className="text-sm font-medium">专长标签</h3>
                <div className="flex flex-wrap gap-2">
                  {agent.specialties.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <h3 className="pt-2 text-sm font-medium">职责摘要</h3>
                <p className="leading-relaxed text-sm text-muted-foreground">{agent.description}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="prompt" className="space-y-4">
            <div className="rounded-md border bg-card p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-medium">系统提示词</h3>
              <pre className="whitespace-pre-wrap rounded-md bg-muted p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                {agent.systemPrompt}
              </pre>
            </div>
            <div className="rounded-md border bg-card p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-medium">行为原则</h3>
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
            <div className="rounded-md border bg-card p-4 shadow-sm">
              <h3 className="mb-1 text-sm font-medium">输出风格</h3>
              <p className="text-sm text-muted-foreground">{agent.outputStyle}</p>
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <div className="overflow-hidden rounded-md border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs">名称</TableHead>
                    <TableHead className="text-xs">分类</TableHead>
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
          </TabsContent>

          <TabsContent value="knowledge">
            <div className="overflow-hidden rounded-md border bg-card shadow-sm">
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
          </TabsContent>

          <TabsContent value="schedules">
            <div className="overflow-hidden rounded-md border bg-card shadow-sm">
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
          </TabsContent>

          <TabsContent value="runs">
            <div className="overflow-hidden rounded-md border bg-card shadow-sm">
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
          </TabsContent>

          <TabsContent value="audit">
            <div className="overflow-hidden rounded-md border bg-card shadow-sm">
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
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
