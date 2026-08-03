import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "./test-utils";
import Students from "../pages/Students";
import api from "../api/axios";
import toast from "react-hot-toast";

// Mock API
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

// Mock Toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock Components
vi.mock("../components/StatusBadge", () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock("../components/StudentModal", () => ({
  default: () => <div>Student Modal</div>,
}));

vi.mock("../components/LoadingSkeleton", () => ({
  TableSkeleton: () => <div>Loading...</div>,
  EmptyState: ({ title }) => <div>{title}</div>,
}));

describe("Students API Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    globalThis.confirm = vi.fn(() => true);

    api.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: "1",
            name: "Adarsh Kumar",
            mobile: "9876543210",
            seatNumber: 5,
            expiryDate: "2026-09-01",
            feeStatus: "paid",
            membershipStatus: "active",
          },
        ],
        meta: {
          totalPages: 1,
        },
      },
    });
  });

  it("fetches students", async () => {
    render(<Students />);

    await waitFor(() => {
      expect(screen.getAllByText("Adarsh Kumar")[0]).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it("refresh button fetches students again", async () => {
    render(<Students />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    }, { timeout: 3000 });

    const refreshBtn = screen.getByTitle("Refresh");
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });
  });

  it("renews membership", async () => {
    api.put.mockResolvedValue({});

    render(<Students />);

    await waitFor(() => {
      expect(screen.getAllByText("Renew")[0]).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getAllByText("Renew")[0]);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/students/1/renew");
      expect(toast.success).toHaveBeenCalledWith("Membership renewed for 30 days");
    }, { timeout: 3000 });
  });

  it("deletes student", async () => {
    api.delete.mockResolvedValue({});

    render(<Students />);

    await waitFor(() => {
      expect(screen.getAllByText("Adarsh Kumar")[0]).toBeInTheDocument();
    }, { timeout: 3000 });

    const deleteBtn = screen.getAllByTitle("Delete")[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/students/1");
      expect(toast.success).toHaveBeenCalledWith("Student deleted");
    }, { timeout: 3000 });
  });

  it("shows delete API error", async () => {
    api.delete.mockRejectedValue({
      response: {
        data: {
          message: "Delete failed",
        },
      },
    });

    render(<Students />);

    await waitFor(() => {
      expect(screen.getAllByText("Adarsh Kumar")[0]).toBeInTheDocument();
    }, { timeout: 3000 });

    const deleteBtn = screen.getAllByTitle("Delete")[0];
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Delete failed");
    }, { timeout: 3000 });
  });

  it("shows renew API error", async () => {
    api.put.mockRejectedValue({
      response: {
        data: {
          message: "Renewal failed",
        },
      },
    });

    render(<Students />);

    await waitFor(() => {
      expect(screen.getAllByText("Renew")[0]).toBeInTheDocument();
    }, { timeout: 3000 });

    fireEvent.click(screen.getAllByText("Renew")[0]);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Renewal failed");
    }, { timeout: 3000 });
  });
});