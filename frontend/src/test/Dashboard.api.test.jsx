import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "./test-utils";
import Dashboard from "../pages/Dashboard";
import api from "../api/axios";

// Mock API
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock Recharts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
  PieChart: ({ children }) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => <div />,
  BarChart: ({ children }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => <div>Bar</div>,
}));

vi.mock("../components/StatCard", () => ({
  default: ({ label }) => <div>{label}</div>,
}));

vi.mock("../components/StatusBadge", () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock("../components/LoadingSkeleton", () => ({
  CardSkeleton: () => <div>Loading...</div>,
}));

describe("Dashboard API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    api.get.mockImplementation((url) => {
      if (url === "/dashboard/stats") {
        return Promise.resolve({
          data: {
            data: {
              totalStudents: 120,
              occupiedSeats: 90,
              totalSeats: 100,
              pendingFeeCount: 6,
              todayAdmissions: 3,
              todayCollection: 5000,
              monthlyCollection: 65000,
              totalCollection: 500000,
              expiringSoon: 2,
              recentPayments: [
                {
                  _id: "1",
                  amount: 800,
                  student: {
                    name: "Adarsh",
                    seatNumber: 5,
                  },
                },
              ],
              recentStudents: [],
            },
          },
        });
      }
      if (url === "/dashboard/charts") {
        return Promise.resolve({
          data: {
            data: {
              revenueByMonth: [
                {
                  _id: { month: 1 },
                  total: 10000,
                },
              ],
              admissionsByMonth: [
                {
                  _id: { month: 1 },
                  count: 10,
                },
              ],
              seatsByStatus: [
                {
                  _id: "Occupied",
                  count: 90,
                },
              ],
            },
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it("calls dashboard APIs", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });

    expect(api.get).toHaveBeenCalledWith("/dashboard/stats");
    expect(api.get).toHaveBeenCalledWith("/dashboard/charts");
  });

  it("renders revenue chart", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByTestId("line-chart")
      ).toBeInTheDocument();
    });
  });

  it("renders pie chart", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByTestId("pie-chart")
      ).toBeInTheDocument();
    });
  });

  it("renders line chart", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByTestId("line-chart")
      ).toBeInTheDocument();
    });
  });

  it("renders payment data", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText("Adarsh")
      ).toBeInTheDocument();

      expect(
        screen.getByText("₹800")
      ).toBeInTheDocument();
    });
  });

  it("handles API failure", async () => {
    vi.clearAllMocks();

    api.get.mockRejectedValue(new Error("API Error"));

    render(<Dashboard />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    expect(
      screen.getByText(/Admin/i)
    ).toBeInTheDocument();
  });
});