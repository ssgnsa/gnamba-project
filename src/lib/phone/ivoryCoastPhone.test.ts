import { describe, expect, it } from "vitest";
import {
  IVORIAN_PHONE_REGEX,
  normalizeIvoryCoastPhone,
  validateIvoryCoastPhone,
} from "./ivoryCoastPhone";

describe("Ivory Coast phone validation", () => {
  it.each([
    ["0707381563", "+2250707381563"],
    ["0700000000", "+2250700000000"],
    ["+2250707381563", "+2250707381563"],
    ["+225 07 07 38 15 63", "+2250707381563"],
    ["07 07 38 15 63", "+2250707381563"],
  ])("accepts %s", (value, expected) => {
    expect(IVORIAN_PHONE_REGEX.test(value)).toBe(true);
    expect(validateIvoryCoastPhone(value)).toBeNull();
    expect(normalizeIvoryCoastPhone(value)).toBe(expected);
  });

  it.each([
    "070738156",
    "07073815630",
    "0607381563",
    "0807381563",
    "+2260707381563",
    "abcdef",
    "+225",
  ])("rejects invalid %s", (value) => {
    expect(validateIvoryCoastPhone(value)).not.toBeNull();
  });
});
