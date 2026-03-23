import { useQuery } from "@tanstack/react-query";
import { mockAgentDetail } from "@/data/mock-agents";
import { mockServices } from "@/data/mock-dashboard";
import { mockRunList } from "@/data/mock-runs";
import { mockDeployInfo, mockSystemConfigs } from "@/data/mock-settings";
import {
  collectMockNotes,
  fetchControlCenterAgentDetail,
  fetchControlCenterRuns,
  fetchControlCenterSettings,
  takeMockItems,
  toMockProvenance,
  withMockProvenance,
  type AgentDetail,
  type RunListItem,
  type SettingsData,
} from "@/lib/control-center-api";

function buildFallbackAgent(agentId: string): AgentDetail {
  return {
    ...mockAgentDetail,
    id: agentId,
    ...toMockProvenance("数字员工运行面接口暂不可用，当前展示演示员工档案。"),
    skills: withMockProvenance(takeMockItems(mockAgentDetail.skills), "Skill 绑定当前使用演示数据，仅保留 1 条样例"),
    knowledgeSources: withMockProvenance(takeMockItems(mockAgentDetail.knowledgeSources), "知识摘要当前使用演示聚合，仅保留 1 条样例"),
    schedules: withMockProvenance(takeMockItems(mockAgentDetail.schedules), "定时任务列表当前使用演示数据，仅保留 1 条样例"),
    recentRuns: withMockProvenance(
      takeMockItems(mockAgentDetail.recentRuns) as Array<{
        id: string;
        taskName: string;
        status: AgentDetail["recentRuns"][number]["status"];
        time: string;
        duration: string;
      }>,
      "工作记录当前使用演示数据，仅保留 1 条样例",
    ),
    auditLog: withMockProvenance(takeMockItems(mockAgentDetail.auditLog), "审计记录当前使用演示数据，仅保留 1 条样例"),
  };
}

const fallbackRuns = withMockProvenance(
  takeMockItems(mockRunList),
  "Bot 运行记录接口暂不可用，当前展示 1 条演示会话与工作记录。",
) as RunListItem[];

const fallbackSettings: SettingsData = {
  deployInfo: {
    ...mockDeployInfo,
    ...toMockProvenance("部署信息当前使用演示数据，仅保留 1 条样例。"),
    ports: withMockProvenance(takeMockItems(mockDeployInfo.ports), "端口信息当前使用演示数据，仅保留 1 条样例"),
  },
  services: withMockProvenance(takeMockItems(mockServices), "服务健康卡片当前使用演示数据，仅保留 1 条样例"),
  systemConfigs: withMockProvenance(takeMockItems(mockSystemConfigs), "系统配置当前使用演示数据，仅保留 1 条样例"),
};

export function useBotPageData(agentId: string) {
  const agentQuery = useQuery({
    queryKey: ["control-center", "agent", agentId],
    queryFn: () => fetchControlCenterAgentDetail(agentId),
    enabled: Boolean(agentId),
  });
  const runsQuery = useQuery({
    queryKey: ["control-center", "runs"],
    queryFn: fetchControlCenterRuns,
  });
  const settingsQuery = useQuery({
    queryKey: ["control-center", "settings"],
    queryFn: fetchControlCenterSettings,
  });

  const agent = agentQuery.data ?? buildFallbackAgent(agentId);
  const runs = runsQuery.data ?? fallbackRuns;
  const settings = settingsQuery.data ?? fallbackSettings;
  const mockNotes = [
    ...collectMockNotes([agent]),
    ...collectMockNotes(agent.recentRuns),
    ...collectMockNotes(runs),
    ...collectMockNotes([settings.deployInfo]),
    ...collectMockNotes(settings.services),
    ...collectMockNotes(settings.systemConfigs),
  ];

  if (agentQuery.isError) {
    mockNotes.unshift("数字员工详情接口访问失败，当前页面已回退到演示档案。");
  }

  if (runsQuery.isError) {
    mockNotes.unshift("Bot 运行记录接口访问失败，当前页面已回退到演示会话数据。");
  }

  if (settingsQuery.isError) {
    mockNotes.unshift("系统设置接口访问失败，当前页面已回退到演示部署数据。");
  }

  return {
    agent,
    runs,
    settings,
    mockNotes: [...new Set(mockNotes)],
    isLoading: agentQuery.isLoading || runsQuery.isLoading || settingsQuery.isLoading,
  };
}
