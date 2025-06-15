// import api from "./api";

// const UserService = {
//   getUserProfile: async () => {
//     try {
//       const response = await api.get("/users/profile");
//       console.log("User profile API response:", {
//         status: response.status,
//         hasData: !!response.data,
//         hasProfileImage: response.data && !!response.data.profileImage,
//       });
//       return response.data;
//     } catch (error) {
//       throw error.response
//         ? error.response.data
//         : new Error("Failed to fetch profile");
//     }
//   },

//   updateUserProfile: async (updateData) => {
//     try {
//       // Include username in the update payload
//       const payload = {
//         firstName: updateData.firstName,
//         lastName: updateData.lastName,
//         email: updateData.email,
//         username: updateData.username,
//       };
//       // Remove any keys with undefined values, as the backend checks for null
//       Object.keys(payload).forEach(
//         (key) => payload[key] === undefined && delete payload[key]
//       );

//       const response = await api.put("/users/profile", payload);
//       return response.data;
//     } catch (error) {
//       // Handle specific error cases
//       if (
//         error.response?.data?.message?.includes("Username is already taken")
//       ) {
//         throw new Error(
//           "This username is already taken. Please choose another one."
//         );
//       }

//       if (error.response?.data?.message?.includes("Email is already in use")) {
//         throw new Error("This email is already in use by another account.");
//       }

//       // Propagate specific error messages if available
//       throw new Error(
//         error.response?.data?.message || // From potential backend validation/exceptions
//           (typeof error.response?.data === "string" && error.response.data) || // Plain string error
//           "Failed to update profile" // Generic fallback
//       );
//     }
//   },

//   verifyEmailUpdate: async (token) => {
//     try {
//       const response = await api.get(`/users/verify-email?token=${token}`);
//       return response.data;
//     } catch (error) {
//       throw new Error(
//         error.response?.data?.message ||
//           (typeof error.response?.data === "string" && error.response.data) ||
//           "Email verification failed. The link may be invalid or expired."
//       );
//     }
//   },

//   deleteAccount: async () => {
//     try {
//       const response = await api.delete("/users/profile");
//       return response.data;
//     } catch (error) {
//       // Propagate specific error messages if available
//       throw new Error(
//         error.response?.data?.message || // From potential backend validation/exceptions
//           (typeof error.response?.data === "string" && error.response.data) || // Plain string error
//           "Failed to delete account" // Generic fallback
//       );
//     }
//   },

//   // Admin only functions
//   deleteUser: async (userId) => {
//     try {
//       const response = await api.delete(`/users/${userId}`);
//       return response.data;
//     } catch (error) {
//       // Propagate specific error messages if available
//       throw new Error(
//         error.response?.data?.message || // From potential backend validation/exceptions
//           (typeof error.response?.data === "string" && error.response.data) || // Plain string error
//           "Failed to delete user" // Generic fallback
//       );
//     }
//   },

//   // These would be admin-specific endpoints that you might add to your backend
//   getAllUsers: async () => {
//     try {
//       const response = await api.get("/admin/users");
//       return response.data;
//     } catch (error) {
//       // Propagate specific error messages if available
//       throw new Error(
//         error.response?.data?.message || // From potential backend validation/exceptions
//           (typeof error.response?.data === "string" && error.response.data) || // Plain string error
//           "Failed to fetch users" // Generic fallback
//       );
//     }
//   },

//   resetUserPassword: async (userId, newPassword) => {
//     try {
//       const response = await api.put(`/admin/users/${userId}/reset-password`, {
//         password: newPassword,
//       });
//       return response.data;
//     } catch (error) {
//       // Propagate specific error messages if available
//       throw new Error(
//         error.response?.data?.message || // From potential backend validation/exceptions
//           (typeof error.response?.data === "string" && error.response.data) || // Plain string error
//           "Failed to reset password" // Generic fallback
//       );
//     }
//   },

//   changePassword: async (currentPassword, newPassword, confirmPassword) => {
//     try {
//       const response = await api.post("/users/change-password", {
//         currentPassword,
//         newPassword,
//         confirmPassword,
//       });
//       return response.data;
//     } catch (error) {
//       throw new Error(
//         error.response?.data?.message ||
//           (typeof error.response?.data === "string" && error.response.data) ||
//           "Failed to change password"
//       );
//     }
//   },

//   uploadProfilePicture: async (file) => {
//     try {
//       const formData = new FormData();
//       formData.append("file", file);

//       console.log("Sending profile image upload request with file:", file.name);

//       const response = await api.post("/users/profile/image", formData, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//         },
//       });

//       console.log("Profile image upload response:", response.data);

//       // Request complete profile refresh after image upload
//       const profileResponse = await api.get("/users/profile");
//       console.log("Refreshed profile after image upload:", {
//         hasData: !!profileResponse.data,
//         hasProfileImage:
//           profileResponse.data && !!profileResponse.data.profileImage,
//       });

//       return response.data;
//     } catch (error) {
//       console.error("Profile image upload error:", error);
//       throw new Error(
//         error.response?.data?.message ||
//           (typeof error.response?.data === "string" && error.response.data) ||
//           "Failed to upload profile picture"
//       );
//     }
//   },

//   // Add this method to explicitly get the profile image
//   getProfileImage: async () => {
//     try {
//       // Use a timestamp query parameter to bypass browser cache
//       const timestamp = new Date().getTime();
//       const response = await api.get(`/users/profile/image?t=${timestamp}`, {
//         responseType: "arraybuffer",
//       });

//       // Convert array buffer to base64 string for direct image display
//       const imageBase64 = btoa(
//         new Uint8Array(response.data).reduce(
//           (data, byte) => data + String.fromCharCode(byte),
//           ""
//         )
//       );

//       const contentType = response.headers["content-type"] || "image/jpeg";
//       return `data:${contentType};base64,${imageBase64}`;
//     } catch (error) {
//       console.error("Error fetching profile image:", error);
//       return null;
//     }
//   },
// };

// export default UserService;

import api from "./api";

const UserService = {
  getUserProfile: async () => {
    try {
      const response = await api.get("/users/profile");
      console.log("User profile API response:", {
        status: response.status,
        hasData: !!response.data,
        hasProfileImage: response.data && !!response.data.profileImage,
      });
      return response.data;
    } catch (error) {
      throw error.response
        ? error.response.data
        : new Error("Failed to fetch profile");
    }
  },

  updateUserProfile: async (updateData) => {
    try {
      // Include username in the update payload
      const payload = {
        firstName: updateData.firstName,
        lastName: updateData.lastName,
        email: updateData.email,
        username: updateData.username,
      };
      // Remove any keys with undefined values, as the backend checks for null
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      const response = await api.put("/users/profile", payload);
      return response.data;
    } catch (error) {
      // Handle specific error cases
      if (
        error.response?.data?.message?.includes("Username is already taken")
      ) {
        throw new Error(
          "This username is already taken. Please choose another one."
        );
      }

      if (error.response?.data?.message?.includes("Email is already in use")) {
        throw new Error("This email is already in use by another account.");
      }

      // Propagate specific error messages if available
      throw new Error(
        error.response?.data?.message || // From potential backend validation/exceptions
          (typeof error.response?.data === "string" && error.response.data) || // Plain string error
          "Failed to update profile" // Generic fallback
      );
    }
  },

  verifyEmailUpdate: async (token) => {
    try {
      const response = await api.get(`/users/verify-email?token=${token}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Email verification failed. The link may be invalid or expired."
      );
    }
  },

  deleteAccount: async () => {
    try {
      const response = await api.delete("/users/profile");
      return response.data;
    } catch (error) {
      // Propagate specific error messages if available
      throw new Error(
        error.response?.data?.message || // From potential backend validation/exceptions
          (typeof error.response?.data === "string" && error.response.data) || // Plain string error
          "Failed to delete account" // Generic fallback
      );
    }
  },

  // Admin only functions
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      // Propagate specific error messages if available
      throw new Error(
        error.response?.data?.message || // From potential backend validation/exceptions
          (typeof error.response?.data === "string" && error.response.data) || // Plain string error
          "Failed to delete user" // Generic fallback
      );
    }
  },

  getAllUsers: async () => {
    try {
      const response = await api.get("/admin/users");
      return response.data;
    } catch (error) {
      // Propagate specific error messages if available
      throw new Error(
        error.response?.data?.message || // From potential backend validation/exceptions
          (typeof error.response?.data === "string" && error.response.data) || // Plain string error
          "Failed to fetch users" // Generic fallback
      );
    }
  },

  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to update user"
      );
    }
  },

  resetUserPassword: async (userId, newPassword) => {
    try {
      const response = await api.put(`/admin/users/${userId}/reset-password`, {
        password: newPassword,
      });
      return response.data;
    } catch (error) {
      // Propagate specific error messages if available
      throw new Error(
        error.response?.data?.message || // From potential backend validation/exceptions
          (typeof error.response?.data === "string" && error.response.data) || // Plain string error
          "Failed to reset password" // Generic fallback
      );
    }
  },

  changePassword: async (currentPassword, newPassword, confirmPassword) => {
    try {
      const response = await api.post("/users/change-password", {
        currentPassword,
        newPassword,
        confirmPassword,
      });
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to change password"
      );
    }
  },

  uploadProfilePicture: async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      console.log("Sending profile image upload request with file:", file.name);

      const response = await api.post("/users/profile/image", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Profile image upload response:", response.data);

      // Request complete profile refresh after image upload
      const profileResponse = await api.get("/users/profile");
      console.log("Refreshed profile after image upload:", {
        hasData: !!profileResponse.data,
        hasProfileImage:
          profileResponse.data && !!profileResponse.data.profileImage,
      });

      return response.data;
    } catch (error) {
      console.error("Profile image upload error:", error);
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to upload profile picture"
      );
    }
  },

  // Add this method to explicitly get the profile image
  getProfileImage: async () => {
    try {
      // Use a timestamp query parameter to bypass browser cache
      const timestamp = new Date().getTime();
      const response = await api.get(`/users/profile/image?t=${timestamp}`, {
        responseType: "arraybuffer",
      });

      // Convert array buffer to base64 string for direct image display
      const imageBase64 = btoa(
        new Uint8Array(response.data).reduce(
          (data, byte) => data + String.fromCharCode(byte),
          ""
        )
      );

      const contentType = response.headers["content-type"] || "image/jpeg";
      return `data:${contentType};base64,${imageBase64}`;
    } catch (error) {
      console.error("Error fetching profile image:", error);
      return null;
    }
  },

  resendVerificationEmail: async () => {
    try {
      const response = await api.post("/users/resend-verification");
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to resend verification email"
      );
    }
  },

  resendEmailChangeVerification: async () => {
    try {
      const response = await api.post(
        "/users/resend-email-change-verification"
      );
      return response.data;
    } catch (error) {
      throw (
        error.response?.data?.message ||
        "Failed to resend email change verification"
      );
    }
  },

  // Admin only functions
  createUserByAdmin: async (userData) => {
    try {
      const response = await api.post("/admin/users", userData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to create user"
      );
    }
  },

  updateUserByAdmin: async (userId, userData) => {
    try {
      const response = await api.put(`/admin/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to update user"
      );
    }
  },

  deleteUserByAdmin: async (userId) => {
    try {
      const response = await api.delete(`/admin/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to delete user"
      );
    }
  },
};

export default UserService;
