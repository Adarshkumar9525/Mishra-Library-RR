import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "./test-utils";
import ChangeSeatModal from "../components/ChangeSeatModal";
import api from "../api/axios";
import toast from "react-hot-toast";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ChangeSeatModal Component", () => {
  const mockStudent = {
    _id: "student123",
    name: "Rohan Sharma",
    seatNumber: 12,
    timing: "morning",
  };

  const mockOnClose = vi.fn();
  const mockOnTransferred = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders student details and current seat info", () => {
    render(
      <ChangeSeatModal
        student={mockStudent}
        onClose={mockOnClose}
        onTransferred={mockOnTransferred}
      />
    );

    expect(screen.getByText("Change Seat")).toBeInTheDocument();
    expect(screen.getByText("Rohan Sharma")).toBeInTheDocument();
    expect(screen.getByText("Currently: Seat #12")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter new seat number/i)).toBeInTheDocument();
  });

  it("shows warning when entering the same seat number", async () => {
    render(
      <ChangeSeatModal
        student={mockStudent}
        onClose={mockOnClose}
        onTransferred={mockOnTransferred}
      />
    );

    const input = screen.getByPlaceholderText(/Enter new seat number/i);
    fireEvent.change(input, { target: { value: "12" } });

    await waitFor(() => {
      expect(screen.getByText(/This is already their current seat/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Transfer Seat/i });
    expect(submitBtn).toBeDisabled();
  });

  it("checks availability for a new seat and shows free status", async () => {
    api.get.mockImplementation((url) => {
      if (url.includes("/availability")) {
        return Promise.resolve({
          data: { data: { available: true, seatNumber: 15, timing: "morning" } },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(
      <ChangeSeatModal
        student={mockStudent}
        onClose={mockOnClose}
        onTransferred={mockOnTransferred}
      />
    );

    const input = screen.getByPlaceholderText(/Enter new seat number/i);
    fireEvent.change(input, { target: { value: "15" } });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/seats/15/availability", {
        params: { timing: "morning" },
      });
      expect(screen.getByText(/Seat #15 is free for the morning shift/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Transfer Seat/i });
    expect(submitBtn).not.toBeDisabled();
  });

  it("shows unavailable message when new seat is booked", async () => {
    api.get.mockImplementation((url) => {
      if (url.includes("/availability")) {
        return Promise.resolve({
          data: { data: { available: false, seatNumber: 20, timing: "morning" } },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(
      <ChangeSeatModal
        student={mockStudent}
        onClose={mockOnClose}
        onTransferred={mockOnTransferred}
      />
    );

    const input = screen.getByPlaceholderText(/Enter new seat number/i);
    fireEvent.change(input, { target: { value: "20" } });

    await waitFor(() => {
      expect(screen.getByText(/Seat #20 is already booked for an overlapping shift/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Transfer Seat/i });
    expect(submitBtn).toBeDisabled();
  });

  it("submits seat transfer successfully", async () => {
    api.get.mockImplementation((url) => {
      if (url.includes("/availability")) {
        return Promise.resolve({
          data: { data: { available: true, seatNumber: 15, timing: "morning" } },
        });
      }
      if (url === "/seats") {
        return Promise.resolve({
          data: { data: [{ _id: "seatObj15Id", seatNumber: 15 }] },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    api.put.mockResolvedValueOnce({
      data: { message: "Seat transferred successfully" },
    });

    render(
      <ChangeSeatModal
        student={mockStudent}
        onClose={mockOnClose}
        onTransferred={mockOnTransferred}
      />
    );

    const input = screen.getByPlaceholderText(/Enter new seat number/i);
    fireEvent.change(input, { target: { value: "15" } });

    await waitFor(() => {
      expect(screen.getByText(/Seat #15 is free for the morning shift/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Transfer Seat/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith("/seats/transfer", {
        studentId: "student123",
        newSeatId: "seatObj15Id",
      });
      expect(toast.success).toHaveBeenCalledWith("Seat transferred successfully");
      expect(mockOnTransferred).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it("handles transfer API error gracefully", async () => {
    api.get.mockImplementation((url) => {
      if (url.includes("/availability")) {
        return Promise.resolve({
          data: { data: { available: true, seatNumber: 15, timing: "morning" } },
        });
      }
      if (url === "/seats") {
        return Promise.resolve({
          data: { data: [{ _id: "seatObj15Id", seatNumber: 15 }] },
        });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    api.put.mockRejectedValueOnce({
      response: {
        data: { message: "Seat 15 is already occupied" },
      },
    });

    render(
      <ChangeSeatModal
        student={mockStudent}
        onClose={mockOnClose}
        onTransferred={mockOnTransferred}
      />
    );

    const input = screen.getByPlaceholderText(/Enter new seat number/i);
    fireEvent.change(input, { target: { value: "15" } });

    await waitFor(() => {
      expect(screen.getByText(/Seat #15 is free for the morning shift/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /Transfer Seat/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Seat 15 is already occupied");
    });
  });
});
