import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Link } from "./link";

describe("Link", () => {
  describe("Variants", () => {
    it("renders default variant correctly", () => {
      render(<Link href="/test">Default Link</Link>);
      const link = screen.getByRole("link", { name: /default link/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/test");
      expect(link).toHaveClass("text-red-500");
    });

    it("renders brand variant correctly", () => {
      render(
        <Link href="/test" variant="brand">
          Brand Link
        </Link>
      );
      const link = screen.getByRole("link", { name: /brand link/i });
      expect(link).toHaveClass("bg-linear-to-r");
      expect(link).toHaveClass("from-red-500");
    });

    it("renders outline variant correctly", () => {
      render(
        <Link href="/test" variant="outline">
          Outline Link
        </Link>
      );
      const link = screen.getByRole("link", { name: /outline link/i });
      expect(link).toHaveClass("border");
      expect(link).toHaveClass("text-gray-600");
    });

    it("renders ghost variant correctly", () => {
      render(
        <Link href="/test" variant="ghost">
          Ghost Link
        </Link>
      );
      const link = screen.getByRole("link", { name: /ghost link/i });
      expect(link).toHaveClass("text-muted-foreground");
      expect(link).toHaveClass("hover:text-foreground");
    });
  });

  describe("Attributes", () => {
    it("applies custom className", () => {
      render(
        <Link href="/test" className="custom-class">
          Custom
        </Link>
      );
      const link = screen.getByRole("link", { name: /custom/i });
      expect(link).toHaveClass("custom-class");
    });

    it("renders children correctly", () => {
      render(
        <Link href="/test">
          <span>Icon</span>
          <span>Text</span>
        </Link>
      );
      expect(screen.getByText("Icon")).toBeInTheDocument();
      expect(screen.getByText("Text")).toBeInTheDocument();
    });
  });
});
