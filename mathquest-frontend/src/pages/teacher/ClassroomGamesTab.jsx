import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import gameService from '../../services/gameService';
import { useAuth } from '../../context/AuthContext';
import CreateGameForm from '../../components/teacher/CreateGameForm';

const ClassroomGamesTab = ({ classroomId, activityId }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddingGame, setIsAddingGame] = useState(false);

  useEffect(() => {
    if (!classroomId) return;
    
    const fetchGames = async () => {
      try {
        const gamesData = await gameService.getGamesByClassroomId(classroomId);
        setGames(gamesData);
        console.log("Games fetched:", gamesData);
      } catch (error) {
        console.error('Error fetching games:', error);
        toast.error('Failed to load games');
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, [classroomId, token]);

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game? All student scores will be lost.')) {
      return;
    }

    try {
      await gameService.deleteGame(gameId);
      
      // Remove the deleted game from the state
      setGames(prevGames => prevGames.filter(game => game.id !== gameId));
      toast.success('Game deleted successfully');
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error(error.response?.data?.message || 'Failed to delete game');
    }
  };

  const handleAddGameSuccess = (newGame) => {
    setIsAddingGame(false);
    
    if (newGame) {
      setGames(prevGames => [...prevGames, newGame]);
      toast.success('Game added successfully!');
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Games</h2>
        {!isAddingGame && (
          <button
            onClick={() => setIsAddingGame(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Game
          </button>
        )}
      </div>

      {isAddingGame ? (
        <div className="mb-6">
          <CreateGameForm 
            classroomId={classroomId} 
            activityId={activityId}
            onSuccess={handleAddGameSuccess} 
          />
        </div>
      ) : games.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <p className="text-gray-600 mb-4">No games have been added to this classroom yet.</p>
          <button
            onClick={() => setIsAddingGame(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Your First Game
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {games.map(game => (
            <div key={game.id} className="bg-white rounded-lg shadow-md p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold mb-2">{game.name}</h3>
                <div className="flex space-x-1">
                  {getGameLevelBadge(game.level)}
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-2">Type: {getGameTypeLabel(game.type)}</p>
              <p className="text-sm text-gray-600 mb-2">Topic: {game.topic}</p>
              
              {game.instructions && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{game.instructions}</p>
              )}
              
              <div className="flex justify-between mt-4">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDeleteGame(game.id)}
                    className="px-3 py-1 bg-red-50 text-red-600 rounded hover:bg-red-100"
                  >
                    Delete
                  </button>
                  <Link
                    to={`/teacher/games/${game.id}/analytics`}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                  >
                    Analytics
                  </Link>
                </div>
                <button
                  onClick={() => navigate(`/student/games/${game.id}`)}
                  className="px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                >
                  Preview
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClassroomGamesTab; 