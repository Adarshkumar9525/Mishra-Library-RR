import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
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
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(
      screen.getByPlaceholderText(/Search students/i)
    ).toBeInTheDocument();
  });

  it("shows admin initial", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("opens profile menu", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("A"));

    expect(screen.getByText("Adarsh Kumar")).toBeInTheDocument();
    expect(screen.getByText("adarsh@test.com")).toBeInTheDocument();
  });

  it("logout works", () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText("A"));
    fireEvent.click(screen.getByText(/Logout/i));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith("/login");
  });
});