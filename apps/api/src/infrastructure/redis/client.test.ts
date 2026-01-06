import { describe, it, expect, mock, beforeEach } from "bun:test";

// Mock ioredis before importing the client
const mockGet = mock(() => Promise.resolve("value"));
const mockSetex = mock(() => Promise.resolve("OK"));
const mockDel = mock(() => Promise.resolve(1));
const mockOn = mock(() => ({}));

let constructorCount = 0;

mock.module("ioredis", () => {
  return {
    default: class {
      constructor() {
        constructorCount++;
      }
      get = mockGet;
      setex = mockSetex;
      del = mockDel;
      on = mockOn;
    },
  };
});

// Import the client after mocking ioredis
import { redis } from "./client";

describe("Redis Infrastructure", () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockSetex.mockClear();
    mockDel.mockClear();
    mockOn.mockClear();
  });

  it("should initialize Redis instance only when a method is called and register default handlers", async () => {
    const initialCount = constructorCount;

    // First call should trigger initialization
    await redis.get("test-key");
    expect(constructorCount).toBe(initialCount + 1);

    // Should have registered default error and connect handlers on initialization
    // These are called in the instance getter in client.ts
    expect(mockOn).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockOn).toHaveBeenCalledWith("connect", expect.any(Function));

    // Second call should not trigger initialization again
    await redis.get("test-key");
    expect(constructorCount).toBe(initialCount + 1);
  });

  it("should proxy get method correctly", async () => {
    const result = await redis.get("my-key");
    expect(result).toBe("value");
    expect(mockGet).toHaveBeenCalledWith("my-key");
  });

  it("should proxy setex method correctly", async () => {
    const result = await redis.setex("my-key", 3600, "my-value");
    expect(result).toBe("OK");
    expect(mockSetex).toHaveBeenCalledWith("my-key", 3600, "my-value");
  });

  it("should proxy del method correctly", async () => {
    const result = await redis.del("key1", "key2");
    expect(result).toBe(1);
    expect(mockDel).toHaveBeenCalledWith("key1", "key2");
  });

  it("should proxy on method correctly", () => {
    const handler = () => {};
    redis.on("connect", handler);
    expect(mockOn).toHaveBeenCalledWith("connect", handler);
  });
});
