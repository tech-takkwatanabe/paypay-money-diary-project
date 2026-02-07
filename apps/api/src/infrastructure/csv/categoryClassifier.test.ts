import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { matchCategory, getCategoryRules, getDefaultCategoryId, CategoryRule } from "./categoryClassifier";
import { db } from "@/db";

describe("CategoryClassifier", () => {
  afterEach(() => {
    mock.restore();
  });

  describe("matchCategory", () => {
    const rules: CategoryRule[] = [
      { keyword: "Amazon", categoryId: "cat-shopping", priority: 10 },
      { keyword: "Starbucks", categoryId: "cat-cafe", priority: 5 },
      { keyword: "コンビニ", categoryId: "cat-food", priority: 1 },
    ];

    it("should match exact keyword", () => {
      expect(matchCategory("Amazon", rules)).toBe("cat-shopping");
    });

    it("should match partial keyword (case-insensitive)", () => {
      expect(matchCategory("amazon.co.jp", rules)).toBe("cat-shopping");
      expect(matchCategory("STARBUCKS COFFEE", rules)).toBe("cat-cafe");
    });

    it("should return null if no match found", () => {
      expect(matchCategory("Unknown Merchant", rules)).toBe(null);
    });

    it("should respect priority (first match wins because rules are assumed to be sorted)", () => {
      const multiRules: CategoryRule[] = [
        { keyword: "Amazon Pay", categoryId: "cat-pay", priority: 20 },
        { keyword: "Amazon", categoryId: "cat-shopping", priority: 10 },
      ];
      expect(matchCategory("Amazon Pay", multiRules)).toBe("cat-pay");
    });
  });

  describe("getCategoryRules", () => {
    it("should fetch rules for user and system", async () => {
      const mockRules = [
        { keyword: "A", categoryId: "1", priority: 10 },
        { keyword: "B", categoryId: "2", priority: 5 },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(mockRules)),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockRules)),
        };
        return chain as unknown as never;
      });

      const result = await getCategoryRules("user-123");
      expect(result).toEqual(mockRules);
    });
  });

  describe("getDefaultCategoryId", () => {
    it("should return ID for 'その他' category", async () => {
      const mockResult = [{ id: "cat-other" }];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve(mockResult)),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockResult)),
        };
        return chain as unknown as never;
      });

      const id = await getDefaultCategoryId("user-123");
      expect(id).toBe("cat-other");
    });

    it("should return null if 'その他' not found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      const id = await getDefaultCategoryId("user-123");
      expect(id).toBe(null);
    });
  });

  describe("assignCategories", () => {
    it("should assign categories to multiple expenses", async () => {
      const mockRules = [{ keyword: "Amazon", categoryId: "cat-shopping", priority: 10 }];
      const mockDefaultId = "cat-other";

      // Mock getCategoryRules and getDefaultCategoryId via db.select chain
      let callCount = 0;
      spyOn(db, "select").mockImplementation((() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockReturnThis(),
          limit: mock().mockReturnThis(),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => {
            callCount++;
            if (callCount === 1) {
              // First call: getCategoryRules (returns rules array)
              return resolve(mockRules);
            }
            if (callCount === 2) {
              // Second call: getDefaultCategoryId (returns [{ id }])
              return resolve([{ id: mockDefaultId }]);
            }
            return resolve([]);
          }),
        };
        return chain;
      }) as unknown as never);

      const expenses = [{ merchant: "Amazon Pay" }, { merchant: "Unknown Store" }];

      // Act
      // Dynamic import to ensure fresh module load if needed, or simply call exported function
      // Since we are mocking db which is imported by the module, standard import works.
      const result = await import("./categoryClassifier").then((m) => m.assignCategories(expenses, "user-123"));

      // Assert
      expect(result.get("Amazon Pay")).toBe("cat-shopping");
      expect(result.get("Unknown Store")).toBe("cat-other");
    });
  });
});
