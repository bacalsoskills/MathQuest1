import api from "./api";

const ClassroomService = {
  // For Teachers: Create a new classroom
  // Expected request: FormData with name, description, and optional image
  createClassroom: async (classroomData) => {
    try {
      const response = await api.post("/classrooms", classroomData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      console.error("Create classroom error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to create classroom"
      );
    }
  },

  // For Teachers: Update an existing classroom
  // Expected request: FormData with name, description, shortCode, and optional image
  updateClassroom: async (classroomId, classroomData) => {
    try {
      const response = await api.put(
        `/classrooms/${classroomId}`,
        classroomData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error("Update classroom error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to update classroom"
      );
    }
  },

  // For Students: Join a classroom with a class code
  // Expected request: { classCode: string }
  joinClassroom: async (classCode) => {
    try {
      const response = await api.post("/classrooms/join", { classCode });

      return response.data;
    } catch (error) {
      console.error("Join classroom error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to join classroom"
      );
    }
  },

  // Get a classroom by its ID
  getClassroomById: async (id) => {
    try {
      const response = await api.get(`/classrooms/${id}`);
      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to fetch classroom"
      );
    }
  },

  // Get classroom details - alias for getClassroomById for clearer naming
  getClassroomDetails: async (id) => {
    try {
      const response = await api.get(`/classrooms/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching classroom details for ${id}:`, error);
      throw error;
    }
  },

  // Get a classroom by its code
  getClassroomByCode: async (classCode) => {
    try {
      const response = await api.get(`/classrooms/code/${classCode}`);
      return response.data;
    } catch (error) {
      console.error("Get classroom by code error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to fetch classroom"
      );
    }
  },

  // For Teachers: Get classrooms created by the teacher
  getTeacherClassrooms: async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/classrooms/teacher");

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to fetch teacher classrooms"
      );
    }
  },

  // For Students: Get classrooms joined by the student
  getStudentClassrooms: async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await api.get("/classrooms/student");

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to fetch student classrooms"
      );
    }
  },

  // For Teachers/Admins: Get students in a classroom
  getStudentsInClassroom: async (classroomId) => {
    try {
      const response = await api.get(`/classrooms/${classroomId}/students`);

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to fetch classroom students"
      );
    }
  },

  // Get student count in a classroom
  getStudentCountInClassroom: async (classroomId) => {
    try {
      const response = await api.get(
        `/classrooms/${classroomId}/students/count`
      );

      return response.data.count;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to fetch student count"
      );
    }
  },

  // For Teachers: Add a student to a classroom
  addStudentToClassroom: async (classroomId, studentId) => {
    try {
      const response = await api.post(
        `/classrooms/${classroomId}/students/${studentId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to add student to classroom"
      );
    }
  },

  // For Teachers: Search for all students with indication if they're in a classroom
  searchStudents: async (searchTerm, classroomId) => {
    try {
      const response = await api.get(`/classrooms/students/search`, {
        params: { searchTerm, classroomId },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to search for students"
      );
    }
  },

  // For Students: Leave a classroom
  leaveClassroom: async (classroomId) => {
    try {
      await api.post(`/classrooms/${classroomId}/leave`);

      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to leave classroom"
      );
    }
  },

  // For Teachers: Remove a student from a classroom
  removeStudentFromClassroom: async (classroomId, studentId) => {
    try {
      await api.delete(`/classrooms/${classroomId}/students/${studentId}`);

      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to remove student from classroom"
      );
    }
  },

  // For Teachers/Admins: Delete a classroom
  deleteClassroom: async (classroomId) => {
    try {
      await api.delete(`/classrooms/${classroomId}`);

      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to delete classroom"
      );
    }
  },

  // For Admins: Get all classrooms
  getAllClassrooms: async () => {
    try {
      const response = await api.get("/admin/classrooms");

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to fetch all classrooms"
      );
    }
  },

  // For Admins: Create a new classroom
  // Expected request: FormData with name, description, teacherId, and optional image
  createClassroomAsAdmin: async (classroomData) => {
    try {
      const response = await api.post("/admin/classrooms", classroomData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to create classroom"
      );
    }
  },

  // For Admins: Update a classroom
  updateClassroomAsAdmin: async (classroomId, classroomData) => {
    try {
      const response = await api.put(
        `/admin/classrooms/${classroomId}`,
        classroomData
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to update classroom"
      );
    }
  },

  // For Admins: Add a student to a classroom
  addStudentToClassroomAsAdmin: async (classroomId, studentId) => {
    try {
      const response = await api.post(
        `/admin/classrooms/${classroomId}/students/${studentId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to add student to classroom"
      );
    }
  },
  // For Admins: Delete classroom by ID
  deleteClassroomById: async (classroomId) => {
    try {
      await api.delete(`/admin/classrooms/${classroomId}`);

      return true;
    } catch (error) {
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to delete classroom"
      );
    }
  },
};

export default ClassroomService;
