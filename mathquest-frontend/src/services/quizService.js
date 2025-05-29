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

const API_URL = "/quizzes";

const quizService = {
  // Quiz CRUD operations
  createQuiz: async (activityId, quizData) => {
    console.log("quizService.createQuiz - Request:", {
      url: `/quizzes/activities/${activityId}`,
      data: quizData,
    });
    const response = await api.post(
      `/quizzes/activities/${activityId}`,
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

      // If the response is just a string 'Data present', we need more info
      if (response.data === "Data present") {
        throw new Error(
          "Invalid response format from server. Expected quiz data but got confirmation string."
        );
      }

      return response.data;
    } catch (error) {
      console.log("quizService.getQuizByActivity - Error:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
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

  // getAvailableQuizzes: async (classroomId) => {
  //   console.log("quizService.getAvailableQuizzes - Request:", {
  //     url: `${API_URL}/classroom/${classroomId}/available`,
  //   });
  //   const response = await api.get(
  //     `${API_URL}/classroom/${classroomId}/available`
  //   );
  //   console.log("quizService.getAvailableQuizzes - Response:", response.data);
  //   return response.data;
  // },

  // Quiz attempt operations

  getAvailableQuizzes: async (classroomId) => {
    console.log("quizService.getAvailableQuizzes - Request:", {
      url: `${API_URL}/classroom/${classroomId}/available`,
    });
    try {
      const response = await api.get(
        `${API_URL}/classroom/${classroomId}/available`
      );
      console.log("quizService.getAvailableQuizzes - Response:", response.data);

      // Log the response data for debugging
      if (Array.isArray(response.data)) {
        console.log("Available quizzes fetched:", response.data);
      } else {
        console.warn("Expected an array but got:", response.data);
      }

      return response.data;
    } catch (error) {
      console.error("Error fetching available quizzes:", error);
      throw error;
    }
  },

  startQuizAttempt: async (quizId, studentId) => {
    console.log("quizService.startQuizAttempt - Request:", {
      url: `${API_URL}/${quizId}/attempts/start`,
      params: { studentId },
    });
    const response = await api.post(
      `${API_URL}/${quizId}/attempts/start?studentId=${studentId}`
    );
    console.log("quizService.startQuizAttempt - Response:", response.data);
    return response.data;
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
      // First complete the quiz attempt
      const response = await api.post(
        `${API_URL}/attempts/${attemptId}/complete`,
        {
          score: pointsEarned,
          answers,
        }
      );
      console.log("quizService.completeQuizAttempt - Response:", response.data);

      // Get the classroom ID from the quiz attempt response
      const quizId = response.data.quizId;
      const studentId = response.data.studentId;
      console.log(
        "Getting quiz details for quizId:",
        quizId,
        "studentId:",
        studentId
      );

      try {
        // Get quiz details including activity and classroom info
        const quizResponse = await api.get(`${API_URL}/${quizId}`);
        console.log("Quiz details response:", quizResponse.data);

        // Get activity details to find classroom ID
        if (quizResponse.data.activityId) {
          const activityResponse = await api.get(
            `/activities/${quizResponse.data.activityId}`
          );
          console.log("Activity details response:", activityResponse.data);

          const classroomId = activityResponse.data.classroomId;
          console.log("Found classroom ID:", classroomId);

          if (classroomId) {
            // Get the classroom leaderboard and find the specific entry
            try {
              console.log(
                "Fetching classroom leaderboard for classroom:",
                classroomId
              );
              const leaderboardData =
                await leaderboardService.getClassroomLeaderboard(classroomId);
              console.log(
                "Raw leaderboard data:",
                JSON.stringify(leaderboardData, null, 2)
              );

              // Find the specific entry for this student
              const studentEntry = leaderboardData.find((entry) => {
                const entryStudentId = entry.studentId || entry.user_id;
                console.log("Comparing student IDs:", {
                  entryStudentId,
                  studentId,
                  entry: entry,
                });
                return Number(entryStudentId) === Number(studentId);
              });

              console.log("Found student entry in leaderboard:", studentEntry);

              if (studentEntry) {
                // The rank is the index + 1 since the data is already sorted
                const rank = leaderboardData.indexOf(studentEntry) + 1;
                console.log("Calculated rank:", rank);
                response.data.rank = rank;
              } else {
                console.log("No student entry found in leaderboard");
                response.data.rank = "N/A";
              }
            } catch (rankError) {
              console.error("Error fetching leaderboard:", rankError);
              response.data.rank = "N/A";
            }
          } else {
            console.log("No classroom ID found in activity data");
            response.data.rank = "N/A";
          }
        } else {
          console.log("No activity ID found in quiz data");
          response.data.rank = "N/A";
        }
      } catch (quizError) {
        console.error("Error getting quiz or activity details:", quizError);
        response.data.rank = "N/A";
      }

      return {
        ...response.data,
        pointsEarned,
        totalPoints: Object.keys(answers).length,
      };
    } catch (error) {
      console.error("Error completing quiz attempt:", error);
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
};

export default quizService;
