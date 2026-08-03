import axios from "axios";

let rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();

// Robust Sanitizer: Extract protocol + domain and append single /api
try {
  if (rawApiUrl.includes("http")) {
    const match = rawApiUrl.match(/(https?:\/\/[^\/\s]+)/i);
    if (match && match[1]) {
      rawApiUrl = `${match[1].replace(/\/$/, "")}/api`;
    }
  }
} catch {
  // fallback to rawApiUrl if regex fails
}

const api = axios.create({
  baseURL: rawApiUrl,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("mishra_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("mishra_token");
      localStorage.removeItem("mishra_admin");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
