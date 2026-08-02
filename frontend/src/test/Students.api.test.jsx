import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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
      expect(api.get).toHaveBeenCalled();
    });

    expect(
      screen.getByText("Adarsh Kumar")
    ).toBeInTheDocument();
  });

  it("refresh button fetches students again", async () => {
    render(<Students />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    const buttons = screen.getAllByRole("button");

    fireEvent.click(buttons[1]);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledTimes(2);
    });
  });

  it("renews membership", async () => {
    api.put.mockResolvedValue({});

    render(<Students />);

    await waitFor(() =>
      screen.getByText("Renew")
    );

    fireEvent.click(
      screen.getByText("Renew")
    );

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith(
        "/students/1/renew"
      );

      expect(toast.success).toHaveBeenCalledWith(
        "Membership renewed for 30 days"
      );
    });
  });

  it("deletes student", async () => {
    api.delete.mockResolvedValue({});

    render(<Students />);

    await waitFor(() =>
      screen.getByText("Adarsh Kumar")
    );

    const deleteButtons = screen.getAllByRole("button");

    fireEvent.click(
      deleteButtons[4]
    );

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(
        "/students/1"
      );

      expect(toast.success).toHaveBeenCalledWith(
        "Student deleted"
      );
    });
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

    await waitFor(() =>
      screen.getByText("Adarsh Kumar")
    );

    const deleteButtons = screen.getAllByRole("button");

    fireEvent.click(
      deleteButtons[4]
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Delete failed"
      );
    });
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

    await waitFor(() =>
      screen.getByText("Renew")
    );

    fireEvent.click(
      screen.getByText("Renew")
    );

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Renewal failed"
      );
    });
  });
});