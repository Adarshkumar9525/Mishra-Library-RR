import React from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import * as AuthContextModule from "../context/AuthContext";
import * as ThemeContextModule from "../context/ThemeContext";

function getSafeComponent(mod, exportName) {
  try {
    if (mod && typeof mod[exportName] === "function") {
      return mod[exportName];
    }
  } catch {
    // Return dummy pass-through wrapper if export is missing on a mocked module
  }
  return ({ children }) => <>{children}</>;
}

const customRender = (ui, { route = "/", ...options } = {}) => {
  const AuthWrapper = getSafeComponent(AuthContextModule, "AuthProvider");
  const ThemeWrapper = getSafeComponent(ThemeContextModule, "ThemeProvider");

  return render(ui, {
    wrapper: ({ children }) => (
      <MemoryRouter initialEntries={[route]}>
        <ThemeWrapper>
          <AuthWrapper>{children}</AuthWrapper>
        </ThemeWrapper>
      </MemoryRouter>
    ),
    ...options,
  });
};

export * from "@testing-library/react";
export { customRender as render };
