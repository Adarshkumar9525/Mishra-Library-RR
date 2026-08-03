import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "./test-utils";
import Dashboard from "../pages/Dashboard";
import api from "../api/axios";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock Charts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => <div>Line</div>,
  XAxis: () => <div />,
  YAxis: () => <div />,
  Tooltip: () => <div />,
  CartesianGrid: () => <div />,
  PieChart: ({ children }) => <div>{children}</div>,
  Pie: ({ children }) => <div>{children}</div>,
  Cell: () => <div />,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => <div>Bar</div>,
}));

vi.mock("../components/StatCard", () => ({
  default: ({ label, value }) => (
    <div>
      {label}: {value}
    </div>
  ),
}));

vi.mock("../components/StatusBadge", () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock("../components/LoadingSkeleton", () => ({
  CardSkeleton: () => <div>Loading Card</div>,
}));

describe("Dashboard UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    api.get.mockImplementation((url) => {
      if (url === "/dashboard/stats") {
        return Promise.resolve({
          data: {
            data: {
              totalStudents: 100,
              occupiedSeats: 80,
              totalSeats: 100,
              pendingFeeCount: 5,
              todayAdmissions: 2,
              todayCollection: 3000,
              monthlyCollection: 45000,
              totalCollection: 200000,
              expiringSoon: 3,
              recentPayments: [],
              recentStudents: [],
            },
          },
        });
      }
      if (url === "/dashboard/charts") {
        return Promise.resolve({
          data: {
            data: {
              revenueByMonth: [],
              admissionsByMonth: [],
              seatsByStatus: [],
            },
          },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it("renders dashboard heading", async () => {
    render(<Dashboard />);

    expect(
      screen.getByText(/Admin/i)
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it("renders stat cards", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/Total Students/i)
      ).toBeInTheDocument();

      expect(
        screen.getAllByText(/Occupied Seats/i)[0]
      ).toBeInTheDocument();
    });
  });

  it("shows no payments", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/No payments yet/i)
      ).toBeInTheDocument();
    });
  });

  it("shows no students", async () => {
    render(<Dashboard />);

    await waitFor(() => {
      expect(
        screen.getByText(/No students yet/i)
      ).toBeInTheDocument();
    });
  });
});