import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { getAvailableYearsHandler } from "./availableYears";
import { db } from "@/db";

describe("getAvailableYearsHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.get("/years", getAvailableYearsHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 200 and list of years extracted from file names", async () => {
    // Arrange
    const mockUploads = [
      { fileName: "Transactions_20240101-20241231.csv" },
      { fileName: "Transactions_20230101-20231231.csv" },
    ];

    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockImplementation(() => Promise.resolve(mockUploads)),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve(mockUploads)),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/years");

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.years).toEqual([2024, 2023]);
  });

  it("should return current year if no uploads found", async () => {
    // Arrange
    spyOn(db, "select").mockImplementation(() => {
      const chain = {
        from: mock().mockReturnThis(),
        where: mock().mockImplementation(() => Promise.resolve([])),
        then: mock().mockImplementation((resolve: (val: unknown) => void) => resolve([])),
      };
      return chain as unknown as never;
    });

    // Act
    const res = await app.request("/years");

    // Assert
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.years).toEqual([new Date().getFullYear()]);
  });
});
