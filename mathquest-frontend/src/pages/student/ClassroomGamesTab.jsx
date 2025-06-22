import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import gameService from '../../services/gameService';
import { useAuth } from '../../context/AuthContext';

const ClassroomGamesTab = ({ classroomId: propClassroomId }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { classroomId: urlClassroomId } = useParams(); // Get classroomId from URL params
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gameScores, setGameScores] = useState({});

  // Use propClassroomId if available, otherwise use urlClassroomId
  const effectiveClassroomId = propClassroomId || urlClassroomId;

  console.log("Prop Classroom ID:", propClassroomId);
  console.log("URL Classroom ID:", urlClassroomId);
  console.log("Effective Classroom ID:", effectiveClassroomId);

  useEffect(() => {
    if (!effectiveClassroomId) {
      console.log("No classroom ID available");
      setLoading(false);
      return;
    }
    
    const fetchGamesAndScores = async () => {
      try {
        console.log("Fetching games for classroom:", effectiveClassroomId);
        const gamesData = await gameService.getGamesByClassroomId(effectiveClassroomId);
        console.log("Games fetched:", gamesData);
        setGames(gamesData || []);

        // Fetch scores for each game
        if (currentUser && gamesData) {
          const scoresPromises = gamesData.map(game => 
            gameService.getGameLeaderboard(game.id)
              .then(leaderboard => {
                // Find the current user's best score
                const userBestScore = leaderboard
                  .filter(score => score.studentId === currentUser.id)
                  .reduce((max, score) => Math.max(max, score.score), 0);
                return { gameId: game.id, highScore: userBestScore };
              })
              .catch(() => ({ gameId: game.id, highScore: 0 }))
          );
          
          const scores = await Promise.all(scoresPromises);
          const scoresMap = scores.reduce((acc, { gameId, highScore }) => {
            acc[gameId] = highScore;
            return acc;
          }, {});
          
          setGameScores(scoresMap);
        }
      } catch (error) {
        console.error('Error fetching games:', error);
        toast.error('Failed to load games');
        setGames([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGamesAndScores();
  }, [effectiveClassroomId, currentUser]);

  const getGameTypeLabel = (type) => {
    switch (type) {
      case 'FALLING_GAME':
        return 'Falling Game';
      case 'MULTIPLE_CHOICE':
        return 'Multiple Choice';
      default:
        return type;
    }
  };

  const getGameTypeIcon = (type) => {
    switch (type) {
      case 'FALLING_GAME':
        return '🎯';
      case 'MULTIPLE_CHOICE':
        return '🎮';
      default:
        return '🎲';
    }
  };

  const getGameLevelBadge = (level) => {
    const levelColors = {
      EASY: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      HARD: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 text-xs rounded-full ${levelColors[level] || 'bg-gray-100 text-gray-800'}`}>
        {level}
      </span>
    );
  };

  if (!effectiveClassroomId) {
    return (
      <div className="mt-4  p-6 text-center">
        <p className="text-gray-600">No classroom selected. Please select a classroom to view games.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="mt-4  p-6 text-center">
        <p className="text-gray-600">No games available for this classroom yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <h2 className="text-xl font-bold mb-6">Available Games</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.isArray(games) && games.map(game => (
          <div 
            key={game.id} 
            className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transform transition hover:scale-105"
            onClick={() => navigate(`/student/games/${game.id}`)}
          >
            <div className="bg-blue-900 text-white px-4 py-3 flex justify-between items-center">
              <span className="text-2xl">{getGameTypeIcon(game.type)}</span>
              {getGameLevelBadge(game.level)}
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-bold mb-2">{game.name}</h3>
              {/* <p className="text-sm text-gray-600 mb-2">Type: {getGameTypeLabel(game.type)}</p>
              <p className="text-sm text-gray-600 mb-2">Topic: {game.topic}</p>
              
              {game.instructions && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{game.instructions}</p>
              )} */}

            <div className="mt-3 space-y-1 text-base text-gray-600">
                <p><span className="font-bold">Type: </span> {getGameTypeLabel(game.type)}</p>
                <p><span className="font-bold">Topic: </span> {game.topic}</p>
                {game.instructions && (
                <p className=" text-gray-600 mb-4 line-clamp-2">{game.instructions}</p>
              )} 
              </div>
              
              <div className="flex justify-between mt-4">
                <div className="flex items-center text-sm text-gray-500">
                  <span className="mr-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z"></path>
                      <path d="M10 4a6 6 0 00-6 6h2a4 4 0 014-4V4z"></path>
                    </svg>
                  </span>
                  <span>Your Best Score: {gameScores[game.id] > 0 ? gameScores[game.id] : 'None yet'}</span>
                </div>
                
                <button
                  className="px-5 py-1 bg-blue-400  hover:bg-blue-700 text-white rounded-full"
                >
                  Play
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ClassroomGamesTab; 