import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "./test-utils";
import Students from "../pages/Students";
import api from "../api/axios";
import toast from "react-hot-toast";

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../components/StudentModal", () => ({
  default: () => <div>Student Modal</div>,
}));

vi.mock("../components/StatusBadge", () => ({
  default: ({ status }) => <span>{status}</span>,
}));

vi.mock("../components/LoadingSkeleton", () => ({
  TableSkeleton: () => <div>Loading...</div>,
  EmptyState: ({ title }) => <div>{title}</div>,
}));

describe("Students Page - UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page title", async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        meta: { totalPages: 1 },
      },
    });

    render(<Students />);

    expect(
      screen.getByText("Students")
    ).toBeInTheDocument();

    await waitFor(() =>
      expect(api.get).toHaveBeenCalled()
    );
  });

  it("shows Add Student button", async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        meta: { totalPages: 1 },
      },
    });

    render(<Students />);

    expect(
      screen.getByRole("button", {
        name: /Add Student/i,
      })
    ).toBeInTheDocument();
  });

  it("opens Student Modal", async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        meta: { totalPages: 1 },
      },
    });

    render(<Students />);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Add Student/i,
      })
    );

    expect(
      screen.getByText("Student Modal")
    ).toBeInTheDocument();
  });

  it("renders search input", async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        meta: { totalPages: 1 },
      },
    });

    render(<Students />);

    expect(
      screen.getByPlaceholderText(
        /Search by name/i
      )
    ).toBeInTheDocument();
  });

  it("updates search value", async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        meta: { totalPages: 1 },
      },
    });

    render(<Students />);

    const input = screen.getByPlaceholderText(
      /Search by name/i
    );

    fireEvent.change(input, {
      target: {
        value: "Rahul",
      },
    });

    expect(input.value).toBe("Rahul");
  });

  it("initializes search input from URL query parameter", async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        meta: { totalPages: 1 },
      },
    });

    render(<Students />, { route: "/students?search=rohit" });

    const input = screen.getByPlaceholderText(/Search by name/i);
    expect(input.value).toBe("rohit");
  });

  it("shows empty state", async () => {
    api.get.mockResolvedValue({
      data: {
        data: [],
        meta: { totalPages: 1 },
      },
    });

    render(<Students />);

    await waitFor(() => {
      expect(
        screen.getByText("No students found")
      ).toBeInTheDocument();
    });
  });

  it("shows error toast when API fails", async () => {
    api.get.mockRejectedValue(new Error());

    render(<Students />);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Failed to load students"
      );
    });
  });
});