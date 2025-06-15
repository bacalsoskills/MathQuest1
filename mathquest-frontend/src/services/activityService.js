// // import api from "./api";

// // const API_URL = "/activities";

// // const activityService = {
// //   // Get activities for a lesson
// //   getActivitiesByLessonId: async (lessonId) => {
// //     try {
// //       const response = await api.get(`${API_URL}/lesson/${lessonId}`);
// //       console.log("Activities fetched:", response.data);
// //       return response.data;
// //     } catch (error) {
// //       console.error("Error fetching activities:", error);
// //       throw error;
// //     }
// //   },

// //   // Get activities by type for a lesson
// //   getActivitiesByLessonIdAndType: async (lessonId, type) => {
// //     try {
// //       const response = await api.get(
// //         `${API_URL}/lesson/${lessonId}/type/${type}`
// //       );
// //       console.log(`${type} activities fetched:`, response.data);
// //       return response.data;
// //     } catch (error) {
// //       console.error(`Error fetching ${type} activities:`, error);
// //       throw error;
// //     }
// //   },

// //   // Get a specific activity
// //   getActivityById: async (activityId) => {
// //     try {
// //       const response = await api.get(`${API_URL}/${activityId}`);
// //       console.log("Activity fetched:", response.data);
// //       return response.data;
// //     } catch (error) {
// //       console.error("Error fetching activity:", error);
// //       throw error;
// //     }
// //   },

// //   // Create a new activity
// //   createActivity: async (activityData) => {
// //     try {
// //       console.log("Creating activity with data:", activityData);

// //       // Create form data for multipart file upload
// //       const formData = new FormData();
// //       formData.append("title", activityData.title);
// //       formData.append("description", activityData.description || "");
// //       formData.append("type", activityData.type);
// //       formData.append("content", activityData.content);
// //       formData.append("lessonId", activityData.lessonId);

// //       if (activityData.orderIndex !== undefined) {
// //         formData.append("orderIndex", activityData.orderIndex);
// //       }

// //       if (activityData.maxScore !== undefined) {
// //         formData.append("maxScore", activityData.maxScore);
// //       }

// //       if (activityData.timeLimit !== undefined) {
// //         formData.append("timeLimit", activityData.timeLimit);
// //       }

// //       if (activityData.image) {
// //         formData.append("image", activityData.image);
// //       }

// //       const response = await api.post(API_URL, formData, {
// //         headers: {
// //           "Content-Type": "multipart/form-data",
// //         },
// //       });
// //       console.log("Activity created:", response.data);
// //       return response.data;
// //     } catch (error) {
// //       console.error("Error creating activity:", error);
// //       throw error;
// //     }
// //   },

// //   // Update an existing activity
// //   updateActivity: async (activityId, activityData) => {
// //     try {
// //       console.log("Updating activity with data:", activityData);

// //       const formData = new FormData();
// //       formData.append("title", activityData.title);
// //       formData.append("description", activityData.description || "");
// //       formData.append("type", activityData.type);
// //       formData.append("content", activityData.content);
// //       formData.append("lessonId", activityData.lessonId);

// //       if (activityData.orderIndex !== undefined) {
// //         formData.append("orderIndex", activityData.orderIndex);
// //       }

// //       if (activityData.maxScore !== undefined) {
// //         formData.append("maxScore", activityData.maxScore);
// //       }

// //       if (activityData.timeLimit !== undefined) {
// //         formData.append("timeLimit", activityData.timeLimit);
// //       }

// //       if (activityData.image && activityData.image instanceof File) {
// //         formData.append("image", activityData.image);
// //       }

// //       const response = await api.put(`${API_URL}/${activityId}`, formData, {
// //         headers: {
// //           "Content-Type": "multipart/form-data",
// //         },
// //       });
// //       console.log("Activity updated:", response.data);
// //       return response.data;
// //     } catch (error) {
// //       console.error("Error updating activity:", error);
// //       throw error;
// //     }
// //   },

// //   // Delete an activity
// //   deleteActivity: async (activityId) => {
// //     try {
// //       await api.delete(`${API_URL}/${activityId}`);
// //       console.log("Activity deleted successfully");
// //       return true;
// //     } catch (error) {
// //       console.error("Error deleting activity:", error);
// //       throw error;
// //     }
// //   },

// //   // Get activities with timestamps for a lesson
// //   getActivitiesWithDates: async (lessonId) => {
// //     try {
// //       const response = await api.get(
// //         `${API_URL}/lesson/${lessonId}/with-dates`
// //       );
// //       console.log("Activities with dates fetched:", response.data);
// //       return response.data;
// //     } catch (error) {
// //       console.error("Error fetching activities with dates:", error);
// //       throw error;
// //     }
// //   },
// // };

// // export default activityService;

// import api from "./api";

// const API_URL = "/activities";

// const activityService = {
//   // Get activities for a lesson
//   getActivitiesByLessonId: async (lessonId) => {
//     try {
//       const response = await api.get(`${API_URL}/lesson/${lessonId}`);
//       console.log("Activities fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching activities:", error);
//       throw error;
//     }
//   },

//   // Get activities by type for a lesson
//   getActivitiesByLessonIdAndType: async (lessonId, type) => {
//     try {
//       const response = await api.get(
//         `${API_URL}/lesson/${lessonId}/type/${type}`
//       );
//       console.log(`${type} activities fetched:`, response.data);
//       return response.data;
//     } catch (error) {
//       console.error(`Error fetching ${type} activities:`, error);
//       throw error;
//     }
//   },

//   // Get a specific activity
//   getActivityById: async (activityId) => {
//     try {
//       const response = await api.get(`${API_URL}/${activityId}`);
//       console.log("Activity fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching activity:", error);
//       throw error;
//     }
//   },

//   // Create a new activity
//   createActivity: async (activityData) => {
//     try {
//       console.log("Creating activity with data:", activityData);

//       // Create form data for multipart file upload
//       const formData = new FormData();
//       formData.append("title", activityData.title);
//       formData.append("description", activityData.description || "");
//       formData.append("type", activityData.type);
//       formData.append("content", activityData.content);
//       formData.append("lessonId", activityData.lessonId);

//       if (activityData.orderIndex !== undefined) {
//         formData.append("orderIndex", activityData.orderIndex);
//       }

//       if (activityData.maxScore !== undefined) {
//         formData.append("maxScore", activityData.maxScore);
//       }

//       if (activityData.timeLimit !== undefined) {
//         formData.append("timeLimit", activityData.timeLimit);
//       }

//       if (activityData.image) {
//         formData.append("image", activityData.image);
//       }

//       // Do not set content-type header explicitly - let browser set it with boundary
//       const response = await api.post(API_URL, formData);
//       console.log("Activity created:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error creating activity:", error);
//       throw error;
//     }
//   },

//   // Update an existing activity
//   updateActivity: async (activityId, activityData) => {
//     try {
//       console.log("Updating activity with data:", activityData);

//       const formData = new FormData();
//       formData.append("title", activityData.title);
//       formData.append("description", activityData.description || "");
//       formData.append("type", activityData.type);
//       formData.append("content", activityData.content);
//       formData.append("lessonId", activityData.lessonId);

//       if (activityData.orderIndex !== undefined) {
//         formData.append("orderIndex", activityData.orderIndex);
//       }

//       if (activityData.maxScore !== undefined) {
//         formData.append("maxScore", activityData.maxScore);
//       }

//       if (activityData.timeLimit !== undefined) {
//         formData.append("timeLimit", activityData.timeLimit);
//       }

//       if (activityData.image && activityData.image instanceof File) {
//         formData.append("image", activityData.image);
//       }

//       // Do not set content-type header explicitly
//       const response = await api.put(`${API_URL}/${activityId}`, formData);
//       console.log("Activity updated:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error updating activity:", error);
//       throw error;
//     }
//   },

//   // Delete an activity
//   deleteActivity: async (activityId) => {
//     try {
//       await api.delete(`${API_URL}/${activityId}`);
//       console.log("Activity deleted successfully");
//       return true;
//     } catch (error) {
//       console.error("Error deleting activity:", error);
//       throw error;
//     }
//   },

//   // Get activities with timestamps for a lesson
//   getActivitiesWithDates: async (lessonId) => {
//     try {
//       const response = await api.get(
//         `${API_URL}/lesson/${lessonId}/with-dates`
//       );
//       console.log("Activities with dates fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching activities with dates:", error);
//       throw error;
//     }
//   },
// };

// export default activityService;

import api from "./api";

const activityService = {
  createActivity: async (activityData) => {
    console.log("activityService.createActivity - Request:", {
      url: "/activities",
      data: activityData,
    });

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
      console.log("Updating activity with data:", formData);
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

// const activityService = {
//   // Get activities for a classroom
//   getActivitiesByClassroomId: async (classroomId) => {
//     try {
//       const response = await api.get(`${API_URL}/classroom/${classroomId}`);
//       console.log("Activities fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching activities:", error);
//       throw error;
//     }
//   },

//   // Get activities by type for a classroom
//   getActivitiesByClassroomIdAndType: async (classroomId, type) => {
//     try {
//       const response = await api.get(
//         `${API_URL}/classroom/${classroomId}/type/${type}`
//       );
//       console.log(`${type} activities fetched:`, response.data);
//       return response.data;
//     } catch (error) {
//       console.error(`Error fetching ${type} activities:`, error);
//       throw error;
//     }
//   },

//   // Get a specific activity
//   getActivityById: async (activityId) => {
//     try {
//       const response = await api.get(`${API_URL}/${activityId}`);
//       console.log("Activity fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching activity:", error);
//       throw error;
//     }
//   },

//   // Create a new activity
//   createActivity: async (activityData) => {
//     try {
//       console.log("Creating activity with data:", activityData);

//       // Create form data for multipart file upload
//       const formData = new FormData();
//       formData.append("title", activityData.title);
//       formData.append("description", activityData.description || "");
//       formData.append("type", activityData.type);
//       formData.append("content", activityData.content);
//       formData.append("classroomId", activityData.classroomId);

//       if (activityData.orderIndex !== undefined) {
//         formData.append("orderIndex", activityData.orderIndex);
//       }

//       if (activityData.maxScore !== undefined) {
//         formData.append("maxScore", activityData.maxScore);
//       }

//       if (activityData.timeLimit !== undefined) {
//         formData.append("timeLimit", activityData.timeLimit);
//       }

//       if (activityData.image) {
//         formData.append("image", activityData.image);
//       }

//       // Do not set content-type header explicitly - let browser set it with boundary
//       const response = await api.post(API_URL, formData);
//       console.log("Activity created:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error creating activity:", error);
//       throw error;
//     }
//   },

//   // Update an existing activity
//   updateActivity: async (activityId, activityData) => {
//     try {
//       console.log("Updating activity with data:", activityData);

//       const formData = new FormData();
//       formData.append("title", activityData.title);
//       formData.append("description", activityData.description || "");
//       formData.append("type", activityData.type);
//       formData.append("content", activityData.content);
//       formData.append("classroomId", activityData.classroomId);

//       if (activityData.orderIndex !== undefined) {
//         formData.append("orderIndex", activityData.orderIndex);
//       }

//       if (activityData.maxScore !== undefined) {
//         formData.append("maxScore", activityData.maxScore);
//       }

//       if (activityData.timeLimit !== undefined) {
//         formData.append("timeLimit", activityData.timeLimit);
//       }

//       if (activityData.image && activityData.image instanceof File) {
//         formData.append("image", activityData.image);
//       }

//       // Do not set content-type header explicitly - let browser set it with boundary
//       const response = await api.put(`${API_URL}/${activityId}`, formData);
//       console.log("Activity updated:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error updating activity:", error);
//       throw error;
//     }
//   },

//   // Delete an activity
//   deleteActivity: async (activityId) => {
//     try {
//       await api.delete(`${API_URL}/${activityId}`);
//       console.log("Activity deleted successfully");
//       return true;
//     } catch (error) {
//       console.error("Error deleting activity:", error);
//       throw error;
//     }
//   },

//   // Get student leaderboard for classroom
//   getStudentLeaderboard: async (classroomId) => {
//     try {
//       const response = await api.get(`${API_URL}/leaderboard/${classroomId}`);
//       console.log("Leaderboard fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching leaderboard:", error);
//       throw error;
//     }
//   },

//   // Get student progress in classroom
//   getStudentProgress: async (classroomId, studentId) => {
//     try {
//       const response = await api.get(
//         `${API_URL}/progress/${classroomId}/student/${studentId}`
//       );
//       console.log("Student progress fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching student progress:", error);
//       throw error;
//     }
//   },
// };

// export default activityService;
