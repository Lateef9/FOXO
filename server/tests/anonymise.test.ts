import { beforeAll, describe, expect, it } from "vitest";
import { anonymise, pseudoId } from "../src/privacy/anonymise.js";
import { loadData } from "../src/loader.js";

beforeAll(() => {
  process.env.PSEUDO_SALT = process.env.PSEUDO_SALT || "test-salt";
});

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

describe("anonymise", () => {
  const data = loadData();

  for (const member of data.members) {
    it(`cleans identifiers for ${member.id} (${member.name})`, () => {
      const { clean, removed } = anonymise(member.history_text, member);

      for (const part of member.name.split(/\s+/).filter((p) => p.length >= 3)) {
        expect(clean.toLowerCase()).not.toContain(part.toLowerCase());
      }
      expect(clean.toLowerCase()).not.toContain(member.city.toLowerCase());
      expect(clean.toLowerCase()).not.toContain(member.email.toLowerCase());

      const cleanDigits = digitsOnly(clean);
      const phoneDigits = digitsOnly(member.phone);
      // last 10 digits of Indian number should not appear contiguously
      expect(cleanDigits.includes(phoneDigits.slice(-10))).toBe(false);

      expect(clean).toContain(String(member.age));
      expect(removed.length).toBeGreaterThan(0);
      expect(removed.some((r) => r.type === "name")).toBe(true);
      expect(removed.some((r) => r.type === "city")).toBe(true);
      expect(removed.some((r) => r.type === "email")).toBe(true);
      expect(removed.some((r) => r.type === "phone")).toBe(true);
    });
  }

  it("replaces numeric and named dates with [DATE]", () => {
    const member = data.members[0]!;
    const text = `Born on 12/03/1990 or 12 March 1990 in ${member.city}.`;
    const { clean, removed } = anonymise(text, member);
    expect(clean).toContain("[DATE]");
    expect(clean).not.toContain("12/03/1990");
    expect(clean).not.toMatch(/12 March 1990/i);
    expect(removed.filter((r) => r.type === "date")).toHaveLength(2);
  });

  it("is case-insensitive for name and city", () => {
    const member = data.members[0]!;
    const upper = member.name.toUpperCase();
    const cityUpper = member.city.toUpperCase();
    const { clean } = anonymise(`${upper} lives in ${cityUpper}`, member);
    expect(clean).toBe("[NAME] lives in [CITY]");
  });

  it("pseudoId is stable and different per member", () => {
    const ids = data.members.map((m) => pseudoId(m));
    expect(ids[0]).toMatch(/^P-[0-9a-f]{6}$/);
    expect(pseudoId(data.members[0]!)).toBe(ids[0]);
    expect(new Set(ids).size).toBe(data.members.length);
  });

  it("Meera cleaned history is readable without identifiers", () => {
    const meera = data.members.find((m) => m.id === "m1")!;
    const { clean } = anonymise(meera.history_text, meera);
    expect(clean).not.toMatch(/Meera|Nair|Bengaluru/i);
    expect(clean).not.toContain("meera.nair@example.com");
    expect(clean).not.toContain("98765");
    expect(clean).toContain("34");
    expect(clean).toContain("[NAME]");
    expect(clean).toContain("[CITY]");
    expect(clean).toContain("[EMAIL]");
    expect(clean).toContain("[PHONE]");
    expect(clean.length).toBeGreaterThan(40);
  });
});
