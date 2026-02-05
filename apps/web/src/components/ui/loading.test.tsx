import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Loading } from "./loading";

describe("Loading", () => {
  it("renders with default props and accessibility attributes", () => {
    render(<Loading />);
    const indicator = screen.getByTestId("loading-indicator");
    expect(indicator).toBeInTheDocument();
    expect(indicator).toHaveAttribute("role", "status");
    expect(indicator).toHaveAttribute("aria-live", "polite");
    expect(indicator).toHaveAttribute("aria-busy", "true");
    expect(indicator).toHaveAttribute("aria-label", "読み込み中");

    const dots = indicator.querySelectorAll(".rounded-full");
    expect(dots).toHaveLength(3);
  });

  it("renders with sm size", () => {
    const { container } = render(<Loading size="sm" />);
    const dots = container.querySelectorAll(".w-1\\.5");
    expect(dots).toHaveLength(3);
  });

  it("renders with md size (default)", () => {
    const { container } = render(<Loading size="md" />);
    const dots = container.querySelectorAll(".w-2");
    expect(dots).toHaveLength(3);
  });

  it("renders with lg size", () => {
    const { container } = render(<Loading size="lg" />);
    const dots = container.querySelectorAll(".w-2\\.5");
    expect(dots).toHaveLength(3);
  });

  it("renders with message and sets aria-label", () => {
    render(<Loading message="データ取得中..." />);
    const indicator = screen.getByTestId("loading-indicator");
    expect(indicator).toHaveAttribute("aria-label", "データ取得中...");
    expect(screen.getByText("データ取得中...")).toBeInTheDocument();
  });

  it("renders without message text by default", () => {
    render(<Loading />);
    const indicator = screen.getByTestId("loading-indicator");
    const message = indicator.querySelector("p");
    expect(message).toBeNull();
  });

  it("renders in fullScreen mode", () => {
    const { container } = render(<Loading fullScreen />);
    const fullScreenDiv = container.querySelector(".min-h-screen");
    expect(fullScreenDiv).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Loading className="custom-class" />);
    const indicator = screen.getByTestId("loading-indicator");
    expect(indicator).toHaveClass("custom-class");
  });

  it("renders dots with responsive color classes", () => {
    render(<Loading />);
    const indicator = screen.getByTestId("loading-indicator");
    const dots = indicator.querySelectorAll(".rounded-full");
    dots.forEach((dot) => {
      expect(dot).toHaveClass("bg-black");
      expect(dot).toHaveClass("dark:bg-white");
    });
  });

  it("applies animation delay to each dot", () => {
    render(<Loading />);
    const indicator = screen.getByTestId("loading-indicator");
    const dots = indicator.querySelectorAll(".rounded-full");
    expect((dots[0] as HTMLElement).style.animationDelay).toBe("0ms");
    expect((dots[1] as HTMLElement).style.animationDelay).toBe("200ms");
    expect((dots[2] as HTMLElement).style.animationDelay).toBe("400ms");
  });
});
