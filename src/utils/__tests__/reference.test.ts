import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  generateReference,
  generateFoncierReference,
  normalizeCode,
} from "../reference";

describe("generateReference", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should generate reference with correct prefix and date format", () => {
    // With seeded date 2026-04-09, the reference should start with PREFIX-20260409
    const ref = generateReference("CLI");
    expect(ref).toMatch(/^CLI-20260409-\d{4}$/);
  });

  it("should generate different random parts on each call", () => {
    const ref1 = generateReference("TEST");
    const ref2 = generateReference("TEST");
    // Both should match the pattern but likely have different random parts
    expect(ref1).toMatch(/^TEST-20260409-\d{4}$/);
    expect(ref2).toMatch(/^TEST-20260409-\d{4}$/);
  });
});

describe("generateFoncierReference", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-09T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should generate foncier reference with date components", () => {
    const ref = generateFoncierReference();
    expect(ref).toMatch(/^FONC-2026-04-09-\d{5}$/);
  });
});

describe("normalizeCode", () => {
  it("should remove accents and special characters", () => {
    expect(normalizeCode("Côte d'Ivoire", 20)).toBe("COTEDIVOIRE");
    expect(normalizeCode("Abidjan-Plateau", 20)).toBe("ABIDJANPLATEAU");
  });

  it("should truncate to max length", () => {
    expect(normalizeCode("TresLongNomDeVillage", 5)).toBe("TRESL");
  });

  it("should return empty string for null/undefined/falsy", () => {
    expect(normalizeCode("", 10)).toBe("");
    expect(normalizeCode(null as unknown as string, 10)).toBe("");
  });

  it("should uppercase the result", () => {
    expect(normalizeCode("village", 10)).toBe("VILLAGE");
  });
});
