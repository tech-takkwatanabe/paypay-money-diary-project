"use client";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Toaster } from "./toaster";
import { useToast } from "@/contexts/ToastContext";

// Mock useToast hook
vi.mock("@/contexts/ToastContext", () => ({
  useToast: vi.fn(),
}));

describe("Toaster", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when there are no toasts", () => {
    vi.mocked(useToast).mockReturnValue({
      toasts: [],
      removeToast: vi.fn(),
      addToast: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    });

    const { container } = render(<Toaster />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });

  it("renders multiple toasts", () => {
    vi.mocked(useToast).mockReturnValue({
      toasts: [
        { id: "1", message: "Message 1", type: "success" },
        { id: "2", message: "Message 2", type: "error" },
      ],
      removeToast: vi.fn(),
      addToast: vi.fn(),
      success: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
    });

    render(<Toaster />);

    expect(screen.getByText("Message 1")).toBeInTheDocument();
    expect(screen.getByText("Message 2")).toBeInTheDocument();
  });
});
