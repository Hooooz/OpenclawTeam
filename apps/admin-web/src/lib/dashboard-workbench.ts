import type { DataSource, RunListItem } from "./control-center-api";

type WorkbenchMetric = {
  label: string;
  value: number;
  unit?: string;
  note: string;
  dataSource: DataSource;
  dataSourceNote?: string;
};

export type WorkbenchWeekItem = {
  dayLabel: string;
  dateKey: string;
  tasks: number;
  files: number;
  savings: number;
  dataSource: DataSource;
};

export type WorkbenchFeedItem = {
  id: string;
  title: string;
  summary: string;
  time: string;
  channelName: string;
  channelType: RunListItem["channelType"];
  status: RunListItem["status"];
  agentName: string;
  dataSource: DataSource;
  dataSourceNote?: string;
};

export type WorkbenchData = {
  today: {
    tasks: WorkbenchMetric;
    files: WorkbenchMetric;
    savings: WorkbenchMetric;
  };
  weekly: WorkbenchWeekItem[];
  feed: WorkbenchFeedItem[];
};

const TASK_SAVINGS_CNY = 35;
const FILE_SAVINGS_CNY = 12;
const FILE_KEYWORDS = [
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".pdf",
  "文档",
  "文件",
  "表格",
  "飞书",
  "纪要",
  "方案",
  "报告",
  "合同",
  "简历",
];

function parseRunTime(value: string) {
  const normalized = value.trim().replace(" ", "T");
  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function toDayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function toDayLabel(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function isCompleted(run: RunListItem) {
  return run.status === "success";
}

function estimateFileCount(run: RunListItem) {
  const haystack = `${run.taskName} ${run.conversationTopic} ${run.outputSummary} ${run.memorySummary}`.toLowerCase();
  return FILE_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase())) ? 1 : 0;
}

function estimateSavings(tasks: number, files: number) {
  return tasks * TASK_SAVINGS_CNY + files * FILE_SAVINGS_CNY;
}

function toFeedItem(run: RunListItem): WorkbenchFeedItem {
  return {
    id: run.id,
    title: run.taskName,
    summary: run.outputSummary || run.conversationTopic || "已完成一轮工作处理。",
    time: run.startTime,
    channelName: run.channelName,
    channelType: run.channelType,
    status: run.status,
    agentName: run.agentName,
    dataSource: run.dataSource,
    dataSourceNote: run.dataSourceNote,
  };
}

export function buildWorkbenchData(runs: RunListItem[], now = new Date()): WorkbenchData {
  const sortedRuns = [...runs].sort((left, right) => right.startTime.localeCompare(left.startTime));
  const currentDay = sortedRuns.filter((run) => {
    const date = parseRunTime(run.startTime);
    return date ? isSameDay(date, now) : false;
  });
  const completedToday = currentDay.filter(isCompleted);
  const todayTaskCount = completedToday.length;
  const todayFileCount = completedToday.reduce((sum, run) => sum + estimateFileCount(run), 0);
  const weeklySeed = Array.from({ length: 7 }, (_, offset) => {
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    day.setDate(now.getDate() - (6 - offset));
    return {
      dayLabel: toDayLabel(day),
      dateKey: toDayKey(day),
      tasks: 0,
      files: 0,
      savings: 0,
      dataSource: "live" as const,
    };
  });
  const weeklyMap = new Map(weeklySeed.map((item) => [item.dateKey, item]));

  sortedRuns.forEach((run) => {
    const date = parseRunTime(run.startTime);
    if (!date) {
      return;
    }

    const key = toDayKey(date);
    const bucket = weeklyMap.get(key);
    if (!bucket || !isCompleted(run)) {
      return;
    }

    const fileCount = estimateFileCount(run);
    bucket.tasks += 1;
    bucket.files += fileCount;
    bucket.savings = estimateSavings(bucket.tasks, bucket.files);
    bucket.dataSource = bucket.dataSource === "mock" || run.dataSource === "mock" ? "mock" : "live";
  });

  return {
    today: {
      tasks: {
        label: "今日完成任务",
        value: todayTaskCount,
        note: "按成功完成的工作记录统计",
        dataSource: sortedRuns.some((run) => run.dataSource === "live") ? "live" : "mock",
      },
      files: {
        label: "今日完成文件",
        value: todayFileCount,
        note: "按运行记录中的文件类关键词识别",
        dataSource: sortedRuns.some((run) => run.dataSource === "live") ? "mock" : "mock",
        dataSourceNote: "文件产出当前按对话与工作记录中的文件类关键词估算",
      },
      savings: {
        label: "预计节约成本",
        value: estimateSavings(todayTaskCount, todayFileCount),
        unit: "元",
        note: `按 ${TASK_SAVINGS_CNY} 元/任务 + ${FILE_SAVINGS_CNY} 元/文件保守估算`,
        dataSource: "mock",
        dataSourceNote: "节约成本当前基于运行记录与保守单价估算",
      },
    },
    weekly: weeklySeed,
    feed: sortedRuns.slice(0, 8).map(toFeedItem),
  };
}
