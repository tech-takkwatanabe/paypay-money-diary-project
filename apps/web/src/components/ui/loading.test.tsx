import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Loading } from "./loading";

describe("Loading", () => {
  it("renders with default props", () => {
    const { container } = render(<Loading />);
    const dots = container.querySelectorAll(".bg-pink-500");
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

  it("renders with message", () => {
    render(<Loading message="読み込み中..." />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("renders without message by default", () => {
    const { container } = render(<Loading />);
    const message = container.querySelector("p");
    expect(message).toBeNull();
  });

  it("renders in fullScreen mode", () => {
    const { container } = render(<Loading fullScreen />);
    const fullScreenDiv = container.querySelector(".min-h-screen");
    expect(fullScreenDiv).toBeInTheDocument();
  });

  it("does not render in fullScreen mode by default", () => {
    const { container } = render(<Loading />);
    const fullScreenDiv = container.querySelector(".min-h-screen");
    expect(fullScreenDiv).toBeNull();
  });

  it("applies custom className", () => {
    const { container } = render(<Loading className="custom-class" />);
    const wrapper = container.querySelector(".custom-class");
    expect(wrapper).toBeInTheDocument();
  });

  it("renders all dots with black background", () => {
    const { container } = render(<Loading />);
    const blackDots = container.querySelectorAll(".bg-black");
    expect(blackDots).toHaveLength(3);
  });

  it("renders all dots with custom animation", () => {
    const { container } = render(<Loading />);
    const animatedDots = container.querySelectorAll(".bg-black");
    expect(animatedDots).toHaveLength(3);
    // 各ドットにanimationスタイルが設定されていることを確認
    animatedDots.forEach((dot) => {
      const style = (dot as HTMLElement).style;
      expect(style.animation).toContain("bounce-dot");
    });
  });
});
