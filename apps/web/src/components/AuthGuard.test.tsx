import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AuthGuard } from "./AuthGuard";
import { AuthProvider } from "@/contexts/AuthContext";
import type { User } from "@/api/models";

// Mock next/navigation
const mockPush = vi.fn();
const mockPathname = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname(),
}));

// Mock API functions
const mockGetAuthMe = vi.fn();
const mockPostAuthLogout = vi.fn();

vi.mock("@/api/generated/auth/auth", () => ({
  getAuthMe: () => mockGetAuthMe(),
  postAuthLogout: () => mockPostAuthLogout(),
}));

describe("AuthGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("shows loading spinner while checking authentication", () => {
      mockGetAuthMe.mockImplementation(() => new Promise(() => {})); // Never resolves
      mockPathname.mockReturnValue("/");

      render(
        <AuthProvider>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </AuthProvider>
      );

      expect(screen.getByText("読み込み中...")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });

  describe("Public Pages", () => {
    it("allows unauthenticated users to access login page", async () => {
      mockGetAuthMe.mockResolvedValue({ status: 401 });
      mockPathname.mockReturnValue("/login");

      render(
        <AuthProvider>
          <AuthGuard>
            <div>Login Page</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Login Page")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("allows unauthenticated users to access signup page", async () => {
      mockGetAuthMe.mockResolvedValue({ status: 401 });
      mockPathname.mockReturnValue("/signup");

      render(
        <AuthProvider>
          <AuthGuard>
            <div>Signup Page</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Signup Page")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("redirects authenticated users from login page to home", async () => {
      const mockUser: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });
      mockPathname.mockReturnValue("/login");

      render(
        <AuthProvider>
          <AuthGuard>
            <div>Login Page</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });

      expect(screen.queryByText("Login Page")).not.toBeInTheDocument();
    });

    it("redirects authenticated users from signup page to home", async () => {
      const mockUser: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });
      mockPathname.mockReturnValue("/signup");

      render(
        <AuthProvider>
          <AuthGuard>
            <div>Signup Page</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/");
      });

      expect(screen.queryByText("Signup Page")).not.toBeInTheDocument();
    });
  });

  describe("Protected Pages", () => {
    it("shows children for authenticated users on protected pages", async () => {
      const mockUser: User = {
        id: "user-123",
        name: "Test User",
        email: "test@example.com",
      };

      mockGetAuthMe.mockResolvedValue({
        status: 200,
        data: mockUser,
      });
      mockPathname.mockReturnValue("/");

      render(
        <AuthProvider>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Protected Content")).toBeInTheDocument();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("redirects unauthenticated users from protected pages to login", async () => {
      mockGetAuthMe.mockResolvedValue({ status: 401 });
      mockPathname.mockReturnValue("/");

      render(
        <AuthProvider>
          <AuthGuard>
            <div>Protected Content</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });

      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });

    it("redirects unauthenticated users from any protected route", async () => {
      mockGetAuthMe.mockResolvedValue({ status: 401 });
      mockPathname.mockReturnValue("/dashboard");

      render(
        <AuthProvider>
          <AuthGuard>
            <div>Dashboard</div>
          </AuthGuard>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/login");
      });

      expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    });
  });
});
