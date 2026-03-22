import type {
  CreateAgentInput,
  CreateScheduleInput,
  CreateSkillInput,
  DashboardSnapshot,
  TriggerRunInput
} from "@openclaw/shared";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() || "http://localhost:3001";

export async function fetchDashboardSnapshot(): Promise<DashboardSnapshot> {
  const response = await fetch(`${API_BASE_URL}/api/dashboard`);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return response.json() as Promise<DashboardSnapshot>;
}

export async function createAgent(input: CreateAgentInput) {
  const response = await fetch(`${API_BASE_URL}/api/agents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Create agent failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function createSkill(input: CreateSkillInput) {
  const response = await fetch(`${API_BASE_URL}/api/skills`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Create skill failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function createSchedule(input: CreateScheduleInput) {
  const response = await fetch(`${API_BASE_URL}/api/schedules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Create schedule failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function updateScheduleStatus(
  scheduleId: string,
  status: "active" | "paused"
) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    throw new Error(`Update schedule status failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function triggerScheduleRun(scheduleId: string) {
  const response = await fetch(`${API_BASE_URL}/api/schedules/${scheduleId}/trigger`, {
    method: "POST"
  });

  if (!response.ok) {
    throw new Error(`Trigger schedule run failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function updateRunStatus(
  runId: string,
  status: "success" | "failed",
  summary: string
) {
  const response = await fetch(`${API_BASE_URL}/api/runs/${runId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ status, summary })
  });

  if (!response.ok) {
    throw new Error(`Update run status failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function runDueSchedules() {
  const response = await fetch(`${API_BASE_URL}/api/schedules/run-due`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(`Run due schedules failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function updateAgentSkillBindings(agentId: string, skillIds: string[]) {
  const response = await fetch(`${API_BASE_URL}/api/agents/${agentId}/skills`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ skillIds })
  });

  if (!response.ok) {
    throw new Error(`Update agent skills failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}

export async function triggerRun(input: TriggerRunInput) {
  const response = await fetch(`${API_BASE_URL}/api/runs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    throw new Error(`Trigger run failed with status ${response.status}`);
  }

  return response.json() as Promise<{ ok: true }>;
}
