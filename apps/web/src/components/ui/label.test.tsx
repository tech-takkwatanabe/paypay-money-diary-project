import * as React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Label } from "./label";

describe("Label Component", () => {
  it("renders correctly with text content", () => {
    render(<Label>Username</Label>);
    expect(screen.getByText("Username")).toBeInTheDocument();
  });

  it("associates with an input via htmlFor", () => {
    render(
      <>
        <Label htmlFor="username">Username</Label>
        <input id="username" />
      </>
    );

    const label = screen.getByText("Username");
    expect(label).toHaveAttribute("for", "username");
  });

  it("applies custom class names", () => {
    render(<Label className="custom-class">Username</Label>);
    const label = screen.getByText("Username");
    expect(label).toHaveClass("custom-class");
    expect(label).toHaveClass("text-sm"); // default class
  });

  it("forwards ref correctly", () => {
    const ref = React.createRef<HTMLLabelElement>();
    render(<Label ref={ref}>Username</Label>);
    expect(ref.current).toBeInstanceOf(HTMLLabelElement);
  });

  it("has correct base styles", () => {
    render(<Label>Username</Label>);
    const label = screen.getByText("Username");
    expect(label).toHaveClass("font-medium");
    expect(label).toHaveClass("leading-none");
  });
});
