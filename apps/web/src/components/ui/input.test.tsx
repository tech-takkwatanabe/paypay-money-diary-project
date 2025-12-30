import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Input } from "./input";

describe("Input", () => {
  describe("Variants", () => {
    it("renders form variant correctly", () => {
      render(<Input variant="form" placeholder="Enter text" />);
      const input = screen.getByPlaceholderText("Enter text");
      expect(input).toHaveClass("px-4");
      expect(input).toHaveClass("py-3");
      expect(input).toHaveClass("rounded-xl");
    });

    it("renders filter variant correctly", () => {
      render(<Input variant="filter" placeholder="Filter..." />);
      const input = screen.getByPlaceholderText("Filter...");
      expect(input).toHaveClass("px-4");
      expect(input).toHaveClass("py-2");
      expect(input).toHaveClass("rounded-lg");
    });
  });

  describe("Attributes", () => {
    it("renders with custom type", () => {
      render(<Input type="password" placeholder="Password" />);
      const input = screen.getByPlaceholderText("Password");
      expect(input).toHaveAttribute("type", "password");
    });

    it("handles disabled state", () => {
      render(<Input disabled placeholder="Disabled" />);
      const input = screen.getByPlaceholderText("Disabled");
      expect(input).toBeDisabled();
      expect(input).toHaveClass("disabled:opacity-50");
    });

    it("applies custom className", () => {
      render(<Input className="custom-class" placeholder="Custom" />);
      const input = screen.getByPlaceholderText("Custom");
      expect(input).toHaveClass("custom-class");
    });
  });

  describe("Events", () => {
    it("calls onChange when value changes", () => {
      const handleChange = vi.fn();
      render(<Input onChange={handleChange} placeholder="Type here" />);
      const input = screen.getByPlaceholderText("Type here");

      fireEvent.change(input, { target: { value: "new value" } });
      expect(handleChange).toHaveBeenCalledTimes(1);
    });
  });
});
