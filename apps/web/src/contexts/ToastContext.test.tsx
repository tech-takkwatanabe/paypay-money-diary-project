"use client";

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { ToastProvider, useToast } from "./ToastContext";

function TestComponent() {
  const { toasts, success, error, info, removeToast } = useToast();

  return (
    <div>
      <div data-testid="toast-count">{toasts.length}</div>
      <button onClick={() => success("Success Message")}>Success</button>
      <button onClick={() => error("Error Message")}>Error</button>
      <button onClick={() => info("Info Message")}>Info</button>
      {toasts.map((t) => (
        <div key={t.id} data-testid={`toast-${t.id}`}>
          {t.message} - {t.type}
          <button onClick={() => removeToast(t.id)}>Remove {t.id}</button>
        </div>
      ))}
    </div>
  );
}

describe("ToastContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides an empty list initially", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
  });

  it("adds a success toast", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText("Success");
    act(() => {
      button.click();
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    expect(screen.getByText("Success Message - success")).toBeInTheDocument();
  });

  it("adds an error toast", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText("Error");
    act(() => {
      button.click();
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    expect(screen.getByText("Error Message - error")).toBeInTheDocument();
  });

  it("adds an info toast", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    const button = screen.getByText("Info");
    act(() => {
      button.click();
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");
    expect(screen.getByText("Info Message - info")).toBeInTheDocument();
  });

  it("removes a toast", () => {
    render(
      <ToastProvider>
        <TestComponent />
      </ToastProvider>
    );

    act(() => {
      screen.getByText("Success").click();
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("1");

    const removeButton = screen.getByText(/Remove/);
    act(() => {
      removeButton.click();
    });

    expect(screen.getByTestId("toast-count")).toHaveTextContent("0");
  });

  it("throws error when used outside ToastProvider", () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow("useToast must be used within a ToastProvider");

    consoleError.mockRestore();
  });
});
