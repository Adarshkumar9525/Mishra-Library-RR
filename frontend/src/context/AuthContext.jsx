import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    const stored = localStorage.getItem("mishra_admin");
    return stored ? JSON.parse(stored) : null;
  });

  const [loading, setLoading] = useState(() =>
    Boolean(localStorage.getItem("mishra_token"))
  );

  useEffect(() => {
    const token = localStorage.getItem("mishra_token");

    if (!token) {
      return;
    }

    const fetchAdmin = async () => {
      try {
        const res = await api.get("/auth/me");

        setAdmin(res.data.data);

        localStorage.setItem(
          "mishra_admin",
          JSON.stringify(res.data.data)
        );
      } catch {
        localStorage.removeItem("mishra_token");
        localStorage.removeItem("mishra_admin");
        setAdmin(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAdmin();
  }, []);

  const login = async (email, password) => {
    setLoading(true);

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      const { token, admin: adminData } = res.data.data;

      localStorage.setItem("mishra_token", token);
      localStorage.setItem(
        "mishra_admin",
        JSON.stringify(adminData)
      );

      setAdmin(adminData);

      return adminData;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("mishra_token");
    localStorage.removeItem("mishra_admin");

    setAdmin(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);