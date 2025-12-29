import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthProvider, useAuth } from "./AuthContext";
import type { User } from "@/api/models";

// Mock API functions
const mockGetAuthMe = vi.fn();
const mockPostAuthLogout = vi.fn();

vi.mock("@/api/generated/auth/auth", () => ({
  getAuthMe: () => mockGetAuthMe(),
  postAuthLogout: () => mockPostAuthLogout(),
}));

// Test component to access context
function TestComponent() {
  const { user, isLoading, isAuthenticated, login, logout, refreshUser } = useAuth();

  return (
    <div>
      <div data-testid="is-loading">{String(isLoading)}</div>
      <div data-testid="is-authenticated">{String(isAuthenticated)}</div>
      <div data-testid="user-name">{user?.name || "null"}</div>
      <button onClick={login}>Login</button>
      <button onClick={logout}>Logout</button>
      <button onClick={refreshUser}>Refresh</button>
    </div>
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("starts with loading state", () => {
      mockGetAuthMe.mockResolvedValue({ status: 401 });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId("is-loading")).toHaveTextContent("true");
    });

    it("loads user on mount if authenticated", async () => {
      const mockUser: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
      expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
    });

    it("sets user to null if not authenticated", async () => {
      mockGetAuthMe.mockResolvedValue({ status: 401 });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      });

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
      expect(screen.getByTestId("user-name")).toHaveTextContent("null");
    });
  });

  describe("login", () => {
    it("refreshes user data on login", async () => {
      mockGetAuthMe.mockResolvedValue({ status: 401 });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      });

      const mockUser: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });

      const loginButton = screen.getByText("Login");
      loginButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("true");
    });
  });

  describe("logout", () => {
    it("clears user data on logout", async () => {
      const mockUser: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      mockPostAuthLogout.mockResolvedValue({ status: 200 });

      const logoutButton = screen.getByText("Logout");
      logoutButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("null");
      });

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
      expect(mockPostAuthLogout).toHaveBeenCalledOnce();
    });

    it("clears user data even if logout API fails", async () => {
      const mockUser: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      mockPostAuthLogout.mockRejectedValue(new Error("Network error"));

      const logoutButton = screen.getByText("Logout");
      logoutButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("null");
      });

      expect(screen.getByTestId("is-authenticated")).toHaveTextContent("false");
    });
  });

  describe("refreshUser", () => {
    it("updates user data when called", async () => {
      mockGetAuthMe.mockResolvedValue({ status: 401 });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("is-loading")).toHaveTextContent("false");
      });

      const mockUser: User = {
        id: "user-123",
        name: "Updated User",
        email: "updated@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });

      const refreshButton = screen.getByText("Refresh");
      refreshButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Updated User");
      });
    });

    it("clears user data if API returns error", async () => {
      const mockUser: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("Test User");
      });

      mockGetAuthMe.mockRejectedValue(new Error("Unauthorized"));

      const refreshButton = screen.getByText("Refresh");
      refreshButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("user-name")).toHaveTextContent("null");
      });
    });
  });

  describe("useAuth hook", () => {
    it("throws error when used outside AuthProvider", () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleError.mockRestore();
    });
  });
});
