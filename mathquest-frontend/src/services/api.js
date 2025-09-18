import axios from "axios";

// Use relative URLs with the proxy in package.json instead of absolute URL
const api = axios.create({
  // No baseURL needed when using proxy in package.json
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No token found in localStorage");
      // Try to get token from user object as fallback
      if (user?.token) {
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log("Response data:", response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });

      // If unauthorized, clear token and redirect to login
      if (error.response.status === 401) {
        console.error("Unauthorized request - clearing token and user data");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("API Request Error:", error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("API Error:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
