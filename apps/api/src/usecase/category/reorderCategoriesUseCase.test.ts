import { describe, it, expect, beforeEach, mock } from "bun:test";
import { ReorderCategoriesUseCase } from "./reorderCategoriesUseCase";

// Mock the database module
mock.module("@/db", () => ({
  db: {
    transaction: mock(async (callback) => {
      // Mock transaction that tracks calls
      const mockTx = {
        select: mock(() => ({
          from: mock(() => ({
            where: mock(async () => [
              { id: "cat-1", userId: "user-1", isOther: false, displayOrder: 1, name: "Food" },
              { id: "cat-2", userId: "user-1", isOther: false, displayOrder: 2, name: "Transport" },
              { id: "cat-3", userId: "user-1", isOther: true, displayOrder: 9999, name: "その他" },
            ]),
          })),
        })),
        update: mock(() => ({
          set: mock(() => ({
            where: mock(async () => {}),
          })),
        })),
      };
      return callback(mockTx);
    }),
  },
}));

describe("ReorderCategoriesUseCase", () => {
  let useCase: ReorderCategoriesUseCase;

  beforeEach(() => {
    useCase = new ReorderCategoriesUseCase();
  });

  it("should successfully reorder categories when 'Others' is not included", async () => {
    // Should not throw
    await useCase.execute("user-1", ["cat-2", "cat-1"]);
  });

  it("should throw error when 'Others' category is included in reorder request", async () => {
    expect(useCase.execute("user-1", ["cat-3", "cat-1", "cat-2"])).rejects.toThrow(/Cannot reorder 'Others' category/);
  });

  it("should throw error when reorder list does not include all reorderable categories", async () => {
    expect(useCase.execute("user-1", ["cat-1"])).rejects.toThrow(/Reorder list must include all categories except/);
  });

  it("should throw error for duplicate IDs", async () => {
    expect(useCase.execute("user-1", ["cat-1", "cat-1", "cat-2"])).rejects.toThrow(/Duplicate/);
  });
});
