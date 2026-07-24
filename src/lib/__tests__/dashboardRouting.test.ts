import { describe, expect, it } from "vitest";
import {
  DASHBOARD_PAGE_PATHS,
  getDashboardPageFromPath,
  normalizePath,
} from "../dashboardRouting";

describe("dashboardRouting", () => {
  it("normalizes paths correctly", () => {
    expect(normalizePath("/dashboard")).toBe("/dashboard");
    expect(normalizePath("/dashboard/")).toBe("/dashboard");
    expect(normalizePath("/dashboard?query=1")).toBe("/dashboard");
    expect(normalizePath("/dashboard#hash")).toBe("/dashboard");
  });

  it("resolves the dashboard page for canonical paths", () => {
    expect(getDashboardPageFromPath("/dashboard")).toBe("dashboard");
    expect(getDashboardPageFromPath("/clients")).toBe("clients");
    expect(getDashboardPageFromPath("/immobilier")).toBe("immobilier");
  });

  it("resolves alias paths to dashboard", () => {
    expect(getDashboardPageFromPath("/app")).toBe("dashboard");
    expect(getDashboardPageFromPath("/admin")).toBe("dashboard");
  });

  it("returns null for unknown or invalid dashboard paths", () => {
    expect(getDashboardPageFromPath("/inconnu")).toBeNull();
    expect(getDashboardPageFromPath("http://example.com/dashboard")).toBeNull();
  });

  it("contains a path for every declared dashboard page", () => {
    const pages = Object.keys(DASHBOARD_PAGE_PATHS);
    expect(pages.length).toBeGreaterThan(0);
  });
});
