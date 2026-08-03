import axios from "axios";

let rawApiUrl = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();

// Auto-sanitize if env variable contains duplicated URL strings
if (rawApiUrl.includes("http") && rawApiUrl.indexOf("http") !== rawApiUrl.lastIndexOf("http")) {
  const firstUrlMatch = rawApiUrl.match(/https?:\/\/[^\/]+/);
  if (firstUrlMatch) {
    rawApiUrl = `${firstUrlMatch[0].replace(/\/$/, "")}/api`;
  }
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
