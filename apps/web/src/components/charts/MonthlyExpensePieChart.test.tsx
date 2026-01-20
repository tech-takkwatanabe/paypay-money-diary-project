import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MonthlyExpensePieChart } from "./MonthlyExpensePieChart";
import type { GetTransactionsSummary200CategoryBreakdownItem as CategoryBreakdown } from "@/api/models";

// Mock react-apexcharts
interface MockChartProps {
  options: Record<string, unknown>;
  series: number[];
  type: string;
  height?: string;
}

vi.mock("react-apexcharts", () => ({
  default: ({ options, series, type }: MockChartProps) => (
    <div data-testid="mock-chart">
      <div data-testid="chart-type">{type}</div>
      <div data-testid="chart-series">{JSON.stringify(series)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  ),
}));

// Mock next/dynamic
vi.mock("next/dynamic", () => ({
  default: (_fn: () => Promise<{ default: React.ComponentType<MockChartProps> }>) => {
    return vi.fn(({ options, series, type }: MockChartProps) => (
      <div data-testid="mock-chart">
        <div data-testid="chart-type">{type}</div>
        <div data-testid="chart-series">{JSON.stringify(series)}</div>
        <div data-testid="chart-options">{JSON.stringify(options)}</div>
      </div>
    ));
  },
}));

describe("MonthlyExpensePieChart", () => {
  const mockData: CategoryBreakdown[] = [
    {
      categoryId: "cat1",
      categoryName: "食費",
      categoryColor: "#FF6384",
      displayOrder: 1,
      totalAmount: 50000,
      transactionCount: 10,
    },
    {
      categoryId: "cat2",
      categoryName: "交通費",
      categoryColor: "#36A2EB",
      displayOrder: 2,
      totalAmount: 20000,
      transactionCount: 5,
    },
    {
      categoryId: "cat3",
      categoryName: "娯楽",
      categoryColor: "#FFCE56",
      displayOrder: 3,
      totalAmount: 30000,
      transactionCount: 8,
    },
  ];

  it("renders card with title", () => {
    render(<MonthlyExpensePieChart data={mockData} />);
    expect(screen.getByText("カテゴリ別支出")).toBeInTheDocument();
  });

  it("displays loading state when isLoading is true", () => {
    render(<MonthlyExpensePieChart data={[]} isLoading={true} />);
    const loadingContainer = screen.getByText("カテゴリ別支出").parentElement?.parentElement;
    const spinner = loadingContainer?.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders chart when not loading", () => {
    render(<MonthlyExpensePieChart data={mockData} />);
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
  });

  it("renders donut chart type", () => {
    render(<MonthlyExpensePieChart data={mockData} />);
    expect(screen.getByTestId("chart-type")).toHaveTextContent("donut");
  });

  it("handles empty data with placeholder", () => {
    render(<MonthlyExpensePieChart data={[]} />);
    expect(screen.getByText("まだデータがありません")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-chart")).not.toBeInTheDocument();
  });

  it("creates series data from category totalAmount", () => {
    render(<MonthlyExpensePieChart data={mockData} />);
    const seriesData = JSON.parse(screen.getByTestId("chart-series").textContent || "[]");

    expect(seriesData).toEqual([50000, 20000, 30000]);
  });

  it("uses category names as labels", () => {
    render(<MonthlyExpensePieChart data={mockData} />);
    const options = JSON.parse(screen.getByTestId("chart-options").textContent || "{}");

    expect(options.labels).toEqual(["食費", "交通費", "娯楽"]);
  });

  it("uses category colors in chart options", () => {
    render(<MonthlyExpensePieChart data={mockData} />);
    const options = JSON.parse(screen.getByTestId("chart-options").textContent || "{}");

    expect(options.colors).toEqual(["#FF6384", "#36A2EB", "#FFCE56"]);
  });

  it("uses default colors when category color is not provided", () => {
    const dataWithoutColors: CategoryBreakdown[] = [
      {
        categoryId: "cat1",
        categoryName: "食費",
        categoryColor: "",
        displayOrder: 1,
        totalAmount: 50000,
        transactionCount: 10,
      },
    ];

    render(<MonthlyExpensePieChart data={dataWithoutColors} />);
    const options = JSON.parse(screen.getByTestId("chart-options").textContent || "{}");

    // Should use first default color
    expect(options.colors[0]).toBe("#ef4444");
  });

  it("handles single category data", () => {
    const singleCategory: CategoryBreakdown[] = [
      {
        categoryId: "cat1",
        categoryName: "食費",
        categoryColor: "#FF6384",
        displayOrder: 1,
        totalAmount: 50000,
        transactionCount: 10,
      },
    ];

    render(<MonthlyExpensePieChart data={singleCategory} />);
    const seriesData = JSON.parse(screen.getByTestId("chart-series").textContent || "[]");

    expect(seriesData).toEqual([50000]);
  });

  it("enables data labels when data exists", () => {
    render(<MonthlyExpensePieChart data={mockData} />);
    const options = JSON.parse(screen.getByTestId("chart-options").textContent || "{}");

    expect(options.dataLabels.enabled).toBe(true);
  });
});
