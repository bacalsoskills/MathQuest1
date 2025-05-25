import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LevelProgressionModal from './LevelProgressionModal';
import gameService from '../../services/gameService';
import { useRef } from 'react';
import { FaPlay, FaPause, FaCog, FaRedo, FaTable, FaVolumeUp, FaVolumeMute, FaStar } from 'react-icons/fa';
import MultiplicationTable from './MultiplicationTable';

// Add these constants at the top after imports
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_CALLS_PER_WINDOW = 10;
const MAX_LEVEL = 10;
const PROBLEMS_PER_LEVEL = 5;
const MAX_LIVES = 5;

// API state management
const apiState = {
  lastCallTime: 0,
  callCount: 0,
  problemsCache: new Map(),
  isGenerating: false
};

const MultipleChoiceGame = ({ game, onGameComplete }) => {
  const { token, currentUser } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [timeLeft, setTimeLeft] = useState(countdown);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [lastScoreData, setLastScoreData] = useState(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  const [problemsSolvedThisLevel, setProblemsSolvedThisLevel] = useState(0);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [countdownModal, setCountdownModal] = useState(null);

  // Add parseGroqApiContent helper function
  const parseGroqApiContent = (content) => {
    if (typeof content === 'string') {
      content = content.trim();
      if (content.startsWith('```json')) {
        content = content.replace(/^```json/, '').replace(/```$/, '').trim();
      } else if (content.startsWith('```')) {
        content = content.replace(/^```/, '').replace(/```$/, '').trim();
      }
    }
    return JSON.parse(content);
  };

  // Add callGroqApi function
  const callGroqApi = useCallback(async (topic, numberOfQuestions) => {
    if (!GROQ_API_KEY) {
      console.warn('Groq API key not found');
      return null;
    }

    const now = Date.now();
    
    if (now - apiState.lastCallTime > RATE_LIMIT_WINDOW) {
      apiState.callCount = 0;
      apiState.lastCallTime = now;
    }

    if (apiState.callCount >= MAX_CALLS_PER_WINDOW) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const topicLower = topic.toLowerCase();
      let operationKeyword = '';
      if (topicLower.includes('multiply')) operationKeyword = 'multiply';
      else if (topicLower.includes('divide')) operationKeyword = 'divide';
      else if (topicLower.includes('add')) operationKeyword = 'add';
      else if (topicLower.includes('subtract')) operationKeyword = 'subtract';

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content: `You are an expert math problem generator for grade 4 students.`
            },
            {
              role: "user",
              content: `Generate ${numberOfQuestions} grade 4 math problems for the topic '${topic}'.\n\nRespond ONLY with a JSON array where each object has:\n- 'question' (string)\n- 'answer' (string)\n- 'operation' (string)`
            }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      apiState.callCount++;
      apiState.lastCallTime = now;

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsedContent = parseGroqApiContent(content);
      
      return parsedContent;
    } catch (error) {
      console.error('Groq API error:', error);
      return null;
    }
  }, []);

  // Update generateQuestions to use Groq API
  const generateQuestions = useCallback(async () => {
    if (!game?.id || !game?.topic || apiState.isGenerating) {
      console.warn('Game or topic not available yet');
      return;
    }

    try {
      setIsLoadingProblems(true);
      apiState.isGenerating = true;
      const topicLower = game.topic.toLowerCase();
      const problemCount = 10;
      const cacheKey = `${topicLower}-${currentLevel}`;

      if (apiState.problemsCache.has(cacheKey)) {
        const cached = apiState.problemsCache.get(cacheKey);
        if (cached.timestamp > Date.now() - 5 * 60 * 1000) {
          setQuestions(cached.problems);
          return;
        }
      }

      // Try Groq API first
      const problems = await callGroqApi(game.topic, problemCount);
      if (Array.isArray(problems) && problems.length > 0) {
        const formattedProblems = problems.map((p, idx) => ({
          id: `${Date.now()}-${idx}`,
          question: p.question,
          answer: p.answer,
          options: generateOptions(p.answer, currentLevel),
          correctAnswer: p.answer,
          level: currentLevel
        }));

        apiState.problemsCache.set(cacheKey, {
          problems: formattedProblems,
          timestamp: Date.now()
        });

        setQuestions(formattedProblems);
        return;
      }

      // Fallback to basic generation
      const range = getDifficultyRanges(currentLevel);
      const newQuestions = [];

      for (let i = 0; i < problemCount; i++) {
        const num1 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        const num2 = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
        
        let question = {};
        if (topicLower.includes('add')) {
          const answer = num1 + num2;
          question = {
            id: `${Date.now()}-${i}`,
            question: `What is ${num1} + ${num2}?`,
            answer: answer.toString(),
            options: generateOptions(answer, currentLevel),
            correctAnswer: answer.toString(),
            level: currentLevel
          };
        } else if (topicLower.includes('subtract')) {
          const [larger, smaller] = num1 >= num2 ? [num1, num2] : [num2, num1];
          const answer = larger - smaller;
          question = {
            id: `${Date.now()}-${i}`,
            question: `What is ${larger} - ${smaller}?`,
            answer: answer.toString(),
            options: generateOptions(answer, currentLevel),
            correctAnswer: answer.toString(),
            level: currentLevel
          };
        } else if (topicLower.includes('multiply')) {
          const answer = num1 * num2;
          question = {
            id: `${Date.now()}-${i}`,
            question: `What is ${num1} × ${num2}?`,
            answer: answer.toString(),
            options: generateOptions(answer, currentLevel),
            correctAnswer: answer.toString(),
            level: currentLevel
          };
        } else if (topicLower.includes('divide')) {
          const product = num1 * num2;
          question = {
            id: `${Date.now()}-${i}`,
            question: `What is ${product} ÷ ${num1}?`,
            answer: num2.toString(),
            options: generateOptions(num2, currentLevel),
            correctAnswer: num2.toString(),
            level: currentLevel
          };
        }
        
        newQuestions.push(question);
      }

      setQuestions(newQuestions);
    } catch (error) {
      console.error('Error generating problems:', error);
    } finally {
      setIsLoadingProblems(false);
      apiState.isGenerating = false;
    }
  }, [game, currentLevel, callGroqApi]);

  // Add getDifficultyRanges helper
  const getDifficultyRanges = useCallback((level) => {
    const ranges = {
      1: { min: 1, max: 10 },
      2: { min: 5, max: 15 },
      3: { min: 10, max: 20 },
      4: { min: 15, max: 30 },
      5: { min: 20, max: 50 }
    };
    
    const rangeLevel = Math.min(level, Object.keys(ranges).length);
    return ranges[rangeLevel] || ranges[Object.keys(ranges).length];
  }, []);

  // Update generateOptions to handle different levels
  const generateOptions = useCallback((correctAnswer, level) => {
    const options = [correctAnswer];
    const range = getDifficultyRanges(level);
    const maxRange = range.max * (level >= 3 ? 2 : 1);
    
    while (options.length < 4) {
      const wrongAnswer = Math.floor(Math.random() * maxRange) + 1;
      if (!options.includes(wrongAnswer) && Math.abs(wrongAnswer - correctAnswer) > 1) {
        options.push(wrongAnswer);
      }
    }
    
    return options.sort(() => Math.random() - 0.5);
  }, [getDifficultyRanges]);

   // Update submitScore to handle levels
   const submitScore = async () => {
    try {
      const gameScoreData = {
        gameId: game.id,
        score: score,
        level: currentLevel,
        timeSpent: (questions.length * countdown) - timeLeft
      };
      
      const result = await gameService.submitGameScore(gameScoreData);
      setLastScoreData(result);
      setShowProgressModal(true);
      
      if (onGameComplete) {
        try {
          onGameComplete(score);
        } catch (error) {
          onGameComplete(result);
        }
      }
    } catch (error) {
      console.error('Error submitting score:', error);
      toast.error('Failed to submit score');
      
      if (currentUser) {
        const existingScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
        const newScore = {
          gameId: game.id,
          score: score,
          level: currentLevel,
          timeSpent: (questions.length * countdown) - timeLeft,
          timestamp: new Date().toISOString(),
          userId: currentUser.id,
          pending: true
        };
        
        existingScores.push(newScore);
        localStorage.setItem('gameScores', JSON.stringify(existingScores));
        
        setLastScoreData(newScore);
        setShowProgressModal(true);
        
        if (onGameComplete) {
          try {
            onGameComplete(score);
          } catch (e) {
            onGameComplete(newScore);
          }
        }
      }
    }
  };


  // Add levelUp function
  const levelUp = useCallback(() => {
    if (currentLevel >= MAX_LEVEL) {
      setGameOver(true);
      submitScore();
      return;
    }
    toast.success(`Level ${currentLevel} complete! Starting level ${currentLevel + 1}...`);
    setCurrentLevel(currentLevel + 1); // Always sequential
    setProblemsSolvedThisLevel(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setTimeLeft(countdown);
    generateQuestions();
  }, [currentLevel, submitScore, generateQuestions, countdown]);

  // Update handleOptionSelect to handle levels
  const handleOptionSelect = (option) => {
    if (showFeedback) return;
    
    setSelectedOption(option);
    setShowFeedback(true);
    
    const currentQuestion = questions[currentQuestionIndex];
    const correct = option.toString() === currentQuestion.correctAnswer.toString();
    setIsCorrect(correct);
    
    if (correct) {
      const timeBonus = Math.ceil((timeLeft / countdown) * 10);
      const levelBonus = currentLevel * 5;
      setScore(prevScore => prevScore + 10 + timeBonus + levelBonus);
      setProblemsSolvedThisLevel(prev => {
        const newCount = prev + 1;
        if (newCount >= PROBLEMS_PER_LEVEL) {
          setTimeout(() => levelUp(), 1500);
          return 0;
        }
        return newCount;
      });
      toast.success('Correct!', { duration: 1000 });
    } else {
      // Deduct a life for incorrect answer
      setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
          submitScore();
          return 0;
        }
        return newLives;
      });
      toast.error('Incorrect!', { duration: 1000 });
    }
    
    setTimeout(() => {
      moveToNextQuestion();
    }, 1500);
  };

 
  // Add handleCloseProgressModal
  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
    setLastScoreData(null);
  };

  // Update startGame to handle levels
  const startGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCurrentLevel(1);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setTimeLeft(countdown);
    setShowFeedback(false);
    setProblemsSolvedThisLevel(0);
    setLives(MAX_LIVES);
    setIsPaused(false);
    setCountdownModal(3);
    generateQuestions();
    let count = 3;
    const countdownInterval = setInterval(() => {
      count--;
      setCountdownModal(count);
      if (count <= 0) {
        clearInterval(countdownInterval);
        setCountdownModal(null);
        setGameStarted(true);
      }
    }, 1000);
  };

  // Timer countdown effect
  useEffect(() => {
    if (!gameStarted || gameOver || showFeedback) return;
    
    if (timeLeft <= 0) {
      // Time's up, deduct a life
      setLives(prevLives => {
        const newLives = prevLives - 1;
        if (newLives <= 0) {
          setGameOver(true);
          submitScore();
          return 0;
        }
        return newLives;
      });
      setShowFeedback(true);
      setIsCorrect(false);
      
      setTimeout(() => {
        moveToNextQuestion();
      }, 1500);
      
      return;
    }
    
    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [gameStarted, gameOver, showFeedback, timeLeft]);
  
  const moveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prevIndex => prevIndex + 1);
      setSelectedOption(null);
      setTimeLeft(countdown);
      setShowFeedback(false);
    } else {
      // Game over
      setGameOver(true);
      submitScore();
    }
  };
  
  // Current question being displayed
  const currentQuestion = questions[currentQuestionIndex];

  // Add this near the top of your component
  const handleLevelSelect = (selectedLevel) => {
    setCurrentLevel(selectedLevel);
    setProblemsSolvedThisLevel(0);
    generateQuestions();
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setTimeLeft(countdown);
    setShowFeedback(false);
  };

  const handleLevelCompletion = useCallback(async () => {
    if (currentLevel >= MAX_LEVEL) {
      setGameOver(true);
      submitScore();
      return;
    }

    // Submit score for current level completion
    const gameScoreData = {
      gameId: game.id,
      score: score,
      level: currentLevel,
      timeSpent: (questions.length * countdown) - timeLeft
    };

    try {
      const result = await gameService.submitGameScore(gameScoreData);
      setLastScoreData(result);
      setShowProgressModal(true);

      // Proceed to next level
      toast.success(`Level ${currentLevel} complete! Starting level ${currentLevel + 1}...`, { duration: 2000 });
      setCurrentLevel(prev => prev + 1);
      setScore(0);
      setCorrectAnswers(0);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setTimeLeft(countdown * PROBLEMS_PER_LEVEL);
      generateQuestions();
    } catch (error) {
      console.error('Error submitting level completion:', error);
      toast.error('Failed to save level progress');
    }
  }, [currentLevel, game?.id, score, questions.length, countdown, timeLeft, generateQuestions]);

  const handleExitGame = () => {
    submitScore();
    setGameOver(true);
    setGameStarted(false);
    if (onGameComplete) onGameComplete(score);
  };


  // Music state and ref
  const [musicVolume, setMusicVolume] = useState(0.5);
  const audioRef = useRef(null);
  useEffect(() => {
    if (musicEnabled && audioRef.current) {
      audioRef.current.volume = musicVolume;
      audioRef.current.play().catch(() => {});
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [musicEnabled, musicVolume]);

  // Add toggle helpers
  const togglePause = () => {
    if (gameOver || !gameStarted) return;
    setIsPaused(prev => !prev);
  };
  const toggleSettingsModal = () => setShowSettingsModal(prev => !prev);
  const toggleTableModal = () => {
    if (game?.topic?.toLowerCase().includes('multiply') || game?.topic?.toLowerCase().includes('division')) {
      setShowTableModal(prev => !prev);
    } else {
      toast.error('Multiplication table is only available for multiplication or division topics.');
    }
  };
  const toggleMusic = () => setMusicEnabled(prev => !prev);
  const isMultiplicationOrDivision = game?.topic?.toLowerCase().includes('multiply') || game?.topic?.toLowerCase().includes('division');

  return (
    <div className="w-full min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <audio ref={audioRef} src="/game-bg-music.mp3" loop autoPlay style={{ display: 'none' }} />
      {/* Progress Modal */}
      {showProgressModal && lastScoreData && (
        <LevelProgressionModal
          isOpen={showProgressModal}
          onClose={handleCloseProgressModal}
          scoreData={lastScoreData}
          gameName={game?.name || 'Multiple Choice Game'}
          gameId={game?.id}
          maxGameLevel={10}
        />
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4">
          <div className="bg-gray-700 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-2xl font-bold mb-6 text-yellow-400 text-center">Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-600 rounded-md">
                <span className="text-lg">Background Music</span>
                <button onClick={toggleMusic} className="p-2 rounded-full hover:bg-gray-500 transition-colors">
                  {musicEnabled ? <FaVolumeUp size={24} className="text-green-400"/> : <FaVolumeMute size={24} className="text-red-400"/>}
                </button>
              </div>
              <div className="flex items-center p-3 bg-gray-600 rounded-md">
                <span className="text-lg mr-4">Volume</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={musicVolume}
                  onChange={e => setMusicVolume(Number(e.target.value))}
                  className="w-full"
                  disabled={!musicEnabled}
                  data-testid="music-volume-slider"
                />
              </div>
            
            </div>
            <div className="mt-8 text-center">
              <button
                onClick={toggleSettingsModal}
                className="px-6 py-2 bg-blue-600 text-white rounded-md text-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Countdown Modal */}
      {countdownModal !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="text-center">
            <h2 className="text-6xl font-bold text-white mb-4">Starting in</h2>
            <div className="text-8xl font-bold text-yellow-400 animate-pulse">
              {countdownModal}
            </div>
          </div>
        </div>
      )}
      {/* Top Bar */}
      {gameStarted && !gameOver && !isPaused && (
        <div className="w-full  p-4 bg-gray-900 shadow-lg flex justify-between items-center mb-6 rounded-lg">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="text-xs sm:text-sm md:text-base">LEVEL: <span className="font-bold text-yellow-400">{currentLevel}</span></div>
            <button
              onClick={() => setShowLevelSelector(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Change Level
            </button>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs sm:text-sm text-gray-400">PROGRESS</div>
            <div className="w-24 sm:w-32 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div 
                className="h-full bg-green-500 transition-all duration-300 ease-in-out"
                style={{ width: `${Math.min(100, (problemsSolvedThisLevel / PROBLEMS_PER_LEVEL) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs sm:text-sm font-bold">{problemsSolvedThisLevel}/{PROBLEMS_PER_LEVEL}</div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={toggleSettingsModal} 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 rounded-md hover:bg-gray-600 text-xs sm:text-sm text-white flex items-center"
            >
              <FaCog className="mr-1 sm:mr-2" size={12}/> Settings
            </button>
            <button 
              onClick={togglePause} 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-xs sm:text-sm text-white flex items-center"
            >
              {isPaused ? <><FaPlay className="mr-1 sm:mr-2" size={12}/> Resume</> : <><FaPause className="mr-1 sm:mr-2" size={12}/> Pause</>}
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm sm:text-base flex items-center">SCORE: <FaStar className="mx-1 text-yellow-400" /> <span className="font-bold text-yellow-400">{score}</span></div>
            <div className="text-sm sm:text-base">LIVES: <span className="text-red-500">{'❤️'.repeat(lives) || '💔'}</span></div>
            <div className="text-lg"><span className="font-bold">Time:</span> {timeLeft}s</div>
          </div>
        </div>
      )}
      {/* Main Game Area */}
      <div className={`w-full max-w-3xl mx-auto flex flex-col items-center justify-center flex-grow`}>
        {!gameStarted && !gameOver && countdownModal === null && (
          <div className="text-center my-8 p-8 bg-gray-700 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-3 text-yellow-400">{game?.name || 'Multiple Choice Game'}</h2>
            <p className="text-gray-300 mb-6">{game?.instructions || 'Choose the correct answer for each question!'}</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-green-500 text-white rounded-lg text-xl font-bold hover:bg-green-600 transition-colors"
            >
              Start Game
            </button>
          </div>
        )}
        {gameStarted && !gameOver && !isPaused && currentQuestion && (
          <>
          
            <div className="bg-blue-50 rounded-lg p-6 mb-6 border-2 border-blue-200 w-full">
              
              <h3 className="text-xl font-bold mb-4 text-gray-800">Questions: {currentQuestion.question}</h3>
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleOptionSelect(option)}
                    disabled={showFeedback}
                    className={`p-4 text-lg font-medium rounded-lg transition-colors !text-gray-800 ${
                      showFeedback
                        ? option === currentQuestion.correctAnswer
                          ? 'bg-green-100 border-2 border-green-500'
                          : selectedOption === option
                            ? 'bg-red-100 border-2 border-red-500'
                            : 'bg-gray-100 border-2 border-gray-200'
                        : selectedOption === option
                          ? 'bg-blue-200 border-2 border-blue-500'
                          : 'bg-white border-2 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {showFeedback && (
                <div className={`mt-4 p-3 rounded-lg ${isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  <p className="font-bold text-center">
                    {isCorrect 
                      ? '✅ Correct!'
                      : `❌ Incorrect! The correct answer is ${currentQuestion.correctAnswer}.`}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
        {gameOver && (
          <div className="text-center my-8 p-8 bg-gray-700 rounded-lg shadow-xl">
            <h3 className="text-3xl font-bold mb-3 text-red-500">Game Over!</h3>
            <p className="text-xl mb-6">Your final score: <span className="font-bold text-yellow-400">{score}</span></p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-green-500 text-white rounded-lg text-xl font-bold hover:bg-green-600 transition-colors"
            >
              Play Again
            </button>
            <button
              onClick={() => { if (onGameComplete) { onGameComplete(score); } }}
              className="ml-4 px-6 py-3 bg-gray-500 text-white rounded-lg text-lg hover:bg-gray-600 transition-colors"
            >
              Back to Games
            </button>
          </div>
        )}
        {isPaused && gameStarted && !gameOver && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-30">
            <div className="bg-gray-700 p-8 rounded-lg shadow-xl text-center">
              <h2 className="text-4xl font-bold mb-8 text-yellow-400">Game Paused</h2>
              <div className="space-y-4">
                <button
                  onClick={togglePause}
                  className="w-full px-6 py-3 bg-green-500 text-white rounded-lg text-lg font-bold hover:bg-green-600 transition-colors flex items-center justify-center"
                >
                  <FaPlay className="mr-2"/> Resume
                </button>
                <button
                  onClick={toggleSettingsModal}
                  className="w-full px-6 py-3 bg-blue-500 text-white rounded-lg text-lg font-bold hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <FaCog className="mr-2"/> Settings
                </button>
                <button
                  onClick={startGame}
                   className="w-full px-6 py-3 bg-orange-300 text-white rounded-lg text-lg font-bold hover:bg-red-400 transition-colors flex items-center justify-center"
                >
                  <FaRedo className="mr-2"/> Restart
                </button> 
                <button
                onClick={handleExitGame}
                className="w-full px-6 py-3 bg-red-500 text-white rounded-lg text-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
              >
                Exit Game
              </button>
               
              </div>
            </div>
          </div>
        )}
        {showLevelSelector && (
          <LevelProgressionModal
            isOpen={true}
            onClose={() => setShowLevelSelector(false)}
            scoreData={null}
            gameName={game?.name || 'Multiple Choice Game'}
            gameId={game?.id}
            maxGameLevel={10}
            onLevelSelect={handleLevelSelect}
            showLevelSelection={true}
          />
        )}
      </div>
    </div>
  );
};

export default MultipleChoiceGame; 

