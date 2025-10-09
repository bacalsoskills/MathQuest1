// import axios from "axios";

// const API_URL = "/quizzes";

// // Helper function to get auth header
// const getAuthHeader = () => {
//   const token = localStorage.getItem("token");
//   if (!token) {
//     throw new Error("No authentication token found");
//   }
//   return {
//     headers: {
//       Authorization: `Bearer ${token}`,
//     },
//   };
// };

// // Helper function to get current user ID from auth context
// const getCurrentUserId = () => {
//   try {
//     const currentUser = JSON.parse(localStorage.getItem("user"));
//     console.log("[Auth] Current user data:", currentUser);

//     // If we have user data in a different format, try to get the ID
//     if (currentUser?.id) {
//       return currentUser.id;
//     }

//     // Try to get user ID from other possible storage locations
//     const userId = localStorage.getItem("userId");
//     if (userId) {
//       return userId;
//     }

//     // If we can't find the user ID, throw an error
//     throw new Error("Could not find user ID");
//   } catch (error) {
//     console.error("[Auth] Error getting user ID:", error);
//     throw new Error("Could not get user ID");
//   }
// };

// export const leaderboardService = {
//   getQuizLeaderboard: async (quizId) => {
//     console.log("[API] Fetching quiz leaderboard for quiz:", quizId);
//     const response = await axios.get(
//       `${API_URL}/${quizId}/leaderboard`,
//       getAuthHeader()
//     );
//     console.log("[API] Quiz leaderboard response:", response.data);
//     return response.data;
//   },

//   // getClassroomLeaderboard: async (classroomId) => {
//   //   console.log(
//   //     "[API] Fetching classroom leaderboard for classroom:",
//   //     classroomId
//   //   );
//   //   const response = await axios.get(
//   //     `${API_URL}/classroom/${classroomId}/leaderboard`,
//   //     getAuthHeader()
//   //   );
//   //   console.log("[API] Classroom leaderboard response:", response.data);
//   //   return response.data;
//   // },

//   getClassroomLeaderboard: async (classroomId) => {
//     console.log(
//       "[API] Fetching classroom leaderboard for classroom:",
//       classroomId
//     );
//     try {
//       const response = await axios.get(
//         `${API_URL}/classroom/${classroomId}/leaderboard`,
//         getAuthHeader()
//       );
//       console.log("[API] Raw leaderboard response:", response.data);

//       // Transform the data to include rank from entry_rank while preserving existing fields
//       const transformedData = response.data.map((entry) => {
//         // Preserve the original studentId if it exists
//         const studentId = entry.studentId || entry.user_id;
//         console.log("Processing entry:", {
//           original: entry,
//           studentId,
//           entry_rank: entry.entry_rank,
//         });

//         return {
//           ...entry, // Keep all original fields
//           rank: entry.entry_rank || entry.rank || null, // Try both entry_rank and rank
//           studentId: studentId, // Use preserved studentId
//           // Only map these if they don't already exist
//           studentName: entry.studentName || entry.student_name,
//           highestScore: entry.highestScore || entry.highest_score,
//           formattedFastestTime:
//             entry.formattedFastestTime || entry.formatted_fastest_time,
//           totalQuizzesCompleted:
//             entry.totalQuizzesCompleted || entry.total_quizzes_completed,
//         };
//       });

//       console.log("[API] Transformed leaderboard data:", transformedData);
//       return transformedData;
//     } catch (error) {
//       console.error("[Error] Error fetching classroom leaderboard:", error);
//       throw error;
//     }
//   },
//   getParticipationLeaderboard: async (classroomId) => {
//     console.log(
//       "[API] Fetching participation leaderboard for classroom:",
//       classroomId
//     );
//     const response = await axios.get(
//       `${API_URL}/classroom/${classroomId}/leaderboard/participation`,
//       getAuthHeader()
//     );
//     console.log("[API] Participation leaderboard response:", response.data);
//     return response.data;
//   },

//   getStudentPerformance: async (classroomId) => {
//     console.log(
//       "[API] Fetching student performance for classroom:",
//       classroomId
//     );
//     const userId = getCurrentUserId();
//     const authHeader = getAuthHeader();

//     try {
//       // Get student performance data
//       console.log("[API] Fetching performance data for user:", userId);
//       const performanceResponse = await axios.get(
//         `${API_URL}/performance/student/${userId}/classroom/${classroomId}`,
//         authHeader
//       );
//       console.log("[API] Performance data:", performanceResponse.data);

//       // Get available quizzes in the classroom
//       console.log("[API] Fetching available quizzes...");
//       const quizzesResponse = await axios.get(
//         `${API_URL}/classroom/${classroomId}/available`,
//         authHeader
//       );
//       console.log("[API] Available quizzes:", quizzesResponse.data);

//       // Get student's attempts
//       console.log("[API] Fetching student attempts...");
//       const attemptsResponse = await axios.get(
//         `${API_URL}/attempts/student/${userId}`,
//         authHeader
//       );
//       console.log("[API] Student attempts:", attemptsResponse.data);

//       // Process the data
//       const performance = performanceResponse.data;
//       const availableQuizzes = quizzesResponse.data;
//       const attempts = attemptsResponse.data;

//       // Filter attempts for this classroom
//       const classroomAttempts = attempts.filter(
//         (attempt) => attempt.classroomId === Number(classroomId)
//       );
//       console.log(
//         "[Processing] Filtered classroom attempts:",
//         classroomAttempts
//       );

//       // Calculate quizzes not taken
//       const takenQuizIds = [
//         ...new Set(classroomAttempts.map((attempt) => attempt.quizId)),
//       ];
//       const notTakenQuizzes = availableQuizzes.filter(
//         (quiz) => !takenQuizIds.includes(quiz.id)
//       );

//       // Calculate passed quizzes
//       const passedQuizIds = [
//         ...new Set(
//           classroomAttempts
//             .filter((attempt) => attempt.passed)
//             .map((attempt) => attempt.quizId)
//         ),
//       ];

//       const result = {
//         averageScore: performance.averageQuizScore || 0,
//         totalQuizzes: performance.totalQuizzesTaken || 0,
//         totalAvailableQuizzes: availableQuizzes.length || 0,
//         notTakenQuizzes: notTakenQuizzes.length || 0,
//         passedQuizzes: passedQuizIds.length || 0,
//         failedQuizzes: takenQuizIds.length - passedQuizIds.length || 0,
//         currentRank: performance.rank || "-",
//         bestScore: performance.highestScore || 0,
//         recentQuizzes: performance.recentQuizzes || [],
//         improvement: performance.improvement || 0,
//         streak: performance.streak || 0,
//       };

//       console.log("[Processing] Final performance result:", result);
//       return result;
//     } catch (error) {
//       console.error("[Error] Error in getStudentPerformance:", error);
//       throw error;
//     }
//   },

//   getOverallStudentPerformance: async (studentId) => {
//     console.log(
//       "[API] Fetching overall student performance for student:",
//       studentId
//     );
//     const response = await axios.get(
//       `${API_URL}/performance/student/${studentId}/overall`,
//       getAuthHeader()
//     );
//     console.log("[API] Overall performance response:", response.data);
//     return response.data;
//   },

//   getTopPerformers: async (classroomId) => {
//     console.log("[API] Fetching top performers for classroom:", classroomId);
//     const response = await axios.get(
//       `${API_URL}/performance/classroom/${classroomId}/top`,
//       getAuthHeader()
//     );
//     console.log("[API] Top performers response:", response.data);
//     return response.data;
//   },

//   getStudentsNeedingAttention: async (classroomId) => {
//     console.log(
//       "[API] Fetching students needing attention for classroom:",
//       classroomId
//     );
//     const response = await axios.get(
//       `${API_URL}/performance/classroom/${classroomId}/attention`,
//       getAuthHeader()
//     );
//     console.log("[API] Students needing attention response:", response.data);
//     return response.data;
//   },

//   getClassroomAverageScore: async (classroomId) => {
//     console.log(
//       "[API] Fetching classroom average score for classroom:",
//       classroomId
//     );
//     const response = await axios.get(
//       `${API_URL}/performance/classroom/${classroomId}/average`,
//       getAuthHeader()
//     );
//     console.log("[API] Classroom average score response:", response.data);
//     return response.data;
//   },

//   getStudentQuizAttempts: async (classroomId) => {
//     console.log(
//       "[API] Fetching student quiz attempts for classroom:",
//       classroomId
//     );
//     const userId = getCurrentUserId();
//     const authHeader = getAuthHeader();

//     try {
//       // First get all quizzes for this classroom
//       console.log("[API] Fetching classroom quizzes...");
//       const quizzesResponse = await axios.get(
//         `${API_URL}/classroom/${classroomId}`,
//         authHeader
//       );
//       console.log("[API] Classroom quizzes:", quizzesResponse.data);

//       // Then get all attempts for the student
//       console.log("[API] Fetching student attempts for user:", userId);
//       const attemptsResponse = await axios.get(
//         `${API_URL}/attempts/student/${userId}`,
//         authHeader
//       );
//       console.log("[API] Student attempts:", attemptsResponse.data);

//       const quizzes = quizzesResponse.data;
//       const attempts = attemptsResponse.data;

//       // Group attempts by quiz
//       const attemptsByQuiz = {};

//       // First, initialize with all classroom quizzes (even those without attempts)
//       quizzes.forEach((quiz) => {
//         attemptsByQuiz[quiz.id] = {
//           quizId: quiz.id,
//           quizName: quiz.quizName,
//           attempts: [],
//           highestScore: 0,
//           bestTime: null,
//           latestAttempt: null,
//           hasTaken: false,
//         };
//       });

//       console.log("[Processing] Initial quiz mapping:", attemptsByQuiz);

//       // Then populate with actual attempts
//       attempts.forEach((attempt) => {
//         // Check if this attempt belongs to a quiz in the classroom
//         if (attemptsByQuiz[attempt.quizId]) {
//           const quizData = attemptsByQuiz[attempt.quizId];
//           quizData.attempts.push(attempt);
//           quizData.hasTaken = true;

//           // Update highest score
//           if (attempt.score > quizData.highestScore) {
//             quizData.highestScore = attempt.score;
//             quizData.bestTime = attempt.timeSpentSeconds;
//           }
//         }
//       });

//       console.log(
//         "[Processing] Quiz data after adding attempts:",
//         attemptsByQuiz
//       );

//       // For each quiz with attempts, get the latest attempt and sort attempts by date
//       Object.values(attemptsByQuiz).forEach((quizData) => {
//         if (quizData.attempts.length > 0) {
//           // Sort attempts by completion time (most recent first)
//           quizData.attempts.sort(
//             (a, b) =>
//               new Date(b.completedAt || b.startedAt) -
//               new Date(a.completedAt || a.startedAt)
//           );

//           // Set the latest attempt
//           quizData.latestAttempt = quizData.attempts[0];

//           // Format the best time
//           if (quizData.bestTime) {
//             const minutes = Math.floor(quizData.bestTime / 60);
//             const seconds = quizData.bestTime % 60;
//             quizData.formattedBestTime = `${minutes}:${seconds
//               .toString()
//               .padStart(2, "0")}`;
//           }
//         }
//       });

//       // Convert to array and sort by quiz name for UI display
//       const quizSummaries = Object.values(attemptsByQuiz).sort((a, b) =>
//         a.quizName.localeCompare(b.quizName)
//       );

//       console.log("[Processing] Final quiz summaries:", quizSummaries);
//       return quizSummaries;
//     } catch (error) {
//       console.error("[Error] Error in getStudentQuizAttempts:", error);
//       throw error;
//     }
//   },
// };

import api from "./api";

const API_URL = ""; // Remove the /quizzes prefix since it's included in the endpoints

// Note: No need for getAuthHeader() anymore - the api instance automatically adds the auth token via interceptors

// Helper function to get current user ID from auth context
const getCurrentUserId = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem("user"));
    console.log("[LeaderboardService] Current user data:", currentUser);

    // If we have user data in a different format, try to get the ID
    if (currentUser?.id) {
      return currentUser.id;
    }

    // Try to get user ID from other possible storage locations
    const userId = localStorage.getItem("userId");
    if (userId) {
      return userId;
    }

    // If we can't find the user ID, throw an error
    throw new Error("Could not find user ID");
  } catch (error) {
    console.error("[LeaderboardService] Error getting user ID:", error);
    throw new Error("Could not get user ID");
  }
};

export const leaderboardService = {
  // Get overall leaderboard for a classroom
  getClassroomLeaderboard: async (classroomId) => {
    try {
      console.log(
        "[LeaderboardService] Fetching classroom leaderboard for classroom:",
        classroomId
      );
      const response = await api.get(
        `/quizzes/classroom/${classroomId}/leaderboard`
      );
      console.log(
        "[LeaderboardService] Classroom leaderboard response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "[LeaderboardService] Error fetching classroom leaderboard:",
        error
      );
      if (error.response?.status === 401) {
        throw new Error("User not authenticated");
      }
      throw error;
    }
  },

  // Get leaderboard for a specific quiz
  getLeaderboardByQuiz: async (quizId) => {
    try {
      console.log(
        "[LeaderboardService] Fetching quiz leaderboard for quiz:",
        quizId
      );
      const response = await api.get(
        `/quizzes/${quizId}/leaderboard`
      );
      console.log(
        "[LeaderboardService] Quiz leaderboard response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "[LeaderboardService] Error fetching quiz leaderboard:",
        error
      );
      if (error.response?.status === 401) {
        throw new Error("User not authenticated");
      }
      throw error;
    }
  },

  // Get list of quizzes in a classroom
  getQuizzesByClassroom: async (classroomId) => {
    try {
      console.log(
        "[LeaderboardService] Fetching quizzes for classroom:",
        classroomId
      );
      const response = await api.get(
        `/quizzes/classroom/${classroomId}`
      );
      console.log(
        "[LeaderboardService] Classroom quizzes response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "[LeaderboardService] Error fetching classroom quizzes:",
        error
      );
      if (error.response?.status === 401) {
        throw new Error("User not authenticated");
      }
      throw error;
    }
  },

  // Get student's quiz attempts
  getStudentQuizAttempts: async (studentId) => {
    try {
      console.log(
        "[LeaderboardService] Fetching student quiz attempts for student:",
        studentId
      );
      const response = await api.get(
        `/quizzes/attempts/student/${studentId}`
      );
      console.log(
        "[LeaderboardService] Student quiz attempts response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "[LeaderboardService] Error fetching student quiz attempts:",
        error
      );
      if (error.response?.status === 401) {
        throw new Error("User not authenticated");
      }
      throw error;
    }
  },

  // Get available quizzes in a classroom
  getAvailableQuizzes: async (classroomId) => {
    try {
      console.log(
        "[LeaderboardService] Fetching available quizzes for classroom:",
        classroomId
      );
      const response = await api.get(
        `/quizzes/classroom/${classroomId}/available`
      );
      console.log(
        "[LeaderboardService] Available quizzes response:",
        response.data
      );
      return response.data;
    } catch (error) {
      console.error(
        "[LeaderboardService] Error fetching available quizzes:",
        error
      );
      if (error.response?.status === 401) {
        throw new Error("User not authenticated");
      }
      throw error;
    }
  },

  // getClassroomLeaderboard: async (classroomId) => {
  //   console.log(
  //     "[API] Fetching classroom leaderboard for classroom:",
  //     classroomId
  //   );
  //   const response = await axios.get(
  //     `/quizzes/classroom/${classroomId}/leaderboard`,
  //     getAuthHeader()
  //   );
  //   console.log("[API] Classroom leaderboard response:", response.data);
  //   return response.data;
  // },

  // getParticipationLeaderboard: async (classroomId) => {
  //   console.log(
  //     "[API] Fetching participation leaderboard for classroom:",
  //     classroomId
  //   );
  //   const response = await axios.get(
  //     `/quizzes/classroom/${classroomId}/leaderboard/participation`,
  //     getAuthHeader()
  //   );
  //   console.log("[API] Participation leaderboard response:", response.data);
  //   return response.data;
  // },

  // getStudentPerformance: async (classroomId) => {
  //   console.log(
  //     "[API] Fetching student performance for classroom:",
  //     classroomId
  //   );
  //   const userId = getCurrentUserId();
  //   const authHeader = getAuthHeader();

  //   try {
  //     // Get student performance data
  //     console.log("[API] Fetching performance data for user:", userId);
  //     const performanceResponse = await axios.get(
  //       `/quizzes/performance/student/${userId}/classroom/${classroomId}`,
  //       authHeader
  //     );
  //     console.log("[API] Performance data:", performanceResponse.data);

  //     // Get available quizzes in the classroom
  //     console.log("[API] Fetching available quizzes...");
  //     const quizzesResponse = await axios.get(
  //       `/quizzes/classroom/${classroomId}/available`,
  //       authHeader
  //     );
  //     console.log("[API] Available quizzes:", quizzesResponse.data);

  //     // Get student's attempts
  //     console.log("[API] Fetching student attempts...");
  //     const attemptsResponse = await axios.get(
  //       `/quizzes/attempts/student/${userId}`,
  //       authHeader
  //     );
  //     console.log("[API] Student attempts:", attemptsResponse.data);

  //     // Process the data
  //     const performance = performanceResponse.data;
  //     const availableQuizzes = quizzesResponse.data;
  //     const attempts = attemptsResponse.data;

  //     // Filter attempts for this classroom
  //     const classroomAttempts = attempts.filter(
  //       (attempt) => attempt.classroomId === Number(classroomId)
  //     );
  //     console.log(
  //       "[Processing] Filtered classroom attempts:",
  //       classroomAttempts
  //     );

  //     // Calculate quizzes not taken
  //     const takenQuizIds = [
  //       ...new Set(classroomAttempts.map((attempt) => attempt.quizId)),
  //     ];
  //     const notTakenQuizzes = availableQuizzes.filter(
  //       (quiz) => !takenQuizIds.includes(quiz.id)
  //     );

  //     // Calculate passed quizzes
  //     const passedQuizIds = [
  //       ...new Set(
  //         classroomAttempts
  //           .filter((attempt) => attempt.passed)
  //           .map((attempt) => attempt.quizId)
  //       ),
  //     ];

  //     const result = {
  //       averageScore: performance.averageQuizScore || 0,
  //       totalQuizzes: performance.totalQuizzesTaken || 0,
  //       totalAvailableQuizzes: availableQuizzes.length || 0,
  //       notTakenQuizzes: notTakenQuizzes.length || 0,
  //       passedQuizzes: passedQuizIds.length || 0,
  //       failedQuizzes: takenQuizIds.length - passedQuizIds.length || 0,
  //       currentRank: performance.rank || "-",
  //       bestScore: performance.highestScore || 0,
  //       recentQuizzes: performance.recentQuizzes || [],
  //       improvement: performance.improvement || 0,
  //       streak: performance.streak || 0,
  //     };

  //     console.log("[Processing] Final performance result:", result);
  //     return result;
  //   } catch (error) {
  //     console.error("[Error] Error in getStudentPerformance:", error);
  //     if (error.response?.status === 401) {
  //       throw new Error("User not authenticated");
  //     }
  //     throw error;
  //   }
  // },

  getStudentPerformance: async (classroomId) => {
    console.log(
      "[API] Fetching student performance for classroom:",
      classroomId
    );
    const userId = getCurrentUserId();

    try {
      // Get student performance data
      console.log("[API] Fetching performance data for user:", userId);
      const performanceResponse = await api.get(
        `/quizzes/performance/student/${userId}/classroom/${classroomId}`
      );
      console.log("[API] Performance data:", performanceResponse.data);

      // Get available quizzes in the classroom
      console.log("[API] Fetching available quizzes...");
      const quizzesResponse = await api.get(
        `/quizzes/classroom/${classroomId}/available`
      );
      console.log("[API] Available quizzes:", quizzesResponse.data);

      // Get student's attempts
      console.log("[API] Fetching student attempts...");
      const attemptsResponse = await api.get(
        `/quizzes/attempts/student/${userId}`
      );
      console.log("[API] Student attempts:", attemptsResponse.data);

      // Process the data
      const performance = performanceResponse.data;
      const availableQuizzes = quizzesResponse.data;
      const attempts = attemptsResponse.data;

      // Filter attempts for this classroom
      const classroomAttempts = attempts.filter(
        (attempt) => attempt.classroomId === Number(classroomId)
      );
      console.log(
        "[Processing] Filtered classroom attempts:",
        classroomAttempts
      );

      // Calculate quizzes not taken
      const takenQuizIds = [
        ...new Set(classroomAttempts.map((attempt) => attempt.quizId)),
      ];
      const notTakenQuizzes = availableQuizzes.filter(
        (quiz) => !takenQuizIds.includes(quiz.id)
      );

      // Calculate passed quizzes - get the highest score attempt for each quiz
      const quizAttemptsMap = new Map();
      classroomAttempts.forEach((attempt) => {
        const existingAttempt = quizAttemptsMap.get(attempt.quizId);
        if (!existingAttempt || attempt.score > existingAttempt.score) {
          quizAttemptsMap.set(attempt.quizId, attempt);
        }
      });

      // Count passed quizzes based on the highest score attempt
      const passedQuizIds = Array.from(quizAttemptsMap.values())
        .filter((attempt) => attempt.passed)
        .map((attempt) => attempt.quizId);

      const result = {
        averageScore: performance.averageQuizScore || 0,
        totalQuizzes: performance.totalQuizzesTaken || 0,
        totalAvailableQuizzes: availableQuizzes.length || 0,
        notTakenQuizzes: notTakenQuizzes.length || 0,
        passedQuizzes: passedQuizIds.length || 0,
        failedQuizzes: takenQuizIds.length - passedQuizIds.length || 0,
        currentRank: performance.rank || "-",
        bestScore: performance.highestScore || 0,
        recentQuizzes: performance.recentQuizzes || [],
        improvement: performance.improvement || 0,
        streak: performance.streak || 0,
      };

      console.log("[Processing] Final performance result:", result);
      return result;
    } catch (error) {
      console.error("[Error] Error in getStudentPerformance:", error);
      if (error.response?.status === 401) {
        throw new Error("User not authenticated");
      }
      throw error;
    }
  },

  getOverallStudentPerformance: async (studentId) => {
    console.log(
      "[API] Fetching overall student performance for student:",
      studentId
    );
    const response = await api.get(
      `/quizzes/performance/student/${studentId}/overall`
    );
    console.log("[API] Overall performance response:", response.data);
    return response.data;
  },

  getTopPerformers: async (classroomId) => {
    console.log("[API] Fetching top performers for classroom:", classroomId);
    const response = await api.get(
      `/quizzes/performance/classroom/${classroomId}/top`
    );
    console.log("[API] Top performers response:", response.data);
    return response.data;
  },

  getStudentsNeedingAttention: async (classroomId) => {
    console.log(
      "[API] Fetching students needing attention for classroom:",
      classroomId
    );
    const response = await api.get(
      `/quizzes/performance/classroom/${classroomId}/attention`
    );
    console.log("[API] Students needing attention response:", response.data);
    return response.data;
  },

  getClassroomAverageScore: async (classroomId) => {
    console.log(
      "[API] Fetching classroom average score for classroom:",
      classroomId
    );
    const response = await api.get(
      `/quizzes/performance/classroom/${classroomId}/average`
    );
    console.log("[API] Classroom average score response:", response.data);
    return response.data;
  },
};
