import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "./test-utils";
import Payments from "../pages/Payments";
import api from "../api/axios";
import toast from "react-hot-toast";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
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
  EmptyState: ({ title }) => <div>{title}</div>,
}));

describe("Payments Page & Add Payment Modal Enhancement", () => {
  const mockStudents = [
    {
      _id: "s1",
      name: "Rahul Mishra",
      mobile: "9876543210",
      seatNumber: 12,
      timing: "morning",
      monthlyFee: 800,
    },
    {
      _id: "s2",
      name: "Rahul Sharma",
      mobile: "9876543211",
      seatNumber: 15,
      timing: "full-day",
      monthlyFee: 1200,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Payments header and collection summaries", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/payments") {
        return Promise.resolve({ data: { data: [] } });
      }
      if (url === "/payments/summary") {
        return Promise.resolve({ data: { data: { today: 500, month: 5000, year: 25000, total: 50000 } } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(<Payments />);

    expect(screen.getByText("Payments")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("₹500")).toBeInTheDocument();
      expect(screen.getByText(/₹5,?000/)).toBeInTheDocument();
    });
  });

  it("opens Add Payment modal with single Student Name Search input field", async () => {
    api.get.mockImplementation((url) => {
      if (url === "/payments") return Promise.resolve({ data: { data: [] } });
      if (url === "/payments/summary") return Promise.resolve({ data: { data: {} } });
      if (url === "/students") return Promise.resolve({ data: { data: mockStudents } });
      return Promise.resolve({ data: { data: [] } });
    });

    render(<Payments />);

    const addButton = screen.getByRole("button", { name: /Add Payment/i });
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: /Add Payment/i })).toBeInTheDocument();
    });

    // Verify single Student Name search input field exists
    const searchInput = screen.getByPlaceholderText(/Type student name to search.../i);
    expect(searchInput).toBeInTheDocument();
  });

  it("searches student by name and displays autocomplete suggestions", async () => {
    api.get.mockImplementation((url, config) => {
      if (url === "/payments") return Promise.resolve({ data: { data: [] } });
      if (url === "/payments/summary") return Promise.resolve({ data: { data: {} } });
      if (url === "/students") {
        if (config?.params?.name === "Rahul") {
          return Promise.resolve({ data: { data: mockStudents } });
        }
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(<Payments />);

    fireEvent.click(screen.getByRole("button", { name: /Add Payment/i }));

    const searchInput = screen.getByPlaceholderText(/Type student name to search.../i);
    fireEvent.change(searchInput, { target: { value: "Rahul" } });

    // Wait for debounced search API call
    await waitFor(
      () => {
        expect(api.get).toHaveBeenCalledWith(
          "/students",
          expect.objectContaining({
            params: expect.objectContaining({ name: "Rahul", limit: 10 }),
          })
        );
      },
      { timeout: 1000 }
    );

    // Verify autocomplete results are rendered
    await waitFor(() => {
      expect(screen.getByText("Rahul Mishra")).toBeInTheDocument();
      expect(screen.getByText("Rahul Sharma")).toBeInTheDocument();
    });
  });

  it("auto-fills details card and monthly fee when selecting a student", async () => {
    api.get.mockImplementation((url, config) => {
      if (url === "/payments") return Promise.resolve({ data: { data: [] } });
      if (url === "/payments/summary") return Promise.resolve({ data: { data: {} } });
      if (url === "/students") {
        if (config?.params?.name === "Rahul") {
          return Promise.resolve({ data: { data: [mockStudents[0]] } });
        }
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(<Payments />);

    fireEvent.click(screen.getByRole("button", { name: /Add Payment/i }));

    const searchInput = screen.getByPlaceholderText(/Type student name to search.../i);
    fireEvent.change(searchInput, { target: { value: "Rahul" } });

    await waitFor(() => {
      expect(screen.getByText("Rahul Mishra")).toBeInTheDocument();
    });

    // Select the student
    fireEvent.click(screen.getByText("Rahul Mishra"));

    // Verify student details card appears
    await waitFor(() => {
      expect(screen.getByText("Student Information")).toBeInTheDocument();
      expect(screen.getByText("9876543210")).toBeInTheDocument();
      expect(screen.getByText("#12")).toBeInTheDocument();
    });

    // Verify monthly fee auto-filled in amount field
    const amountInput = screen.getByRole("spinbutton");
    expect(amountInput.value).toBe("800");
  });

  it("displays 'No student found' when query matches no student", async () => {
    api.get.mockImplementation((url, config) => {
      if (url === "/payments") return Promise.resolve({ data: { data: [] } });
      if (url === "/payments/summary") return Promise.resolve({ data: { data: {} } });
      if (url === "/students") {
        if (config?.params?.name === "Unknown") {
          return Promise.resolve({ data: { data: [] } });
        }
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(<Payments />);

    fireEvent.click(screen.getByRole("button", { name: /Add Payment/i }));

    const searchInput = screen.getByPlaceholderText(/Type student name to search.../i);
    fireEvent.change(searchInput, { target: { value: "Unknown" } });

    await waitFor(() => {
      expect(screen.getByText("No student found")).toBeInTheDocument();
    });
  });

  it("submits payment form successfully", async () => {
    api.get.mockImplementation((url, config) => {
      if (url === "/payments") return Promise.resolve({ data: { data: [] } });
      if (url === "/payments/summary") return Promise.resolve({ data: { data: {} } });
      if (url === "/students") {
        if (config?.params?.name === "Rahul") {
          return Promise.resolve({ data: { data: [mockStudents[0]] } });
        }
        return Promise.resolve({ data: { data: [] } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
    api.post.mockResolvedValue({ data: { success: true } });

    render(<Payments />);

    fireEvent.click(screen.getByRole("button", { name: /Add Payment/i }));

    const searchInput = screen.getByPlaceholderText(/Type student name to search.../i);
    fireEvent.change(searchInput, { target: { value: "Rahul" } });

    await waitFor(() => {
      expect(screen.getByText("Rahul Mishra")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Rahul Mishra"));

    const submitBtn = screen.getByRole("button", { name: /Record Payment/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(
        "/payments",
        expect.objectContaining({
          student: "s1",
          amount: "800",
          mode: "cash",
        })
      );
      expect(toast.success).toHaveBeenCalledWith("Payment recorded");
    });
  });
});
