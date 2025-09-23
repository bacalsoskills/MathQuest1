import api from "./api";
import logger from "./logger";

const AuthService = {
  login: async (usernameOrEmail, password) => {
    try {
      const loginRequest = { username: usernameOrEmail, password: password };
      const response = await api.post("/auth/signin", loginRequest);

      // Check if the response contains an error message
      if (
        response.data &&
        typeof response.data === "object" &&
        response.data.message &&
        (response.data.message.includes("verify") ||
          response.data.message.includes("Verify"))
      ) {
        throw new Error(response.data.message);
      }

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data));
      }
      return { success: true, data: response.data };
    } catch (error) {
      // Check if this is a verification error from Spring Security
      const errorMsg =
        error.response?.data?.message ||
        (typeof error.response?.data === "string"
          ? error.response.data
          : null) ||
        error.message;

      // Special handling for verification errors
      if (
        errorMsg &&
        (errorMsg.includes("verify") ||
          errorMsg.includes("Verify") ||
          errorMsg.includes("enabled") ||
          errorMsg.includes("activated"))
      ) {
        throw new Error(
          "Please verify your email before logging in. Check your inbox for a verification link."
        );
      }

      throw new Error(
        errorMsg ||
          "Login failed. Please check credentials or verify your email."
      );
    }
  },

  register: async (signupData) => {
    try {
      const formattedRequest = {
        ...signupData,
        role: [signupData.role],
      };
      const response = await api.post("/auth/signup", formattedRequest);

      // Check if the response contains an error message (Spring Boot sometimes returns 200 OK with error message)
      if (
        response.data &&
        response.data.message &&
        response.data.message.startsWith("Error:")
      ) {
        throw new Error(response.data.message);
      }

      return response.data; // Contains the success message
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data) {
        const data = error.response.data;
        if (data.message) {
          errorMessage = data.message;
        } else if (Array.isArray(data.errors) && data.errors.length > 0) {
          errorMessage = data.errors
            .map((err) => `${err.field}: ${err.defaultMessage}`)
            .join(", ");
        } else if (typeof data === "object") {
          errorMessage = JSON.stringify(data);
        } else if (typeof data === "string") {
          errorMessage = data;
        }
      } else if (error.message) {
        // This handles the error we threw above for responses with "Error:" prefix
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify?token=${token}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Email verification failed. The link may be invalid or expired."
      );
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  refreshUser: async () => {
    try {
      // Get current user profile data from the API
      const response = await api.get("/users/profile");
      const userData = response.data;

      // Get current user from localStorage to preserve the token
      const currentUser = AuthService.getCurrentUser();

      if (currentUser && currentUser.token) {
        // Create updated user object with fresh data and existing token
        const updatedUser = {
          ...userData,
          token: currentUser.token,
          roles: userData.roles?.map((role) =>
            typeof role === "string" ? role : role.name
          ),
          // Include profile image data if it exists
          profileImage: userData.profileImage || null,
          profileImageName: userData.profileImageName || null,
        };

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(updatedUser));
        return updatedUser;
      }
      return userData;
    } catch (error) {
      logger.error("Failed to refresh user", { error: error.message });
      // Return current user as fallback
      return AuthService.getCurrentUser();
    }
  },

  isAuthenticated: () => {
    return localStorage.getItem("token") !== null;
  },

  isAdmin: () => {
    const user = AuthService.getCurrentUser();
    return user && user.roles && user.roles.includes("ROLE_ADMIN");
  },

  isTeacher: () => {
    const user = AuthService.getCurrentUser();
    return user && user.roles && user.roles.includes("ROLE_TEACHER");
  },

  isStudent: () => {
    const user = AuthService.getCurrentUser();
    return user && user.roles && user.roles.includes("ROLE_STUDENT");
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return {
        success: true,
        message:
          response.data.message || "Password reset email sent successfully",
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to process password reset request"
      );
    }
  },

  resetPassword: async (token, newPassword, confirmPassword) => {
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
        confirmPassword,
      });
      return {
        success: true,
        message: response.data.message || "Password reset successful",
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to reset password"
      );
    }
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    try {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords do not match");
      }
      if (newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long");
      }
      const response = await api.post("/users/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return {
        success: true,
        message: response.data.message || "Password changed successfully",
      };
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to change password"
      );
    }
  },
};

export default AuthService;
