import { useEffect, useState } from "react";
import {
  approvePlaybook,
  draftPlaybook,
  getPlaybook,
  patchPlaybookItem,
} from "../api";
import { loadPlaybookId, savePlaybookId } from "../lib/playbookStorage";
import type { PlaybookItemState, PlaybookResponse } from "../types";

export function usePlaybook(memberId: string) {
  const [data, setData] = useState<PlaybookResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const stored = loadPlaybookId(memberId);
    if (!stored) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    getPlaybook(stored)
      .then((pb) => {
        if (!cancelled) {
          setData(pb);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setData(null);
          setError(err instanceof Error ? err.message : "Failed to load");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [memberId]);

  async function onDraft() {
    setBusy(true);
    setError(null);
    try {
      const pb = await draftPlaybook(memberId);
      savePlaybookId(memberId, pb.playbook.id);
      setData(pb);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Draft failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDecide(
    itemId: string,
    state: PlaybookItemState,
    edited_text?: string,
  ) {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await patchPlaybookItem(data.playbook.id, itemId, {
        state,
        edited_text,
      });
      setData({
        ...data,
        items: data.items.map((i) => (i.id === itemId ? updated : i)),
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function onApprove() {
    if (!data) return;
    setBusy(true);
    setError(null);
    try {
      const playbook = await approvePlaybook(data.playbook.id);
      setData({ ...data, playbook });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Approve failed");
    } finally {
      setBusy(false);
    }
  }

  return { data, loading, busy, error, onDraft, onDecide, onApprove };
}
