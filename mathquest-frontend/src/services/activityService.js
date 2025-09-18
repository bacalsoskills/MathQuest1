import api from "./api";

const activityService = {
  createActivity: async (activityData) => {
    // Create form data for multipart file upload
    const formData = new FormData();
    formData.append("title", activityData.title);
    formData.append("description", activityData.description || "");
    formData.append("type", activityData.type);
    formData.append("classroomId", activityData.classroomId);
    formData.append("content", activityData.content || JSON.stringify({})); // Add default empty content

    const response = await api.post("/activities", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  getActivityById: async (activityId) => {
    const response = await api.get(`/activities/${activityId}`);
    return response.data;
  },

  getActivitiesByClassroom: async (classroomId) => {
    const response = await api.get(`/activities/classroom/${classroomId}`);
    return response.data;
  },

  updateActivity: async (activityId, formData) => {
    try {
      const response = await api.put(`/activities/${activityId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating activity:", error);
      throw error;
    }
  },

  deleteActivity: async (activityId) => {
    await api.delete(`/activities/${activityId}`);
  },
};

export default activityService;
