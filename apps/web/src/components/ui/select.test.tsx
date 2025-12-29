import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

describe("Select Components", () => {
  describe("SelectTrigger", () => {
    it("renders with default size", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveAttribute("data-size", "default");
      expect(trigger).toHaveAttribute("data-slot", "select-trigger");
    });

    it("renders with small size", () => {
      render(
        <Select>
          <SelectTrigger size="sm">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveAttribute("data-size", "sm");
    });

    it("displays placeholder when no value selected", () => {
      render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Choose an option" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Choose an option")).toBeInTheDocument();
    });

    it("can be disabled", () => {
      render(
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeDisabled();
    });

    it("applies custom className", () => {
      render(
        <Select>
          <SelectTrigger className="custom-class">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );

      const trigger = screen.getByRole("combobox");
      expect(trigger).toHaveClass("custom-class");
    });
  });

  describe("Select with defaultValue", () => {
    it("displays selected value", () => {
      render(
        <Select defaultValue="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Option 1")).toBeInTheDocument();
    });

    it("works with different values", () => {
      render(
        <Select defaultValue="apple">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="apple">Apple</SelectItem>
            <SelectItem value="banana">Banana</SelectItem>
            <SelectItem value="orange">Orange</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Apple")).toBeInTheDocument();
    });
  });

  describe("Controlled Select", () => {
    it("works as controlled component", () => {
      const { rerender } = render(
        <Select value="option1">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Option 1")).toBeInTheDocument();

      rerender(
        <Select value="option2">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="option1">Option 1</SelectItem>
            <SelectItem value="option2">Option 2</SelectItem>
          </SelectContent>
        </Select>
      );

      expect(screen.getByText("Option 2")).toBeInTheDocument();
    });
  });

  describe("SelectValue", () => {
    it("has correct data-slot attribute", () => {
      const { container } = render(
        <Select>
          <SelectTrigger>
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="test">Test</SelectItem>
          </SelectContent>
        </Select>
      );

      const selectValue = container.querySelector('[data-slot="select-value"]');
      expect(selectValue).toBeInTheDocument();
    });
  });
});
