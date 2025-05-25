import api from "./api";

const ClassroomService = {
  // For Teachers: Create a new classroom
  // Expected request: FormData with name, description, and optional image
  createClassroom: async (classroomData) => {
    try {
      console.log("Creating classroom with data:", {
        name: classroomData.get("name"),
        description: classroomData.get("description"),
        hasImage: classroomData.has("image"),
      });

      const response = await api.post("/classrooms", classroomData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Classroom created successfully:", response.data);
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
      console.log("Updating classroom with ID:", classroomId);
      console.log("Update data:", {
        name: classroomData.get("name"),
        description: classroomData.get("description"),
        shortCode: classroomData.get("shortCode"),
        hasImage: classroomData.has("image"),
      });

      const response = await api.put(
        `/classrooms/${classroomId}`,
        classroomData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("Classroom updated successfully:", response.data);
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
      console.log("Joining classroom with code:", classCode);
      const response = await api.post("/classrooms/join", { classCode });
      console.log("Successfully joined classroom:", response.data);
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
      console.log("Fetching classroom with ID:", id);
      const response = await api.get(`/classrooms/${id}`);
      return response.data;
    } catch (error) {
      console.error("Get classroom error:", error);
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
      console.log("Fetching classroom with code:", classCode);
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
      console.log("Fetching teacher classrooms");
      const token = localStorage.getItem("token");
      console.log("Using auth token:", token ? "Present" : "Missing");

      const response = await api.get("/classrooms/teacher");
      console.log("Teacher classrooms fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get teacher classrooms error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log("Fetching student classrooms");
      const token = localStorage.getItem("token");
      console.log("Using auth token:", token ? "Present" : "Missing");

      const response = await api.get("/classrooms/student");
      console.log("Student classrooms fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get student classrooms error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log("Fetching students for classroom ID:", classroomId);
      const response = await api.get(`/classrooms/${classroomId}/students`);
      console.log("Students fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get students error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log("Fetching student count for classroom ID:", classroomId);
      const response = await api.get(
        `/classrooms/${classroomId}/students/count`
      );
      console.log("Student count fetched:", response.data);
      return response.data.count;
    } catch (error) {
      console.error("Get student count error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log(`Adding student ${studentId} to classroom ${classroomId}`);
      const response = await api.post(
        `/classrooms/${classroomId}/students/${studentId}`
      );
      console.log("Student added successfully:", response.data);
      return response.data;
    } catch (error) {
      console.error("Add student error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log(
        `Searching for students with term: ${searchTerm} for classroom ${
          classroomId || "none"
        }`
      );
      const response = await api.get(`/classrooms/students/search`, {
        params: { searchTerm, classroomId },
      });
      console.log("Students search results:", response.data);
      return response.data;
    } catch (error) {
      console.error("Search students error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log(`Student leaving classroom with id: ${classroomId}`);
      await api.post(`/classrooms/${classroomId}/leave`);
      console.log("Successfully left classroom");
      return true;
    } catch (error) {
      console.error("Leave classroom error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log(
        `Removing student ${studentId} from classroom ${classroomId}`
      );
      await api.delete(`/classrooms/${classroomId}/students/${studentId}`);
      console.log("Student removed successfully");
      return true;
    } catch (error) {
      console.error("Remove student error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log(`Deleting classroom ${classroomId}`);
      await api.delete(`/classrooms/${classroomId}`);
      console.log("Classroom deleted successfully");
      return true;
    } catch (error) {
      console.error("Delete classroom error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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
      console.log("Fetching all classrooms");
      const response = await api.get("/admin/classrooms");
      console.log("All classrooms fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Get all classrooms error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to fetch all classrooms"
      );
    }
  },

  // For Admins: Delete classroom by ID
  deleteClassroomById: async (classroomId) => {
    try {
      console.log(`Deleting classroom with ID ${classroomId}`);
      await api.delete(`/admin/classrooms/${classroomId}`);
      console.log("Classroom deleted successfully");
      return true;
    } catch (error) {
      console.error("Delete classroom by ID error:", error);
      console.error("Error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
      throw new Error(
        error.response?.data?.message ||
          (typeof error.response?.data === "string" && error.response.data) ||
          "Failed to delete classroom"
      );
    }
  },
};

export default ClassroomService;
