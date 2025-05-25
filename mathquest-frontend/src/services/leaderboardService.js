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

// export const leaderboardService = {
//   getQuizLeaderboard: async (quizId) => {
//     const response = await axios.get(
//       `${API_URL}/${quizId}/leaderboard`,
//       getAuthHeader()
//     );
//     return response.data;
//   },

//   getClassroomLeaderboard: async (classroomId) => {
//     const response = await axios.get(
//       `${API_URL}/classroom/${classroomId}/leaderboard`,
//       getAuthHeader()
//     );
//     return response.data;
//   },

//   getParticipationLeaderboard: async (classroomId) => {
//     const response = await axios.get(
//       `${API_URL}/classroom/${classroomId}/leaderboard/participation`,
//       getAuthHeader()
//     );
//     return response.data;
//   },

//   getStudentPerformance: async (classroomId) => {
//     // Get the current user's ID from the auth context or local storage
//     const currentUser = JSON.parse(localStorage.getItem("currentUser"));
//     if (!currentUser || !currentUser.id) {
//       throw new Error("User not authenticated");
//     }

//     const response = await axios.get(
//       `${API_URL}/performance/student/${currentUser.id}/classroom/${classroomId}`,
//       getAuthHeader()
//     );

//     // Transform the response to match the expected format for the My Status tab
//     const data = response.data;
//     return {
//       averageScore: data.averageScore || 0,
//       totalQuizzes: data.totalQuizzesCompleted || 0,
//       currentRank: data.currentRank || "-",
//       bestScore: data.highestScore || 0,
//       recentQuizzes: data.recentQuizzes || [],
//       improvement: data.improvement || 0,
//       streak: data.streak || 0,
//     };
//   },

//   getOverallStudentPerformance: async (studentId) => {
//     const response = await axios.get(
//       `${API_URL}/performance/student/${studentId}/overall`,
//       getAuthHeader()
//     );
//     return response.data;
//   },

//   getTopPerformers: async (classroomId) => {
//     const response = await axios.get(
//       `${API_URL}/performance/classroom/${classroomId}/top`,
//       getAuthHeader()
//     );
//     return response.data;
//   },

//   getStudentsNeedingAttention: async (classroomId) => {
//     const response = await axios.get(
//       `${API_URL}/performance/classroom/${classroomId}/attention`,
//       getAuthHeader()
//     );
//     return response.data;
//   },

//   getClassroomAverageScore: async (classroomId) => {
//     const response = await axios.get(
//       `${API_URL}/performance/classroom/${classroomId}/average`,
//       getAuthHeader()
//     );
//     return response.data;
//   },

//   getStudentQuizAttempts: async (classroomId) => {
//     // Get the current user's ID from auth context or local storage
//     const currentUser = JSON.parse(localStorage.getItem("currentUser"));
//     if (!currentUser || !currentUser.id) {
//       throw new Error("User not authenticated");
//     }

//     try {
//       const response = await axios.get(
//         `${API_URL}/attempts/student/${currentUser.id}/classroom/${classroomId}`,
//         getAuthHeader()
//       );

//       // Group attempts by quiz
//       const attemptsByQuiz = {};
//       response.data.forEach((attempt) => {
//         if (!attemptsByQuiz[attempt.quizId]) {
//           attemptsByQuiz[attempt.quizId] = {
//             quizId: attempt.quizId,
//             quizName: attempt.quizName || `Quiz ${attempt.quizId}`,
//             activityId: attempt.activityId,
//             attempts: [],
//           };
//         }
//         // Include all attempt data including time spent
//         attemptsByQuiz[attempt.quizId].attempts.push({
//           ...attempt,
//           attemptNumber: attempt.attemptNumber,
//           score: attempt.score,
//           timeTaken: attempt.timeSpentSeconds || attempt.timeTaken,
//           startTime: attempt.startedAt || attempt.createdAt,
//           completionTime: attempt.completedAt,
//           passed: attempt.passed,
//         });
//       });

//       // For each quiz, calculate the highest score and best time
//       const quizSummaries = Object.values(attemptsByQuiz).map((quizData) => {
//         const attempts = quizData.attempts;
//         let highestScore = 0;
//         let bestTimeForHighestScore = null;

//         attempts.forEach((attempt) => {
//           if (attempt.score > highestScore) {
//             highestScore = attempt.score;
//             bestTimeForHighestScore = attempt.timeTaken;
//           }
//         });

//         return {
//           quizId: quizData.quizId,
//           quizName: quizData.quizName,
//           activityId: quizData.activityId,
//           highestScore,
//           bestTime: bestTimeForHighestScore,
//           attempts: attempts.sort(
//             (a, b) =>
//               new Date(b.completionTime || b.startTime) -
//               new Date(a.completionTime || a.startTime)
//           ),
//         };
//       });

//       return quizSummaries;
//     } catch (error) {
//       console.error("Error fetching quiz attempts:", error);
//       // Fallback to empty data
//       return [];
//     }
//   },
// };

import axios from "axios";

const API_URL = "/quizzes";

// Helper function to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem("token");
  if (!token) {
    throw new Error("No authentication token found");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Helper function to get current user ID from auth context
const getCurrentUserId = () => {
  try {
    const currentUser = JSON.parse(localStorage.getItem("currentUser"));
    console.log("[Auth] Current user data:", currentUser);

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
    console.error("[Auth] Error getting user ID:", error);
    throw new Error("Could not get user ID");
  }
};

export const leaderboardService = {
  getQuizLeaderboard: async (quizId) => {
    console.log("[API] Fetching quiz leaderboard for quiz:", quizId);
    const response = await axios.get(
      `${API_URL}/${quizId}/leaderboard`,
      getAuthHeader()
    );
    console.log("[API] Quiz leaderboard response:", response.data);
    return response.data;
  },

  getClassroomLeaderboard: async (classroomId) => {
    console.log(
      "[API] Fetching classroom leaderboard for classroom:",
      classroomId
    );
    const response = await axios.get(
      `${API_URL}/classroom/${classroomId}/leaderboard`,
      getAuthHeader()
    );
    console.log("[API] Classroom leaderboard response:", response.data);
    return response.data;
  },

  getParticipationLeaderboard: async (classroomId) => {
    console.log(
      "[API] Fetching participation leaderboard for classroom:",
      classroomId
    );
    const response = await axios.get(
      `${API_URL}/classroom/${classroomId}/leaderboard/participation`,
      getAuthHeader()
    );
    console.log("[API] Participation leaderboard response:", response.data);
    return response.data;
  },

  getStudentPerformance: async (classroomId) => {
    console.log(
      "[API] Fetching student performance for classroom:",
      classroomId
    );
    const userId = getCurrentUserId();
    const authHeader = getAuthHeader();

    try {
      // Get student performance data
      console.log("[API] Fetching performance data for user:", userId);
      const performanceResponse = await axios.get(
        `${API_URL}/performance/student/${userId}/classroom/${classroomId}`,
        authHeader
      );
      console.log("[API] Performance data:", performanceResponse.data);

      // Get available quizzes in the classroom
      console.log("[API] Fetching available quizzes...");
      const quizzesResponse = await axios.get(
        `${API_URL}/classroom/${classroomId}/available`,
        authHeader
      );
      console.log("[API] Available quizzes:", quizzesResponse.data);

      // Get student's attempts
      console.log("[API] Fetching student attempts...");
      const attemptsResponse = await axios.get(
        `${API_URL}/attempts/student/${userId}`,
        authHeader
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

      // Calculate passed quizzes
      const passedQuizIds = [
        ...new Set(
          classroomAttempts
            .filter((attempt) => attempt.passed)
            .map((attempt) => attempt.quizId)
        ),
      ];

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
      throw error;
    }
  },

  getOverallStudentPerformance: async (studentId) => {
    console.log(
      "[API] Fetching overall student performance for student:",
      studentId
    );
    const response = await axios.get(
      `${API_URL}/performance/student/${studentId}/overall`,
      getAuthHeader()
    );
    console.log("[API] Overall performance response:", response.data);
    return response.data;
  },

  getTopPerformers: async (classroomId) => {
    console.log("[API] Fetching top performers for classroom:", classroomId);
    const response = await axios.get(
      `${API_URL}/performance/classroom/${classroomId}/top`,
      getAuthHeader()
    );
    console.log("[API] Top performers response:", response.data);
    return response.data;
  },

  getStudentsNeedingAttention: async (classroomId) => {
    console.log(
      "[API] Fetching students needing attention for classroom:",
      classroomId
    );
    const response = await axios.get(
      `${API_URL}/performance/classroom/${classroomId}/attention`,
      getAuthHeader()
    );
    console.log("[API] Students needing attention response:", response.data);
    return response.data;
  },

  getClassroomAverageScore: async (classroomId) => {
    console.log(
      "[API] Fetching classroom average score for classroom:",
      classroomId
    );
    const response = await axios.get(
      `${API_URL}/performance/classroom/${classroomId}/average`,
      getAuthHeader()
    );
    console.log("[API] Classroom average score response:", response.data);
    return response.data;
  },

  getStudentQuizAttempts: async (classroomId) => {
    console.log(
      "[API] Fetching student quiz attempts for classroom:",
      classroomId
    );
    const userId = getCurrentUserId();
    const authHeader = getAuthHeader();

    try {
      // First get all quizzes for this classroom
      console.log("[API] Fetching classroom quizzes...");
      const quizzesResponse = await axios.get(
        `${API_URL}/classroom/${classroomId}`,
        authHeader
      );
      console.log("[API] Classroom quizzes:", quizzesResponse.data);

      // Then get all attempts for the student
      console.log("[API] Fetching student attempts for user:", userId);
      const attemptsResponse = await axios.get(
        `${API_URL}/attempts/student/${userId}`,
        authHeader
      );
      console.log("[API] Student attempts:", attemptsResponse.data);

      const quizzes = quizzesResponse.data;
      const attempts = attemptsResponse.data;

      // Group attempts by quiz
      const attemptsByQuiz = {};

      // First, initialize with all classroom quizzes (even those without attempts)
      quizzes.forEach((quiz) => {
        attemptsByQuiz[quiz.id] = {
          quizId: quiz.id,
          quizName: quiz.quizName,
          attempts: [],
          highestScore: 0,
          bestTime: null,
          latestAttempt: null,
          hasTaken: false,
        };
      });

      console.log("[Processing] Initial quiz mapping:", attemptsByQuiz);

      // Then populate with actual attempts
      attempts.forEach((attempt) => {
        // Check if this attempt belongs to a quiz in the classroom
        if (attemptsByQuiz[attempt.quizId]) {
          const quizData = attemptsByQuiz[attempt.quizId];
          quizData.attempts.push(attempt);
          quizData.hasTaken = true;

          // Update highest score
          if (attempt.score > quizData.highestScore) {
            quizData.highestScore = attempt.score;
            quizData.bestTime = attempt.timeSpentSeconds;
          }
        }
      });

      console.log(
        "[Processing] Quiz data after adding attempts:",
        attemptsByQuiz
      );

      // For each quiz with attempts, get the latest attempt and sort attempts by date
      Object.values(attemptsByQuiz).forEach((quizData) => {
        if (quizData.attempts.length > 0) {
          // Sort attempts by completion time (most recent first)
          quizData.attempts.sort(
            (a, b) =>
              new Date(b.completedAt || b.startedAt) -
              new Date(a.completedAt || a.startedAt)
          );

          // Set the latest attempt
          quizData.latestAttempt = quizData.attempts[0];

          // Format the best time
          if (quizData.bestTime) {
            const minutes = Math.floor(quizData.bestTime / 60);
            const seconds = quizData.bestTime % 60;
            quizData.formattedBestTime = `${minutes}:${seconds
              .toString()
              .padStart(2, "0")}`;
          }
        }
      });

      // Convert to array and sort by quiz name for UI display
      const quizSummaries = Object.values(attemptsByQuiz).sort((a, b) =>
        a.quizName.localeCompare(b.quizName)
      );

      console.log("[Processing] Final quiz summaries:", quizSummaries);
      return quizSummaries;
    } catch (error) {
      console.error("[Error] Error in getStudentQuizAttempts:", error);
      throw error;
    }
  },
};
