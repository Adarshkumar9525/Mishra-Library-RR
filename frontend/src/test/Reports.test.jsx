import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "./test-utils";
import Reports from "../pages/Reports";
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

describe("Reports Page & Print Functionality", () => {
  const mockStudents = [
    {
      _id: "s1",
      name: "Rahul Mishra",
      mobile: "9876543210",
      seatNumber: 12,
      timing: "morning",
      monthlyFee: 800,
      joiningDate: "2026-01-01T00:00:00.000Z",
      expiryDate: "2026-02-01T00:00:00.000Z",
      feeStatus: "paid",
      status: "active",
    },
  ];

  const mockPayments = [
    {
      _id: "p1",
      receiptNumber: "REC-1001",
      student: { name: "Rahul Mishra" },
      amount: 800,
      mode: "cash",
      forMonth: "2026-01",
      paidAt: "2026-01-02T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.print = vi.fn();
  });

  it("renders report selection cards and printable report document header", async () => {
    api.get.mockResolvedValue({ data: { data: mockStudents } });

    render(<Reports />);

    expect(screen.getByRole("heading", { name: /Reports/i })).toBeInTheDocument();
    expect(screen.getAllByText("Student Report")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Payment Report")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Seat Report")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Collection Report")[0]).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Rahul Mishra")).toBeInTheDocument();
    });
  });

  it("switches active report when clicking a report card", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/students") return Promise.resolve({ data: { data: mockStudents } });
      if (url === "/payments") return Promise.resolve({ data: { data: mockPayments } });
      return Promise.resolve({ data: { data: [] } });
    });

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText("Rahul Mishra")).toBeInTheDocument();
    });

    const paymentCard = screen.getAllByText("Payment Report")[0];
    fireEvent.click(paymentCard);

    await waitFor(() => {
      expect(screen.getByText("REC-1001")).toBeInTheDocument();
    });
  });

  it("triggers window.print when clicking Print button", async () => {
    api.get.mockResolvedValue({ data: { data: mockStudents } });

    render(<Reports />);

    await waitFor(() => {
      expect(screen.getByText("Rahul Mishra")).toBeInTheDocument();
    });

    const printButtons = screen.getAllByRole("button", { name: /Print/i });
    fireEvent.click(printButtons[0]);

    await waitFor(() => {
      expect(window.print).toHaveBeenCalled();
    });
  });
});
