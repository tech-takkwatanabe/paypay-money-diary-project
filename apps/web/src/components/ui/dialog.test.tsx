import { describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

  it("opens dialog when trigger is clicked", async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    const trigger = screen.getByRole("button", { name: /open dialog/i });
    await user.click(trigger);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dialog Title")).toBeInTheDocument();
    expect(screen.getByText("Dialog Description")).toBeInTheDocument();
    expect(screen.getByText("Content Body")).toBeInTheDocument();
  });

  it("closes dialog when close button is clicked", async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    await user.click(screen.getByRole("button", { name: /open dialog/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const closeButton = screen.getByRole("button", { name: /cancel/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("closes dialog when the default X button is clicked", async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    await user.click(screen.getByRole("button", { name: /open dialog/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const xButton = screen.getByRole("button", { name: /close/i });
    await user.click(xButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("applies custom class names", async () => {
    const user = userEvent.setup();
    render(
      <Dialog>
        <DialogTrigger className="custom-trigger">Open</DialogTrigger>
        <DialogContent className="custom-content">
          <DialogHeader className="custom-header">
            <DialogTitle className="custom-title">Title</DialogTitle>
            <DialogDescription className="custom-description">Description</DialogDescription>
          </DialogHeader>
          <DialogFooter className="custom-footer">Footer</DialogFooter>
        </DialogContent>
      </Dialog>
    );

    const trigger = screen.getByRole("button", { name: /open/i });
    expect(trigger).toHaveClass("custom-trigger");

    await user.click(trigger);

    expect(screen.getByRole("dialog")).toHaveClass("custom-content");
    expect(screen.getByText("Title").parentElement).toHaveClass("custom-header");
    expect(screen.getByText("Title")).toHaveClass("custom-title");
    expect(screen.getByText("Description")).toHaveClass("custom-description");
    // DialogFooter is a div, so we find it by text and check parent or use container
    expect(screen.getByText("Footer")).toHaveClass("custom-footer");
  });

  it("handles accessibility attributes correctly", async () => {
    const user = userEvent.setup();
    render(<TestDialog title="Custom Title" description="Custom Description" />);

    await user.click(screen.getByRole("button", { name: /open dialog/i }));

    const dialog = screen.getByRole("dialog");
    const title = screen.getByText("Custom Title");
    const description = screen.getByText("Custom Description");

    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    expect(dialog).toHaveAttribute("aria-describedby", description.id);
  });

  it("does not close when clicking inside the content", async () => {
    const user = userEvent.setup();
    render(<TestDialog />);

    await user.click(screen.getByRole("button", { name: /open dialog/i }));
    const content = screen.getByText("Content Body");

    await user.click(content);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
