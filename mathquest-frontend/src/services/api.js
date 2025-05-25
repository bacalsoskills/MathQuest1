// import axios from "axios";

// // Use relative URLs with the proxy in package.json instead of absolute URL
// const api = axios.create({
//   // No baseURL needed when using proxy in package.json
//   headers: {
//     "Content-Type": "application/json",
//   },
//   timeout: 10000,
// });

// console.log("API Service initialized with proxy configuration");

// // Add a request interceptor to include the JWT token in all requests
// api.interceptors.request.use(
//   (config) => {
//     console.log(
//       `Making ${config.method.toUpperCase()} request to: ${config.url}`
//     );

//     const token = localStorage.getItem("token");
//     if (token) {
//       console.log("Adding Authorization header with token");
//       config.headers.Authorization = `Bearer ${token}`;
//     } else {
//       console.log("No token found in localStorage");
//     }
//     return config;
//   },
//   (error) => {
//     console.error("Request interceptor error:", error);
//     return Promise.reject(error);
//   }
// );

// // Add a response interceptor to handle errors
// api.interceptors.response.use(
//   (response) => {
//     console.log(`Response received from ${response.config.url}:`, {
//       status: response.status,
//       statusText: response.statusText,
//       data: response.data ? "Data present" : "No data",
//     });
//     return response;
//   },
//   (error) => {
//     console.error("API Error Response:", {
//       message: error.message,
//       request: error.config
//         ? {
//             method: error.config.method,
//             url: error.config.url,
//           }
//         : "No request config",
//       response: error.response
//         ? {
//             status: error.response.status,
//             headers: error.response.headers,
//             data: error.response.data,
//           }
//         : "No response received",
//     });

//     if (error.response && error.response.status === 401) {
//       // Unauthorized - clean up and redirect to login
//       console.log("Unauthorized access detected. Redirecting to login.");
//       localStorage.removeItem("token");
//       localStorage.removeItem("user");
//       window.location.href = "/login";
//     }
//     return Promise.reject(error);
//   }
// );

// export default api;

import axios from "axios";

// Use relative URLs with the proxy in package.json instead of absolute URL
const api = axios.create({
  // No baseURL needed when using proxy in package.json
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

console.log("API Service initialized with proxy configuration");

// Add a request interceptor to include the JWT token in all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");

    console.log(`API Request: ${config.method.toUpperCase()} ${config.url}`);
    console.log("Request headers:", config.headers);
    console.log("Request data:", config.data);

    if (user) {
      console.log("Current user ID:", user.id);
      console.log("User role:", user.role);
    } else {
      console.warn("No user data found in localStorage");
    }

    if (token) {
      console.log("Adding Authorization header with token");
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.warn("No token found in localStorage");
      // Try to get token from user object as fallback
      if (user?.token) {
        console.log("Using token from user object");
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
    console.log(`API Response: ${response.status} ${response.statusText}`);
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
