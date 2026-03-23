import { useQuery } from "@tanstack/react-query";
import { GitBranch, Pencil, Server, Settings as SettingsIcon } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { DataSourceBadge } from "@/components/DataSourceBadge";
import { MockDataNotice } from "@/components/MockDataNotice";
import { SystemHealthCard } from "@/components/dashboard/SystemHealthCard";
import { Button } from "@/components/ui/button";
import { mockServices } from "@/data/mock-dashboard";
import { mockDeployInfo, mockSystemConfigs } from "@/data/mock-settings";
import {
  collectMockNotes,
  fetchControlCenterSettings,
  takeMockItems,
  toMockProvenance,
  withMockProvenance,
  type SettingsData,
} from "@/lib/control-center-api";

const fallbackSettings: SettingsData = {
  deployInfo: {
    ...mockDeployInfo,
    ...toMockProvenance("部署信息当前使用演示数据，仅保留 1 条样例。"),
    ports: withMockProvenance(takeMockItems(mockDeployInfo.ports), "端口信息当前使用演示数据，仅保留 1 条样例"),
  },
  services: withMockProvenance(takeMockItems(mockServices), "服务健康卡片当前使用演示数据，仅保留 1 条样例"),
  systemConfigs: withMockProvenance(takeMockItems(mockSystemConfigs), "系统配置当前使用演示数据，仅保留 1 条样例"),
};

export default function Settings() {
  const settingsQuery = useQuery({
    queryKey: ["control-center", "settings"],
    queryFn: fetchControlCenterSettings,
  });

  const settings = settingsQuery.data ?? fallbackSettings;
  const configGroups = [...new Set(settings.systemConfigs.map((config) => config.category))];
  const mockNotes = [
    ...collectMockNotes([settings.deployInfo]),
    ...collectMockNotes(settings.deployInfo.ports),
    ...collectMockNotes(settings.services),
    ...collectMockNotes(settings.systemConfigs),
  ];

  if (settingsQuery.isError) {
    mockNotes.unshift("系统设置接口访问失败，当前页面已回退到演示数据。");
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1400px] space-y-6 p-6">
        <div>
          <h1 className="text-lg font-semibold text-foreground">系统设置与部署</h1>
          <p className="mt-0.5 text-xs text-muted-foreground">管理服务状态、部署信息和系统配置</p>
        </div>

        <MockDataNotice notes={[...new Set(mockNotes)]} />

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--status-success))]" />
              控制面在线
            </span>
            <DataSourceBadge item={settings.deployInfo} />
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{settings.deployInfo.os}</span>
            <span className="text-muted-foreground">·</span>
            <span className="font-mono text-xs text-muted-foreground">{settings.deployInfo.version}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              最近部署 {settings.deployInfo.lastDeploy}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SystemHealthCard services={settings.services} />

          <div className="rounded-md border bg-card p-4 shadow-sm">
            <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
              <Server className="h-4 w-4" />
              部署信息
            </h3>
            <div className="space-y-2 text-sm">
              {[
                { label: "主机地址", value: settings.deployInfo.host },
                { label: "操作系统", value: settings.deployInfo.os },
                { label: "运行环境", value: settings.deployInfo.runtime },
                { label: "仓库地址", value: settings.deployInfo.repo },
                { label: "最近部署", value: settings.deployInfo.lastDeploy },
                { label: "版本号", value: settings.deployInfo.version },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-mono text-xs text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-medium">
            <GitBranch className="h-4 w-4" />
            运行端口
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {settings.deployInfo.ports.map((port) => (
              <div
                key={`${port.service}-${port.port}`}
                className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="text-foreground">{port.service}</span>
                  <DataSourceBadge item={port} className="px-1.5 py-0 text-[9px]" />
                </div>
                <span className="font-mono text-xs text-muted-foreground">
                  {port.protocol}:{port.port}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-md border bg-card p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
            <SettingsIcon className="h-4 w-4" />
            系统配置
          </h3>
          {configGroups.map((group) => (
            <div key={group} className="mb-4 last:mb-0">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                {group}
              </p>
              <div className="space-y-2">
                {settings.systemConfigs
                  .filter((config) => config.category === group)
                  .map((config) => (
                    <div key={config.key} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-foreground">{config.label}</span>
                        <DataSourceBadge item={config} className="px-1.5 py-0 text-[9px]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="min-w-[80px] rounded bg-muted px-2 py-1 text-right font-mono text-xs text-foreground">
                          {config.value}
                        </span>
                        {config.editable ? (
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Pencil className="h-3 w-3" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
