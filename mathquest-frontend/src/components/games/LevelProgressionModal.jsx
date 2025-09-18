import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import gameService from '../../services/gameService';




const LevelProgressionModal = ({ isOpen, onClose, gameId, gameName, maxGameLevel = 10, onLevelSelect, showLevelSelection = false, scoreData }) => {
  const { currentUser } = useAuth();
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState(null);
  const [error, setError] = useState(null);


  const effectiveGameId = gameId || (scoreData && scoreData.gameId);

  useEffect(() => {

    // Only fetch when modal is open and both currentUser and gameId are available
    if (!isOpen || !currentUser || !effectiveGameId) {
      setLoading(false);
      return;
    }
    
    const fetchStudentLevel = async () => {
      try {
     
        let level = await gameService.getStudentGameLevel(effectiveGameId, currentUser.id);

        if (typeof level === 'object' && level !== null) {
          level = level.level_achieved || level.level || 1;
        }
        // Only unlock up to the level already achieved, not the next one
        const newUnlockedLevels = Math.min(Number(level), maxGameLevel);
        setUnlockedLevels(newUnlockedLevels);
        setLoading(false);

      } catch (error) {
        setUnlockedLevels(1);
        setLoading(false);
        console.error('[LevelProgressionModal] Error fetching student level:', error);
      }
    };
    
    fetchStudentLevel();
  }, [isOpen, currentUser, effectiveGameId, maxGameLevel]);

  useEffect(() => {
    const fetchGame = async () => {
      if (!effectiveGameId) return;
      
      try {
        const response = await api.get(`/games/${effectiveGameId}`);
        setGame(response.data);

      } catch (error) {
        console.error('Error fetching game:', error);
        setError('Failed to load game. Please try again later.');
      }
    };

    if (isOpen) {
      fetchGame();
    }
  }, [effectiveGameId, isOpen]);

  const handleLevelClick = (selectedLevel) => {
    if (selectedLevel <= unlockedLevels) {
      onLevelSelect(selectedLevel);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Show loading spinner if waiting for user or gameId
  if (loading || !currentUser || !effectiveGameId) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4 flex flex-col items-center">
          <h2 className="text-2xl font-bold mb-4">{gameName}</h2>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-lg w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">{gameName}</h2>
        {/* Score summary (optional, if scoreData is provided) */}
        {/* {scoreData && !showLevelSelection && (
          <div className="mb-6">
            <p className="text-lg mb-2">Level {scoreData.level || 1} Complete!</p>
            <p className="text-gray-600">Score: {scoreData.score}</p>
          </div>
        )} */}
        {/* Level selection */}
        {showLevelSelection && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            {Array.from({ length: maxGameLevel }, (_, i) => i + 1).map((level) => (
              <button
                key={level}
                onClick={() => handleLevelClick(level)}
                disabled={level > unlockedLevels}
                className={`p-4 rounded-lg text-center transition-colors ${
                  level <= unlockedLevels
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Level {level}
                {level <= unlockedLevels && <span className="block text-xs mt-1">Unlocked</span>}
                {level > unlockedLevels && <span className="block text-xs mt-1">Locked</span>}
              </button>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default LevelProgressionModal; 

