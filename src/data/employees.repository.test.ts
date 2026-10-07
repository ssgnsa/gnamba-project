import { describe, expect, it } from "vitest";
import { employeesRepository } from "./employees.repository";

describe("employeesRepository", () => {
  it("should return error for invalid id on getById", async () => {
    const result = await employeesRepository.getById("invalid-id");
    expect(result.error).toBe("ID invalide");
    expect(result.data).toBeNull();
  });
});
