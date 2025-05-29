import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Leaderboard from '../games/Leaderboard';

const ActivityManager = ({ classroomId, refreshTrigger }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activities, setActivities] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    if (!classroomId) return;
    
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Fetch activities for this lesson
        const activitiesResponse = await api.get(
          `/activities/classroom/${classroomId}`
        );
        
        const fetchedActivities = activitiesResponse.data;
        setActivities(fetchedActivities);
        
        // Extract game activities
        const gameActivities = fetchedActivities.filter(activity => activity.type === 'GAME');
        
        if (gameActivities.length > 0) {
          // For each game activity, fetch the associated game
          const gamePromises = gameActivities.map(activity => 
            api.get(`/games/activity/${activity.id}`)
          );
          
          const gameResponses = await Promise.all(gamePromises);
          const fetchedGames = gameResponses.map(response => response.data);
          setGames(fetchedGames);
        } else {
          setGames([]);
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError('Failed to load activities. Please try again.');
        toast.error('Failed to load activities');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [classroomId, token, refreshTrigger]);

  const handleDeleteGame = async (gameId) => {
    if (!window.confirm('Are you sure you want to delete this game activity? All student scores will be lost.')) {
      return;
    }

    try {
      // First find the activity associated with this game
      const game = games.find(g => g.id === gameId);
      if (!game || !game.activityId) {
        toast.error('Could not find the activity for this game');
        return;
      }

      // Delete the game first
      await api.delete(`/games/${gameId}`);
      
      // Then delete the activity
      await api.delete(`/activities/${game.activityId}`);
      
      // Update the local state
      setGames(prevGames => prevGames.filter(g => g.id !== gameId));
      setActivities(prevActivities => prevActivities.filter(a => a.id !== game.activityId));
      
      toast.success('Game activity deleted successfully');
    } catch (error) {
      console.error('Error deleting game:', error);
      toast.error('Failed to delete game activity');
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

  const handlePreviewGame = (game) => {
    setSelectedGame(game);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setSelectedGame(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error! </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No activities available for this lesson yet.</p>
      </div>
    );
  }

  // Only show game activities for now
  if (!games.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">No game activities available for this lesson yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Game Activities</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map(game => (
          <div key={game.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-blue-500 text-white px-4 py-3 flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-2xl mr-2">{getGameTypeIcon(game.type)}</span>
                <span className="font-semibold">{game.name}</span>
              </div>
              {getGameLevelBadge(game.level)}
            </div>
            
            <div className="p-4">
              <div className="space-y-1 text-base text-gray-600">
                <p><span className="font-bold">Type: </span> {getGameTypeLabel(game.type)}</p>
                <p><span className="font-bold">Topic: </span> {game.topic}</p>
                {game.instructions && (
                  <p className="text-gray-600 mb-4 line-clamp-2">{game.instructions}</p>
                )} 
              </div>
              
              <div className="flex items-center space-x-2 mt-4">
                <button
                  onClick={() => handlePreviewGame(game)}
                  className="text-gray-600 hover:text-gray-900 text-base focus:outline-none"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  Preview
                </button>
                <span className="mx-1 text-gray-400">|</span>
                <button
                  onClick={() => handleDeleteGame(game.id)}
                  className="text-red-600 hover:text-red-900 text-base focus:outline-none"
                  style={{ background: 'none', border: 'none', padding: 0 }}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreviewModal && selectedGame && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Only close if clicking the backdrop (outer div)
            if (e.target === e.currentTarget) {
              closePreviewModal();
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Preview Leaderboard - {selectedGame.name}</h3>
              <button
                onClick={closePreviewModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <Leaderboard gameId={selectedGame.id} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityManager; 