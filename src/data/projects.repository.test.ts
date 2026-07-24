import { describe, expect, it } from "vitest";
import { projectsRepository } from "./projects.repository";

describe("projectsRepository", () => {
  it("should return error for invalid id on getById", async () => {
    const result = await projectsRepository.getById("invalid-id");
    expect(result.error).toBe("ID invalide");
    expect(result.data).toBeNull();
  });
});
