import api from "./api";

const API_URL = "/lessons";

const lessonService = {
  // Get all lessons for a classroom
  getLessonsByClassroomId: async (classroomId) => {
    try {
      const response = await api.get(`${API_URL}/classroom/${classroomId}`);
      console.log("Lessons fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching lessons:", error);
      throw error;
    }
  },

  // Get a specific lesson with its content blocks and activities
  getLessonById: async (lessonId) => {
    try {
      const response = await api.get(`${API_URL}/${lessonId}`);
      console.log("Lesson fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching lesson:", error);
      throw error;
    }
  },

  // Create a new lesson
  createLesson: async (lessonData) => {
    try {
      console.log("Creating lesson with data:", lessonData);

      // Create form data for multipart file upload
      const formData = new FormData();
      formData.append("title", lessonData.title);
      formData.append("description", lessonData.description || "");
      formData.append("classroomId", lessonData.classroomId);
      if (lessonData.orderIndex) {
        formData.append("orderIndex", lessonData.orderIndex);
      }
      if (lessonData.image) {
        formData.append("image", lessonData.image);
      }

      const response = await api.post(API_URL, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Lesson created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating lesson:", error);
      throw error;
    }
  },

  // Update an existing lesson
  updateLesson: async (lessonId, lessonData) => {
    try {
      console.log("Updating lesson with data:", lessonData);

      // If lessonData is already a FormData object, use it directly
      let formData;
      if (lessonData instanceof FormData) {
        formData = lessonData;
        console.log("Using provided FormData object");
      } else {
        // Create form data for multipart file upload
        formData = new FormData();
        formData.append("title", lessonData.title);
        formData.append("description", lessonData.description || "");

        if (lessonData.classroomId) {
          formData.append("classroomId", lessonData.classroomId);
        }

        if (lessonData.orderIndex) {
          formData.append("orderIndex", lessonData.orderIndex);
        }

        if (lessonData.image && lessonData.image instanceof File) {
          formData.append("image", lessonData.image);
        }
      }

      const response = await api.put(`${API_URL}/${lessonId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Lesson updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating lesson:", error);
      throw error;
    }
  },

  // Delete a lesson
  deleteLesson: async (lessonId) => {
    try {
      await api.delete(`${API_URL}/${lessonId}`);
      console.log("Lesson deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting lesson:", error);
      throw error;
    }
  },

  // Get lessons with their creation/update dates
  getLessonsWithDates: async (classroomId) => {
    try {
      const response = await api.get(`${API_URL}/classroom/${classroomId}`);
      console.log("Lessons with dates fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching lessons with dates:", error);
      throw error;
    }
  },

  // Add a method to create an activity
  addActivity: async (activityData) => {
    try {
      const response = await api.post("/activities", activityData);
      return response.data;
    } catch (error) {
      console.error("Error adding activity:", error);
      throw error;
    }
  },
};

export default lessonService;
