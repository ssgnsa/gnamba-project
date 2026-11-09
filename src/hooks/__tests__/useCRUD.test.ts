import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useCRUD } from "../useCRUD";

interface Item {
  id: number;
  name: string;
}

describe("useCRUD", () => {
  it("returns empty items by default", () => {
    const { result } = renderHook(() => useCRUD<Item>({ autoLoad: false }));
    expect(result.current.items).toEqual([]);
  });

  it("loads items with autoLoad", async () => {
    const mockItems: Item[] = [{ id: 1, name: "Test" }];
    const list = vi.fn().mockResolvedValue(mockItems);
    const { result } = renderHook(() =>
      useCRUD<Item>({ list, autoLoad: true }),
    );

    await waitFor(() => {
      expect(result.current.items).toEqual(mockItems);
    });
    expect(list).toHaveBeenCalledTimes(1);
  });

  it("creates an item and adds it to the local list", async () => {
    const createdItem: Item = { id: 1, name: "New" };
    const create = vi.fn().mockResolvedValue(createdItem);
    const { result } = renderHook(() =>
      useCRUD<Item>({ create, autoLoad: false }),
    );

    await act(async () => {
      await result.current.create({ name: "New" });
    });

    expect(create).toHaveBeenCalledWith({ name: "New" });
    expect(result.current.items).toEqual([createdItem]);
  });

  it("sets error when list fails", async () => {
    const list = vi.fn().mockRejectedValue(new Error("Failed to load"));
    const { result } = renderHook(() =>
      useCRUD<Item>({ list, autoLoad: true }),
    );

    await waitFor(() => {
      expect(result.current.error).toBe("Failed to load");
    });
  });

  it("sets loading state while the list request is pending", async () => {
    let resolveList: ((items: Item[]) => void) | undefined;
    const list = vi.fn(
      () => new Promise<Item[]>((resolve) => {
        resolveList = resolve;
      }),
    );

    const { result } = renderHook(() =>
      useCRUD<Item>({ list, autoLoad: true }),
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolveList?.([{ id: 2, name: "Loaded" }]);
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.items).toEqual([{ id: 2, name: "Loaded" }]);
    });
  });
});
