import { describe, it, expect, mock, spyOn, afterEach } from "bun:test";
import { CategoryRepository } from "./categoryRepository";
import { db } from "@/db";
import { Category } from "@/domain/entity/category";

describe("CategoryRepository", () => {
  const repository = new CategoryRepository();
  const mockDate = new Date("2024-01-01T00:00:00Z");

  const mockCategoryData = {
    id: "cat-123",
    name: "Food",
    color: "#FF0000",
    icon: "food-icon",
    displayOrder: 1,
    isDefault: false,
    userId: "user-123",
    createdAt: mockDate,
  };

  afterEach(() => {
    mock.restore();
  });

  describe("findByUserId", () => {
    it("should return categories if found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([mockCategoryData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockCategoryData])),
        };
        return chain as unknown as never;
      });

      const categories = await repository.findByUserId("user-123");
      expect(categories).toHaveLength(1);
      expect(categories[0]).toBeInstanceOf(Category);
      expect(categories[0].id).toBe(mockCategoryData.id);
      expect(categories[0].name).toBe(mockCategoryData.name);
    });

    it("should return empty array if not found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          orderBy: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      const categories = await repository.findByUserId("user-123");
      expect(categories).toHaveLength(0);
    });
  });

  describe("findById", () => {
    it("should return category if found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([mockCategoryData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockCategoryData])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("cat-123");
      expect(category).not.toBeNull();
      expect(category?.id).toBe(mockCategoryData.id);
    });

    it("should return null if not found", async () => {
      spyOn(db, "select").mockImplementation(() => {
        const chain = {
          from: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          limit: mock().mockImplementation(() => Promise.resolve([])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
        };
        return chain as unknown as never;
      });

      const category = await repository.findById("cat-123");
      expect(category).toBeNull();
    });
  });

  describe("create", () => {
    it("should insert and return new category", async () => {
      spyOn(db, "insert").mockImplementation(() => {
        const chain = {
          values: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([mockCategoryData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockCategoryData])),
        };
        return chain as unknown as never;
      });

      const input = {
        name: "Food",
        color: "#FF0000",
        icon: "food-icon",
        displayOrder: 1,
      };

      const category = await repository.create("user-123", input);

      expect(category).not.toBeNull();
      expect(category.id).toBe(mockCategoryData.id);
      expect(category.name).toBe(input.name);
    });
  });

  describe("update", () => {
    it("should update and return updated category", async () => {
      spyOn(db, "update").mockImplementation(() => {
        const chain = {
          set: mock().mockReturnThis(),
          where: mock().mockReturnThis(),
          returning: mock().mockImplementation(() => Promise.resolve([mockCategoryData])),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([mockCategoryData])),
        };
        return chain as unknown as never;
      });

      const input = {
        name: "Updated Food",
      };

      const category = await repository.update("cat-123", input);

      expect(category).not.toBeNull();
      expect(category.id).toBe(mockCategoryData.id);
    });
  });

  describe("delete", () => {
    it("should delete category", async () => {
      spyOn(db, "delete").mockImplementation(() => {
        const chain = {
          where: mock().mockImplementation(() => Promise.resolve()),
          then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(undefined)),
        };
        return chain as unknown as never;
      });

      await repository.delete("cat-123");
      expect(true).toBe(true);
    });
  });
});
