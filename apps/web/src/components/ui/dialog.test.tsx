import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "./dialog";

describe("Dialog Component", () => {
  const TestDialog = ({ triggerText = "Open Dialog", title = "Dialog Title", description = "Dialog Description" }) => (
    <Dialog>
      <DialogTrigger asChild>
        <button>{triggerText}</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div>Content Body</div>
        <DialogFooter>
          <DialogClose asChild>
            <button>Cancel</button>
          </DialogClose>
          <button>Confirm</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  it("renders trigger correctly", () => {
    render(<TestDialog />);
    expect(screen.getByRole("button", { name: /open dialog/i })).toBeInTheDocument();
  });

  it("opens dialog when trigger is clicked", () => {
    render(<TestDialog />);

    const trigger = screen.getByRole("button", { name: /open dialog/i });
    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog Title")).toBeInTheDocument();
    expect(screen.getByText("Dialog Description")).toBeInTheDocument();
    expect(screen.getByText("Content Body")).toBeInTheDocument();
  });

  it("closes dialog when close button is clicked", () => {
    render(<TestDialog />);

    fireEvent.click(screen.getByRole("button", { name: /open dialog/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(closeButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes dialog when the default X button is clicked", () => {
    render(<TestDialog />);

    fireEvent.click(screen.getByRole("button", { name: /open dialog/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const xButton = screen.getByRole("button", { name: /close/i });
    fireEvent.click(xButton);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("applies custom class names", () => {
    render(
      <Dialog>
        <DialogTrigger className="custom-trigger">Open</DialogTrigger>
        <DialogContent className="custom-content">
          <DialogHeader className="custom-header" data-testid="dialog-header">
            <DialogTitle className="custom-title">Title</DialogTitle>
            <DialogDescription className="custom-description">Description</DialogDescription>
          </DialogHeader>
          <DialogFooter className="custom-footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    expect(trigger).toHaveClass("custom-trigger");

    fireEvent.click(trigger);

    expect(screen.getByRole("dialog")).toHaveClass("custom-content");
    expect(screen.getByTestId("dialog-header")).toHaveClass("custom-header");
    expect(screen.getByText("Title")).toHaveClass("custom-title");
    expect(screen.getByText("Description")).toHaveClass("custom-description");
    expect(screen.getByText("Footer")).toHaveClass("custom-footer");
  });

  it("handles accessibility attributes correctly", () => {
    render(<TestDialog title="Custom Title" description="Custom Description" />);

    fireEvent.click(screen.getByRole("button", { name: /open dialog/i }));

    const dialog = screen.getByRole("dialog");
    const title = screen.getByText("Custom Title");
    const description = screen.getByText("Custom Description");

    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    expect(dialog).toHaveAttribute("aria-describedby", description.id);
  });

  it("does not close when clicking inside the content", () => {
    render(<TestDialog />);

    fireEvent.click(screen.getByRole("button", { name: /open dialog/i }));
    const content = screen.getByText("Content Body");

    fireEvent.click(content);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
