import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "./test-utils";
import { MemoryRouter } from "react-router-dom";
import Login from "../pages/Login";

// Mock navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock toast
vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock AuthContext
const mockLogin = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form", () => {
    render(<Login />);

    expect(
      screen.getByRole("heading", { name: /Mishra Library/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/admin@mishralibrary.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign in/i })).toBeInTheDocument();
  });

  it("logs in successfully", async () => {
    mockLogin.mockResolvedValueOnce({});

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText(/admin@mishralibrary.com/i), {
      target: { value: "admin@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("shows loading state", async () => {
    mockLogin.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 500))
    );

    render(<Login />);

    fireEvent.change(screen.getByPlaceholderText(/admin@mishralibrary.com/i), {
      target: { value: "admin@test.com" },
    });

    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: "123456" },
    });

    fireEvent.click(screen.getByRole("button", { name: /Sign in/i }));

    expect(screen.getByText(/Signing in/i)).toBeInTheDocument();
  });
});