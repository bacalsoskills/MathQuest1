import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import FallingGame from './FallingGame';
import MultipleChoiceGame from './MultipleChoiceGame';
import Leaderboard from './Leaderboard';

const GameContainer = () => {
  const { gameId } = useParams();
  const { token, currentUser } = useAuth();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [finalScore, setFinalScore] = useState(null);
  const [gameState, setGameState] = useState({ gameStarted: false, gameOver: false });

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

  const handleGameComplete = useCallback((score, gameStateUpdate) => {
    if (score !== null) {
      // Handle score submission
      setFinalScore(score);
      // Add a small delay to ensure score submission is processed
      setTimeout(() => {
        setShowLeaderboard(true);
      }, 1000);
    }
    
    if (gameStateUpdate) {
      // Handle game state update
      if (gameStateUpdate.showLeaderboard) {
        // Handle View Leaderboard button click
        setShowLeaderboard(true);
      } else {
        setGameState(gameStateUpdate);
      }
    }
  }, []);

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
      {showLeaderboard && (
        <div className="mb-4">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <button
              onClick={handleBackToClassroom}
              className="hover:text-blue-600 transition-colors"
            >
              Back to Classroom
            </button>
            <span className="text-gray-400">/</span>
            <button
              onClick={handleBackToGame}
              className="hover:text-blue-600 transition-colors"
            >
              Back to Game
            </button>
          </nav>
        </div>
      )}

      {/* {!showLeaderboard && !gameState.gameStarted && (
        <div className="mb-4 flex justify-start items-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              View Leaderboard
            </button>
          </div>
        </div>
      )} */}

      {showLeaderboard ? (
        <Leaderboard key={`${gameId}-${finalScore}`} gameId={gameId} finalScore={finalScore} />
      ) : (
        <div className="">
          {game.type === 'FALLING_GAME' ? (
            <FallingGame game={game} onGameComplete={handleGameComplete} />
          ) : (
            <MultipleChoiceGame game={game} onGameComplete={handleGameComplete} />
          )}
        </div>
      )}
    </div>
  );
};

export default GameContainer; 