import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { mockAgentDetail } from "@/data/mock-agents";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search } from "lucide-react";
import { Link } from "react-router-dom";

const a = mockAgentDetail;

const mockSessions = [
  { id: "ses1", sessionId: "SES-001", type: "群聊", platform: "企业微信", lastActive: "1 分钟前", messageCount: 47, tokenUsage: 12400, status: "active", risk: false, topic: "客服工单处理群", memorySummary: "新增 FAQ 3 条" },
  { id: "ses2", sessionId: "SES-002", type: "私聊", platform: "钉钉", lastActive: "5 分钟前", messageCount: 23, tokenUsage: 5600, status: "active", risk: false, topic: "李明·工单审批", memorySummary: "无更新" },
  { id: "ses3", sessionId: "SES-003", type: "定时任务", platform: "系统", lastActive: "14:32", messageCount: 1, tokenUsage: 2100, status: "completed", risk: false, topic: "工单分类-批次 #1847", memorySummary: "映射规则 +3" },
  { id: "ses4", sessionId: "SES-004", type: "私聊", platform: "企业微信", lastActive: "30 分钟前", messageCount: 8, tokenUsage: 1800, status: "active", risk: true, topic: "客户投诉升级", memorySummary: "标记敏感词 +1" },
  { id: "ses5", sessionId: "SES-005", type: "系统", platform: "系统", lastActive: "1 小时前", messageCount: 2, tokenUsage: 800, status: "completed", risk: false, topic: "健康检查", memorySummary: "无更新" },
];

export default function BotSessions() {
  const [search, setSearch] = useState("");
  const filtered = mockSessions.filter(s => !search || s.topic.includes(search) || s.sessionId.includes(search));

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div>
          <Link to={`/agents/${a.id}/bot`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="h-3.5 w-3.5" /> 返回运行面
          </Link>
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
              <span className="text-sm font-medium">{a.avatar}</span>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">{a.name} · Session 管理</h1>
              <p className="text-xs text-muted-foreground">{a.position} · 共 {mockSessions.length} 个会话</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索会话主题或 ID…" className="pl-9 h-9 text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader><TableRow className="hover:bg-transparent">
              <TableHead className="text-xs">Session ID</TableHead>
              <TableHead className="text-xs">类型</TableHead>
              <TableHead className="text-xs">平台</TableHead>
              <TableHead className="text-xs">对话主题</TableHead>
              <TableHead className="text-xs">状态</TableHead>
              <TableHead className="text-xs text-right">消息数</TableHead>
              <TableHead className="text-xs text-right">Token</TableHead>
              <TableHead className="text-xs">最近活跃</TableHead>
              <TableHead className="text-xs">记忆更新</TableHead>
              <TableHead className="text-xs">风险</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-xs font-mono text-muted-foreground">{s.sessionId}</TableCell>
                  <TableCell><span className="text-xs bg-muted rounded px-1.5 py-0.5 text-muted-foreground">{s.type}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.platform}</TableCell>
                  <TableCell className="text-sm font-medium">{s.topic}</TableCell>
                  <TableCell><StatusBadge variant={s.status === "active" ? "running" : "success"} label={s.status === "active" ? "活跃" : "完成"} /></TableCell>
                  <TableCell className="text-sm tabular-nums text-right">{s.messageCount}</TableCell>
                  <TableCell className="text-xs tabular-nums text-right text-muted-foreground">{s.tokenUsage.toLocaleString()}</TableCell>
                  <TableCell className="text-xs tabular-nums text-muted-foreground">{s.lastActive}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[120px] truncate">{s.memorySummary}</TableCell>
                  <TableCell>{s.risk ? <StatusBadge variant="high" label="风险" /> : <span className="text-xs text-muted-foreground">—</span>}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
