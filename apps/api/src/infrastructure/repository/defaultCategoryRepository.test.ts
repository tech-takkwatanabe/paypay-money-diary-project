import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { DefaultCategoryRepository } from "./defaultCategoryRepository";
import { db } from "@/db";

describe("DefaultCategoryRepository", () => {
  const repository = new DefaultCategoryRepository();

  const mockDefaultCategoryData = {
    id: "default-cat-1",
    name: "食費",
    color: "#FF6B6B",
    icon: "utensils",
    displayOrder: 1,
    isDefault: true,
    isOther: false,
  };

  const mockDefaultCategoryDataWithNullIcon = {
    id: "default-cat-2",
    name: "その他",
    color: "#9c9c9c",
    icon: null,
    displayOrder: 9999,
    isDefault: true,
    isOther: true,
  };

  afterEach(() => {
    mock.restore();
  });

  describe("findAll", () => {
    it("should return all default categories sorted by displayOrder", async () => {
      const mockCategories = [mockDefaultCategoryData, mockDefaultCategoryDataWithNullIcon];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(mockCategories)),
        };
        return chain as unknown as never;
      });

      const categories = await repository.findAll();

      expect(categories).toHaveLength(2);
      expect(categories[0].id).toBe("default-cat-1");
      expect(categories[0].name).toBe("食費");
      expect(categories[0].color).toBe("#FF6B6B");
      expect(categories[0].icon).toBe("utensils");
      expect(categories[0].displayOrder).toBe(1);
      expect(categories[0].isDefault).toBe(true);
      expect(categories[0].isOther).toBe(false);

      expect(categories[1].id).toBe("default-cat-2");
      expect(categories[1].icon).toBeNull();
      expect(categories[1].displayOrder).toBe(9999);
    });

    it("should return empty array if no default categories exist", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([])),
        };
        return chain as unknown as never;
      });

      const categories = await repository.findAll();

      expect(categories).toHaveLength(0);
      expect(Array.isArray(categories)).toBe(true);
    });

    it("should preserve all properties including null icon", async () => {
      const mockCategories = [mockDefaultCategoryDataWithNullIcon];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(mockCategories)),
        };
        return chain as unknown as never;
      });

      const categories = await repository.findAll();

      expect(categories[0]).toEqual({
        id: "default-cat-2",
        name: "その他",
        color: "#9c9c9c",
        icon: null,
        displayOrder: 9999,
        isDefault: true,
        isOther: true,
      });
    });

    it("should handle special characters in category names", async () => {
      const specialCharCategory = {
        id: "default-cat-special",
        name: "日用品（生活用品）",
        color: "#FF0000",
        icon: "shopping",
        displayOrder: 5,
        isDefault: true,
        isOther: false,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([specialCharCategory])),
        };
        return chain as unknown as never;
      });

      const categories = await repository.findAll();

      expect(categories[0].name).toBe("日用品（生活用品）");
      expect(categories).toHaveLength(1);
    });

    it("should maintain displayOrder sorting", async () => {
      const unsortedCategories = [
        { ...mockDefaultCategoryData, displayOrder: 5 },
        { ...mockDefaultCategoryData, id: "default-cat-2", displayOrder: 1 },
        { ...mockDefaultCategoryData, id: "default-cat-3", displayOrder: 3 },
      ];

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve(unsortedCategories)),
        };
        return chain as unknown as never;
      });

      const categories = await repository.findAll();

      // Should be sorted by displayOrder passed from database
      expect(categories[0].displayOrder).toBe(5);
      expect(categories[1].displayOrder).toBe(1);
      expect(categories[2].displayOrder).toBe(3);
    });
  });

  describe("findById", () => {
    it("should return default category if found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockDefaultCategoryData])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("default-cat-1");

      expect(category).not.toBeNull();
      expect(category?.id).toBe("default-cat-1");
      expect(category?.name).toBe("食費");
      expect(category?.color).toBe("#FF6B6B");
      expect(category?.icon).toBe("utensils");
      expect(category?.displayOrder).toBe(1);
      expect(category?.isDefault).toBe(true);
      expect(category?.isOther).toBe(false);
    });

    it("should return null if category not found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("non-existent-id");

      expect(category).toBeNull();
    });

    it("should handle null icon property correctly", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockDefaultCategoryDataWithNullIcon])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("default-cat-2");

      expect(category).not.toBeNull();
      expect(category?.icon).toBeNull();
      expect(category?.name).toBe("その他");
      expect(category?.isOther).toBe(true);
    });

    it("should preserve all properties when found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockDefaultCategoryData])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("default-cat-1");

      expect(category).toEqual({
        id: "default-cat-1",
        name: "食費",
        color: "#FF6B6B",
        icon: "utensils",
        displayOrder: 1,
        isDefault: true,
        isOther: false,
      });
    });

    it("should handle special characters in category name", async () => {
      const specialCharCategory = {
        id: "default-cat-special",
        name: "日用品（生活用品）",
        color: "#FF0000",
        icon: "shopping",
        displayOrder: 5,
        isDefault: true,
        isOther: false,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([specialCharCategory])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("default-cat-special");

      expect(category).not.toBeNull();
      expect(category?.name).toBe("日用品（生活用品）");
    });

    it("should handle UUIDs as category IDs", async () => {
      const uuidCategory = {
        id: "550e8400-e29b-41d4-a716-446655440000",
        name: "Test Category",
        color: "#0000FF",
        icon: "test",
        displayOrder: 1,
        isDefault: true,
        isOther: false,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([uuidCategory])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("550e8400-e29b-41d4-a716-446655440000");

      expect(category?.id).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should handle edge case with displayOrder = 0", async () => {
      const zeroOrderCategory = {
        ...mockDefaultCategoryData,
        displayOrder: 0,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([zeroOrderCategory])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("default-cat-1");

      expect(category?.displayOrder).toBe(0);
    });

    it("should handle edge case with very large displayOrder", async () => {
      const largeOrderCategory = {
        ...mockDefaultCategoryData,
        displayOrder: 999999,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([largeOrderCategory])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("default-cat-1");

      expect(category?.displayOrder).toBe(999999);
    });

    it("should handle color code validation", async () => {
      const validColorCodes = [
        { ...mockDefaultCategoryData, color: "#000000" },
        { ...mockDefaultCategoryData, color: "#FFFFFF" },
        { ...mockDefaultCategoryData, color: "#ABC123" },
      ];

      for (const categoryData of validColorCodes) {
        spyOn(db, "select").mockImplementation(() => {
          const chain = {
            from: mock().mockReturnThis(),
            where: mock().mockReturnThis(),
            limit: mock().mockImplementation(() => Promise.resolve([categoryData])),
          };
          return chain as unknown as never;
        });

        const category = await repository.findById("default-cat-1");
        expect(category?.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });

    it("should handle boolean flags correctly", async () => {
      const trueFalseCombinations = [
        { isDefault: true, isOther: false },
        { isDefault: true, isOther: true },
        { isDefault: false, isOther: false },
        { isDefault: false, isOther: true },
      ];

      for (const flags of trueFalseCombinations) {
        const categoryData = {
          ...mockDefaultCategoryData,
          ...flags,
        };

        spyOn(db, "select").mockImplementation(() => {
          const chain = {
            from: mock().mockReturnThis(),
            where: mock().mockReturnThis(),
            limit: mock().mockImplementation(() => Promise.resolve([categoryData])),
          };
          return chain as unknown as never;
        });

        const category = await repository.findById("default-cat-1");
        expect(category?.isDefault).toBe(flags.isDefault);
        expect(category?.isOther).toBe(flags.isOther);
      }
    });
  });

  describe("error handling", () => {
    it("should handle database errors in findAll", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => {
            throw new Error("Database connection failed");
          }),
        };
        return chain as unknown as never;
      });

      try {
        await repository.findAll();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe("Database connection failed");
      }
    });

    it("should handle database errors in findById", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => {
            throw new Error("Database query failed");
          }),
        };
        return chain as unknown as never;
      });

      try {
        await repository.findById("default-cat-1");
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        expect((error as Error).message).toBe("Database query failed");
      }
    });
  });

  describe("data mapping", () => {
    it("should correctly map all properties from database row", async () => {
      const dbRow = {
        id: "db-cat-123",
        name: "Database Category",
        color: "#123ABC",
        icon: "db-icon",
        displayOrder: 42,
        isDefault: false,
        isOther: false,
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([dbRow])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("db-cat-123");

      expect(category).toEqual(dbRow);
    });

    it("should not include extra fields in returned object", async () => {
      const dbRowWithExtra = {
        id: "default-cat-1",
        name: "食費",
        color: "#FF6B6B",
        icon: "utensils",
        displayOrder: 1,
        isDefault: true,
        isOther: false,
        extraField: "should not be returned",
      };

      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([dbRowWithExtra])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("default-cat-1");

      expect(category).not.toHaveProperty("extraField");
      expect(Object.keys(category || {})).toEqual([
        "id",
        "name",
        "color",
        "icon",
        "displayOrder",
        "isDefault",
        "isOther",
      ]);
    });
  });
});
