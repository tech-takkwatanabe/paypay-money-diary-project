"use client";

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Toast } from "./toast";

describe("Toast", () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders success toast correctly", () => {
    render(<Toast id="1" message="Success Message" type="success" onClose={mockOnClose} />);

    expect(screen.getByText("Success Message")).toBeInTheDocument();
    // Check for success color class (partial match since we use template literal)
    expect(screen.getByText("Success Message").closest("div")).toHaveClass("bg-green-50");
  });

  it("renders error toast correctly", () => {
    render(<Toast id="1" message="Error Message" type="error" onClose={mockOnClose} />);

    expect(screen.getByText("Error Message")).toBeInTheDocument();
    expect(screen.getByText("Error Message").closest("div")).toHaveClass("bg-red-50");
  });

  it("calls onClose after default duration", () => {
    render(<Toast id="1" message="Message" onClose={mockOnClose} />);

    // Default duration is 3000ms
    act(() => {
      vi.advanceTimersByTime(3000);
    });

    // It should trigger handleClose which sets isExiting and then calls onClose after 300ms
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockOnClose).toHaveBeenCalledWith("1");
  });

  it("calls onClose when close button is clicked", async () => {
    render(<Toast id="1" message="Message" onClose={mockOnClose} />);

    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);

    // Should call onClose after animation delay (300ms)
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockOnClose).toHaveBeenCalledWith("1");
  });

  it("supports custom duration", () => {
    render(<Toast id="1" message="Message" duration={5000} onClose={mockOnClose} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(mockOnClose).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(2000 + 300);
    });
    expect(mockOnClose).toHaveBeenCalledWith("1");
  });
});
