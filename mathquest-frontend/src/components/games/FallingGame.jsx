import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { FaPlay, FaPause, FaCog, FaRedo, FaTable, FaVolumeUp, FaVolumeMute, FaStar } from 'react-icons/fa';
import { BsFullscreen } from "react-icons/bs";
import gameService from "../../services/gameService";
import LevelProgressionModal from "./LevelProgressionModal";
import Modal from '../../ui/modal';
import { Button } from '../../ui/button';
import { Header } from '../../ui/heading';
import logger from '../../services/logger';

// Groq API configuration with rate limiting
const GROQ_API_KEY = process.env.REACT_APP_GROQ_API_KEY;
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const RATE_LIMIT_WINDOW = 60000; // 1 minute in milliseconds
const MAX_CALLS_PER_WINDOW = 10;

// API state management
const apiState = {
  lastCallTime: 0,
  callCount: 0,
  problemsCache: new Map(),
  isGenerating: false
};

// Constants for game rules
const MAX_LEVEL = 10;
const PROBLEMS_PER_LEVEL = 10; // 10 problems per level for each multiplication table
const MAX_LIVES = 5;
const TOTAL_PROBLEMS = 50;

// Add these constants at the top with other constants
const BASE_FALL_TIME = 20000; // 20 seconds for level 1
const FALL_TIME_DECREASE_PER_LEVEL = 3000; // 3 seconds faster each level (gentler curve)
const BASE_ACTIVE_PROBLEMS = 2; // Start with 2 problems at level 1
const MAX_ACTIVE_PROBLEMS = 4;  // Maximum 4 problems at highest level
const MIN_VERTICAL_GAP = 30; // Minimum vertical gap between items (in percentage)
const MIN_HORIZONTAL_GAP = 20; // Minimum horizontal gap between items (in percentage)
const SPAWN_DELAY = 1000; // Delay between spawning new items (in milliseconds)

// Update getMinFallTime to never go below 4s and use a gentler curve
function getMinFallTime(level) {
  if (level >= 9) return 4000; // 4s for level 9-10
  if (level >= 7) return 5000; // 5s for level 7-8
  if (level >= 4) return 6000; // 6s for level 4-6
  return 7000; // 7s for level 1-3
}

const FallingGame = ({ game, onGameComplete }) => {
  const { currentUser, token } = useAuth();
  const [problems, setProblems] = useState([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [activeProblems, setActiveProblems] = useState([]);
  const [lives, setLives] = useState(MAX_LIVES);
  const gameAreaRef = useRef(null);
  const animationFrameRef = useRef(null);
  const lastSpawnTimeRef = useRef(0);
  const solvedProblemsRef = useRef(new Set()); // Track solved problems to prevent repetition
  const usedProblemsRef = useRef([]); // Track used problems for the current level
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0); // Add sequence tracking
  const [deductedProblems, setDeductedProblems] = useState(new Set()); // Track problems that have caused life deduction
  const [lastDeductionTime, setLastDeductionTime] = useState(0); // Track last deduction time
  const [showLevelTransition, setShowLevelTransition] = useState(false); // Show level transition animation
  const [isGeneratingProblems, setIsGeneratingProblems] = useState(false); // Show when generating new problems
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false); // Show congratulations modal
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // Track current question (0-9)
  const [questionsAnswered, setQuestionsAnswered] = useState(0); // Track total questions answered in current level

  // New states
  const [isPaused, setIsPaused] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [problemsSolvedThisLevel, setProblemsSolvedThisLevel] = useState(0);
  const [targetProblemsPerLevel, setTargetProblemsPerLevel] = useState(PROBLEMS_PER_LEVEL);
  const initialProblemGenerationDone = useRef(false);
  const [selectedTableForProblems, setSelectedTableForProblems] = useState('random');
  const [gameTime, setGameTime] = useState(0);

  // Note: Removed isLoadingProblems state as it was blocking the animation loop unnecessarily
  
  // Add new state for countdown
  const [countdown, setCountdown] = useState(null);
  
  // Add new state for showing progress modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [lastScoreData, setLastScoreData] = useState(null);
  
  // Add new state for showing level selector
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  
  // Add new state for processing falling items
  const processedItemsRef = useRef(new Set());

  // Add new states for fullscreen and exit confirmation
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [nextLocation, setNextLocation] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isRestoringGame, setIsRestoringGame] = useState(false);
  const [showRestartConfirmModal, setShowRestartConfirmModal] = useState(false);

  // Add state for unlocked levels
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const [loadingUnlockedLevels, setLoadingUnlockedLevels] = useState(false);

  // localStorage key for game state
  const lsKey = `fallingGame-${game?.id || 'default'}`;

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

  // Cache validation function
  const isCacheValid = useCallback((topic, level) => {
    const cacheKey = `${topic}-${level}`;
    const cached = apiState.problemsCache.get(cacheKey);
    return cached && cached.timestamp > Date.now() - 5 * 60 * 1000; // 5 minute cache
  }, []);

  // Updated difficulty ranges based on level
  const getDifficultyRanges = useCallback((level, topic) => {
    const topicLower = topic?.toLowerCase() || '';
    
    // Default ranges
    let ranges = {
      1: { min: 1, max: 10 },     // Level 1: Easy
      2: { min: 5, max: 15 },     // Level 2: Easy-Medium
      3: { min: 10, max: 20 },    // Level 3: Medium
      4: { min: 15, max: 30 },    // Level 4: Medium-Hard
      5: { min: 20, max: 50 }     // Level 5+: Hard
    };
    
    // Special handling for negative addition
    if (topicLower.includes('negative') && topicLower.includes('addition')) {
      ranges = {
        1: { min: -5, max: 5 },      // Level 1: Simple negative/positive
        2: { min: -10, max: 10 },    // Level 2: Wider range
        3: { min: -20, max: 20 },    // Level 3: More challenging
        4: { min: -30, max: 30 },    // Level 4: Advanced
        5: { min: -50, max: 50 }     // Level 5+: Hard
      };
    }
    
    // Get range for current level, defaulting to the highest defined level if beyond ranges
    const rangeLevel = Math.min(level, Object.keys(ranges).length);
    return ranges[rangeLevel] || ranges[Object.keys(ranges).length];
  }, []);

  // Add getPlaceholderText helper function
  const getPlaceholderText = useCallback(() => {
    const topic = game?.topic?.toLowerCase() || '';
    if (topic.includes('multiply')) {
      return "Type your answer (e.g. 42, 56)";
    } else if (topic.includes('divide') || topic.includes('division')) {
      return "Type your answer (e.g. 8, 12)";
    } else if (topic.includes('add') || topic.includes('addition')) {
      return "Type your answer (e.g. 15, 23)";
    } else if (topic.includes('subtract') || topic.includes('subtraction')) {
      return "Type your answer (e.g. 7, 18)";
    } else if (topic.includes('fraction')) {
      return "Type your answer (e.g. 1/2, 3/4)";
    }
    return "Type your answer";
  }, [game]);

  /**
   * Submits the player's score to the backend
   * @returns {Promise<void>}
   */
  const submitScore = useCallback(async () => {
    if (!currentUser || !game) {
      logger.error("Unable to submit score: User or game data missing");
      return;
    }

    // Don't submit zero scores
    if (score <= 0) {
      return;
    }

    // Mark that game is over and clear saved state
    hasLeftGameRef.current = true;
    localStorage.removeItem(lsKey);


    try {
      const currentDate = new Date().toISOString();
      const gameScoreData = {
        gameId: game.id,
        score: score,
        level: currentLevel,
        timeSpent: Math.floor(gameTime), // Changed from timeTaken to timeSpent to match gameService
        levelAchieved: currentLevel,
        playedAt: currentDate,
        studentId: currentUser.id,
        studentName: currentUser.name,
        studentUsername: currentUser.username,
        gameType: "FALLING_GAME",
        gameName: game.name,
        isHighScore: true
      };
      
      // First try the API submission
      try {
        const result = await gameService.submitGameScore(gameScoreData);
        
        // Save score data and show modal with properly formatted data
        setLastScoreData({
          ...result,
          playedAt: result.playedAt || currentDate, // Ensure we have a date
          score: parseInt(result.score || score), // Ensure score is a number
          levelAchieved: parseInt(result.levelAchieved || currentLevel) // Ensure level is a number
        });
        setShowProgressModal(true);
        
        if (onGameComplete) {
          // Pass the numeric score to avoid React child errors
          onGameComplete(parseInt(score));
        }
      } catch (apiError) {
        logger.error("API submission error", { error: apiError.message });
        // Backup: Store in localStorage if API fails
        const existingScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
        
        // Check if we already have a score for this game
        const gameScoreIndex = existingScores.findIndex(s => 
          s.gameId === game.id && s.studentId === currentUser.id
        );
        
        const newScoreData = {
          ...gameScoreData,
          id: Date.now(), // Temporary ID for local storage
          timestamp: currentDate,
          pending: true
        };
        
        // If we have a previous score, only update if new score is higher
        if (gameScoreIndex >= 0) {
          if (parseInt(existingScores[gameScoreIndex].score) < score) {
            existingScores[gameScoreIndex] = newScoreData;
          }
        } else {
          // No previous score, add new one
          existingScores.push(newScoreData);
        }
        
        localStorage.setItem('gameScores', JSON.stringify(existingScores));
        
        // Show modal with properly formatted data
        setLastScoreData(newScoreData);
        setShowProgressModal(true);
        
        if (onGameComplete) {
          onGameComplete(parseInt(score));
        }
      }
    } catch (error) {
      logger.error("Failed to save score", { error: error.message });
      toast.error("Failed to save your score. Please try again.");
    }
  }, [currentUser, game, score, currentLevel, gameTime, onGameComplete, lsKey]);

  const parseGroqApiContent = (content) => {
    // Remove markdown code block if present
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

  const callGroqApi = useCallback(async (topic, numberOfQuestions) => {
    // Check if API key is available
    if (!GROQ_API_KEY) {
      logger.warn('Groq API key not found. Please set REACT_APP_GROQ_API_KEY environment variable.');
      return null;
    }

    const now = Date.now();
    
    // Reset counter if we're in a new time window
    if (now - apiState.lastCallTime > RATE_LIMIT_WINDOW) {
      apiState.callCount = 0;
      apiState.lastCallTime = now;
    }

    // Check rate limit
    if (apiState.callCount >= MAX_CALLS_PER_WINDOW) {
      throw new Error('Rate limit exceeded. Please wait a moment before generating more problems.');
    }

    try {
      // Determine operation keyword for filtering
      const topicLower = topic.toLowerCase();
      let operationKeyword = '';
      if (topicLower.includes('multiply')) operationKeyword = 'multiply';
      else if (topicLower.includes('divide')) operationKeyword = 'divide';
      else if (topicLower.includes('add')) operationKeyword = 'add';
      else if (topicLower.includes('subtract')) operationKeyword = 'subtract';
      else if (topicLower.includes('fraction')) operationKeyword = 'fraction';
      else if (topicLower.includes('algebra')) operationKeyword = 'algebra';
      
      const requestPayload = {
        model: GROQ_MODEL,
        messages: [
          {
            role: "system",
            content: `You are an expert math problem generator for grade 4 students.\nCreate accurate, level-appropriate math problems with precise answers.\nFor each problem:\n- Ensure the difficulty matches grade 4 level\n- Format fractions properly (e.g., 1/2, 3/4)\n- For algebra, use simple variables (x, y)\n- For word problems, use clear, age-appropriate language`
          },
          {
            role: "user",
            content: `Generate ${numberOfQuestions} grade 4 math problems for the topic '${topic}'.\n\nIMPORTANT: Only generate problems for the topic '${topic}'. Do NOT include other types of problems.\nIf the topic is addition, only generate addition problems. If multiplication, only multiplication, etc.\n\nRespond ONLY with a JSON array where each object has:\n- 'question' (string): The math problem\n- 'answer' (string): The correct answer (simplified)\n- 'operation' (string): The mathematical operation used (e.g., 'addition', 'multiplication', 'division', 'subtraction', 'fraction', 'algebra')`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: false
      };

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        logger.error('Groq API Error Details', {
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          error: errorData
        });
        throw new Error(`Groq API error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      apiState.callCount++;
      apiState.lastCallTime = now;

      const data = await response.json();
      
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        logger.error('Invalid API Response Structure', { data });
        throw new Error('Invalid API response format');
      }

      try {
        const content = data.choices[0].message.content;
        const parsedContent = parseGroqApiContent(content);
        
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
              if (operationKeyword === 'fraction') return op.includes('fraction');
              if (operationKeyword === 'algebra') return op.includes('algebra');
              return false;
            });
          }
        } else if (parsedContent.problems) {
          filteredProblems = parsedContent.problems.filter(p => {
            if (!p.operation) return false;
            const op = p.operation.toLowerCase();
            if (operationKeyword === 'multiply') return op.includes('multiply');
            if (operationKeyword === 'divide') return op.includes('divide');
            if (operationKeyword === 'add') return op.includes('add');
            if (operationKeyword === 'subtract') return op.includes('subtract');
            if (operationKeyword === 'fraction') return op.includes('fraction');
            if (operationKeyword === 'algebra') return op.includes('algebra');
            return false;
          });
        }
        return filteredProblems;
      } catch (parseError) {
        logger.error('Error parsing Groq API response', { 
          parseError: parseError.message,
          content: data.choices[0].message.content 
        });
        throw new Error('Failed to parse API response');
      }
    } catch (error) {
      logger.error('Groq API error', { 
        error: error.message,
        status: error.response?.status 
      });
      if (error.message.includes('401')) {
        logger.error('Invalid Groq API key. Please check your REACT_APP_GROQ_API_KEY environment variable.');
      }
      throw error;
    }
  }, []);

  // Generate multiplication table problems for specific level
  const generateMultiplicationTableProblems = useCallback((level) => {
    const problems = [];
    const tableNumber = level; // Level 1 = Table of 1, Level 2 = Table of 2, etc.
    
    // Generate problems from tableNumber × 1 to tableNumber × 10
    for (let i = 1; i <= 10; i++) {
      const question = `${tableNumber} × ${i}`;
      const answer = (tableNumber * i).toString();
      
      problems.push({
        id: `table-${level}-${i}-${Date.now()}`,
        question: question,
        answer: answer,
        operation: 'multiplication',
        x: Math.random() * 80 + 10,
        y: -10 - (Math.random() * 20),
        speed: 0.3 + (0.1 * level),
        status: 'normal',
        level: level,
        sequenceIndex: i - 1,
        isSolved: false,
        isMissed: false
      });
    }
    
    // Shuffle the problems to randomize order
    return problems.sort(() => Math.random() - 0.5);
  }, []);

  const generateProblems = useCallback(async () => {
    if (!game?.id || !game?.topic || apiState.isGenerating) {
      logger.warn('Game, game ID, or topic not available yet');
      return;
    }
    
    // Set generating state immediately but don't block UI
    setIsGeneratingProblems(true);
    apiState.isGenerating = true;
    
    try {
      const cacheKey = `multiplication-table-${currentLevel}`;
      
      // Check cache first (synchronous)
      if (isCacheValid(`multiplication-table-${currentLevel}`, 'all')) {
        const cached = apiState.problemsCache.get(cacheKey);
        setProblems(cached.problems);
        setIsGeneratingProblems(false);
        apiState.isGenerating = false;
        return;
      }
      
      // Generate multiplication table problems for current level (synchronous)
      logger.info(`Generating multiplication table problems for Level ${currentLevel} (Table of ${currentLevel})`);
      const multiplicationProblems = generateMultiplicationTableProblems(currentLevel);
      
      // Cache the problems
      apiState.problemsCache.set(cacheKey, {
        problems: multiplicationProblems,
        timestamp: Date.now()
      });
      
      // Set problems immediately
      setProblems(multiplicationProblems);
      logger.info(`Generated ${multiplicationProblems.length} problems for Table of ${currentLevel}`);
      
    } catch (error) {
      logger.error('Error generating problems', { error: error.message });
      
      // Fall back to basic generation (synchronous)
      const diffRange = getDifficultyRanges(currentLevel, game.topic);
      const fallbackProblemCount = TOTAL_PROBLEMS;
      const newProblems = [];
      for (let i = 0; i < fallbackProblemCount; i++) {
        let num1 = Math.floor(Math.random() * (diffRange.max - diffRange.min + 1)) + diffRange.min;
        let num2 = Math.floor(Math.random() * (diffRange.max - diffRange.min + 1)) + diffRange.min;
        let problem = {};
        const problemId = `${Date.now()}-${i}-${Math.random()}`;
        const topicLower = game.topic?.toLowerCase() || 'unknown_topic';
        if ((topicLower.includes('divide') || topicLower.includes('division'))) {
          if (num2 === 0) num2 = 1;
          if (num1 === 0) num1 = num2 * (Math.floor(Math.random() * diffRange.max) + 1);
          const product = num1 * num2;
          problem = { id: problemId, question: `${product} ÷ ${num2}`, answer: num1.toString(), operation: 'division_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / 5) + 1 };
        } else if (topicLower.includes('negative') && topicLower.includes('add')) {
          const sign1 = Math.random() > 0.5 ? -1 : 1;
          const sign2 = Math.random() > 0.5 ? -1 : 1;
          const signedNum1 = num1 * sign1;
          const signedNum2 = num2 * sign2;
          problem = { id: problemId, question: `${signedNum1} + ${signedNum2}`, answer: (signedNum1 + signedNum2).toString(), operation: 'negative_addition', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / 5) + 1 };
        } else if (topicLower.includes('add') || topicLower.includes('addition')) {
          problem = { id: problemId, question: `${num1} + ${num2}`, answer: (num1 + num2).toString(), operation: 'addition_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / 5) + 1 };
        } else if (topicLower.includes('subtract') || topicLower.includes('subtraction')) {
          const [larger, smaller] = num1 >= num2 ? [num1, num2] : [num2, num1];
          problem = { id: problemId, question: `${larger} - ${smaller}`, answer: (larger - smaller).toString(), operation: 'subtraction_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / 5) + 1 };
        } else if (topicLower.includes('multiply') || topicLower.includes('multiplication')) {
          problem = { id: problemId, question: `${num1} × ${num2}`, answer: (num1 * num2).toString(), operation: 'multiplication_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / 5) + 1 };
        } else { 
          problem = { id: problemId, question: `${num1} + ${num2}`, answer: (num1 + num2).toString(), operation: 'addition_default_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / 5) + 1 };
        }
        newProblems.push(problem);
      }
      // Sort fallback problems by difficulty
      newProblems.sort((a, b) => {
        const sumAbs = q => (q.question.match(/-?\d+/g) || []).reduce((acc, n) => acc + Math.abs(Number(n)), 0);
        return sumAbs(a) - sumAbs(b);
      });
      setProblems(newProblems);
    } finally {
      // Clear generating state
      setIsGeneratingProblems(false);
      apiState.isGenerating = false;
    }
  }, [game, currentLevel, isCacheValid, generateMultiplicationTableProblems]);

  // Improved function to get non-overlapping positions for a batch
  function getNonOverlappingPositions(count, minXGap, minYGap) {
    // For 2-5 items, use fixed, evenly spaced X positions (randomized order)
    const fixedXSets = {
      2: [30, 70],
      3: [20, 50, 80],
      4: [15, 40, 65, 85],
      5: [10, 30, 55, 75, 90]
    };
    if (fixedXSets[count]) {
      // Shuffle the array to randomize order
      const shuffled = fixedXSets[count].slice().sort(() => Math.random() - 0.5);
      return shuffled.map((x, i) => ({ x, y: -20 - i * minYGap }));
    }
    // Fallback to random/grid for more than 5
    const positions = [];
    let attempts = 0;
    const maxAttempts = 100;
    while (positions.length < count && attempts < maxAttempts) {
      const x = Math.random() * 80 + 10;
      const y = -20 - Math.random() * 30;
      if (positions.every(pos => Math.abs(pos.x - x) >= minXGap && Math.abs(pos.y - y) >= minYGap)) {
        positions.push({ x, y });
      }
      attempts++;
    }
    // If not enough positions found, use even grid
    if (positions.length < count) {
      positions.length = 0;
      const xStep = (80 - (count - 1) * minXGap) / count;
      for (let i = 0; i < count; i++) {
        const x = 10 + i * (minXGap + xStep);
        const y = -20 - i * minYGap;
        positions.push({ x, y });
      }
    }
    return positions;
  }

  // Helper to get a non-overlapping Y (vertical gap)
  const getNonOverlappingY = (existingY) => {
    let newY;
    let attempts = 0;
    const maxAttempts = 20;
    
    do {
      // Start higher up for higher levels to give more time
      const startHeight = -20 - (currentLevel * 2);
      const range = 30 + (currentLevel * 2);
      newY = startHeight - (Math.random() * range);
      attempts++;
    } while (
      existingY.some(y => Math.abs(y - newY) < MIN_VERTICAL_GAP) && 
      attempts < maxAttempts
    );
    
    return newY;
  };

  // Define the getNonOverlappingX function
  const getNonOverlappingX = (existingX) => {
    let newX;
    let attempts = 0;
    const maxAttempts = 20;
    
    do {
      newX = Math.random() * 80 + 10; // Random x position between 10% and 90%
      attempts++;
    } while (
      existingX.some(x => Math.abs(x - newX) < MIN_HORIZONTAL_GAP) && 
      attempts < maxAttempts
    );
    
    return newX;
  };

  // Update calculateLevelTiming to use dynamic min fall time
  const calculateLevelTiming = useCallback((level) => {
    const minFallTime = getMinFallTime(level);
    const fallTime = Math.max(
      minFallTime,
      BASE_FALL_TIME - (FALL_TIME_DECREASE_PER_LEVEL * (level - 1))
    );
    const activeProblems = Math.min(
      MAX_ACTIVE_PROBLEMS,
      BASE_ACTIVE_PROBLEMS + Math.floor((level - 1) / 2)
    );
    const speed = 100 / (fallTime / 16.67); // Convert fall time to speed
    return { fallTime, activeProblems, speed };
  }, []);

  // Create refs for values that change frequently to prevent useEffect loops
  const currentLevelRef = useRef(currentLevel);
  const problemsRef = useRef(problems);
  const deductedProblemsRef = useRef(deductedProblems);
  const submitScoreRef = useRef(submitScore);
  const lastProblemSpawnTimeRef = useRef(Date.now());
  const stuckGameTimeoutRef = useRef(null);
  
  // Update refs when values change
  useEffect(() => {
    currentLevelRef.current = currentLevel;
  }, [currentLevel]);
  
  useEffect(() => {
    problemsRef.current = problems;
  }, [problems]);
  
  useEffect(() => {
    deductedProblemsRef.current = deductedProblems;
  }, [deductedProblems]);
  
  useEffect(() => {
    submitScoreRef.current = submitScore;
  }, [submitScore]);

  const levelUp = useCallback(() => {
    logger.info('Level up function called', { currentLevel, maxLevel: MAX_LEVEL });
    if (currentLevel >= MAX_LEVEL) {
      logger.info('Game completed - max level reached');
      
      // Show final "Good Job!" announcement for completing the entire game
      toast.success(`🏆 AMAZING! You completed all ${MAX_LEVEL} levels! 🏆`, { 
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #FFD700, #FFA500)',
          color: '#000000',
          fontSize: '18px',
          fontWeight: 'bold',
          padding: '20px 30px',
          borderRadius: '15px',
          boxShadow: '0 6px 20px rgba(255, 215, 0, 0.4)',
          border: '3px solid #FFD700'
        },
        iconTheme: {
          primary: '#000000',
          secondary: '#FFD700',
        }
      });
      
      setGameOver(true);
      submitScore();
      return;
    }
    
    const currentDate = new Date().toISOString();
    const gameScoreData = {
      gameId: game.id,
      score: score,
      level: currentLevel,
      timeSpent: Math.floor(gameTime),
      levelAchieved: currentLevel,
      playedAt: currentDate,
      studentId: currentUser?.id,
      studentName: currentUser?.name,
      studentUsername: currentUser?.username,
      gameType: "FALLING_GAME",
      gameName: game?.name,
      isHighScore: true,
      isLevelUp: true
    };
    
    gameService.submitGameScore(gameScoreData)
      .then(result => {
        setLastScoreData({
          ...result,
          playedAt: result.playedAt || currentDate,
          score: parseInt(result.score || score),
          levelAchieved: parseInt(result.levelAchieved || currentLevel)
        });
        const newLevel = currentLevel + 1;
        logger.info('Level completed, showing congratulations modal', { completedLevel: currentLevel, nextLevel: newLevel });
        
        // Show congratulations modal instead of immediately advancing
        setShowCongratulationsModal(true);
        
        // Clear all active problems
        setActiveProblems([]);
        setSpeedMultiplier(prev => prev + 0.2);
        setProblemsSolvedThisLevel(0);
        setTargetProblemsPerLevel(PROBLEMS_PER_LEVEL);
        const solvedIds = Array.from(solvedProblemsRef.current);
        usedProblemsRef.current = usedProblemsRef.current.filter(id => !solvedIds.includes(id));
      })
      .catch(error => {
        logger.error('Error submitting level completion', { error: error.message });
        toast.error('Failed to save level progress');
      });
  }, [currentUser, game, currentLevel, score, gameTime, submitScore]);

  // Add timeout mechanism to prevent game from getting stuck
  useEffect(() => {
    if (gameStarted && !gameOver && !isPaused) {
      // Clear existing timeout
      if (stuckGameTimeoutRef.current) {
        clearTimeout(stuckGameTimeoutRef.current);
      }
      
      // Set timeout to check if game is stuck (no problems spawning for 30 seconds)
      stuckGameTimeoutRef.current = setTimeout(() => {
        logger.warn('Game appears to be stuck - no problems spawning', {
          currentLevel,
          problemsSolved: problemsSolvedThisLevel,
          activeProblems: activeProblems.length,
          totalProblems: problems.length
        });
        
        // Force level up if we've solved at least 1 problem
        if (problemsSolvedThisLevel >= 1) {
          logger.info('Forcing level up due to stuck game');
          
          // Show "Good Job!" announcement for auto-level up
          toast.success(`🎉 Good Job! Level ${currentLevel} Complete! (Auto-advance) 🎉`, { 
            duration: 3000,
            style: {
              background: '#F59E0B',
              color: '#FFFFFF',
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '16px 24px',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
            },
            iconTheme: {
              primary: '#FFFFFF',
              secondary: '#F59E0B',
            }
          });
          
          levelUp();
        } else {
          // If no problems solved, try to regenerate problems
          logger.info('Regenerating problems due to stuck game');
          generateProblems();
        }
      }, 30000); // 30 seconds timeout
    }
    
    return () => {
      if (stuckGameTimeoutRef.current) {
        clearTimeout(stuckGameTimeoutRef.current);
      }
    };
  }, [gameStarted, gameOver, isPaused, currentLevel, problemsSolvedThisLevel, activeProblems.length, problems.length, levelUp, generateProblems]);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }
    
    const { fallTime, activeProblems: maxActiveProblems, speed } = calculateLevelTiming(currentLevelRef.current);
    
    // Animation loop
    const gameLoop = (timestamp) => {
      if (isPaused || gameOver || !gameStarted) return;
      
      setActiveProblems(prevActive => {
        const updated = prevActive.map(p => {
          const newY = p.y + speed;
          let status = p.status;
          if (newY >= 80 && status === 'normal') status = 'warning';
          return { ...p, y: newY, status };
        });
        
        // Separate the filtering and state updates to avoid multiple re-renders
        const itemsToRemove = [];
        const itemsToDeduct = [];
        
        const filtered = updated.filter(p => {
          if (p.y >= 100) {
            if (!processedItemsRef.current.has(p.id) && !deductedProblemsRef.current.has(p.id)) {
              itemsToRemove.push(p.id);
              itemsToDeduct.push(p.id);
            }
            return false;
          }
          return true;
        });
        
        // Handle missed questions
        if (itemsToDeduct.length > 0) {
          itemsToDeduct.forEach(id => {
            if (!processedItemsRef.current.has(id)) {
              processedItemsRef.current.add(id);
              handleMissedQuestion(id);
            }
          });
        }
        
        return filtered;
      });
      
      // Check if we need to spawn new problems
      setActiveProblems(prevActive => {
        if (prevActive.length < maxActiveProblems) {
        const currentTime = performance.now();
        const timeSinceLastSpawn = currentTime - lastSpawnTimeRef.current;
        
        if (timeSinceLastSpawn >= SPAWN_DELAY) {
            // Check if problems are available for current level
            const currentLevelProblems = problemsRef.current.filter(p => 
              p.level === currentLevelRef.current && 
            !solvedProblemsRef.current.has(p.id) && 
            !usedProblemsRef.current.includes(p.id)
          );
            
            logger.debug('Problem spawning check', {
              currentLevel: currentLevelRef.current,
              availableProblems: currentLevelProblems.length,
              totalProblems: problemsRef.current.length,
              solvedProblems: solvedProblemsRef.current.size,
              usedProblems: usedProblemsRef.current.length,
              activeProblems: prevActive.length,
              maxActiveProblems,
              isGenerating: apiState.isGenerating
            });
          
          // If problems are available, spawn them
          if (currentLevelProblems.length > 0) {
              const needed = maxActiveProblems - prevActive.length;
            // Use improved non-overlapping batch placement
            const positions = getNonOverlappingPositions(needed, MIN_HORIZONTAL_GAP, MIN_VERTICAL_GAP);
            const toAdd = currentLevelProblems.slice(0, needed).map((p, idx) => {
              return {
                ...p,
                y: positions[idx].y,
                status: 'normal',
                x: positions[idx].x,
                speed: speed
              };
            });
            usedProblemsRef.current.push(...toAdd.map(p => p.id));
            lastSpawnTimeRef.current = currentTime;
              return [...prevActive, ...toAdd];
            } else {
              // No more problems available for current level
              logger.warn('No more problems available for current level', {
                currentLevel: currentLevelRef.current,
                solvedCount: solvedProblemsRef.current.size,
                totalProblems: problemsRef.current.length,
                isGenerating: apiState.isGenerating
              });
              
              // If problems are still being generated, wait a bit longer
              if (apiState.isGenerating) {
                logger.debug('Problems still being generated, waiting...');
                return prevActive;
              }
              
              // Clear used problems to allow reuse
              usedProblemsRef.current = [];
              
              // Get all problems for current level (including solved ones)
              const allLevelProblems = problemsRef.current.filter(p => p.level === currentLevelRef.current);
              
              if (allLevelProblems.length > 0) {
                const needed = maxActiveProblems - prevActive.length;
                const positions = getNonOverlappingPositions(needed, MIN_HORIZONTAL_GAP, MIN_VERTICAL_GAP);
                const toAdd = allLevelProblems.slice(0, needed).map((p, idx) => {
                  return {
                    ...p,
                    y: positions[idx].y,
                    status: 'normal',
                    x: positions[idx].x,
                    speed: speed,
                    id: `${p.id}-reused-${Date.now()}` // New ID to avoid conflicts
                  };
                });
                usedProblemsRef.current.push(...toAdd.map(p => p.id));
                lastSpawnTimeRef.current = currentTime;
                return [...prevActive, ...toAdd];
              } else {
                // No problems available at all - force level up
                logger.warn('No problems available at all, forcing level up', {
                  currentLevel: currentLevelRef.current,
                  problemsSolved: problemsSolvedThisLevel
                });
                
                // Force level up if we've solved at least 1 problem
                if (problemsSolvedThisLevel >= 1) {
                  levelUp();
                }
              }
            }
          }
        }
        return prevActive;
      });
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameStarted, gameOver, isPaused, calculateLevelTiming]);


  const handleStayOnPage = () => {

    setNextLocation(null);
    setShowExitConfirmModal(false);
  };

  const handleRestartConfirm = () => {

    setShowRestartConfirmModal(false);
    // Clear saved state and restart fresh
    hasLeftGameRef.current = true;
    localStorage.removeItem(lsKey);
    setGameStarted(false);
    setActiveProblems([]);
    setProblems([]);
    setScore(0);
    setLives(MAX_LIVES);
    setCurrentLevel(1);
    setSpeedMultiplier(1);
    setProblemsSolvedThisLevel(0);
    setTargetProblemsPerLevel(PROBLEMS_PER_LEVEL);
    setGameOver(false);
    setIsPaused(false);
    setUserAnswer('');
    setGameTime(0);
    processedItemsRef.current = new Set();
    setDeductedProblems(new Set());
    initialProblemGenerationDone.current = false;
    apiState.isGenerating = false;
    solvedProblemsRef.current = new Set();
    usedProblemsRef.current = [];
    apiState.lastCallTime = 0;
    apiState.callCount = 0;
    setCountdown(3);
    generateProblems().then(() => {
      let count = 3;
      const countdownInterval = setInterval(() => {
        count--;
        setCountdown(count);
        if (count <= 0) {
          clearInterval(countdownInterval);
          setCountdown(null);
          setGameStarted(true);
          lastSpawnTimeRef.current = performance.now();
        }
      }, 1000);
    });
  };

  const handleExitGameConfirm = () => {

    setShowExitConfirmModal(false);
    setIsPaused(false); // Close the pause modal

    submitScore();
    setGameOver(true);
    setGameStarted(false);
    
    // Mark that user has left the game and clear saved state
    hasLeftGameRef.current = true;
    localStorage.removeItem(lsKey);

    
    // Navigate back to the previous page or classroom
    if (window.history.length > 1) {
  
      window.history.back();
    } else {
  
      // If no history, navigate to a default location
      window.location.href = '/student/classrooms';
    }
  };

  // Track if this is a page refresh vs returning from game over
  const isPageRefreshRef = useRef(true);
  const hasLeftGameRef = useRef(false);

  // Check if this is a page refresh on component mount
  useEffect(() => {
    const handleBeforeUnload = () => {
      logger.debug('[FallingGame] beforeunload detected - marking as page refresh');
      isPageRefreshRef.current = true;
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Check if we're returning from a completed game (not a refresh)
    const savedState = localStorage.getItem(lsKey);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // If the saved state shows game over or we've left the game, this is not a refresh
        if (parsed.gameOver || parsed.hasLeftGame) {
          logger.debug('[FallingGame] Detected game over or left game state - not a refresh');
          isPageRefreshRef.current = false;
          hasLeftGameRef.current = true;
        }
      } catch (error) {
        logger.error('Error parsing saved state:', error);
      }
    }
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [lsKey]);

  const startGame = () => {
    // Only load saved state if this is a page refresh AND the previous game didn't end
    const savedState = localStorage.getItem(lsKey);
    let savedScore = 0;
    let savedLevel = 1;
    let savedLives = MAX_LIVES;
    let savedProblemsSolved = 0;
    let savedGameTime = 0;
    let savedAnswers = '';
    let hasPreviousProgress = false;
    let shouldRestoreState = false;
    
    if (savedState && isPageRefreshRef.current && !hasLeftGameRef.current) {
      try {
        const parsed = JSON.parse(savedState);
        logger.debug('[FallingGame] Checking saved state:', {
          isPageRefresh: isPageRefreshRef.current,
          hasLeftGame: hasLeftGameRef.current,
          savedState: parsed
        });
        
        // Don't restore if the previous game ended
        if (parsed.gameOver) {
          logger.debug('[FallingGame] Previous game ended, not restoring state');
          shouldRestoreState = false;
          // Clear the saved state since game is over
          localStorage.removeItem(lsKey);
        } else {
          shouldRestoreState = true;
          savedScore = parsed.savedScore || 0;
          savedLevel = parsed.savedLevel || 1;
          savedLives = parsed.savedLives || MAX_LIVES;
          savedProblemsSolved = parsed.savedProblemsSolved || 0;
          savedGameTime = parsed.savedGameTime || 0;
          savedAnswers = parsed.savedAnswers || '';
          
          // Check if there was previous progress
          hasPreviousProgress = savedScore > 0 || savedLevel > 1;
          
          // Show notification if we restored saved state
          if (hasPreviousProgress) {
            logger.debug('[FallingGame] Restoring previous progress from page refresh');
            toast.success('Your previous progress has been restored!');
          }
        }
      } catch (error) {
        logger.error('Error parsing saved state:', error);
        localStorage.removeItem(lsKey);
        shouldRestoreState = false;
      }
    } else {
      logger.debug('[FallingGame] Not restoring progress:', {
        hasSavedState: !!savedState,
        isPageRefresh: isPageRefreshRef.current,
        hasLeftGame: hasLeftGameRef.current
      });
      shouldRestoreState = false;
    }

    // If we shouldn't restore state, use default values
    if (!shouldRestoreState) {
      savedScore = 0;
      savedLevel = 1;
      savedLives = MAX_LIVES;
      savedProblemsSolved = 0;
      savedGameTime = 0;
      savedAnswers = '';
      hasPreviousProgress = false;
    }

    setGameStarted(false);
    setActiveProblems([]);
    setProblems([]);
    setScore(savedScore);
    setLives(savedLives);
    setCurrentLevel(savedLevel);
    setSpeedMultiplier(1);
    setProblemsSolvedThisLevel(savedProblemsSolved);
    setTargetProblemsPerLevel(PROBLEMS_PER_LEVEL);
    setGameOver(false);
    setIsPaused(false);
    setUserAnswer(savedAnswers);
    setGameTime(savedGameTime);
    processedItemsRef.current = new Set(); // Reset processed items ref
    setDeductedProblems(new Set()); // Reset deducted problems
    initialProblemGenerationDone.current = false;
    apiState.isGenerating = false;
    solvedProblemsRef.current = new Set();
    usedProblemsRef.current = [];
    apiState.lastCallTime = 0;
    apiState.callCount = 0;
    
    // If there was previous progress, show loading and auto-start
    if (hasPreviousProgress) {
      setIsRestoringGame(true);
      generateProblems().then(() => {
        setIsRestoringGame(false);
        setGameStarted(true);
        lastSpawnTimeRef.current = performance.now();
      });
    } else {
      // Normal countdown for new game
      setCountdown(3);
      generateProblems().then(() => {
        let count = 3;
        const countdownInterval = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) {
            clearInterval(countdownInterval);
            setCountdown(null);
            setGameStarted(true);
            lastSpawnTimeRef.current = performance.now();
          }
        }, 1000);
      });
    }
  };

  let submitted = false;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitted) return;
    submitted = true;
    setTimeout(() => { submitted = false; }, 500);
    if (!userAnswer.trim() || isPaused || gameOver) return;
    
    // Find the current problem to answer
    const currentProblem = activeProblems.find(p => !p.isSolved && !p.isMissed);
    
    if (!currentProblem) {
      setUserAnswer('');
      return;
    }
    
    const normalizedAnswer = userAnswer.trim().replace(/\s+/g, '');
    const isCorrect = normalizedAnswer === currentProblem.answer;
    
    if (isCorrect) {
      // Correct answer
      setScore(prev => prev + (10 * currentLevel));
      setActiveProblems(prev => prev.map(p => 
        p.id === currentProblem.id ? { ...p, status: 'correct', isSolved: true } : p
      ));
      
      // Show "Good Job!" announcement
      toast.success(`✅ Good Job! +${10 * currentLevel} points!`, { 
        duration: 1500,
        style: {
          background: '#10B981',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
        }
      });
      
      // Remove the solved problem after animation
      setTimeout(() => {
        setActiveProblems(prev => prev.filter(p => p.id !== currentProblem.id));
      }, 300);
      
    } else {
      // Wrong answer - deduct life
      setLives(prev => {
        const newLives = prev - 1;
        if (newLives <= 0) {
          setGameOver(true);
          submitScore();
          return 0;
        }
        return newLives;
      });
      
      setActiveProblems(prev => prev.map(p => 
        p.id === currentProblem.id ? { ...p, status: 'incorrect', isMissed: true } : p
      ));
      
      // Show wrong answer feedback
      toast.error(`❌ Wrong! The answer is ${currentProblem.answer}`, { 
        duration: 2000,
        style: {
          background: '#EF4444',
          color: '#FFFFFF',
          fontSize: '14px',
          fontWeight: 'bold',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
        }
      });
      
      // Remove the wrong problem after animation
      setTimeout(() => {
        setActiveProblems(prev => prev.filter(p => p.id !== currentProblem.id));
      }, 300);
    }
    
    // Always increment questions answered
    setQuestionsAnswered(prev => {
      const newCount = prev + 1;
      
      // Check if level is complete (10 questions answered)
      if (newCount >= 10) {
        logger.info('Level completed - 10 questions answered', { 
          currentLevel, 
          questionsAnswered: newCount 
        });
        
        // Show congratulations modal
        setShowCongratulationsModal(true);
        setActiveProblems([]); // Clear all active problems
        
        return 0; // Reset for next level
      }
      
      return newCount;
    });
    
    setUserAnswer('');
  };

  // Handle missed questions (when problems fall off screen)
  const handleMissedQuestion = useCallback((problemId) => {
    logger.debug('Question missed', { problemId, currentLevel });
    
    // Deduct life for missed question
    setLives(prev => {
      const newLives = prev - 1;
      if (newLives <= 0) {
        setGameOver(true);
        submitScore();
        return 0;
      }
      return newLives;
    });
    
    // Mark as missed and remove from active problems
    setActiveProblems(prev => prev.filter(p => p.id !== problemId));
    
    // Always increment questions answered (even if missed)
    setQuestionsAnswered(prev => {
      const newCount = prev + 1;
      
      // Check if level is complete (10 questions answered)
      if (newCount >= 10) {
        logger.info('Level completed - 10 questions answered (including missed)', { 
          currentLevel, 
          questionsAnswered: newCount 
        });
        
        // Show congratulations modal
        setShowCongratulationsModal(true);
        setActiveProblems([]); // Clear all active problems
        
        return 0; // Reset for next level
      }
      
      return newCount;
    });
    
    // Show missed question feedback
    toast(`⏰ Question missed! -1 life`, { 
      duration: 2000,
      style: {
        background: '#F59E0B',
        color: '#FFFFFF',
        fontSize: '14px',
        fontWeight: 'bold',
        padding: '12px 20px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.3)'
      },
      icon: '⚠️'
    });
  }, [currentLevel, submitScore]);
  
  const togglePause = () => {
    if (gameOver || !gameStarted) return;
    setIsPaused(prevPaused => {
        const newPausedState = !prevPaused;
        if (newPausedState) {
        } else {
            lastSpawnTimeRef.current = performance.now() - (Math.max(1000, 3000 - currentLevel * 150) / speedMultiplier);
        }
        return newPausedState;
    });
  };

  const toggleSettingsModal = () => setShowSettingsModal(prev => !prev);
  const toggleTableModal = () => {
    if (game?.topic?.toLowerCase().includes('multiply') || game?.topic?.toLowerCase().includes('division')) {
        setShowTableModal(prev => !prev);
    } else {
        toast.error("Multiplication table is only available for multiplication or division topics.");
    }
  }
  const toggleMusic = () => setMusicEnabled(prev => !prev);

  const isMultiplicationOrDivision = game?.topic?.toLowerCase().includes('multiply') || game?.topic?.toLowerCase().includes('division');

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

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
    setLastScoreData(null);
  };

  // Update the handleLevelSelect function
  const handleLevelSelect = (selectedLevel) => {
    // Close the level selector modal
    setShowLevelSelector(false);
    
    // Reset all game state immediately
    setCurrentLevel(selectedLevel);
    setProblemsSolvedThisLevel(0);
    setActiveProblems([]);
    setScore(0);
    setLives(MAX_LIVES);
    setSpeedMultiplier(1);
    setUserAnswer('');
    setGameTime(0);
    setIsPaused(false);
    setGameOver(false);
    setQuestionsAnswered(0);
    setCurrentQuestionIndex(0);
    
    // Reset refs immediately
    processedItemsRef.current = new Set();
    setDeductedProblems(new Set());
    solvedProblemsRef.current = new Set();
    usedProblemsRef.current = [];
    lastSpawnTimeRef.current = performance.now();
    
    // Start game immediately and generate problems in background
    setGameStarted(true);
    
    // Generate problems asynchronously without blocking
    generateProblems();
  };

  const handleExitGame = () => {
    submitScore();
    setGameOver(true);
    setGameStarted(false);
  };

  // Save state to localStorage whenever it changes (debounced)
  const saveTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (gameStarted && !showProgressModal) {
      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce the save operation to avoid excessive localStorage writes
      saveTimeoutRef.current = setTimeout(() => {
      const stateToSave = {
        savedScore: score,
        savedLevel: currentLevel,
        savedLives: lives,
        savedProblemsSolved: problemsSolvedThisLevel,
        savedGameTime: gameTime,
        savedAnswers: userAnswer,
        gameOver: gameOver, // Track if game is over
        hasLeftGame: hasLeftGameRef.current, // Track if user has left the game
        lastSaved: new Date().toISOString()
      };
        
        try {
      localStorage.setItem(lsKey, JSON.stringify(stateToSave));
      setHasUnsavedChanges(false);
        } catch (error) {
          logger.error('Failed to save game state to localStorage', { error: error.message });
        }
      }, 500); // 500ms debounce
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [score, currentLevel, lives, problemsSolvedThisLevel, gameTime, userAnswer, lsKey, gameStarted, showProgressModal, gameOver]);

  // Track unsaved changes
  useEffect(() => {
    if (gameStarted && !gameOver) {
      setHasUnsavedChanges(true);
    }
  }, [score, currentLevel, lives, problemsSolvedThisLevel, gameTime, userAnswer, gameStarted, gameOver]);

  // Handle beforeunload event (page refresh/close)
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (gameStarted && !gameOver) {
        logger.debug('[FallingGame] beforeunload event triggered - game is active, showing confirmation');
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
      logger.debug('[FallingGame] beforeunload event triggered - game not active, allowing navigation');
    };

    const handlePopState = (e) => {
      if (gameStarted && !gameOver) {
        logger.debug('[FallingGame] popstate event triggered - game is active, preventing navigation');
        e.preventDefault();
        setNextLocation(window.location.href);
        setShowExitConfirmModal(true);
        window.history.pushState(null, '', window.location.href);
      } else {
        logger.debug('[FallingGame] popstate event triggered - game not active, allowing navigation');
      }
    };

    if (gameStarted && !gameOver) {
      logger.debug('[FallingGame] Adding navigation protection - game is active');
      window.addEventListener('beforeunload', handleBeforeUnload);
      window.addEventListener('popstate', handlePopState);
      window.history.pushState(null, '', window.location.href);
    } else {
      logger.debug('[FallingGame] Removing navigation protection - game not active');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    }

    return () => {
      logger.debug('[FallingGame] Cleanup: removing navigation event listeners');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [gameStarted, gameOver]);

  // Handle navigation attempts (sidebar/navbar clicks)
  useEffect(() => {
    const handleNavigationAttempt = (e) => {
      if (gameStarted && !gameOver) {
        logger.debug('[FallingGame] Navigation attempt detected:', {
          target: e.target,
          href: e.target.href,
          tagName: e.target.tagName,
          className: e.target.className
        });
        e.preventDefault();
        e.stopPropagation();
        setNextLocation(e.target.href || e.target.getAttribute('href'));
        setShowExitConfirmModal(true);
      } else {
        logger.debug('[FallingGame] Navigation attempt detected - game not active, allowing navigation');
      }
    };

    if (gameStarted && !gameOver) {
      logger.debug('[FallingGame] Adding navigation attempt listeners - game is active');
      // Listen for clicks on navigation elements
      const handleClick = (e) => {
        // Check for various navigation elements
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
            logger.debug('[FallingGame] Navigation element clicked:', {
              element: target,
              href: href,
              tagName: target.tagName,
              className: target.className
            });
            handleNavigationAttempt(e);
          }
        }
      };
      
      document.addEventListener('click', handleClick, true);
      
      return () => {
        logger.debug('[FallingGame] Cleanup: removing navigation attempt listeners');
        document.removeEventListener('click', handleClick, true);
      };
    }

    return () => {
      logger.debug('[FallingGame] Cleanup: removing navigation attempt listeners');
    };
  }, [gameStarted, gameOver]);

  const handleLeavePage = () => {
    logger.debug('[FallingGame] Leave Page confirmed - navigating to:', nextLocation);
    if (nextLocation) {
      window.location.href = nextLocation;
    }
    setShowExitConfirmModal(false);
    setNextLocation(null);
  };

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
        // Hide navbar and sidebar in fullscreen
        document.body.classList.add('fullscreen-mode');
      }).catch(err => {
        logger.error('Error attempting to enable fullscreen:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        // Show navbar and sidebar when exiting fullscreen
        document.body.classList.remove('fullscreen-mode');
      }).catch(err => {
        logger.error('Error attempting to exit fullscreen:', err);
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
      // Clean up on unmount
      document.body.classList.remove('fullscreen-mode');
    };
  }, []);

  // Add function to fetch unlocked levels
  const fetchUnlockedLevels = useCallback(async () => {
    if (!currentUser || !game?.id) return;
    
    setLoadingUnlockedLevels(true);
    try {
      const levelData = await gameService.getStudentGameLevel(game.id, currentUser.id);
      let unlockedLevel = 1;
      
      if (typeof levelData === 'object' && levelData !== null) {
        unlockedLevel = levelData.level_achieved || levelData.level || 1;
      } else if (typeof levelData === 'number') {
        unlockedLevel = levelData;
      }
      
      setUnlockedLevels(Math.min(unlockedLevel, MAX_LEVEL));
    } catch (error) {
      logger.error('Error fetching unlocked levels:', error);
      setUnlockedLevels(1);
    } finally {
      setLoadingUnlockedLevels(false);
    }
  }, [currentUser, game]);

  // Update the level selector modal to fetch unlocked levels when opened
  const handleShowLevelSelector = () => {
    setShowLevelSelector(true);
    fetchUnlockedLevels();
  };

  // Handle congratulations modal - continue to next level
  const handleContinueToNextLevel = () => {
    setShowCongratulationsModal(false);
    const newLevel = currentLevel + 1;
    
    // Reset counters for new level immediately
    setQuestionsAnswered(0);
    setCurrentQuestionIndex(0);
    setProblemsSolvedThisLevel(0);
    setActiveProblems([]);
    
    // Reset refs immediately
    processedItemsRef.current = new Set();
    setDeductedProblems(new Set());
    solvedProblemsRef.current = new Set();
    usedProblemsRef.current = [];
    lastSpawnTimeRef.current = performance.now();
    
    // Set new level immediately
    setCurrentLevel(newLevel);
    
    // Show brief level transition animation (reduced from 2s to 1s)
    setShowLevelTransition(true);
    
    // Hide transition after shorter animation
    setTimeout(() => {
      setShowLevelTransition(false);
    }, 1000);
    
    toast.success(`Starting Table of ${newLevel}...`, { duration: 1500 });
    
    // Generate problems immediately without waiting
    generateProblems();
  };

  // Handle congratulations modal - exit game
  const handleExitAfterLevel = () => {
    setShowCongratulationsModal(false);
    if (onGameComplete) {
      onGameComplete(score);
    }
  };

  // Main UI
  if (!game) {
    return <div className="text-center p-8 text-xl">Loading game data...</div>;
  }

  return (
    <div className="px-2 sm:px-4 md:px-6 game-container max-w-7xl mx-auto">
      <div className="w-full">
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
        {!gameStarted && !gameOver && countdown === null && (
          <div className="text-center my-8 p-8  md:mt-36 rounded-2xl shadow-xl dark:bg-transparent sm:p-6 lg:p-8 flex flex-col min-h-[200px] sm:min-h-[260px] relative border border-white/10 ">
            <Header type="h1" fontSize="5xl"  weight="semibold" className="text-yellow-500 py-3 ">
              {game?.name || 'Falling Math Game'}
            </Header>
            <p className="dark:text-gray-300 text-gray-900 mb-3">{game?.instructions || 'Solve the math problems before they fall off the screen!'}</p>
            <div className="flex flex-col items-center gap-3">
              <div className="flex justify-center gap-2">
                <Button
                  onClick={toggleFullscreen}
                  variant="link"
                  size="sm"
                >
                  {/* <BsFullscreen className="mr-2" /> */}
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
        
        {countdown !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="text-center">
              <h2 className="text-6xl font-bold text-white mb-4">Starting in</h2>
              <div className="text-8xl font-bold text-yellow-400 animate-pulse">
                {countdown}
              </div>
            </div>
          </div>
        )}
        
        {showLevelTransition && (
          <div className="fixed inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center z-50 p-4">
            <div className="text-center animate-bounce w-full max-w-md sm:max-w-lg">
              <div className="text-4xl sm:text-6xl md:text-8xl mb-4 sm:mb-6">🎉</div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-3 sm:mb-4">Level Up!</h2>
              <div className="text-xl sm:text-2xl md:text-4xl font-bold text-yellow-300 mb-2">
                Table of {currentLevel} → Table of {currentLevel + 1}
              </div>
              <div className="text-base sm:text-lg md:text-2xl text-white opacity-90 mb-4">
                Get ready for new challenges!
              </div>
              
              {/* Total Progress in Level Transition - Responsive */}
              <div className="inline-flex flex-col sm:flex-row items-center bg-white bg-opacity-20 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg w-full sm:w-auto">
                <div className="flex items-center mb-2 sm:mb-0">
                  <span className="text-lg sm:text-xl md:text-2xl font-bold mr-2 sm:mr-3">🏆</span>
                  <span className="text-sm sm:text-base md:text-xl font-bold">Total Progress: {currentLevel + 1}/{MAX_LEVEL} Levels</span>
                </div>
                <div className="w-16 sm:w-20 md:w-24 bg-white bg-opacity-20 rounded-full h-2 sm:h-3 sm:ml-4">
                  <div 
                    className="bg-yellow-300 h-2 sm:h-3 rounded-full transition-all duration-500"
                    style={{ width: `${((currentLevel + 1) / MAX_LEVEL) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Congratulations Modal */}
        {showCongratulationsModal && (
          <div className="fixed inset-0 bg-gradient-to-br from-green-600 via-blue-600 to-purple-600 flex items-center justify-center z-50 p-4">
            <div className="text-center animate-bounce w-full max-w-md sm:max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
              <div className="text-4xl sm:text-6xl mb-4">🎉</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Congratulations!
              </h2>
              <div className="text-lg sm:text-xl font-bold text-blue-600 mb-2">
                You completed Table of {currentLevel}!
              </div>
              <div className="text-sm sm:text-base text-gray-600 mb-6">
                You solved all 10 problems correctly! 🏆
              </div>
              
              <div className="space-y-3 sm:space-y-4">
                <button
                  onClick={handleContinueToNextLevel}
                  className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-lg text-base sm:text-lg font-bold hover:from-green-600 hover:to-blue-600 transition-all duration-300 flex items-center justify-center"
                >
                  <span className="mr-2">➡️</span>
                  Continue to Table of {currentLevel + 1}
                </button>
                <button
                  onClick={handleExitAfterLevel}
                  className="w-full px-6 py-3 bg-gray-500 text-white rounded-lg text-base sm:text-lg font-bold hover:bg-gray-600 transition-colors flex items-center justify-center"
                >
                  <span className="mr-2">🏠</span>
                  Exit Game
                </button>
              </div>
            </div>
          </div>
        )}
        
        {isRestoringGame && (
          <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-white mb-2">Loading...</h2>
              <p className="text-lg text-gray-300">Getting back from the previous game</p>
            </div>
          </div>
        )}
        
        {gameStarted && !gameOver && !isPaused && (
          <div className="flex flex-col xl:flex-row w-full gap-4 lg:gap-6">
            {/* Game Area - Full width on small/medium screens, 3/4 on large screens */}
            <div className="w-full xl:w-3/4">
              {/* Level Indicator - Responsive */}
              <div className="mb-3 sm:mb-4 text-center px-2">
                <div className="inline-flex flex-col sm:flex-row items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg w-full sm:w-auto">
                  <div className="flex items-center mb-1 sm:mb-0">
                    <span className="text-lg sm:text-2xl font-bold mr-2">🎯</span>
                    <span className="text-lg sm:text-xl font-bold">Table of {currentLevel}</span>
                  </div>
                  <span className="text-xs sm:text-sm bg-white bg-opacity-20 px-2 sm:px-3 py-1 rounded-full sm:ml-4">
                    {questionsAnswered}/10 Questions Answered
                  </span>
                </div>
                
                {/* Total Progress Indicator - Responsive */}
                <div className="mt-2">
                  <div className="inline-flex flex-col sm:flex-row items-center bg-gradient-to-r from-green-500 to-teal-500 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg w-full sm:w-auto">
                    <div className="flex items-center mb-1 sm:mb-0">
                      <span className="text-sm sm:text-lg font-bold mr-2">🏆</span>
                      <span className="text-xs sm:text-sm font-bold">Total Progress: {currentLevel}/{MAX_LEVEL} Levels</span>
                    </div>
                    <div className="w-16 sm:w-20 bg-white bg-opacity-20 rounded-full h-2 sm:ml-3">
                      <div 
                        className="bg-white h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(currentLevel / MAX_LEVEL) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Problem Generation Indicator - Responsive */}
              {isGeneratingProblems && (
                <div className="mb-3 sm:mb-4 text-center px-2">
                  <div className="inline-flex flex-col sm:flex-row items-center bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 sm:px-6 py-2 sm:py-3 rounded-full shadow-lg animate-pulse w-full sm:w-auto">
                    <div className="flex items-center mb-1 sm:mb-0">
                      <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-b-2 border-white mr-2 sm:mr-3"></div>
                      <span className="text-sm sm:text-lg font-bold">Generating New Problems for Level {currentLevel}...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div
                ref={gameAreaRef}
                className="relative w-full h-[calc(100vh-320px)] sm:h-[calc(100vh-300px)] md:h-[calc(100vh-280px)] lg:h-[calc(100vh-260px)] bg-gray-50 shadow-lg rounded-lg mb-4 overflow-hidden"
              >
                {activeProblems.map(problem => {
                  let bgColor = "from-pink-500 to-purple-600";
                  let borderColor = "border-pink-300";
                  
                  // Visual feedback based on status and sequence
                  if (problem.status === 'correct') {
                    bgColor = "from-green-500 to-green-600";
                    borderColor = "border-green-300";
                  } else if (problem.status === 'incorrect') {
                    bgColor = "from-red-500 to-red-600";
                    borderColor = "border-red-300";
                  } else if (problem.status === 'warning') {
                    bgColor = "from-orange-500 to-orange-600";
                    borderColor = "border-orange-300";
                  } else if (problem.sequenceIndex === currentSequenceIndex) {
                    // Highlight current sequence problem
                    bgColor = "from-blue-500 to-blue-600";
                    borderColor = "border-blue-300";
                  }
                  
                  return (
                    <div
                      key={problem.id}
                      className={`absolute px-2 py-1 sm:px-3 sm:py-2 md:px-4 md:py-3 bg-gradient-to-br ${bgColor} text-white rounded-lg shadow-lg border-2 ${borderColor} transform transition-transform duration-100 hover:scale-110`}
                      style={{
                        left: `${problem.x}%`,
                        top: `${problem.y}%`,
                        transform: 'translate(-50%, -50%)',
                        fontSize: problem.question.length > 10 ? '0.75rem' : '0.875rem',
                        fontWeight: 'bold',
                        minWidth: '60px',
                        textAlign: 'center',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                      }}
                    >
                      <span className="font-bold text-xs sm:text-sm md:text-base">{problem.question}</span>
                    </div>
                  );
                })}
              </div>
              
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row items-center w-full mt-auto mb-4 px-2 sm:px-0 gap-2 sm:gap-0">
                <input
                  type="text"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  className="flex-1 w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-3 bg-white text-gray-900 border-2 border-blue-400 rounded-md sm:rounded-l-md sm:rounded-r-none focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500 text-sm sm:text-lg"
                  placeholder={getPlaceholderText()}
                  autoFocus
                  disabled={isPaused || gameOver}
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 h-10 sm:h-14 text-white bg-gradient-to-b from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] hover:opacity-70 dark:text-white dark:bg-gradient-to-b dark:from-[#18C8FF] dark:via-[#4B8CFF] dark:to-[#6D6DFF] dark:hover:opacity-70 rounded-md sm:rounded-l-none sm:rounded-r-md text-sm sm:text-base font-medium"
                  disabled={isPaused || gameOver || !userAnswer.trim()}
                >
                  Submit
                </button>
              </form>
            </div>

            {/* Game Controls - Responsive */}
            <div className="w-full xl:w-1/4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 shadow-lg h-fit">
                <Header type="h3" variant="default" fontSize="xl" className="mb-4 sm:mb-6 text-primary text-center">Game Controls</Header>
                
                {/* Stats Grid - Responsive */}
                <div className="grid grid-cols-3 xl:grid-cols-1 gap-2 sm:gap-4 mb-4">
                {/* Level Info */}
                  <div className="p-2 sm:p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                      <div className="text-xs sm:text-sm text-gray-800">Level</div>
                      <div className="text-lg sm:text-2xl font-bold text-yellow-500">{currentLevel}</div>
                  </div>
                </div>

                {/* Score */}
                  <div className="p-2 sm:p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                      <div className="text-xs sm:text-sm text-gray-800 flex items-center justify-center">
                        <FaStar className="mr-1 text-yellow-500 text-xs sm:text-sm" /> Score
                    </div>
                      <div className="text-lg sm:text-2xl font-bold text-yellow-500">{score}</div>
                  </div>
                </div>

                {/* Lives */}
                  <div className="p-2 sm:p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                      <div className="text-xs sm:text-sm text-gray-800">Lives</div>
                      <div className="text-lg sm:text-2xl text-red-500">{'❤️'.repeat(lives) || '💔'}</div>
                    </div>
                  </div>
                </div>

                {/* Progress - Hidden on mobile, shown on larger screens */}
                <div className="hidden xl:block mb-4 p-3 bg-gray-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-800 mb-2">Progress</div>
                    <div className="w-full h-3 bg-gray-600 rounded-full overflow-hidden border border-gray-500">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300 ease-in-out"
                        style={{ width: `${Math.min(100, (problemsSolvedThisLevel / targetProblemsPerLevel) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-sm font-bold mt-1">{problemsSolvedThisLevel}/{targetProblemsPerLevel}</div>
                  </div>
                </div>

                {/* Action Buttons - Responsive Grid */}
                <div className="grid grid-cols-2 xl:grid-cols-1 gap-2 xl:space-y-2 xl:space-y-0">
                  <button
                    onClick={handleShowLevelSelector}
                    className="w-full px-2 sm:px-3 py-2 bg-blue-400 text-white rounded hover:bg-blue-600 text-xs sm:text-sm font-medium"
                  >
                    <span className="hidden sm:inline">Change Level</span>
                    <span className="sm:hidden">Level</span>
                  </button>
                  <button 
                    onClick={toggleSettingsModal} 
                    className="w-full px-2 sm:px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-xs sm:text-sm font-medium flex items-center justify-center"
                  >
                    <FaCog className="mr-1 sm:mr-2" size={12} />
                    <span className="hidden sm:inline">Settings</span>
                  </button>
                  <button 
                    onClick={togglePause} 
                    className="w-full px-2 sm:px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs sm:text-sm font-medium flex items-center justify-center"
                  >
                    {isPaused ? <><FaPlay className="mr-1 sm:mr-2" size={12}/> <span className="hidden sm:inline">Resume</span><span className="sm:hidden">Play</span></> : <><FaPause className="mr-1 sm:mr-2" size={12}/> <span className="hidden sm:inline">Pause</span><span className="sm:hidden">Stop</span></>}
                  </button>
                  <button
                    onClick={toggleFullscreen}
                    className="w-full px-2 sm:px-3 py-2 bg-blue-700 text-white rounded hover:bg-blue-800 text-xs sm:text-sm font-medium flex items-center justify-center"
                  >
                    <BsFullscreen className="mr-1 sm:mr-2" size={12} />
                    <span className="hidden sm:inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                    <span className="sm:hidden">Full</span>
                  </button>
                  <button
                    onClick={() => {
                      logger.info('Manual level skip triggered by user');
                      
                      // Show "Good Job!" announcement for manual skip
                      toast.success(`🎉 Good Job! Level ${currentLevel} Complete! (Manual Skip) 🎉`, { 
                        duration: 3000,
                        style: {
                          background: '#8B5CF6',
                          color: '#FFFFFF',
                          fontSize: '16px',
                          fontWeight: 'bold',
                          padding: '16px 24px',
                          borderRadius: '12px',
                          boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)'
                        },
                        iconTheme: {
                          primary: '#FFFFFF',
                          secondary: '#8B5CF6',
                        }
                      });
                      
                      levelUp();
                    }}
                    className="w-full px-2 sm:px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-xs sm:text-sm font-medium flex items-center justify-center col-span-2 xl:col-span-1"
                    title="Skip to next level (emergency use)"
                  >
                    <FaRedo className="mr-1 sm:mr-2" size={12} />
                    <span className="hidden sm:inline">Skip Level</span>
                    <span className="sm:hidden">Skip</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {gameOver && (
          <div className="text-center md:mt-36 my-8 p-8 w-full max-w-md mx-auto rounded-2xl shadow-xl dark:bg-transparent sm:p-6 lg:p-8 flex flex-col relative border border-white/10 ">
            <Header type="h1" fontSize="5xl"  weight="semibold" className="text-red-600 py-3 ">
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
                    // For the "Back to Games" button, just pass the score number
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
          <div className="fixed inset-0 bg-black bg-opacity-80 flex flex-col items-center justify-center z-30 p-4">
            <div className="bg-gray-50 p-4 sm:p-6 md:p-8 w-full max-w-sm sm:max-w-md md:max-w-lg rounded-lg shadow-xl text-center">
              <Header type="h2" variant="default" fontSize="xl" className="mb-3 sm:mb-4 text-primary text-center">Game Paused</Header>
              
              {/* Level Indicator in Pause Screen - Responsive */}
              <div className="mb-4 sm:mb-6 space-y-2">
                <div className="inline-flex flex-col sm:flex-row items-center bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 sm:px-4 py-2 rounded-full shadow-lg w-full sm:w-auto">
                  <div className="flex items-center mb-1 sm:mb-0">
                    <span className="text-base sm:text-lg font-bold mr-2">🎯</span>
                    <span className="text-base sm:text-lg font-bold">Table of {currentLevel}</span>
                  </div>
                  <span className="text-xs sm:text-sm bg-white bg-opacity-20 px-2 py-1 rounded-full sm:ml-3">
                    {questionsAnswered}/10
                  </span>
                </div>
                
                {/* Total Progress in Pause Screen - Responsive */}
                <div className="inline-flex flex-col sm:flex-row items-center bg-gradient-to-r from-green-500 to-teal-500 text-white px-2 sm:px-3 py-1 rounded-full shadow-lg w-full sm:w-auto">
                  <div className="flex items-center mb-1 sm:mb-0">
                    <span className="text-xs sm:text-sm font-bold mr-2">🏆</span>
                    <span className="text-xs font-bold">Total: {currentLevel}/{MAX_LEVEL}</span>
                  </div>
                  <div className="w-10 sm:w-12 bg-white bg-opacity-20 rounded-full h-1 sm:ml-2">
                    <div 
                      className="bg-white h-1 rounded-full transition-all duration-500"
                      style={{ width: `${(currentLevel / MAX_LEVEL) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                 <button
                  onClick={togglePause}
                  className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-400 text-white rounded-lg text-base sm:text-lg font-bold hover:bg-blue-500 transition-colors flex items-center justify-center"
                >
                  <FaPlay className="mr-2 text-sm sm:text-base"/> Resume
                </button>
                <button
                  onClick={toggleSettingsModal}
                  className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg text-base sm:text-lg font-bold hover:bg-blue-600 transition-colors flex items-center justify-center"
                >
                  <FaCog className="mr-2 text-sm sm:text-base"/> Settings
                </button>
                <button
                  onClick={() => setShowRestartConfirmModal(true)}
                  className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg text-base sm:text-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center"
                >
                  <FaRedo className="mr-2 text-sm sm:text-base"/> Restart
                </button>
                <button
                  onClick={() => {
                    logger.debug('[FallingGame] Exit Game button clicked - showing confirmation modal');
                    setShowExitConfirmModal(true);
                  }}
                  className="w-full px-4 sm:px-6 py-2 sm:py-3 bg-red-500 text-white rounded-lg text-base sm:text-lg font-bold hover:bg-red-600 transition-colors flex items-center justify-center"
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
              <div className="flex items-center p-3  rounded-md">
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
                <div className="p-3 bg-gray-600 rounded-md">
                  <label htmlFor="tableSelect" className="block text-lg mb-2">Problem Table Focus:</label>
                  <select 
                    id="tableSelect"
                    value={selectedTableForProblems}
                    onChange={(e) => {
                      setSelectedTableForProblems(e.target.value);
                      if (gameStarted && !isPaused && !gameOver) {
                          generateProblems();
                      }
                    }}
                    className="w-full p-2 bg-gray-500 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="random">Random</option>
                    {Array.from({ length: 11 }, (_, i) => i + 2).map(num => (
                      <option key={num} value={num}>{`${num}${game.topic.includes('multiply') ? '×' : '÷'}`}</option>
                    ))}
                  </select>
                </div>
              )}

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


        {/* Removed loading screen that was blocking the UI unnecessarily */}

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

export default memo(FallingGame); 