import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Seats from "../pages/Seats";
import api from "../api/axios";
import toast from "react-hot-toast";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../components/LoadingSkeleton", () => ({
  TableSkeleton: () => <div>Loading...</div>,
}));

describe("Seats UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    api.get.mockResolvedValue({
      data: {
        data: [
          {
            _id: "1",
            seatNumber: 1,
            slots: {
              morning: {
                status: "occupied",
                student: {
                  name: "Adarsh",
                },
              },
              afternoon: {
                status: "available",
              },
              evening: {
                status: "reserved",
              },
              night: {
                status: "maintenance",
              },
            },
          },
        ],
      },
    });
  });

  it("renders page", async () => {
    render(<Seats />);

    expect(
      screen.getByText("Seats")
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });
  });

  it("shows shift tabs", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(screen.getByText("Morning")).toBeInTheDocument();
      expect(screen.getByText("Afternoon")).toBeInTheDocument();
      expect(screen.getByText("Evening")).toBeInTheDocument();
      expect(screen.getByText("Night")).toBeInTheDocument();
    });
  });

  it("switches to table view", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalled();
    });

    const buttons = screen.getAllByRole("button");

    fireEvent.click(buttons[1]);

    expect(
      screen.getByText(/Student/i)
    ).toBeInTheDocument();
  });

  it("opens seat modal", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(
        screen.getByText("1")
      ).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByText("1")
    );

    expect(
      screen.getByText(/Seat #1/i)
    ).toBeInTheDocument();

    expect(
      screen.getByText("Close")
    ).toBeInTheDocument();
  });

  it("closes seat modal", async () => {
    render(<Seats />);

    await waitFor(() => {
      expect(
        screen.getByText("1")
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("1"));

    fireEvent.click(
      screen.getByRole("button", {
        name: /Close/i,
      })
    );

    expect(
      screen.queryByText(/Seat #1/i)
    ).not.toBeInTheDocument();
  });

  it("shows API error", async () => {
    vi.clearAllMocks();

    api.get.mockRejectedValue(new Error());

    render(<Seats />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load seats"
      );
    });
  });
});