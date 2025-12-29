import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./button";

describe("Button", () => {
  describe("Variants", () => {
    it("renders default variant correctly", () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole("button", { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-primary");
    });

    it("renders destructive variant correctly", () => {
      render(<Button variant="destructive">Delete</Button>);
      const button = screen.getByRole("button", { name: /delete/i });
      expect(button).toHaveClass("bg-destructive");
    });

    it("renders outline variant correctly", () => {
      render(<Button variant="outline">Outline</Button>);
      const button = screen.getByRole("button", { name: /outline/i });
      expect(button).toHaveClass("border");
    });

    it("renders secondary variant correctly", () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole("button", { name: /secondary/i });
      expect(button).toHaveClass("bg-secondary");
    });

    it("renders ghost variant correctly", () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole("button", { name: /ghost/i });
      expect(button).toHaveClass("hover:bg-accent");
    });

    it("renders link variant correctly", () => {
      render(<Button variant="link">Link</Button>);
      const button = screen.getByRole("button", { name: /link/i });
      expect(button).toHaveClass("underline-offset-4");
    });
  });

  describe("Sizes", () => {
    it("renders default size correctly", () => {
      render(<Button>Default</Button>);
      const button = screen.getByRole("button", { name: /default/i });
      expect(button).toHaveClass("h-9");
    });

    it("renders sm size correctly", () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole("button", { name: /small/i });
      expect(button).toHaveClass("h-8");
    });

    it("renders lg size correctly", () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole("button", { name: /large/i });
      expect(button).toHaveClass("h-10");
    });

    it("renders icon size correctly", () => {
      render(<Button size="icon" aria-label="Icon button" />);
      const button = screen.getByRole("button", { name: /icon button/i });
      expect(button).toHaveClass("size-9");
    });
  });

  describe("States", () => {
    it("handles disabled state correctly", () => {
      render(<Button disabled>Disabled</Button>);
      const button = screen.getByRole("button", { name: /disabled/i });
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:opacity-50");
    });

    it("handles click events", async () => {
      const user = userEvent.setup();
      let clicked = false;
      const handleClick = () => {
        clicked = true;
      };

      render(<Button onClick={handleClick}>Click me</Button>);
      const button = screen.getByRole("button", { name: /click me/i });

      await user.click(button);
      expect(clicked).toBe(true);
    });

    it("does not trigger click when disabled", async () => {
      const user = userEvent.setup();
      let clicked = false;
      const handleClick = () => {
        clicked = true;
      };

      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );
      const button = screen.getByRole("button", { name: /disabled/i });

      await user.click(button);
      expect(clicked).toBe(false);
    });
  });

  describe("AsChild", () => {
    it("renders as child component when asChild is true", () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      const link = screen.getByRole("link", { name: /link button/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
    });
  });
});
