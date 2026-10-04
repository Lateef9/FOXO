import { createHash } from "node:crypto";
import type { Member } from "../types.js";

export type RemovedItem = {
  type: "name" | "city" | "email" | "phone" | "date";
  original: string;
};

export type AnonymiseResult = {
  clean: string;
  removed: RemovedItem[];
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replaceAllCI(
  text: string,
  needle: string,
  tag: string,
  type: RemovedItem["type"],
  removed: RemovedItem[],
): string {
  if (!needle) return text;
  const re = new RegExp(escapeRegExp(needle), "gi");
  return text.replace(re, (match) => {
    removed.push({ type, original: match });
    return tag;
  });
}

const EMAIL_RE = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;

// Indian mobiles: optional +91, optional spaces/dashes, 10 digits (may be split 5+5)
const PHONE_RE =
  /(?:\+91[\s-]*)?(?:[6-9]\d{4}[\s-]?\d{5}|[6-9]\d{9})\b/g;

const DATE_NUMERIC_RE = /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g;
const DATE_NAMED_RE =
  /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi;

function replaceRegex(
  text: string,
  re: RegExp,
  tag: string,
  type: RemovedItem["type"],
  removed: RemovedItem[],
): string {
  return text.replace(re, (match) => {
    removed.push({ type, original: match });
    return tag;
  });
}

export function pseudoId(member: Pick<Member, "id">): string {
  const salt = process.env.PSEUDO_SALT ?? "";
  const hex = createHash("sha256")
    .update(`${member.id}${salt}`)
    .digest("hex");
  return `P-${hex.slice(0, 6)}`;
}

export function anonymise(
  text: string,
  member: Pick<Member, "name" | "city">,
): AnonymiseResult {
  const removed: RemovedItem[] = [];
  let clean = text;

  // Email/phone/dates before name parts (names can appear inside emails).
  clean = replaceRegex(clean, EMAIL_RE, "[EMAIL]", "email", removed);
  clean = replaceRegex(clean, PHONE_RE, "[PHONE]", "phone", removed);
  clean = replaceRegex(clean, DATE_NUMERIC_RE, "[DATE]", "date", removed);
  clean = replaceRegex(clean, DATE_NAMED_RE, "[DATE]", "date", removed);

  clean = replaceAllCI(clean, member.city, "[CITY]", "city", removed);

  // Full name first, then parts of 3+ letters (longest first)
  clean = replaceAllCI(clean, member.name, "[NAME]", "name", removed);
  const parts = member.name
    .split(/\s+/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 3)
    .sort((a, b) => b.length - a.length);
  for (const part of parts) {
    clean = replaceAllCI(clean, part, "[NAME]", "name", removed);
  }

  return { clean, removed };
}
