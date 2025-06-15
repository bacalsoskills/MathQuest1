// import api from "./api";

// const API_URL = "/quizzes";

// const quizService = {
//   // Quiz CRUD operations
//   createQuiz: async (activityId, quizData) => {
//     console.log("quizService.createQuiz - Request:", {
//       url: `/quizzes/activities/${activityId}`,
//       data: quizData,
//     });
//     const response = await api.post(
//       `/quizzes/activities/${activityId}`,
//       quizData
//     );
//     console.log("quizService.createQuiz - Response:", response.data);
//     return response.data;
//   },

//   getQuiz: async (quizId) => {
//     console.log("quizService.getQuiz - Request:", {
//       url: `${API_URL}/${quizId}`,
//     });
//     const response = await api.get(`${API_URL}/${quizId}`);
//     console.log("quizService.getQuiz - Response:", response.data);
//     return response.data;
//   },

//   getQuizByActivity: async (activityId) => {
//     console.log("quizService.getQuizByActivity - Request:", {
//       url: `${API_URL}/activities/${activityId}`,
//     });
//     try {
//       const response = await api.get(`${API_URL}/activities/${activityId}`);
//       console.log("quizService.getQuizByActivity - Response:", response.data);

//       // If the response is just a string 'Data present', we need more info
//       if (response.data === "Data present") {
//         throw new Error(
//           "Invalid response format from server. Expected quiz data but got confirmation string."
//         );
//       }

//       return response.data;
//     } catch (error) {
//       console.log("quizService.getQuizByActivity - Error:", {
//         status: error.response?.status,
//         data: error.response?.data,
//         message: error.message,
//       });
//       throw error;
//     }
//   },

//   updateQuiz: async (quizId, quizData) => {
//     console.log("quizService.updateQuiz - Request:", {
//       url: `${API_URL}/${quizId}`,
//       data: quizData,
//     });
//     const response = await api.put(`${API_URL}/${quizId}`, quizData);
//     console.log("quizService.updateQuiz - Response:", response.data);
//     return response.data;
//   },

//   deleteQuiz: async (quizId) => {
//     console.log("quizService.deleteQuiz - Request:", {
//       url: `${API_URL}/${quizId}`,
//     });
//     await api.delete(`${API_URL}/${quizId}`);
//   },

//   getQuizzesByClassroom: async (classroomId) => {
//     console.log("quizService.getQuizzesByClassroom - Request:", {
//       url: `${API_URL}/classroom/${classroomId}`,
//     });
//     const response = await api.get(`${API_URL}/classroom/${classroomId}`);
//     console.log("quizService.getQuizzesByClassroom - Response:", response.data);
//     return response.data;
//   },

//   // getAvailableQuizzes: async (classroomId) => {
//   //   console.log("quizService.getAvailableQuizzes - Request:", {
//   //     url: `${API_URL}/classroom/${classroomId}/available`,
//   //   });
//   //   const response = await api.get(
//   //     `${API_URL}/classroom/${classroomId}/available`
//   //   );
//   //   console.log("quizService.getAvailableQuizzes - Response:", response.data);
//   //   return response.data;
//   // },

//   // Quiz attempt operations

//   getAvailableQuizzes: async (classroomId) => {
//     console.log("quizService.getAvailableQuizzes - Request:", {
//       url: `${API_URL}/classroom/${classroomId}/available`,
//     });
//     try {
//       const response = await api.get(
//         `${API_URL}/classroom/${classroomId}/available`
//       );
//       console.log("quizService.getAvailableQuizzes - Response:", response.data);

//       // Log the response data for debugging
//       if (Array.isArray(response.data)) {
//         console.log("Available quizzes fetched:", response.data);
//       } else {
//         console.warn("Expected an array but got:", response.data);
//       }

//       return response.data;
//     } catch (error) {
//       console.error("Error fetching available quizzes:", error);
//       throw error;
//     }
//   },

//   startQuizAttempt: async (quizId, studentId) => {
//     console.log("quizService.startQuizAttempt - Request:", {
//       url: `${API_URL}/${quizId}/attempts/start`,
//       params: { studentId },
//     });
//     const response = await api.post(
//       `${API_URL}/${quizId}/attempts/start?studentId=${studentId}`
//     );
//     console.log("quizService.startQuizAttempt - Response:", response.data);
//     return response.data;
//   },

//   completeQuizAttempt: async (attemptId, score, answers) => {
//     console.log("quizService.completeQuizAttempt - Request:", {
//       url: `${API_URL}/attempts/${attemptId}/complete`,
//       data: { score, answers },
//     });
//     try {
//       const response = await api.post(
//         `${API_URL}/attempts/${attemptId}/complete`,
//         {
//           score,
//           answers,
//         }
//       );
//       console.log("quizService.completeQuizAttempt - Response:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error completing quiz attempt:", error);
//       throw error; // Rethrow to handle in the component
//     }
//   },

//   getQuizAttempt: async (attemptId) => {
//     console.log("quizService.getQuizAttempt - Request:", {
//       url: `${API_URL}/attempts/${attemptId}`,
//     });
//     const response = await api.get(`${API_URL}/attempts/${attemptId}`);
//     console.log("quizService.getQuizAttempt - Response:", response.data);
//     return response.data;
//   },

//   getQuizAttemptsByStudent: async (studentId) => {
//     console.log("quizService.getQuizAttemptsByStudent - Request:", {
//       url: `${API_URL}/attempts/student/${studentId}`,
//     });
//     try {
//       const response = await api.get(
//         `${API_URL}/attempts/student/${studentId}`
//       );
//       console.log(
//         "quizService.getQuizAttemptsByStudent - Response:",
//         response.data
//       );
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching student quiz attempts:", error);
//       return []; // Return empty array on error to prevent UI breaks
//     }
//   },

//   getQuizAttemptsByQuiz: async (quizId) => {
//     console.log("quizService.getQuizAttemptsByQuiz - Request:", {
//       url: `${API_URL}/${quizId}/attempts`,
//     });
//     const response = await api.get(`${API_URL}/${quizId}/attempts`);
//     console.log("quizService.getQuizAttemptsByQuiz - Response:", response.data);
//     return response.data;
//   },

//   getTopQuizAttempts: async (quizId) => {
//     console.log("quizService.getTopQuizAttempts - Request:", {
//       url: `${API_URL}/${quizId}/attempts/top`,
//     });
//     const response = await api.get(`${API_URL}/${quizId}/attempts/top`);
//     console.log("quizService.getTopQuizAttempts - Response:", response.data);
//     return response.data;
//   },
// };

// export default quizService;

import api from "./api";
import { leaderboardService } from "./leaderboardService";
import axios from "axios";

const API_URL = "/quizzes";

const quizService = {
  // Quiz CRUD operations
  createQuiz: async (activityId, quizData) => {
    console.log("quizService.createQuiz - Request:", {
      url: `${API_URL}/activities/${activityId}`,
      data: quizData,
    });
    const response = await api.post(
      `${API_URL}/activities/${activityId}`,
      quizData
    );
    console.log("quizService.createQuiz - Response:", response.data);
    return response.data;
  },

  getQuiz: async (quizId) => {
    console.log("quizService.getQuiz - Request:", {
      url: `${API_URL}/${quizId}`,
    });
    const response = await api.get(`${API_URL}/${quizId}`);
    console.log("quizService.getQuiz - Response:", response.data);
    return response.data;
  },

  getQuizByActivity: async (activityId) => {
    console.log("quizService.getQuizByActivity - Request:", {
      url: `${API_URL}/activities/${activityId}`,
    });
    try {
      const response = await api.get(`${API_URL}/activities/${activityId}`);
      console.log("quizService.getQuizByActivity - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("quizService.getQuizByActivity - Error:", error);
      throw error;
    }
  },

  updateQuiz: async (quizId, quizData) => {
    console.log("quizService.updateQuiz - Request:", {
      url: `${API_URL}/${quizId}`,
      data: quizData,
    });
    const response = await api.put(`${API_URL}/${quizId}`, quizData);
    console.log("quizService.updateQuiz - Response:", response.data);
    return response.data;
  },

  deleteQuiz: async (quizId) => {
    console.log("quizService.deleteQuiz - Request:", {
      url: `${API_URL}/${quizId}`,
    });
    await api.delete(`${API_URL}/${quizId}`);
  },

  getQuizzesByClassroom: async (classroomId) => {
    console.log("quizService.getQuizzesByClassroom - Request:", {
      url: `${API_URL}/classroom/${classroomId}`,
    });
    const response = await api.get(`${API_URL}/classroom/${classroomId}`);
    console.log("quizService.getQuizzesByClassroom - Response:", response.data);
    return response.data;
  },

  getAvailableQuizzes: async (classroomId) => {
    console.log("quizService.getAvailableQuizzes - Request:", {
      url: `${API_URL}/classroom/${classroomId}/available`,
    });
    try {
      const response = await api.get(
        `${API_URL}/classroom/${classroomId}/available`
      );
      console.log("quizService.getAvailableQuizzes - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching available quizzes:", error);
      throw error;
    }
  },

  startQuizAttempt: async (quizId, studentId) => {
    console.log("[quizService] Starting quiz attempt with details:", {
      quizId,
      studentId,
      url: `${API_URL}/${quizId}/attempts/start`,
      method: "POST",
    });

    try {
      console.log("[quizService] Making API request to start quiz attempt...");
      const response = await api.post(
        `${API_URL}/${quizId}/attempts/start`,
        null,
        {
          params: { studentId },
        }
      );
      console.log(
        "[quizService] Quiz attempt started successfully:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("[quizService] Failed to start quiz attempt:", {
        error: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          headers: error.config?.headers,
        },
      });
      throw error;
    }
  },

  completeQuizAttempt: async (attemptId, pointsEarned, answers) => {
    console.log("quizService.completeQuizAttempt - Request:", {
      url: `${API_URL}/attempts/${attemptId}/complete`,
      data: {
        score: pointsEarned,
        answers,
      },
    });
    try {
      const response = await api.post(
        `${API_URL}/attempts/${attemptId}/complete`,
        {
          score: pointsEarned,
          answers,
        }
      );
      console.log("quizService.completeQuizAttempt - Response:", response.data);
      return response.data;
    } catch (error) {
      console.error("quizService.completeQuizAttempt - Error:", error);
      throw error;
    }
  },

  getQuizAttempt: async (attemptId) => {
    console.log("quizService.getQuizAttempt - Request:", {
      url: `${API_URL}/attempts/${attemptId}`,
    });
    const response = await api.get(`${API_URL}/attempts/${attemptId}`);
    console.log("quizService.getQuizAttempt - Response:", response.data);
    return response.data;
  },

  getQuizAttemptsByStudent: async (studentId) => {
    console.log("quizService.getQuizAttemptsByStudent - Request:", {
      url: `${API_URL}/attempts/student/${studentId}`,
    });
    try {
      const response = await api.get(
        `${API_URL}/attempts/student/${studentId}`
      );
      console.log(
        "quizService.getQuizAttemptsByStudent - Response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching student quiz attempts:", error);
      return []; // Return empty array on error to prevent UI breaks
    }
  },

  getQuizAttemptsByQuiz: async (quizId) => {
    console.log("quizService.getQuizAttemptsByQuiz - Request:", {
      url: `${API_URL}/${quizId}/attempts`,
    });
    const response = await api.get(`${API_URL}/${quizId}/attempts`);
    console.log("quizService.getQuizAttemptsByQuiz - Response:", response.data);
    return response.data;
  },

  getTopQuizAttempts: async (quizId) => {
    console.log("quizService.getTopQuizAttempts - Request:", {
      url: `${API_URL}/${quizId}/attempts/top`,
    });
    const response = await api.get(`${API_URL}/${quizId}/attempts/top`);
    console.log("quizService.getTopQuizAttempts - Response:", response.data);
    return response.data;
  },

  getQuizByActivityId: async (activityId) => {
    try {
      console.log(`[quizService] Fetching quiz for activity ${activityId}`);
      const response = await api.get(`${API_URL}/activities/${activityId}`);
      console.log(`[quizService] Quiz fetched successfully:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`[quizService] Error fetching quiz by activity ID:`, error);
      throw error;
    }
  },

  createQuizAttempt: async (quizId, studentId) => {
    try {
      console.log(`[quizService] Creating quiz attempt with details:`, {
        quizId,
        studentId,
        url: `${API_URL}/${quizId}/attempts/start`,
        method: "POST",
        params: { studentId },
      });

      const response = await api.post(
        `${API_URL}/${quizId}/attempts/start`,
        null,
        {
          params: { studentId },
        }
      );

      console.log(`[quizService] Quiz attempt created successfully:`, {
        status: response.status,
        data: response.data,
        headers: response.headers,
      });

      return response.data;
    } catch (error) {
      console.error(`[quizService] Error creating quiz attempt:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          params: error.config?.params,
          headers: error.config?.headers,
        },
      });
      throw error;
    }
  },
};

export default quizService;
