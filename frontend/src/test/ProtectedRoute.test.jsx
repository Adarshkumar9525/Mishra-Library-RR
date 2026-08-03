import { describe, it, expect, vi } from "vitest";
import { render, screen } from "./test-utils";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";

// Mock AuthContext
vi.mock("../context/AuthContext", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "../context/AuthContext";

describe("ProtectedRoute", () => {
  it("shows loading spinner", () => {
    useAuth.mockReturnValue({
      admin: null,
      loading: true,
    });

    const { container } = render(
      <ProtectedRoute>
        <div>Dashboard</div>
      </ProtectedRoute>
    );

    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("renders children when admin is logged in", () => {
    useAuth.mockReturnValue({
      admin: { name: "Admin" },
      loading: false,
    });

    render(
      <ProtectedRoute>
        <div>Dashboard</div>
      </ProtectedRoute>
    );

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("redirects to login when admin is not logged in", () => {
    useAuth.mockReturnValue({
      admin: null,
      loading: false,
    });

    render(
      <Routes>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <div>Dashboard</div>
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { route: "/dashboard" }
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });
}); 