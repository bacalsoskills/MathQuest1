import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FallingGame from './FallingGame';
import MultipleChoiceGame from './MultipleChoiceGame';
import Leaderboard from './Leaderboard';
import LevelProgressionModal from './LevelProgressionModal';

const GameContainer = () => {
  const { gameId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [showLevelSelector, setShowLevelSelector] = useState(false);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await api.get(`/games/${gameId}`);
        setGame(response.data);
      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game. Please try again later.');
        toast.error(error.response?.data?.message || 'Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    if (gameId) {
      fetchGame();
    }
  }, [gameId, token]);

  const handleGameComplete = (score) => {
    setFinalScore(score);
    setShowLeaderboard(true);
  };

  const handleBackToGame = () => {
    setShowLeaderboard(false);
    setFinalScore(null);
  };

  const handleBackToClassroom = () => {
    if (game?.lessonId) {
      navigate(`/student/classrooms/${game.classroomId}/lessons/${game.lessonId}`);
    } else {
      navigate(-1);
    }
  };

  const handleLevelSelect = (selectedLevel) => {
    setShowLevelSelector(false);
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

  if (!game) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Game not found! </strong>
        <span className="block sm:inline">The requested game could not be found.</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {!showLeaderboard ? (
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={handleBackToClassroom}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to Classroom
          </button>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Leaderboard
            </button>
            <button
              onClick={() => setShowLevelSelector(true)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              View Level
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={handleBackToGame}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
          >
            Back to Game
          </button>
          <button
            onClick={handleBackToClassroom}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Classroom
          </button>
        </div>
      )}

      {showLeaderboard ? (
        <Leaderboard gameId={gameId} finalScore={finalScore} />
      ) : (
        game.type === 'FALLING_GAME' ? (
          <FallingGame game={game} onGameComplete={handleGameComplete} />
        ) : (
          <MultipleChoiceGame game={game} onGameComplete={handleGameComplete} />
        )
      )}

      {showLevelSelector && (
        <LevelProgressionModal
          isOpen={true}
          onClose={() => setShowLevelSelector(false)}
          scoreData={finalScore ? { score: finalScore } : null}
          gameName={game?.name || 'Game'}
          gameId={gameId}
          maxGameLevel={10}
          onLevelSelect={handleLevelSelect}
          showLevelSelection={true}
        />
      )}
    </div>
  );
};

export default GameContainer; 