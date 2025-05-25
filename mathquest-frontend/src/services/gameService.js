// import api from "./api";

// const API_URL = "/games";

// const gameService = {
//   // Get a specific game by ID
//   getGameById: async (gameId) => {
//     try {
//       const response = await api.get(`${API_URL}/${gameId}`);
//       console.log("Game fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching game:", error);
//       throw error;
//     }
//   },

//   // Get game by activity ID
//   getGameByActivityId: async (activityId) => {
//     try {
//       const response = await api.get(`${API_URL}/activity/${activityId}`);
//       console.log("Game fetched by activity ID:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching game by activity ID:", error);
//       throw error;
//     }
//   },

//   // Get games for a classroom
//   getGamesByClassroomId: async (classroomId) => {
//     try {
//       // First, get all activities for the classroom
//       const activitiesResponse = await api.get(
//         `/activities/classroom/${classroomId}`
//       );
//       const activities = activitiesResponse.data;

//       // Filter game activities
//       const gameActivities = activities.filter(
//         (activity) => activity.type === "GAME"
//       );

//       if (gameActivities.length === 0) {
//         return [];
//       }

//       // For each game activity, fetch the associated game
//       const gamePromises = gameActivities.map((activity) =>
//         api
//           .get(`${API_URL}/activity/${activity.id}`)
//           .then((response) => response.data)
//           .catch((error) => {
//             console.error(
//               `Error fetching game for activity ${activity.id}:`,
//               error
//             );
//             return null;
//           })
//       );

//       const games = await Promise.all(gamePromises);
//       // Filter out any null results from failed requests
//       return games.filter((game) => game !== null);
//     } catch (error) {
//       console.error("Error fetching games for classroom:", error);
//       throw error;
//     }
//   },

//   // Get games by type for a classroom
//   getGamesByClassroomIdAndType: async (classroomId, type) => {
//     try {
//       const response = await api.get(
//         `${API_URL}/classroom/${classroomId}/type/${type}`
//       );
//       console.log(`${type} games fetched:`, response.data);
//       return response.data;
//     } catch (error) {
//       console.error(`Error fetching ${type} games:`, error);
//       throw error;
//     }
//   },

//   // Create a new game
//   createGame: async (gameData) => {
//     try {
//       console.log("Creating game with original data:", gameData);

//       // Handle both lessonId and classroomId for backward compatibility
//       // If lessonId is provided but classroomId isn't, convert it
//       const payload = { ...gameData };

//       if (payload.lessonId && !payload.classroomId) {
//         console.log(
//           "Converting lessonId to classroomId for backward compatibility"
//         );
//         payload.classroomId = payload.lessonId;
//         delete payload.lessonId;
//       }

//       // Remove any fields that aren't part of the backend model
//       if (payload.level) {
//         console.log(
//           "Removing level field as it's not part of the backend model"
//         );
//         delete payload.level;
//       }

//       console.log("Sending game creation payload:", payload);
//       const response = await api.post(API_URL, payload);
//       console.log("Game created:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error creating game:", error);
//       throw error;
//     }
//   },

//   // Update an existing game
//   updateGame: async (gameId, gameData) => {
//     try {
//       console.log("Updating game with data:", gameData);
//       const response = await api.put(`${API_URL}/${gameId}`, {
//         classroomId: gameData.classroomId,
//         name: gameData.name,
//         instructions: gameData.instructions,
//         topic: gameData.topic,
//         type: gameData.type,
//         maxLevels: gameData.maxLevels,
//         orderIndex: gameData.orderIndex,
//         customContent: gameData.customContent,
//       });
//       console.log("Game updated:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error updating game:", error);
//       throw error;
//     }
//   },

//   // Delete a game
//   deleteGame: async (gameId) => {
//     try {
//       await api.delete(`${API_URL}/${gameId}`);
//       console.log("Game deleted successfully");
//       return true;
//     } catch (error) {
//       console.error("Error deleting game:", error);
//       throw error;
//     }
//   },

//   // Submit a game score
//   submitGameScore: async (scoreData) => {
//     try {
//       const response = await api.post(`${API_URL}/submit-score`, {
//         gameId: scoreData.gameId,
//         score: scoreData.score,
//         level: scoreData.level,
//         timeSpent: scoreData.timeSpent,
//       });
//       console.log("Game score submitted:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error submitting game score:", error);
//       throw error;
//     }
//   },

//   // Get leaderboard for a game
//   getGameLeaderboard: async (gameId) => {
//     try {
//       const response = await api.get(`${API_URL}/${gameId}/leaderboard`);
//       console.log("Game leaderboard fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching game leaderboard:", error);
//       throw error;
//     }
//   },

//   // Get classroom leaderboard
//   getClassroomLeaderboard: async (classroomId) => {
//     try {
//       const response = await api.get(
//         `${API_URL}/classroom/${classroomId}/leaderboard`
//       );
//       console.log("Classroom leaderboard fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching classroom leaderboard:", error);
//       throw error;
//     }
//   },

//   // Get game analytics
//   getGameAnalytics: async (gameId) => {
//     try {
//       const response = await api.get(`${API_URL}/${gameId}/analytics`);
//       console.log("Game analytics fetched:", response.data);
//       return response.data;
//     } catch (error) {
//       console.error("Error fetching game analytics:", error);
//       throw error;
//     }
//   },
// };

// export default gameService;

import api from "./api";

const API_URL = "/games";

const gameService = {
  // Get a specific game by ID
  getGameById: async (gameId) => {
    try {
      const response = await api.get(`${API_URL}/${gameId}`);
      console.log("Game fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching game:", error);
      throw error;
    }
  },

  // Get game by activity ID
  getGameByActivityId: async (activityId) => {
    try {
      const response = await api.get(`${API_URL}/activity/${activityId}`);
      console.log("Game fetched by activity ID:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching game by activity ID:", error);
      throw error;
    }
  },

  // Get games for a classroom
  getGamesByClassroomId: async (classroomId) => {
    try {
      // First, get all activities for the classroom
      const activitiesResponse = await api.get(
        `/activities/classroom/${classroomId}`
      );
      const activities = activitiesResponse.data;

      // Filter game activities
      const gameActivities = activities.filter(
        (activity) => activity.type === "GAME"
      );

      if (gameActivities.length === 0) {
        return [];
      }

      // For each game activity, fetch the associated game
      const gamePromises = gameActivities.map((activity) =>
        api
          .get(`${API_URL}/activity/${activity.id}`)
          .then((response) => response.data)
          .catch((error) => {
            console.error(
              `Error fetching game for activity ${activity.id}:`,
              error
            );
            return null;
          })
      );

      const games = await Promise.all(gamePromises);
      // Filter out any null results from failed requests
      return games.filter((game) => game !== null);
    } catch (error) {
      console.error("Error fetching games for classroom:", error);
      throw error;
    }
  },

  // Get games by type for a classroom
  getGamesByClassroomIdAndType: async (classroomId, type) => {
    try {
      const response = await api.get(
        `${API_URL}/classroom/${classroomId}/type/${type}`
      );
      console.log(`${type} games fetched:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} games:`, error);
      throw error;
    }
  },

  // Create a new game
  createGame: async (gameData) => {
    try {
      console.log("Creating game with original data:", gameData);

      // Handle both lessonId and classroomId for backward compatibility
      // If lessonId is provided but classroomId isn't, convert it
      const payload = { ...gameData };

      if (payload.lessonId && !payload.classroomId) {
        console.log(
          "Converting lessonId to classroomId for backward compatibility"
        );
        payload.classroomId = payload.lessonId;
        delete payload.lessonId;
      }

      // Remove any fields that aren't part of the backend model
      if (payload.level) {
        console.log(
          "Removing level field as it's not part of the backend model"
        );
        delete payload.level;
      }

      console.log("Sending game creation payload:", payload);
      const response = await api.post(API_URL, payload);
      console.log("Game created:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating game:", error);
      throw error;
    }
  },

  // Update an existing game
  updateGame: async (gameId, gameData) => {
    try {
      console.log("Updating game with data:", gameData);
      const response = await api.put(`${API_URL}/${gameId}`, {
        classroomId: gameData.classroomId,
        name: gameData.name,
        instructions: gameData.instructions,
        topic: gameData.topic,
        type: gameData.type,
        maxLevels: gameData.maxLevels,
        orderIndex: gameData.orderIndex,
        customContent: gameData.customContent,
      });
      console.log("Game updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error updating game:", error);
      throw error;
    }
  },

  // Delete a game
  deleteGame: async (gameId) => {
    try {
      await api.delete(`${API_URL}/${gameId}`);
      console.log("Game deleted successfully");
      return true;
    } catch (error) {
      console.error("Error deleting game:", error);
      throw error;
    }
  },

  // Submit a game score
  submitGameScore: async (scoreData) => {
    try {
      console.log("Submitting score data:", scoreData);
      const response = await api.post(`${API_URL}/submit-score`, {
        gameId: scoreData.gameId,
        score: scoreData.score,
        level: scoreData.level || 1, // Ensure level is always sent, default to 1
        timeSpent: scoreData.timeSpent,
      });
      console.log("Game score submitted, server response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error submitting game score:", error);
      throw error;
    }
  },

  // Get student's current level for a game
  getStudentGameLevel: async (gameId, studentId) => {
    try {
      const response = await api.get(
        `${API_URL}/${gameId}/student/${studentId}/level`
      );
      console.log("Student game level fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching student game level:", error);
      throw error;
    }
  },

  // Check if a level is unlocked for a student
  isLevelUnlocked: async (gameId, studentId, level) => {
    try {
      const response = await api.get(
        `${API_URL}/${gameId}/student/${studentId}/level/${level}/unlocked`
      );
      console.log("Level unlock status fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error checking level unlock status:", error);
      throw error;
    }
  },

  // Get leaderboard for a game
  getGameLeaderboard: async (gameId) => {
    try {
      const response = await api.get(`${API_URL}/${gameId}/leaderboard`);
      console.log("Game leaderboard fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching game leaderboard:", error);
      throw error;
    }
  },

  // Get classroom leaderboard
  getClassroomLeaderboard: async (classroomId) => {
    try {
      const response = await api.get(
        `${API_URL}/classroom/${classroomId}/leaderboard`
      );
      console.log("Classroom leaderboard fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching classroom leaderboard:", error);
      throw error;
    }
  },

  // Get game analytics
  getGameAnalytics: async (gameId) => {
    try {
      const response = await api.get(`${API_URL}/${gameId}/analytics`);
      console.log("Game analytics fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Error fetching game analytics:", error);
      throw error;
    }
  },
};

export default gameService;
