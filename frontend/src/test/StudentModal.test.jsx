import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "./test-utils";
import StudentModal from "../components/StudentModal";

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock axios (Part 1 me API use nahi hogi)
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

describe("StudentModal - UI Tests", () => {
  const onClose = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders Add Student modal", () => {
    render(
      <StudentModal
        student={null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: /Add Student/i,
      })
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();

    expect(screen.getByRole("button", {
      name: /Add Student/i,
    })).toBeInTheDocument();
  });

  it("renders Edit Student modal", () => {
    const student = {
      _id: "1",
      name: "Adarsh Kumar",
      fatherName: "Awadhesh",
      mobile: "9876543210",
      email: "adarsh@test.com",
      seatNumber: 10,
      timing: "morning",
      monthlyFee: 800,
      joiningDate: "2026-08-01",
      expiryDate: "2026-08-31",
    };

    render(
      <StudentModal
        student={student}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    expect(
      screen.getByRole("heading", {
        name: /Edit Student/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByDisplayValue("Adarsh Kumar")
    ).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /Update Student/i,
      })
    ).toBeInTheDocument();
  });

  it("calls onClose when Cancel clicked", () => {
    render(
      <StudentModal
        student={null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: /Cancel/i,
      })
    );

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("updates Full Name input", () => {
    render(
      <StudentModal
        student={null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    const input = screen.getByLabelText(/Full Name/i);

    fireEvent.change(input, {
      target: {
        value: "Rahul Kumar",
      },
    });

    expect(input.value).toBe("Rahul Kumar");
  });

  it("updates joining date", () => {
    render(
      <StudentModal
        student={null}
        onClose={onClose}
        onSaved={onSaved}
      />
    );

    const joiningDate = screen.getByDisplayValue(
      new Date().toISOString().slice(0, 10)
    );

    fireEvent.change(joiningDate, {
      target: {
        value: "2026-09-01",
      },
    });

    expect(joiningDate.value).toBe("2026-09-01");
  });
});