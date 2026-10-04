import { z } from "zod";

const wordCount = (text: string) =>
  text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;

export const WordingResponseSchema = z.object({
  clusters: z.array(
    z.object({
      cluster_id: z.string().min(1),
      doctor_summary: z
        .string()
        .min(1)
        .refine((s) => wordCount(s) <= 60, "doctor_summary > 60 words"),
      member_friendly: z
        .string()
        .min(1)
        .refine((s) => wordCount(s) <= 60, "member_friendly > 60 words"),
    }),
  ),
  items: z.array(
    z.object({
      item_key: z.string().min(1),
      why_this: z
        .string()
        .min(1)
        .refine((s) => wordCount(s) <= 25, "why_this > 25 words"),
    }),
  ),
});

export type WordingResponse = z.infer<typeof WordingResponseSchema>;

/** Extract numeric tokens (ints/decimals) from arbitrary text. */
export function extractNumbers(text: string): string[] {
  const matches = text.match(/-?\d+(?:\.\d+)?/g);
  return matches ?? [];
}

export function numbersInPayload(payload: unknown): Set<string> {
  return new Set(extractNumbers(JSON.stringify(payload)));
}

export function parseWordingResponse(raw: unknown): WordingResponse {
  return WordingResponseSchema.parse(raw);
}

/**
 * Reject if any number in the response text is not present in the payload.
 * Returns null when valid; otherwise an error message.
 */
export function guardInventedNumbers(
  payload: unknown,
  response: WordingResponse,
): string | null {
  const allowed = numbersInPayload(payload);
  const found = extractNumbers(JSON.stringify(response));
  for (const n of found) {
    if (!allowed.has(n)) {
      return `Invented number not in payload: ${n}`;
    }
  }
  return null;
}

export function validateLlmWording(
  payload: unknown,
  raw: unknown,
): { ok: true; data: WordingResponse } | { ok: false; reason: string } {
  try {
    const data = parseWordingResponse(raw);
    const invented = guardInventedNumbers(payload, data);
    if (invented) return { ok: false, reason: invented };
    return { ok: true, data };
  } catch (err) {
    return {
      ok: false,
      reason: err instanceof Error ? err.message : String(err),
    };
  }
}
