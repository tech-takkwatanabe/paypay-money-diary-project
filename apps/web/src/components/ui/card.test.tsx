import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardAction } from "./card";

describe("Card Components", () => {
  describe("Card", () => {
    it("renders children correctly", () => {
      render(<Card>Card content</Card>);
      expect(screen.getByText("Card content")).toBeInTheDocument();
    });

    it("applies custom className", () => {
      const { container } = render(<Card className="custom-class">Content</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveClass("custom-class");
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<Card>Content</Card>);
      const card = container.querySelector('[data-slot="card"]');
      expect(card).toHaveAttribute("data-slot", "card");
    });
  });

  describe("CardHeader", () => {
    it("renders children correctly", () => {
      render(<CardHeader>Header content</CardHeader>);
      expect(screen.getByText("Header content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardHeader>Content</CardHeader>);
      const header = container.querySelector('[data-slot="card-header"]');
      expect(header).toHaveAttribute("data-slot", "card-header");
    });
  });

  describe("CardTitle", () => {
    it("renders title text correctly", () => {
      render(<CardTitle>Title</CardTitle>);
      expect(screen.getByText("Title")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText("Title");
      expect(title).toHaveAttribute("data-slot", "card-title");
    });

    it("applies font-semibold class", () => {
      render(<CardTitle>Title</CardTitle>);
      const title = screen.getByText("Title");
      expect(title).toHaveClass("font-semibold");
    });
  });

  describe("CardDescription", () => {
    it("renders description text correctly", () => {
      render(<CardDescription>Description</CardDescription>);
      expect(screen.getByText("Description")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      render(<CardDescription>Description</CardDescription>);
      const description = screen.getByText("Description");
      expect(description).toHaveAttribute("data-slot", "card-description");
    });
  });

  describe("CardContent", () => {
    it("renders content correctly", () => {
      render(<CardContent>Content</CardContent>);
      expect(screen.getByText("Content")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardContent>Content</CardContent>);
      const content = container.querySelector('[data-slot="card-content"]');
      expect(content).toHaveAttribute("data-slot", "card-content");
    });
  });

  describe("CardFooter", () => {
    it("renders footer correctly", () => {
      render(<CardFooter>Footer</CardFooter>);
      expect(screen.getByText("Footer")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardFooter>Footer</CardFooter>);
      const footer = container.querySelector('[data-slot="card-footer"]');
      expect(footer).toHaveAttribute("data-slot", "card-footer");
    });
  });

  describe("CardAction", () => {
    it("renders action correctly", () => {
      render(<CardAction>Action</CardAction>);
      expect(screen.getByText("Action")).toBeInTheDocument();
    });

    it("has correct data-slot attribute", () => {
      const { container } = render(<CardAction>Action</CardAction>);
      const action = container.querySelector('[data-slot="card-action"]');
      expect(action).toHaveAttribute("data-slot", "card-action");
    });
  });

  describe("Card Composition", () => {
    it("renders a complete card with all components", () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Card Title</CardTitle>
            <CardDescription>Card Description</CardDescription>
            <CardAction>Action</CardAction>
          </CardHeader>
          <CardContent>Card Content</CardContent>
          <CardFooter>Card Footer</CardFooter>
        </Card>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card Description")).toBeInTheDocument();
      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(screen.getByText("Card Content")).toBeInTheDocument();
      expect(screen.getByText("Card Footer")).toBeInTheDocument();
    });
  });
});
