import type {
  AnalysisResponse,
  AnonymisationResponse,
  MemberDetailResponse,
  MemberListItem,
  Playbook,
  PlaybookItem,
  PlaybookItemState,
  PlaybookResponse,
} from "./types";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: text };
    }
  }
  if (!res.ok) {
    const err = body as { error?: string } | null;
    throw new Error(err?.error || `Request failed (${res.status})`);
  }
  return body as T;
}

export function listMembers() {
  return request<MemberListItem[]>("/api/members");
}

export function getMember(id: string) {
  return request<MemberDetailResponse>(`/api/members/${id}`);
}

export function getAnonymisation(id: string) {
  return request<AnonymisationResponse>(`/api/members/${id}/anonymisation`);
}

export function analyzeMember(id: string) {
  return request<{ id: string }>(`/api/members/${id}/analyze`, {
    method: "POST",
    body: JSON.stringify({ confirmed: true }),
  });
}

export function getAnalysis(id: string) {
  return request<AnalysisResponse>(`/api/members/${id}/analysis`);
}

export function draftPlaybook(memberId: string) {
  return request<PlaybookResponse>(`/api/members/${memberId}/playbook`, {
    method: "POST",
  });
}

export function getPlaybook(playbookId: string) {
  return request<PlaybookResponse>(`/api/playbooks/${playbookId}`);
}

export function patchPlaybookItem(
  playbookId: string,
  itemId: string,
  body: { state: PlaybookItemState; edited_text?: string },
) {
  return request<PlaybookItem>(
    `/api/playbooks/${playbookId}/items/${itemId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
  );
}

export function approvePlaybook(playbookId: string) {
  return request<Playbook>(`/api/playbooks/${playbookId}/approve`, {
    method: "POST",
  });
}
