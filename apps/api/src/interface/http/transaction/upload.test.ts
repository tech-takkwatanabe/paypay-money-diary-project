import { describe, it, expect, mock, beforeEach, spyOn, afterEach } from "bun:test";
import { Hono } from "hono";
import { uploadCsvHandler } from "./upload";
import { UploadCsvUseCase } from "@/usecase/transaction/uploadCsvUseCase";

describe("uploadCsvHandler", () => {
  let app: Hono<{ Variables: { user: { userId: string; email: string } } }>;
  const testUser = { userId: "user-123", email: "test@example.com" };

  beforeEach(() => {
    app = new Hono<{ Variables: { user: { userId: string; email: string } } }>();
    app.use("*", async (c, next) => {
      c.set("user", testUser);
      await next();
    });
    app.post("/upload", uploadCsvHandler);
  });

  afterEach(() => {
    mock.restore();
  });

  it("should return 201 on successful upload", async () => {
    // Arrange
    const mockResult = {
      uploadId: "upload-1",
      totalRows: 10,
      importedRows: 8,
      skippedRows: 1,
      duplicateRows: 1,
    };
    const spy = spyOn(UploadCsvUseCase.prototype, "execute").mockResolvedValue(mockResult);

    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/csv" }), "test.csv");

    // Act
    const res = await app.request("/upload", {
      method: "POST",
      body: formData,
    });

    // Assert
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.uploadId).toBe("upload-1");
    expect(spy).toHaveBeenCalled();
  });

  it("should return 400 if no file provided", async () => {
    // Act
    const res = await app.request("/upload", {
      method: "POST",
      body: new FormData(),
    });

    // Assert
    expect(res.status).toBe(400);
  });

  it("should return 400 if file is not CSV", async () => {
    // Arrange
    const formData = new FormData();
    formData.append("file", new Blob(["test"], { type: "text/plain" }), "test.txt");

    // Act
    const res = await app.request("/upload", {
      method: "POST",
      body: formData,
    });

    // Assert
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Only CSV files are allowed");
  });
});
