import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState } from "react";
import { takeMockItems, withMockProvenance } from "@/lib/control-center-api";

const mockAuditLog = [
  { id: "1", time: "2025-03-22 14:32:00", user: "李明", role: "超级管理员", action: "触发运行", target: "客服工单处理", detail: "手动触发工单分类-批次 #1847" },
  { id: "2", time: "2025-03-22 14:15:00", user: "系统调度", role: "系统", action: "自动触发", target: "HR 简历筛选", detail: "计划「简历池刷新」触发" },
  { id: "3", time: "2025-03-22 13:50:00", user: "系统调度", role: "系统", action: "自动触发", target: "财务对账", detail: "计划「财务日对账」触发" },
  { id: "4", time: "2025-03-22 10:20:00", user: "王芳", role: "运营负责人", action: "暂停 Agent", target: "财务对账", detail: "因银行接口维护暂停" },
  { id: "5", time: "2025-03-22 09:30:00", user: "张伟", role: "开发者", action: "更新 Skill", target: "工单分类", detail: "升级至 v2.1.0" },
  { id: "6", time: "2025-03-21 18:00:00", user: "系统", role: "系统", action: "部署完成", target: "Control Plane", detail: "v1.4.2-build.387 部署成功" },
  { id: "7", time: "2025-03-21 17:30:00", user: "赵敏", role: "Skill 维护者", action: "创建 Skill", target: "翻译服务", detail: "新建草稿 v0.5.0" },
  { id: "8", time: "2025-03-21 16:00:00", user: "李明", role: "超级管理员", action: "更新配置", target: "系统配置", detail: "最大并发任务数 8→10" },
  { id: "9", time: "2025-03-21 14:00:00", user: "王芳", role: "运营负责人", action: "创建模板", target: "舆情快报", detail: "新建任务模板" },
  { id: "10", time: "2025-03-21 10:00:00", user: "系统", role: "系统", action: "知识同步", target: "客服FAQ手册", detail: "同步完成，新增 12 条" },
];

export default function Audit() {
  const [search, setSearch] = useState("");
  const auditLog = withMockProvenance(takeMockItems(mockAuditLog), "审计日志当前仅提供 1 条演示数据样例。");

  const filtered = auditLog.filter((a) => {
    if (!search) return true;
    return a.user.includes(search) || a.action.includes(search) || a.target.includes(search) || a.detail.includes(search);
  });

  return (
    <DashboardLayout>
      <div className="p-6 max-w-[1400px] mx-auto space-y-5">
        <div>
          <h1 className="text-lg font-semibold text-foreground">审计日志</h1>
          <p className="text-xs text-muted-foreground mt-0.5">记录所有关键操作和系统事件</p>
        </div>

        <MockDataNotice notes={["审计日志当前仅保留 1 条 mock 样例，并已标记为 MOCK。"]} />

        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="搜索操作人、动作或对象…" className="pl-9 h-9 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="rounded-md border bg-card shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">时间</TableHead>
                <TableHead className="text-xs">操作人</TableHead>
                <TableHead className="text-xs">角色</TableHead>
                <TableHead className="text-xs">动作</TableHead>
                <TableHead className="text-xs">对象</TableHead>
                <TableHead className="text-xs">详情</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="text-xs tabular-nums text-muted-foreground font-mono whitespace-nowrap">{a.time}</TableCell>
                  <TableCell className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <span>{a.user}</span>
                      <DataSourceBadge item={a} className="px-1.5 py-0 text-[9px]" />
                    </div>
                  </TableCell>
                  <TableCell><span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">{a.role}</span></TableCell>
                  <TableCell className="text-sm">{a.action}</TableCell>
                  <TableCell className="text-sm text-foreground">{a.target}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{a.detail}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </DashboardLayout>
  );
}
