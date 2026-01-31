import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnnualExpenseBarChart } from "./AnnualExpenseBarChart";
import type { TransactionSummaryMonthlyBreakdownItem as MonthlyBreakdown } from "@/api/models";

// Mock react-apexcharts
interface MockChartProps {
  options: Record<string, unknown>;
  series: Array<{ name: string; data: number[] }>;
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

describe("AnnualExpenseBarChart", () => {
  const mockData: MonthlyBreakdown[] = [
    {
      month: 1,
      totalAmount: 70000,
      categories: [
        {
          categoryId: "cat1",
          categoryName: "食費",
          categoryColor: "#FF6384",
          displayOrder: 1,
          amount: 50000,
        },
        {
          categoryId: "cat2",
          categoryName: "交通費",
          categoryColor: "#36A2EB",
          displayOrder: 2,
          amount: 20000,
        },
      ],
    },
    {
      month: 2,
      totalAmount: 45000,
      categories: [
        {
          categoryId: "cat1",
          categoryName: "食費",
          categoryColor: "#FF6384",
          displayOrder: 1,
          amount: 45000,
        },
      ],
    },
  ];

  it("renders card with title", () => {
    render(<AnnualExpenseBarChart data={mockData} />);
    expect(screen.getByText("年間支出推移")).toBeInTheDocument();
  });

  it("displays loading state when isLoading is true", () => {
    render(<AnnualExpenseBarChart data={[]} isLoading={true} />);
    const loadingContainer = screen.getByText("年間支出推移").parentElement?.parentElement;
    const spinner = loadingContainer?.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });

  it("renders chart when not loading", () => {
    render(<AnnualExpenseBarChart data={mockData} />);
    expect(screen.getByTestId("mock-chart")).toBeInTheDocument();
  });

  it("renders bar chart type", () => {
    render(<AnnualExpenseBarChart data={mockData} />);
    expect(screen.getByTestId("chart-type")).toHaveTextContent("bar");
  });

  it("handles empty data correctly", () => {
    render(<AnnualExpenseBarChart data={[]} />);
    expect(screen.getByText("まだデータがありません")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-chart")).not.toBeInTheDocument();
  });

  it("creates series data for all categories", () => {
    render(<AnnualExpenseBarChart data={mockData} />);
    const seriesData = JSON.parse(screen.getByTestId("chart-series").textContent || "[]");

    expect(seriesData).toHaveLength(2); // 2 categories
    expect(seriesData[0].name).toBe("食費");
    expect(seriesData[1].name).toBe("交通費");
  });

  it("fills missing months with zero values", () => {
    render(<AnnualExpenseBarChart data={mockData} />);
    const seriesData = JSON.parse(screen.getByTestId("chart-series").textContent || "[]");

    // Each series should have 12 data points (one for each month)
    expect(seriesData[0].data).toHaveLength(12);
    expect(seriesData[1].data).toHaveLength(12);

    // January (index 0) should have values
    expect(seriesData[0].data[0]).toBe(50000);
    expect(seriesData[1].data[0]).toBe(20000);

    // February (index 1) should have food expense but no transport
    expect(seriesData[0].data[1]).toBe(45000);
    expect(seriesData[1].data[1]).toBe(0);

    // March (index 2) and beyond should be 0
    expect(seriesData[0].data[2]).toBe(0);
    expect(seriesData[1].data[2]).toBe(0);
  });

  it("uses category colors in chart options", () => {
    render(<AnnualExpenseBarChart data={mockData} />);
    const options = JSON.parse(screen.getByTestId("chart-options").textContent || "{}");

    expect(options.colors).toEqual(["#FF6384", "#36A2EB"]);
  });

  it("configures chart as stacked bar chart", () => {
    render(<AnnualExpenseBarChart data={mockData} />);
    const options = JSON.parse(screen.getByTestId("chart-options").textContent || "{}");

    expect(options.chart.type).toBe("bar");
    expect(options.chart.stacked).toBe(true);
  });

  it("handles categories without IDs (others)", () => {
    const dataWithOthers: MonthlyBreakdown[] = [
      {
        month: 1,
        totalAmount: 10000,
        categories: [
          {
            categoryId: null,
            categoryName: "その他",
            categoryColor: "#CCCCCC",
            displayOrder: 100,
            amount: 10000,
          },
        ],
      },
    ];

    render(<AnnualExpenseBarChart data={dataWithOthers} />);
    const seriesData = JSON.parse(screen.getByTestId("chart-series").textContent || "[]");

    expect(seriesData[0].name).toBe("その他");
    expect(seriesData[0].data[0]).toBe(10000);
  });
});
