import type {
  CreateAgentInput,
  CreateSkillInput,
  DashboardSnapshot
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
