const key = (memberId: string) => `primer:playbook:${memberId}`;

export function loadPlaybookId(memberId: string): string | null {
  try {
    return sessionStorage.getItem(key(memberId));
  } catch {
    return null;
  }
}

export function savePlaybookId(memberId: string, playbookId: string): void {
  try {
    sessionStorage.setItem(key(memberId), playbookId);
  } catch {
    /* ignore */
  }
}
