import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SelectNative } from "./select-native";

describe("SelectNative", () => {
  describe("Variants", () => {
    it("renders default variant correctly", () => {
      render(
        <SelectNative variant="default">
          <option value="1">Option 1</option>
        </SelectNative>
      );
      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("text-lg");
      expect(select).toHaveClass("font-semibold");
    });

    it("renders filter variant correctly", () => {
      render(
        <SelectNative variant="filter">
          <option value="1">Option 1</option>
        </SelectNative>
      );
      const select = screen.getByRole("combobox");
      expect(select).toHaveClass("px-3");
      expect(select).toHaveClass("py-2");
    });
  });

  describe("Functionality", () => {
    it("renders options correctly", () => {
      render(
        <SelectNative>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </SelectNative>
      );
      expect(screen.getByText("Option 1")).toBeInTheDocument();
      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });

    it("handles value changes", () => {
      const handleChange = vi.fn();
      render(
        <SelectNative onChange={handleChange}>
          <option value="1">Option 1</option>
          <option value="2">Option 2</option>
        </SelectNative>
      );
      const select = screen.getByRole("combobox");

      fireEvent.change(select, { target: { value: "2" } });
      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(select).toHaveValue("2");
    });

    it("handles disabled state", () => {
      render(
        <SelectNative disabled>
          <option value="1">Option 1</option>
        </SelectNative>
      );
      const select = screen.getByRole("combobox");
      expect(select).toBeDisabled();
      expect(select).toHaveClass("disabled:opacity-50");
    });
  });
});
