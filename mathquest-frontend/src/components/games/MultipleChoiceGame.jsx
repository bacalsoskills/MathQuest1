import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import LevelProgressionModal from './LevelProgressionModal';
import gameService from '../../services/gameService';
import { useRef } from 'react';
import { FaPlay, FaPause, FaCog, FaRedo, FaTable, FaVolumeUp, FaVolumeMute, FaStar } from 'react-icons/fa';
import { BsFullscreen } from "react-icons/bs";
import MultiplicationTable from './MultiplicationTable';
import Modal from '../../ui/modal';
import { Button } from '../../ui/button';
import { Header } from '../../ui/heading';

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

  // Add new states for fullscreen and exit confirmation
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);

  // Add state for unlocked levels
  const [unlockedLevels, setUnlockedLevels] = useState(() => {
    // Try to get from localStorage
    const stored = localStorage.getItem('mcgUnlockedLevels');
    return stored ? parseInt(stored, 10) : 1;
  });
  const [loadingUnlockedLevels, setLoadingUnlockedLevels] = useState(false);

  // localStorage key for game state
  const lsKey = `multipleChoiceGame-${game?.id || 'default'}`;

  // Track previous game state to prevent unnecessary parent notifications
  const previousGameStateRef = useRef({ gameStarted: false, gameOver: false });

  // Notify parent when game state changes
  useEffect(() => {
    const currentState = { gameStarted, gameOver };
    const previousState = previousGameStateRef.current;
    
    // Only notify parent if state actually changed
    if (currentState.gameStarted !== previousState.gameStarted || 
        currentState.gameOver !== previousState.gameOver) {
      
      if (onGameComplete && typeof onGameComplete === 'function') {
        // Pass game state to parent
        onGameComplete(null, currentState);
      }
      
      // Update the ref with current state
      previousGameStateRef.current = currentState;
    }
  }, [gameStarted, gameOver, onGameComplete]);

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
    console.log('[MultipleChoiceGame] callGroqApi called with:', { topic, numberOfQuestions });
    
    if (!GROQ_API_KEY) {
      console.warn('[MultipleChoiceGame] Groq API key not found');
      return null;
    }

    const now = Date.now();
    
    if (now - apiState.lastCallTime > RATE_LIMIT_WINDOW) {
      apiState.callCount = 0;
      apiState.lastCallTime = now;
    }

    if (apiState.callCount >= MAX_CALLS_PER_WINDOW) {
      console.error('[MultipleChoiceGame] Rate limit exceeded');
      throw new Error('Rate limit exceeded');
    }

    try {
      const topicLower = topic.toLowerCase();
      let operationKeyword = '';
      if (topicLower.includes('multiply')) operationKeyword = 'multiply';
      else if (topicLower.includes('divide')) operationKeyword = 'divide';
      else if (topicLower.includes('add')) operationKeyword = 'add';
      else if (topicLower.includes('subtract')) operationKeyword = 'subtract';
      else if (topicLower.includes('fraction')) operationKeyword = 'fraction';

      console.log('[MultipleChoiceGame] Making API request to Groq...');
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
              content: `You are an expert math problem generator for grade 4 students. Create accurate, level-appropriate math problems with precise answers. 

For fractions, use proper formatting (e.g., 1/2, 3/4, 1 1/2 for mixed numbers).
For situational questions, use clear, age-appropriate language and real-world scenarios.
For complex topics, carefully follow the exact specifications provided.

Always ensure answers are in the simplest form and match the expected format.`
            },
            {
              role: "user",
              content: `Generate ${numberOfQuestions} grade 4 math problems for the topic: "${topic}"

IMPORTANT: 
- Follow the exact topic description provided
- If the topic mentions specific answer formats (like "pure number like ½"), ensure answers match that format
- If it mentions situational questions, create word problems with real-world scenarios
- If it mentions single-digit fractions, use only single-digit numerators and denominators
- Ensure all problems are appropriate for grade 4 level

Respond ONLY with a JSON array where each object has:
- 'question' (string): The math problem or word problem
- 'answer' (string): The correct answer in the specified format
- 'operation' (string): The mathematical operation used (e.g., 'fraction_addition', 'situational_fraction')`
            }
          ],
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      console.log('[MultipleChoiceGame] Groq API response status:', response.status);
      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      apiState.callCount++;
      apiState.lastCallTime = now;

      const data = await response.json();
      console.log('[MultipleChoiceGame] Groq API raw response:', data);
      const content = data.choices[0].message.content;
      console.log('[MultipleChoiceGame] Groq API content:', content);
      const parsedContent = parseGroqApiContent(content);
      console.log('[MultipleChoiceGame] Parsed content:', parsedContent);
      
      // Filter problems to only include those matching the topic/operation
      let filteredProblems = parsedContent;
      if (Array.isArray(parsedContent)) {
        if (operationKeyword) {
          filteredProblems = parsedContent.filter(p => {
            if (!p.operation) return false;
            const op = p.operation.toLowerCase();
            if (operationKeyword === 'multiply') return op.includes('multiply');
            if (operationKeyword === 'divide') return op.includes('divide');
            if (operationKeyword === 'add') return op.includes('add');
            if (operationKeyword === 'subtract') return op.includes('subtract');
            if (operationKeyword === 'fraction') return op.includes('fraction') || op.includes('add') || op.includes('situational');
            return false;
          });
        }
      }
      
      console.log('[MultipleChoiceGame] Filtered problems:', filteredProblems);
      return filteredProblems;
    } catch (error) {
      console.error('[MultipleChoiceGame] Groq API error:', error);
      return null;
    }
  }, []);

  // Update generateQuestions to use Groq API only
  const generateQuestions = useCallback(async () => {
    console.log('[MultipleChoiceGame] generateQuestions called with:', { gameId: game?.id, topic: game?.topic, currentLevel });
    
    if (!game?.id || !game?.topic || apiState.isGenerating) {
      console.warn('[MultipleChoiceGame] Game or topic not available yet, or already generating');
      return [];
    }

    try {
      setIsLoadingProblems(true);
      apiState.isGenerating = true;
      const topicLower = game.topic.toLowerCase();
      const problemCount = 60; // Generate 60 questions for all levels (10 levels × 6 questions per level)
      const cacheKey = `${topicLower}-${currentLevel}`;

      console.log('[MultipleChoiceGame] Checking cache for key:', cacheKey);
      if (apiState.problemsCache.has(cacheKey)) {
        const cached = apiState.problemsCache.get(cacheKey);
        if (cached.timestamp > Date.now() - 5 * 60 * 1000) {
          console.log('[MultipleChoiceGame] Using cached problems');
          setQuestions(cached.problems);
          return cached.problems;
        }
      }

      console.log('[MultipleChoiceGame] Calling Groq API for topic:', game.topic);
      // Use Groq API only - no fallback
      const problems = await callGroqApi(game.topic, problemCount);
      console.log('[MultipleChoiceGame] Groq API response:', problems);
      
      if (Array.isArray(problems) && problems.length > 0) {
        // Filter out duplicate questions by question text
        const seen = new Set();
        const uniqueProblems = problems.filter(p => {
          if (!p.question) return false;
          if (seen.has(p.question)) return false;
          seen.add(p.question);
          return true;
        });
        
        console.log('[MultipleChoiceGame] Unique problems after filtering:', uniqueProblems.length);
        
        const formattedProblems = uniqueProblems.map((p, idx) => ({
          id: `${Date.now()}-${idx}`,
          question: p.question,
          answer: p.answer,
          options: generateOptions(p.answer, currentLevel, game.topic),
          correctAnswer: p.answer,
          level: currentLevel
        }));

        apiState.problemsCache.set(cacheKey, {
          problems: formattedProblems,
          timestamp: Date.now()
        });

        console.log('[MultipleChoiceGame] Setting questions:', formattedProblems.length);
        setQuestions(formattedProblems);
        return formattedProblems;
      }

      // If no problems returned, show error and retry
      console.error('[MultipleChoiceGame] No problems generated from Groq API');
      
      // Generate fallback questions based on topic
      console.log('[MultipleChoiceGame] Generating fallback questions...');
      const fallbackQuestions = generateFallbackQuestions(game.topic, problemCount);
      if (fallbackQuestions.length > 0) {
        console.log('[MultipleChoiceGame] Using fallback questions:', fallbackQuestions.length);
        setQuestions(fallbackQuestions);
        return fallbackQuestions;
      }
      
      toast.error('Failed to generate questions. Please try again.');
      setQuestions([]);
      return [];
      
    } catch (error) {
      console.error('[MultipleChoiceGame] Error generating problems:', error);
      toast.error('Failed to generate questions. Please try again.');
      setQuestions([]);
      return [];
    } finally {
      console.log('[MultipleChoiceGame] generateQuestions finished');
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
  const generateOptions = useCallback((correctAnswer, level, topic) => {
    const options = [correctAnswer];
    const range = getDifficultyRanges(level);
    const maxRange = range.max * (level >= 3 ? 2 : 1);
    if (topic && topic.toLowerCase().includes('fraction')) {
      // Generate plausible fraction options
      const [ansNum, ansDen] = correctAnswer.split(/[ /]+/).map(Number);
      while (options.length < 4) {
        let num = Math.max(1, ansNum + Math.floor(Math.random() * 5) - 2);
        let den = ansDen || (Math.floor(Math.random() * 8) + 2);
        let opt = `${num}/${den}`;
        if (!options.includes(opt)) options.push(opt);
      }
      return options.sort(() => Math.random() - 0.5);
    }
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
    // Unlock next level
    setUnlockedLevels(prev => {
      const next = Math.max(prev, currentLevel + 1);
      localStorage.setItem('mcgUnlockedLevels', next);
      return next;
    });
    toast.success(`Level ${currentLevel} complete! Starting level ${currentLevel + 1}...`);
    setCurrentLevel(currentLevel + 1); // Always sequential
    setProblemsSolvedThisLevel(0);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setTimeLeft(getLevelTime(currentLevel + 1));
    generateQuestions();
  }, [currentLevel, submitScore, generateQuestions]);

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

  // Update startGame to use getLevelTime
  const startGame = () => {
    console.log('[MultipleChoiceGame] startGame called');
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setCurrentLevel(1);
    setCurrentQuestionIndex(0);
    setSelectedOption(null);
    setTimeLeft(getLevelTime(1));
    setShowFeedback(false);
    setProblemsSolvedThisLevel(0);
    setLives(MAX_LIVES);
    setIsPaused(false);
    setCountdownModal(3);
    
    console.log('[MultipleChoiceGame] Generating questions...');
    generateQuestions().then((generatedQuestions) => {
      console.log('[MultipleChoiceGame] Questions generated, checking count:', generatedQuestions.length);
      
      // Check if questions were actually generated
      if (!generatedQuestions || generatedQuestions.length === 0) {
        console.log('[MultipleChoiceGame] No questions available, not starting game');
        setCountdownModal(null);
        toast.error('Failed to generate questions. Please try again.');
        return;
      }
      
      console.log('[MultipleChoiceGame] Questions available, starting countdown');
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        console.log('[MultipleChoiceGame] Countdown:', count);
        setCountdownModal(count);
        if (count <= 0) {
          console.log('[MultipleChoiceGame] Countdown finished, starting game');
          clearInterval(countdownInterval);
          setCountdownModal(null);
          setGameStarted(true);
        }
      }, 1000);
    }).catch(error => {
      console.error('[MultipleChoiceGame] Error generating questions:', error);
      toast.error('Failed to start game. Please try again.');
      setCountdownModal(null);
    });
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
      setTimeLeft(getLevelTime(currentLevel));
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
    setTimeLeft(getLevelTime(selectedLevel));
    setShowFeedback(false);
    // Unlock this level if not already
    setUnlockedLevels(prev => {
      const next = Math.max(prev, selectedLevel);
      localStorage.setItem('mcgUnlockedLevels', next);
      return next;
    });
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

  // Add exit game handlers
  const handleStayOnPage = () => {
    setNextLocation(null);
    setShowExitConfirmModal(false);
  };

  const handleExitGameConfirm = () => {
    setShowExitConfirmModal(false);
    setIsPaused(false);
    submitScore();
    setGameOver(true);
    setGameStarted(false);
    
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/student/classrooms';
    }
  };

  const handleRestartConfirm = () => {
    setShowRestartConfirmModal(false);
    startGame();
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

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        document.body.classList.add('fullscreen-mode');
      }).catch(err => {
        console.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        document.body.classList.remove('fullscreen-mode');
      }).catch(err => {
        console.error('Error attempting to exit fullscreen:', err);
      });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isInFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isInFullscreen);
      if (isInFullscreen) {
        document.body.classList.add('fullscreen-mode');
      } else {
        document.body.classList.remove('fullscreen-mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.body.classList.remove('fullscreen-mode');
    };
  }, []);

  // Add function to fetch unlocked levels
  const fetchUnlockedLevels = useCallback(async () => {
    if (!currentUser || !game?.id) {
      // fallback to localStorage
      const stored = localStorage.getItem('mcgUnlockedLevels');
      setUnlockedLevels(stored ? parseInt(stored, 10) : 1);
      return;
    }
    setLoadingUnlockedLevels(true);
    try {
      const levelData = await gameService.getStudentGameLevel(game.id, currentUser.id);
      let unlockedLevel = 1;
      if (typeof levelData === 'object' && levelData !== null) {
        unlockedLevel = levelData.level_achieved || levelData.level || 1;
      } else if (typeof levelData === 'number') {
        unlockedLevel = levelData;
      }
      setUnlockedLevels(Math.max(unlockedLevel, parseInt(localStorage.getItem('mcgUnlockedLevels') || '1', 10)));
    } catch (error) {
      // fallback to localStorage
      const stored = localStorage.getItem('mcgUnlockedLevels');
      setUnlockedLevels(stored ? parseInt(stored, 10) : 1);
    } finally {
      setLoadingUnlockedLevels(false);
    }
  }, [currentUser, game]);

  // Update the level selector modal to fetch unlocked levels when opened
  const handleShowLevelSelector = () => {
    setShowLevelSelector(true);
    fetchUnlockedLevels();
  };

  // Add helper for level time
  const getLevelTime = (level) => {
    // 20s at level 1, 7s at level 10, linear decrease
    return Math.max(7, 20 - Math.floor((level - 1) * (13 / 9)));
  };

  // Navigation warning logic
  useEffect(() => {
    if (!gameStarted || gameOver) return;
    
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    
    const handlePopState = (e) => {
      e.preventDefault && e.preventDefault();
      setNextLocation(window.location.href);
      setShowExitConfirmModal(true);
      window.history.pushState(null, '', window.location.href);
    };
    
    const handleNavigationAttempt = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setNextLocation(e.target.href || e.target.getAttribute('href'));
      setShowExitConfirmModal(true);
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.history.pushState(null, '', window.location.href);
    
    // Listen for clicks on navigation elements
    const handleClick = (e) => {
      const target = e.target.closest('a, button[data-nav], [role="link"], .nav-link, .sidebar-link, [href]');
      if (target) {
        const href = target.href || target.getAttribute('href');
        const isExternalLink = href && !href.includes(window.location.origin + '/game/');
        const isNavigationElement = target.tagName === 'A' || 
                                   target.hasAttribute('data-nav') || 
                                   target.getAttribute('role') === 'link' ||
                                   target.className.includes('nav-link') ||
                                   target.className.includes('sidebar-link');
        if (isNavigationElement && isExternalLink) {
          handleNavigationAttempt(e);
        }
      }
    };
    
    document.addEventListener('click', handleClick, true);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      document.removeEventListener('click', handleClick, true);
    };
  }, [gameStarted, gameOver]);

  // Load saved game state from localStorage on component mount
  useEffect(() => {
    if (!game?.id) return;
    
    const lsKey = `mcg_gameState_${game.id}`;
    const savedState = localStorage.getItem(lsKey);
    
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        const savedTimestamp = parsedState.timestamp || 0;
        const now = Date.now();
        
        // Only restore if saved within last 30 minutes and game was active
        if (now - savedTimestamp < 30 * 60 * 1000) {
          console.log('[MultipleChoiceGame] Restoring saved game state:', parsedState);
          
          setScore(parsedState.score || 0);
          setCurrentLevel(parsedState.currentLevel || 1);
          setLives(parsedState.lives || MAX_LIVES);
          setProblemsSolvedThisLevel(parsedState.problemsSolvedThisLevel || 0);
          setTimeLeft(parsedState.timeLeft || getLevelTime(parsedState.currentLevel || 1));
          setSelectedOption(parsedState.selectedOption || null);
          setCurrentQuestionIndex(parsedState.currentQuestionIndex || 0);
          
          // Restore questions if available
          if (parsedState.questions && parsedState.questions.length > 0) {
            setQuestions(parsedState.questions);
          }
          
          // Set game as started if we have valid state
          if (parsedState.score !== undefined && parsedState.lives > 0) {
            setGameStarted(true);
            setGameOver(false);
            console.log('[MultipleChoiceGame] Game restored and started');
          }
        } else {
          console.log('[MultipleChoiceGame] Saved state too old, clearing');
          localStorage.removeItem(lsKey);
        }
      } catch (error) {
        console.error('[MultipleChoiceGame] Error parsing saved state:', error);
        localStorage.removeItem(lsKey);
      }
    }
  }, [game?.id, MAX_LIVES]);

  // Save game state to localStorage during gameplay (not when game is over)
  useEffect(() => {
    const lsKey = `mcg_gameState_${game?.id}`;
    
    // Only save if game is active (started but not over)
    if (gameStarted && !gameOver && questions.length > 0) {
      const stateToSave = {
        score,
        currentLevel,
        lives,
        problemsSolvedThisLevel,
        timeLeft,
        selectedOption,
        currentQuestionIndex,
        questions: questions.slice(0, 10), // Save only first 10 questions to avoid localStorage size limits
        timestamp: Date.now()
      };
      console.log('[MultipleChoiceGame] Saving game state to localStorage:', stateToSave);
      localStorage.setItem(lsKey, JSON.stringify(stateToSave));
    } else if (gameOver) {
      // Clear saved state when game is over
      console.log('[MultipleChoiceGame] Game over, clearing saved state');
      localStorage.removeItem(lsKey);
    }
  }, [gameStarted, gameOver, score, currentLevel, lives, problemsSolvedThisLevel, timeLeft, selectedOption, currentQuestionIndex, questions.length, game?.id]);

  // Add fallback question generator
  const generateFallbackQuestions = (topic, count) => {
    console.log('[MultipleChoiceGame] generateFallbackQuestions called with:', { topic, count });
    
    const questions = [];
    const topicLower = topic.toLowerCase();
    
    for (let i = 0; i < count; i++) {
      let question, answer, options;
      
      if (topicLower.includes('fraction')) {
        // Basic fraction questions with proper calculation
        const numerators = [1, 2, 3, 4, 5];
        const denominators = [2, 3, 4, 5, 6];
        const num1 = numerators[Math.floor(Math.random() * numerators.length)];
        const den1 = denominators[Math.floor(Math.random() * denominators.length)];
        const num2 = numerators[Math.floor(Math.random() * numerators.length)];
        const den2 = denominators[Math.floor(Math.random() * denominators.length)];
        
        // Calculate correct answer using proper fraction addition
        const lcm = (a, b) => (a * b) / gcd(a, b);
        const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
        
        const commonDenominator = lcm(den1, den2);
        const newNum1 = num1 * (commonDenominator / den1);
        const newNum2 = num2 * (commonDenominator / den2);
        const resultNum = newNum1 + newNum2;
        
        // Simplify the fraction
        const divisor = gcd(resultNum, commonDenominator);
        const simplifiedNum = resultNum / divisor;
        const simplifiedDen = commonDenominator / divisor;
        
        question = `What is ${num1}/${den1} + ${num2}/${den2}?`;
        answer = `${simplifiedNum}/${simplifiedDen}`;
        
        // Generate wrong options
        const wrong1 = `${num1 + num2}/${den1}`;
        const wrong2 = `${num1 + num2}/${den1 + den2}`;
        const wrong3 = `${num1 * num2}/${den1 * den2}`;
        
        options = [answer, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
      } else if (topicLower.includes('multiply')) {
        // Basic multiplication
        const num1 = Math.floor(Math.random() * 12) + 1;
        const num2 = Math.floor(Math.random() * 12) + 1;
        question = `What is ${num1} × ${num2}?`;
        answer = (num1 * num2).toString();
        
        const wrong1 = (num1 + num2).toString();
        const wrong2 = (num1 - num2).toString();
        const wrong3 = (num1 * num2 + 1).toString();
        
        options = [answer, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
      } else if (topicLower.includes('add')) {
        // Basic addition
        const num1 = Math.floor(Math.random() * 50) + 1;
        const num2 = Math.floor(Math.random() * 50) + 1;
        question = `What is ${num1} + ${num2}?`;
        answer = (num1 + num2).toString();
        
        const wrong1 = (num1 - num2).toString();
        const wrong2 = (num1 * num2).toString();
        const wrong3 = (num1 + num2 + 1).toString();
        
        options = [answer, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
      } else if (topicLower.includes('subtract')) {
        // Basic subtraction
        const num1 = Math.floor(Math.random() * 50) + 50;
        const num2 = Math.floor(Math.random() * num1) + 1;
        question = `What is ${num1} - ${num2}?`;
        answer = (num1 - num2).toString();
        
        const wrong1 = (num1 + num2).toString();
        const wrong2 = (num1 * num2).toString();
        const wrong3 = (num1 - num2 - 1).toString();
        
        options = [answer, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
      } else {
        // Default to addition
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        question = `What is ${num1} + ${num2}?`;
        answer = (num1 + num2).toString();
        
        const wrong1 = (num1 - num2).toString();
        const wrong2 = (num1 * num2).toString();
        const wrong3 = (num1 + num2 + 1).toString();
        
        options = [answer, wrong1, wrong2, wrong3].sort(() => Math.random() - 0.5);
      }
      
      questions.push({
        id: `fallback-${Date.now()}-${i}`,
        question,
        answer,
        options,
        correctAnswer: answer,
        level: currentLevel
      });
    }
    
    console.log('[MultipleChoiceGame] Generated fallback questions:', questions.length);
    return questions;
  };

  // Main UI
  if (!game) {
    return <div className="text-center p-8 text-xl">Loading game data...</div>;
  }

  return (
    <div className="px-4 sm:px-6 game-container">
      <div className="mx-auto">
      <audio ref={audioRef} src="/game-bg-music.mp3" loop autoPlay style={{ display: 'none' }} />
      
      {/* Progress Modal - render at top level */}
      {showProgressModal && lastScoreData && (
        <LevelProgressionModal
          isOpen={showProgressModal}
          onClose={handleCloseProgressModal}
          scoreData={lastScoreData}
          gameName={game.name}
          gameId={game.id}
          maxGameLevel={MAX_LEVEL}
        />
      )}
      
      <div className={`w-full mx-auto flex flex-col items-center justify-center md:flex-grow`}>
        {!gameStarted && !gameOver && countdownModal === null && (
          <div className="text-center my-8 p-8 md:mt-36 rounded-2xl shadow-xl dark:bg-transparent sm:p-6 lg:p-8 flex flex-col min-h-[200px] sm:min-h-[260px] relative border border-white/10">
            <Header type="h1" fontSize="5xl" weight="semibold" className="text-yellow-500 py-3">
              {game?.name || 'Multiple Choice Game'}
            </Header>
            <p className="dark:text-gray-300 text-gray-900 mb-3">{game?.instructions || 'Choose the correct answer for each question!'}</p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex justify-center gap-2">
                <Button
                  onClick={toggleFullscreen}
                  variant="link"
                  size="sm"
                >
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </Button>
                <Button
                  onClick={() => {
                    if (onGameComplete) {
                      onGameComplete(null, { showLeaderboard: true });
                    }
                  }}
                  variant="link"
                  size="sm"
                >
                  View Leaderboard
                </Button>
                <Button
                  onClick={handleShowLevelSelector}
                  variant="link"
                  size="sm"
                >
                  View Level
                </Button>
              </div>
              <div className="">
                <Button
                  onClick={startGame}
                  variant="default"
                  size="sm"
                  rounded="full"
                  className="w-full"
                >
                  Start Game
                </Button>
              </div>
            </div>
          </div>
        )}
        
        {countdownModal !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="text-center">
              <h2 className="text-6xl font-bold text-white mb-4">Starting in</h2>
              <div className="text-8xl font-bold text-yellow-400 animate-pulse">
                {countdownModal}
              </div>
            </div>
          </div>
        )}
        
        {gameStarted && !gameOver && !isPaused && (
          <div className="flex flex-col lg:flex-row w-full gap-6">
            {/* Game Area - Full width on small screens, 3/4 on large screens */}
            <div className="w-full lg:w-3/4">
              <div className="relative w-full h-[calc(100vh-220px)] sm:h-[calc(100vh-200px)] lg:h-[calc(100vh-200px)] bg-gray-50 shadow-lg rounded-lg mb-4 overflow-hidden flex items-center justify-center">
                {currentQuestion && (
                  <div className="bg-blue-50 rounded-lg p-6 border-2 border-blue-200 w-full max-w-2xl mx-4">
                    <h3 className="text-xl font-bold mb-4 text-gray-800">Question: {currentQuestion.question}</h3>
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
                )}
              </div>
            </div>

            {/* Game Controls - Full width on small screens, 1/4 on large screens */}
            <div className="w-full lg:w-1/4">
              <div className="bg-gray-50 rounded-lg p-4 shadow-lg h-[calc(100vh-220px)] sm:h-[calc(100vh-200px)] lg:h-[calc(100vh-200px)] overflow-y-auto">
                <Header type="h3" variant="default" fontSize="2xl" className="mb-6 text-primary text-center">Game Controls</Header>
                
                {/* Level Info */}
                <div className="mb-4 p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-800">Current Level</div>
                    <div className="text-2xl font-bold text-yellow-500">{currentLevel}</div>
                  </div>
                </div>

                {/* Score */}
                <div className="mb-4 p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-800 flex items-center justify-center">
                      <FaStar className="mr-1 text-yellow-500" /> Score
                    </div>
                    <div className="text-2xl font-bold text-yellow-500">{score}</div>
                  </div>
                </div>

                {/* Lives */}
                <div className="mb-4 p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-800">Lives</div>
                    <div className="text-2xl text-red-500">{'❤️'.repeat(lives) || '💔'}</div>
                  </div>
                </div>

                {/* Progress */}
                <div className="mb-4 p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-800 mb-2">Progress</div>
                    <div className="w-full h-3 bg-gray-600 rounded-full overflow-hidden border border-gray-500">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${Math.min(100, (problemsSolvedThisLevel / PROBLEMS_PER_LEVEL) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-bold mt-1">{problemsSolvedThisLevel}/{PROBLEMS_PER_LEVEL}</div>
                  </div>
                </div>

                {/* Timer */}
                <div className="mb-4 p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-800">Time Left</div>
                    <div className="text-2xl font-bold text-blue-500">{timeLeft}s</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
            <button
                    onClick={handleShowLevelSelector}
                    className="w-full px-3 py-2 bg-blue-400 text-white rounded hover:bg-blue-600 text-sm font-medium"
            >
                    Change Level
            </button>
            <button
                    onClick={toggleSettingsModal} 
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium flex items-center justify-center"
                  >
                    <FaCog className="mr-2" size={14} /> Settings
                  </button>
                  <button 
                    onClick={togglePause} 
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium flex items-center justify-center"
                  >
                    {isPaused ? <><FaPlay className="mr-2" size={14}/> Resume</> : <><FaPause className="mr-2" size={14}/> Pause</>}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="w-full px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-sm font-medium flex items-center justify-center"
                  >
                    <BsFullscreen className="mr-2" size={14} />
                    {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {gameOver && (
          <div className="text-center md:mt-36 my-8 p-8 w-full max-w-md mx-auto rounded-2xl shadow-xl dark:bg-transparent sm:p-6 lg:p-8 flex flex-col relative border border-white/10">
            <Header type="h1" fontSize="5xl" weight="semibold" className="text-red-600 py-3">
              Game Over!
            </Header>
            <p className="dark:text-gray-300 text-gray-900 mb-3">Your final score: <span className="font-bold text-yellow-500">{score}</span></p>
            <div className="flex items-center justify-center gap-3">
              <Button
                onClick={startGame}
                variant="default"
                size="sm"
                rounded="full"
              >
                Play Again
              </Button>
              <Button
                onClick={() => { 
                  if (onGameComplete) {
                    onGameComplete(score);
                  }
                }}
                variant="cancel"
                size="sm"
                rounded="full"
              >
                Back to Games
              </Button>
            </div>
          </div>
        )}

        {isPaused && gameStarted && !gameOver && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-30">
            <div className="bg-gray-50 p-8 w-64 md:w-80 rounded-lg shadow-xl text-center">
              <Header type="h2" variant="default" fontSize="2xl" className="mb-8 text-primary text-center">Game Paused</Header>
              <div className="space-y-4">
                <button
                  onClick={togglePause}
                  className="w-full px-6 py-3 bg-blue-400 text-white rounded-lg text-lg font-bold hover:bg-blue-500 transition-colors flex items-center justify-center"
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
                  onClick={() => setShowRestartConfirmModal(true)}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg text-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FaRedo className="mr-2"/> Restart
                </button> 
                <button
                  onClick={() => {
                    setShowExitConfirmModal(true);
                  }}
                className="w-full px-6 py-3 bg-red-500 text-white rounded-lg text-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
                  data-testid="exit-button"
              >
                Exit Game
              </button>
               
              </div>
            </div>
          </div>
        )}

        {showSettingsModal && (
          <Modal
            isOpen={showSettingsModal}
            onClose={toggleSettingsModal}
            title="Settings"
            maxWidth="max-w-md"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-md">
                <span className="text-lg dark:text-gray-50 text-gray-900">Background Music</span>
                <button onClick={toggleMusic} className="p-2 rounded-full hover:bg-gray-500 transition-colors">
                  {musicEnabled ? <FaVolumeUp size={24} className="text-green-400"/> : <FaVolumeMute size={24} className="text-red-400"/>}
                </button>
              </div>
              <div className="flex items-center p-3 rounded-md">
                <span className="text-lg mr-4 dark:text-gray-50 text-gray-900">Volume</span>
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

              {isMultiplicationOrDivision && (
                  <button
                      onClick={() => { toggleTableModal(); setShowSettingsModal(false);}}
                      className="w-full px-4 py-2 bg-purple-500 text-white rounded-md text-lg hover:bg-purple-600 transition-colors flex items-center justify-center"
                  >
                      <FaTable className="mr-2"/> Show Multiplication Reference
                  </button>
              )}
            </div>
          </Modal>
        )}

        {isLoadingProblems && countdownModal === null && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          </div>
        )}

        {showLevelSelector && (
          <Modal
            isOpen={showLevelSelector}
            onClose={() => setShowLevelSelector(false)}
            title="Select Level"
            maxWidth="max-w-lg"
          >
            {loadingUnlockedLevels ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 mb-6">
                {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleLevelSelect(level)}
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
          </Modal>
        )}

        <Modal
          isOpen={showExitConfirmModal}
          onClose={handleStayOnPage}
          title="Leave Game?"
        >
          <p className="dark:text-gray-50 text-gray-700 mb-4">
            Your game progress is automatically saved, so you can continue later. Are you sure you want to leave the game now?
          </p>
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="cancel" rounded="full" onClick={handleExitGameConfirm}>
              Leave Game
            </Button>
            <Button variant="default" rounded="full" onClick={handleStayOnPage}>
              Stay on Game
            </Button>
          </div>
        </Modal>

        <Modal
          isOpen={showRestartConfirmModal}
          onClose={() => setShowRestartConfirmModal(false)}
          title="Restart Game?"
        >
          <p className="dark:text-gray-50 text-gray-700 mb-4">
            Restarting the game will clear your progress. Are you sure you want to restart?
          </p>
          <div className="mt-6 flex justify-end gap-4">
            <Button variant="cancel" rounded="full" onClick={() => setShowRestartConfirmModal(false)}>
              Cancel
            </Button>
            <Button variant="default" rounded="full" onClick={handleRestartConfirm}>
              Restart
            </Button>
          </div>
        </Modal>
      </div>
      </div>
    </div>
  );
};

export default MultipleChoiceGame; 

