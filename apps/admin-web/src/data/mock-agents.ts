import type { AgentStatus } from "./mock-dashboard";

export interface AgentListItem {
  id: string;
  name: string;         // 员工姓名
  position: string;     // 职位
  department: string;   // 部门
  avatar: string;       // 头像首字
  motto: string;        // 座右铭
  role: string;         // 职责摘要
  status: AgentStatus;
  model: string;
  skillCount: number;
  knowledgeCount: number;
  lastRunTime: string;
  lastRunStatus: "success" | "failed" | "running" | "cancelled" | null;
  successRate: number;
  group: string;
  communicationStyle: string;
  specialties: string[];
  machine: {
    id: string;
    name: string;
    host: string;
    runtime: string;
    status: "healthy" | "degraded" | "down";
  };
  channelCount: number;
  openclawCount: number;
}

export interface AgentDetail extends AgentListItem {
  description: string;
  owner: string;
  createdAt: string;
  workCreed: string;
  systemPrompt: string;
  behaviorRules: string[];
  outputStyle: string;
  machine: AgentListItem["machine"];
  channels: Array<{
    id: string;
    openclawAgentId: string;
    name: string;
    platform: string;
    channelType: "私聊" | "群聊" | "系统";
    status: AgentStatus;
    sessionCount: number;
    lastActive: string;
    lastMessage: string;
    successRate: number;
    model: string;
    alertCount: number;
  }>;
  skills: { id: string; name: string; category: string; status: string }[];
  knowledgeSources: { id: string; name: string; type: string; lastSync: string }[];
  schedules: { id: string; name: string; cron: string; nextRun: string; enabled: boolean }[];
  recentRuns: { id: string; taskName: string; status: string; time: string; duration: string }[];
  auditLog: { id: string; user: string; action: string; time: string; detail: string }[];
}

const mockMachine = {
  id: "machine-demo-01",
  name: "demo-worker-01",
  host: "192.168.31.220",
  runtime: "Windows 11 / OpenClaw Local",
  status: "healthy" as const,
};

export const mockAgentList: AgentListItem[] = [
  { id: "a1", name: "陈晓服", position: "客服主管", department: "客户服务部", avatar: "陈", motto: "每一张工单，都是一次信任的托付", role: "自动分类与回复工单，处理来自各渠道的客服请求", status: "running", model: "GPT-4o", skillCount: 5, knowledgeCount: 2, lastRunTime: "2 分钟前", lastRunStatus: "success", successRate: 96.3, group: "客服", communicationStyle: "温和专业", specialties: ["工单分类", "情感分析", "自动回复"], machine: mockMachine, channelCount: 2, openclawCount: 1 },
  { id: "a2", name: "林账清", position: "财务专员", department: "财务部", avatar: "林", motto: "每一分钱都要对得上", role: "每日银行流水核对与异常标记", status: "paused", model: "GPT-4o", skillCount: 3, knowledgeCount: 1, lastRunTime: "26 小时前", lastRunStatus: "failed", successRate: 88.1, group: "财务", communicationStyle: "严谨细致", specialties: ["流水核对", "异常标记", "报表生成"], machine: mockMachine, channelCount: 1, openclawCount: 1 },
  { id: "a3", name: "赵市研", position: "市场分析师", department: "市场部", avatar: "赵", motto: "了解对手，才能超越对手", role: "定时抓取竞品价格与评论数据", status: "running", model: "GPT-4o-mini", skillCount: 7, knowledgeCount: 3, lastRunTime: "刚刚", lastRunStatus: "running", successRate: 99.2, group: "市场", communicationStyle: "数据驱动", specialties: ["竞品监控", "数据采集", "趋势分析"], machine: mockMachine, channelCount: 3, openclawCount: 1 },
  { id: "a4", name: "周法安", position: "法务顾问", department: "法务部", avatar: "周", motto: "风险止于条款之间", role: "审查合同关键条款并标记风险", status: "idle", model: "GPT-4o", skillCount: 4, knowledgeCount: 4, lastRunTime: "45 分钟前", lastRunStatus: "success", successRate: 94.7, group: "法务", communicationStyle: "审慎严谨", specialties: ["合同审核", "风险评估", "条款解析"], machine: mockMachine, channelCount: 1, openclawCount: 1 },
  { id: "a5", name: "孙才选", position: "招聘助理", department: "人力资源部", avatar: "孙", motto: "找到对的人，比什么都重要", role: "初筛简历并生成评估报告", status: "error", model: "GPT-4o", skillCount: 2, knowledgeCount: 1, lastRunTime: "15 分钟前", lastRunStatus: "failed", successRate: 72.4, group: "人力", communicationStyle: "高效直接", specialties: ["简历筛选", "岗位匹配"], machine: mockMachine, channelCount: 2, openclawCount: 1 },
  { id: "a6", name: "吴周报", position: "运营助理", department: "运营部", avatar: "吴", motto: "让信息流动，让决策有据", role: "汇总各组周报并生成摘要", status: "idle", model: "GPT-4o-mini", skillCount: 3, knowledgeCount: 2, lastRunTime: "2 天前", lastRunStatus: "success", successRate: 100, group: "运营", communicationStyle: "简洁清晰", specialties: ["报告生成", "数据汇总", "信息整理"], machine: mockMachine, channelCount: 2, openclawCount: 1 },
  { id: "a7", name: "郑供审", position: "采购审核员", department: "采购部", avatar: "郑", motto: "合格的供应商，是品质的第一道防线", role: "审核供应商资质文件", status: "running", model: "GPT-4o", skillCount: 6, knowledgeCount: 5, lastRunTime: "5 分钟前", lastRunStatus: "success", successRate: 97.8, group: "采购", communicationStyle: "规范严格", specialties: ["资质审核", "文件校验", "合规检查"], machine: mockMachine, channelCount: 2, openclawCount: 1 },
  { id: "a8", name: "王舆情", position: "舆情分析师", department: "市场部", avatar: "王", motto: "防患于未然，守护品牌声誉", role: "实时监测品牌舆情并预警", status: "running", model: "GPT-4o-mini", skillCount: 4, knowledgeCount: 2, lastRunTime: "1 分钟前", lastRunStatus: "success", successRate: 98.5, group: "市场", communicationStyle: "敏锐果断", specialties: ["舆情监控", "情感分析", "预警通知"], machine: mockMachine, channelCount: 3, openclawCount: 1 },
  { id: "a9", name: "钱技服", position: "IT 支持工程师", department: "信息技术部", avatar: "钱", motto: "让技术问题不再成为障碍", role: "自动处理常见 IT 支持请求", status: "idle", model: "GPT-4o", skillCount: 3, knowledgeCount: 3, lastRunTime: "1 小时前", lastRunStatus: "success", successRate: 91.2, group: "IT", communicationStyle: "耐心友好", specialties: ["故障排查", "工单处理", "知识检索"], machine: mockMachine, channelCount: 2, openclawCount: 1 },
  { id: "a10", name: "李票通", position: "票据专员", department: "财务部", avatar: "李", motto: "让每张发票都有归属", role: "OCR 识别并录入发票信息", status: "paused", model: "GPT-4o", skillCount: 2, knowledgeCount: 1, lastRunTime: "3 天前", lastRunStatus: "cancelled", successRate: 85.6, group: "财务", communicationStyle: "精确高效", specialties: ["OCR 识别", "发票录入"], machine: mockMachine, channelCount: 1, openclawCount: 1 },
];

export const mockAgentDetail: AgentDetail = {
  id: "a1",
  name: "陈晓服",
  position: "客服主管",
  department: "客户服务部",
  avatar: "陈",
  motto: "每一张工单，都是一次信任的托付",
  role: "自动分类与回复工单，处理来自各渠道的客服请求",
  status: "running",
  model: "GPT-4o",
  skillCount: 5,
  knowledgeCount: 2,
  lastRunTime: "2 分钟前",
  lastRunStatus: "success",
  successRate: 96.3,
  group: "客服",
  communicationStyle: "温和专业",
  specialties: ["工单分类", "情感分析", "自动回复"],
  channelCount: 2,
  openclawCount: 1,
  description: "负责处理来自各渠道的客服工单，自动分类、优先级判定、初步回复生成，并将复杂工单转交人工。",
  owner: "李明",
  createdAt: "2025-01-15",
  workCreed: "用心倾听每一位用户的声音，用专业回应每一个问题",
  systemPrompt: "你是一个专业的客服工单处理助手。你的职责是：\n1. 准确分类用户工单\n2. 判断工单优先级\n3. 生成初步回复建议\n4. 将无法处理的工单转交人工",
  behaviorRules: ["不得承诺超出公司政策的退款", "涉及法律问题必须转人工", "回复必须使用正式语言"],
  outputStyle: "结构化 JSON + 自然语言回复",
  machine: mockMachine,
  channels: [
    {
      id: "ch-1",
      openclawAgentId: "wecom-dm-customer",
      name: "企业微信私聊",
      platform: "企业微信",
      channelType: "私聊",
      status: "running",
      sessionCount: 128,
      lastActive: "2 分钟前",
      lastMessage: "客户催问退款进度，已整理工单并生成回复建议。",
      successRate: 97.4,
      model: "GPT-4o",
      alertCount: 0,
    },
    {
      id: "ch-2",
      openclawAgentId: "wecom-group-support",
      name: "售后群协作",
      platform: "企业微信",
      channelType: "群聊",
      status: "idle",
      sessionCount: 42,
      lastActive: "35 分钟前",
      lastMessage: "已在群内同步三张待处理工单和负责人。",
      successRate: 94.2,
      model: "GPT-4o",
      alertCount: 1,
    },
  ],
  skills: [
    { id: "sk1", name: "工单分类", category: "NLP", status: "active" },
    { id: "sk2", name: "情感分析", category: "NLP", status: "active" },
    { id: "sk3", name: "知识库检索", category: "检索", status: "active" },
    { id: "sk4", name: "邮件发送", category: "通信", status: "active" },
    { id: "sk5", name: "工单状态更新", category: "API", status: "active" },
  ],
  knowledgeSources: [
    { id: "k1", name: "客服FAQ手册", type: "文档", lastSync: "1 小时前" },
    { id: "k2", name: "产品说明书", type: "文档", lastSync: "3 小时前" },
  ],
  schedules: [
    { id: "s1", name: "工单自动分类", cron: "*/15 * * * *", nextRun: "14:45", enabled: true },
    { id: "s2", name: "工单日报", cron: "0 18 * * *", nextRun: "18:00", enabled: true },
  ],
  recentRuns: [
    { id: "r1", taskName: "工单分类-批次 #1847", status: "success", time: "14:32", duration: "1m 23s" },
    { id: "r2", taskName: "工单分类-批次 #1846", status: "success", time: "13:30", duration: "1m 11s" },
    { id: "r3", taskName: "工单分类-批次 #1845", status: "success", time: "12:15", duration: "1m 05s" },
    { id: "r4", taskName: "工单日报-3月21日", status: "success", time: "昨天 18:00", duration: "2m 30s" },
    { id: "r5", taskName: "工单分类-批次 #1844", status: "failed", time: "昨天 16:45", duration: "0m 12s" },
  ],
  auditLog: [
    { id: "au1", user: "李明", action: "更新系统提示词", time: "2 天前", detail: "修改了回复语气要求" },
    { id: "au2", user: "王芳", action: "绑定 Skill", time: "5 天前", detail: "新增「邮件发送」Skill" },
    { id: "au3", user: "系统", action: "自动触发", time: "1 周前", detail: "定时任务「工单自动分类」首次运行" },
  ],
};
