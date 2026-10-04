import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMembers } from "../api";
import { StatusChip } from "../components/StatusChip";
import type { MemberListItem } from "../types";

export function MembersPage() {
  const [members, setMembers] = useState<MemberListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listMembers()
      .then((data) => {
        if (!cancelled) {
          setMembers(data);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load members");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Members</h1>
        <p className="text-sm text-slate-600">
          Open a member to confirm anonymisation before analysis.
        </p>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading members…</p>}
      {error && (
        <p className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!loading && !error && (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Age</th>
                <th className="px-4 py-3 font-medium">Goals</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    <Link
                      to={`/members/${m.id}/anonymise`}
                      className="font-medium text-sky-700 hover:underline"
                    >
                      {m.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{m.age}</td>
                  <td className="px-4 py-3 text-slate-600">{m.goals}</td>
                  <td className="px-4 py-3">
                    <StatusChip status={m.status} />
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-slate-500">
                    No members yet. Run <code>npm run seed</code> on the server.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
