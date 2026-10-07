import { describe, expect, it } from "vitest";
import { tasksRepository } from "./tasks.repository";

describe("tasksRepository", () => {
  it("should return error for invalid id on getById", async () => {
    const result = await tasksRepository.getById("invalid-id");
    expect(result.error).toBe("ID invalide");
    expect(result.data).toBeNull();
  });
});
