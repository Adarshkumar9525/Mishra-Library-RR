import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "./test-utils";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar";

// Mock navigate
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock AuthContext
const mockLogout = vi.fn();

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    admin: {
      name: "Adarsh Kumar",
      email: "adarsh@test.com",
    },
    logout: mockLogout,
  }),
}));

describe("Navbar Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders search input", () => {
    render(<Navbar />);

    expect(
      screen.getByPlaceholderText(/Search students/i)
    ).toBeInTheDocument();
  });

  it("shows admin initial", () => {
    render(<Navbar />);

    expect(screen.getByText("AK")).toBeInTheDocument();
  });

  it("opens profile menu", () => {
    render(<Navbar />);

    fireEvent.click(screen.getByText("AK"));

    expect(screen.getAllByText("Adarsh Kumar")[0]).toBeInTheDocument();
    expect(screen.getByText("adarsh@test.com")).toBeInTheDocument();
  });

  it("logout works", () => {
    render(<Navbar />);

    fireEvent.click(screen.getByText("AK"));
    fireEvent.click(screen.getByText(/Sign Out/i));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});