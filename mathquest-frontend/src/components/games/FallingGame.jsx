import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import MultiplicationTable from './MultiplicationTable';
import { FaPlay, FaPause, FaCog, FaRedo, FaTable, FaVolumeUp, FaVolumeMute, FaStar } from 'react-icons/fa';
import gameService from "../../services/gameService";
import LevelProgressionModal from "./LevelProgressionModal";

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
const PROBLEMS_PER_LEVEL = 5;
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

  // Add new state for tracking problem generation
  const [isLoadingProblems, setIsLoadingProblems] = useState(false);
  
  // Add new state for countdown
  const [countdown, setCountdown] = useState(null);
  
  // Add new state for showing progress modal
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [lastScoreData, setLastScoreData] = useState(null);
  
  // Add new state for showing level selector
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  
  // Add new state for processing falling items
  const processedItemsRef = useRef(new Set());

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
      console.error("Unable to submit score: User or game data missing");
      return;
    }

    // Don't submit zero scores
    if (score <= 0) {
      console.log("Not submitting zero score");
      return;
    }

    try {
      const currentDate = new Date().toISOString();
      const gameScoreData = {
        gameId: game.id,
        score: score,
        level: currentLevel,
        timeTaken: Math.floor(gameTime), // Changed from timeSpent to timeTaken to match API
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
        console.log("Submitting score data:", gameScoreData);
        const result = await gameService.submitGameScore(gameScoreData);
        console.log("Score submission result:", result);
        
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
        console.error("API submission error:", apiError);
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
      console.error("Failed to save score:", error);
      toast.error("Failed to save your score. Please try again.");
    }
  }, [currentUser, game, score, currentLevel, gameTime, onGameComplete]);

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
      console.warn('Groq API key not found. Please set REACT_APP_GROQ_API_KEY environment variable.');
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
      // Log the request payload for debugging
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

      console.log('Groq API Request Payload:', requestPayload);

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
        console.error('Groq API Error Details:', {
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
      console.log('Groq API Response:', data);
      
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
        console.error('Invalid API Response Structure:', data);
        throw new Error('Invalid API response format');
      }

      try {
        const content = data.choices[0].message.content;
        console.log('Raw API Content:', content);
        const parsedContent = parseGroqApiContent(content);
        console.log('Parsed Content:', parsedContent);
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
        console.error('Error parsing Groq API response:', parseError);
        console.error('Failed content:', data.choices[0].message.content);
        throw new Error('Failed to parse API response');
      }
    } catch (error) {
      console.error('Groq API error:', error);
      if (error.message.includes('401')) {
        console.error('Invalid Groq API key. Please check your REACT_APP_GROQ_API_KEY environment variable.');
      }
      throw error;
    }
  }, []);

  const generateProblems = useCallback(async () => {
    if (!game?.id || !game?.topic || apiState.isGenerating) {
      console.warn('Game, game ID, or topic not available yet');
      return;
    }
    try {
      setIsLoadingProblems(true);
      apiState.isGenerating = true;
      const topicLower = game.topic.toLowerCase();
      const problemCount = TOTAL_PROBLEMS;
      const cacheKey = `${topicLower}-all`;
      solvedProblemsRef.current = new Set();
      usedProblemsRef.current = [];
      setDeductedProblems(new Set()); // Reset deducted problems
      setCurrentSequenceIndex(0); // Reset sequence index
      
      if (isCacheValid(topicLower, 'all')) {
        const cached = apiState.problemsCache.get(cacheKey);
        setProblems(cached.problems);
        return;
      }
      
      // Try Groq API
      const problems = await callGroqApi(game.topic, problemCount);
      if (Array.isArray(problems) && problems.length > 0) {
        // Sort problems by difficulty: easiest first (by sum of abs values in question)
        const sortedProblems = problems
          .filter(p => p.question && p.answer && p.operation)
          .sort((a, b) => {
            // Heuristic: sum of absolute numbers in question
            const sumAbs = q => (q.match(/-?\d+/g) || []).reduce((acc, n) => acc + Math.abs(Number(n)), 0);
            return sumAbs(a.question) - sumAbs(b.question);
          });
        const formattedProblems = sortedProblems.map((p, idx) => ({
          id: `${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
          question: p.question,
          answer: p.answer,
          operation: p.operation,
          x: Math.random() * 80 + 10,
          y: -10 - (Math.random() * 20),
          speed: 0.3 + (0.1 * currentLevel),
          status: 'normal',
          level: Math.floor(idx / PROBLEMS_PER_LEVEL) + 1,
          sequenceIndex: idx // Add sequence index
        }));
        apiState.problemsCache.set(cacheKey, {
          problems: formattedProblems,
          timestamp: Date.now()
        });
        setProblems(formattedProblems);
        initialProblemGenerationDone.current = true;
        return;
      }
      throw new Error('Invalid API response format');
    } catch (error) {
      console.error('Error generating problems:', error);
      
      // Fall back to basic generation
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
          problem = { id: problemId, question: `${product} ÷ ${num2}`, answer: num1.toString(), operation: 'division_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / PROBLEMS_PER_LEVEL) + 1 };
        } else if (topicLower.includes('negative') && topicLower.includes('add')) {
          const sign1 = Math.random() > 0.5 ? -1 : 1;
          const sign2 = Math.random() > 0.5 ? -1 : 1;
          const signedNum1 = num1 * sign1;
          const signedNum2 = num2 * sign2;
          problem = { id: problemId, question: `${signedNum1} + ${signedNum2}`, answer: (signedNum1 + signedNum2).toString(), operation: 'negative_addition', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / PROBLEMS_PER_LEVEL) + 1 };
        } else if (topicLower.includes('add') || topicLower.includes('addition')) {
          problem = { id: problemId, question: `${num1} + ${num2}`, answer: (num1 + num2).toString(), operation: 'addition_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / PROBLEMS_PER_LEVEL) + 1 };
        } else if (topicLower.includes('subtract') || topicLower.includes('subtraction')) {
          const [larger, smaller] = num1 >= num2 ? [num1, num2] : [num2, num1];
          problem = { id: problemId, question: `${larger} - ${smaller}`, answer: (larger - smaller).toString(), operation: 'subtraction_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / PROBLEMS_PER_LEVEL) + 1 };
        } else if (topicLower.includes('multiply') || topicLower.includes('multiplication')) {
          problem = { id: problemId, question: `${num1} × ${num2}`, answer: (num1 * num2).toString(), operation: 'multiplication_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / PROBLEMS_PER_LEVEL) + 1 };
        } else { 
          problem = { id: problemId, question: `${num1} + ${num2}`, answer: (num1 + num2).toString(), operation: 'addition_default_fallback', x: Math.random() * 80 + 10, y: -10 - (Math.random() * 20), speed: 0.3 + (0.1 * currentLevel), status: 'normal', level: Math.floor(i / PROBLEMS_PER_LEVEL) + 1 };
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
      setIsLoadingProblems(false);
      apiState.isGenerating = false;
    }
  }, [game, currentLevel, isCacheValid, callGroqApi, getDifficultyRanges]);

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
    console.log('[FallingGame] Level Timing Details:', {
      level,
      fallTime: `${fallTime/1000}s`,
      activeProblems,
      speed: `${speed.toFixed(2)} units/frame`,
      baseFallTime: `${BASE_FALL_TIME/1000}s`,
      minFallTime: `${minFallTime/1000}s`
    });
    return { fallTime, activeProblems, speed };
  }, []);

  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }
    
    const { fallTime, activeProblems: maxActiveProblems, speed } = calculateLevelTiming(currentLevel);
    
    // Animation loop
    const gameLoop = (timestamp) => {
      if (isPaused || gameOver || !gameStarted) return;
      
      setActiveProblems(prevActive => {
        const updated = prevActive.map(p => {
          const newY = p.y + speed;
          let status = p.status;
          if (newY >= 80 && status === 'normal') status = 'warning';
          return { ...p, y: newY, status };
        }).filter(p => {
          if (p.y >= 100) {
            if (!processedItemsRef.current.has(p.id) && !deductedProblems.has(p.id)) {
              processedItemsRef.current.add(p.id);
              setDeductedProblems(prev => {
                const newSet = new Set(prev);
                newSet.add(p.id);
                return newSet;
              });
              
              setLives(l => {
                const newLives = l - 1;
                if (newLives <= 0) {
                  setGameOver(true);
                  submitScore();
                  return 0;
                }
                return newLives;
              });
              
              setLastDeductionTime(Date.now());
            }
            return false;
          }
          return true;
        });
        return updated;
      });
      
      // Check if we need to spawn new problems
      if (activeProblems.length < maxActiveProblems) {
        const currentTime = performance.now();
        const timeSinceLastSpawn = currentTime - lastSpawnTimeRef.current;
        
        if (timeSinceLastSpawn >= SPAWN_DELAY) {
          const currentLevelProblems = problems.filter(p => 
            p.level === currentLevel && 
            !solvedProblemsRef.current.has(p.id) && 
            !usedProblemsRef.current.includes(p.id)
          );
          
          if (currentLevelProblems.length > 0) {
            const needed = maxActiveProblems - activeProblems.length;
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
            console.log('[FallingGame] Spawning New Items:', {
              level: currentLevel,
              currentActiveCount: activeProblems.length,
              maxActiveCount: maxActiveProblems,
              spawningCount: toAdd.length,
              items: toAdd.map(item => ({
                id: item.id,
                question: item.question,
                startY: item.y,
                x: item.x,
                speed: item.speed
              }))
            });
            setActiveProblems(prev => [...prev, ...toAdd]);
            usedProblemsRef.current.push(...toAdd.map(p => p.id));
            lastSpawnTimeRef.current = currentTime;
          }
        }
      }
      
      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };
    
    animationFrameRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [gameStarted, gameOver, problems, currentLevel, activeProblems.length, isPaused, submitScore, calculateLevelTiming]);

  const levelUp = useCallback(() => {
    if (currentLevel >= MAX_LEVEL) {
      setGameOver(true);
      submitScore();
      return;
    }
    
    const currentDate = new Date().toISOString();
    const gameScoreData = {
      gameId: game.id,
      score: score,
      level: currentLevel,
      timeTaken: Math.floor(gameTime),
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
        toast.success(`Level ${currentLevel} complete! Starting level ${currentLevel + 1}...`, { duration: 2000 });
        setCurrentLevel(currentLevel + 1);
        setSpeedMultiplier(prev => prev + 0.2);
        setProblemsSolvedThisLevel(0);
        setTargetProblemsPerLevel(PROBLEMS_PER_LEVEL);
        const solvedIds = Array.from(solvedProblemsRef.current);
        usedProblemsRef.current = usedProblemsRef.current.filter(id => !solvedIds.includes(id));
      })
      .catch(error => {
        console.error('Error submitting level completion:', error);
        toast.error('Failed to save level progress');
      });
  }, [currentUser, game, currentLevel, score, gameTime, submitScore]);

  const startGame = () => {
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
    processedItemsRef.current = new Set(); // Reset processed items ref
    setDeductedProblems(new Set()); // Reset deducted problems
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

  let submitted = false;
  const handleSubmit = (e) => {
    e.preventDefault();
    if (submitted) return;
    submitted = true;
    setTimeout(() => { submitted = false; }, 500);
    if (!userAnswer.trim() || isPaused || gameOver) return;
    
    const normalizedAnswer = userAnswer.trim().replace(/\s+/g, '');
    
    // Add detailed logging for answer matching
    console.log('[FallingGame] Answer submission details:', {
      userAnswer: normalizedAnswer,
      activeProblems: activeProblems.map(p => ({
        id: p.id,
        question: p.question,
        answer: p.answer,
        sequenceIndex: p.sequenceIndex,
        currentSequenceIndex
      }))
    });

    const matchIndex = activeProblems.findIndex(problem => {
      const problemAnswer = problem.answer.replace(/\s+/g, '');
      const normalizeNumber = (str) => {
        str = str.replace(/\s+/g, '');
        const mixedMatch = str.match(/^-?(\d+)\s*(\d+)\/(\d+)$/);
        if (mixedMatch) {
          const [_, whole, num, den] = mixedMatch;
          const sign = str.startsWith('-') ? -1 : 1;
          const improperNum = Math.abs(whole) * parseInt(den) + parseInt(num);
          return `${sign * improperNum}/${den}`;
        }
        if (str.includes('.')) return parseFloat(str).toString();
        return str;
      };

      const normalizedUserAnswer = normalizeNumber(normalizedAnswer);
      const normalizedProblemAnswer = normalizeNumber(problemAnswer);
      
      // Add logging for answer normalization
      console.log('[FallingGame] Answer normalization:', {
        problemId: problem.id,
        originalUserAnswer: normalizedAnswer,
        normalizedUserAnswer,
        originalProblemAnswer: problemAnswer,
        normalizedProblemAnswer,
        isMatch: normalizedUserAnswer === normalizedProblemAnswer
      });

      return normalizedUserAnswer === normalizedProblemAnswer;
    });

    if (matchIndex !== -1) {
      const solvedProblem = activeProblems[matchIndex];
      console.log('[FallingGame] Answer submitted:', {
        problemId: solvedProblem.id,
        problemSequenceIndex: solvedProblem.sequenceIndex,
        currentSequenceIndex,
        question: solvedProblem.question,
        userAnswer: normalizedAnswer,
        correctAnswer: solvedProblem.answer
      });

      // Accept any correct answer
      console.log('[FallingGame] Correct answer');
      solvedProblemsRef.current.add(solvedProblem.id);
      setScore(prev => prev + (10 * currentLevel));
      setActiveProblems(prev => prev.map((p, idx) => idx === matchIndex ? { ...p, status: 'correct' } : p));
      setTimeout(() => {
        setActiveProblems(prev => prev.filter((_, idx) => idx !== matchIndex));
      }, 300);
      setProblemsSolvedThisLevel(prev => {
        const newSolvedCount = prev + 1;
        if (newSolvedCount >= PROBLEMS_PER_LEVEL) {
          levelUp();
          return 0;
        }
        return newSolvedCount;
      });
      setCurrentSequenceIndex(prev => prev + 1); // Still increment sequence index for tracking
    } else {
      // Wrong answer - deduct life only if not already deducted
      const wrongProblem = activeProblems.find(p => !deductedProblems.has(p.id));
      console.log('[FallingGame] Wrong answer submitted:', {
        wrongProblemId: wrongProblem?.id,
        wrongProblemSequenceIndex: wrongProblem?.sequenceIndex,
        currentSequenceIndex,
        timeSinceLastDeduction: Date.now() - lastDeductionTime,
        alreadyDeducted: wrongProblem ? deductedProblems.has(wrongProblem.id) : false,
        userAnswer: normalizedAnswer,
        availableAnswers: activeProblems.map(p => p.answer)
      });

      if (wrongProblem) {
        console.log('[FallingGame] Deducting life for wrong answer');
        // Add to deducted problems immediately
        setDeductedProblems(prev => {
          const newSet = new Set(prev);
          newSet.add(wrongProblem.id);
          return newSet;
        });
        
        setLives(l => {
          const newLives = l - 1;
          console.log('[FallingGame] Life deducted from wrong answer. New lives:', newLives);
          if (newLives <= 0) {
            setGameOver(true);
            submitScore();
            return 0;
          }
          return newLives;
        });
        
        setLastDeductionTime(Date.now());
      } else {
        console.log('[FallingGame] Skipped life deduction for wrong answer: No undeducted problems available');
      }
      
      setActiveProblems(prev => prev.map(p => ({ ...p, status: 'incorrect' })));
      setTimeout(() => {
        setActiveProblems(prev => prev.map(p => ({ ...p, status: p.status === 'incorrect' ? 'normal' : p.status })));
      }, 300);
    }
    setUserAnswer('');

    setTimeout(() => {
      setActiveProblems(prev => {
        if (prev.length < calculateLevelTiming(currentLevel).activeProblems) {
          // Try to spawn more if available
          const currentLevelProblems = problems.filter(p => 
            p.level === currentLevel && 
            !solvedProblemsRef.current.has(p.id) && 
            !usedProblemsRef.current.includes(p.id)
          );
          const needed = calculateLevelTiming(currentLevel).activeProblems - prev.length;
          if (currentLevelProblems.length > 0 && needed > 0) {
            const positions = getNonOverlappingPositions(needed, MIN_HORIZONTAL_GAP, MIN_VERTICAL_GAP);
            const toAdd = currentLevelProblems.slice(0, needed).map((p, idx) => ({
              ...p,
              y: positions[idx].y,
              status: 'normal',
              x: positions[idx].x,
              speed: calculateLevelTiming(currentLevel).speed
            }));
            usedProblemsRef.current.push(...toAdd.map(p => p.id));
            return [...prev, ...toAdd];
          }
        }
        return prev;
      });
    }, 350);
  };
  
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
    console.log('[FallingGame] Manual Level Change:', {
      fromLevel: currentLevel,
      toLevel: selectedLevel,
      timestamp: new Date().toISOString()
    });
    
    setCurrentLevel(selectedLevel);
    setProblemsSolvedThisLevel(0);
    setActiveProblems([]);
    processedItemsRef.current = new Set();
    setDeductedProblems(new Set());
    lastSpawnTimeRef.current = performance.now();
    
    generateProblems().then(() => {
      setGameStarted(true);
      setGameOver(false);
      setScore(0);
      setLives(MAX_LIVES);
      setSpeedMultiplier(1);
      setUserAnswer('');
      setGameTime(0);
      setIsPaused(false);
    });
  };

  const handleExitGame = () => {
    submitScore();
    setGameOver(true);
    setGameStarted(false);
  };

  // Main UI
  if (!game) {
    return <div className="text-center p-8 text-xl">Loading game data...</div>;
  }

  return (
    // <div className="w-full min-h-screen bg-gray-800 text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
    <div className="w-full h-screen bg-gray-800 text-white flex flex-col items-center justify-between p-4 relative overflow-hidden">
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
      
      {gameStarted && !gameOver && (
          <div className="w-full  p-4 bg-gray-900 shadow-lg flex justify-between items-center mb-6 rounded-lg">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="text-xs sm:text-sm md:text-base">LEVEL: <span className="font-bold text-yellow-400">{currentLevel}</span></div>
            <button
              onClick={() => setShowLevelSelector(true)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
            >
              Change Level
            </button>
            {/* <div className="text-xs sm:text-sm md:text-base">Topic: <span className="font-bold text-yellow-400">
              {isMultiplicationOrDivision ? (selectedTableForProblems === 'random' ? `Random ${game.topic.includes('multiply') ? '×' : '÷'}` : `${selectedTableForProblems}${game.topic.includes('multiply') ? '×' : '÷'}`) : game.topic.split(' ')[0]}
            </span></div> */}
          </div>
          <div className="flex flex-col items-center">
            <div className="text-xs sm:text-sm text-gray-400">PROGRESS</div>
            <div className="w-24 sm:w-32 h-4 bg-gray-700 rounded-full overflow-hidden border border-gray-600">
              <div 
                className="h-full bg-green-500 transition-all duration-300 ease-in-out"
                style={{ width: `${Math.min(100, (problemsSolvedThisLevel / targetProblemsPerLevel) * 100)}%` }}
              ></div>
            </div>
            <div className="text-xs sm:text-sm font-bold">{problemsSolvedThisLevel}/{targetProblemsPerLevel}</div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button 
              onClick={toggleSettingsModal} 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gray-700 rounded-md hover:bg-gray-600 text-xs sm:text-sm text-white flex items-center"
            >
              <FaCog className="mr-1 sm:mr-2" size={12} sm={14} /> Settings
            </button>
            <button 
              onClick={togglePause} 
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-600 rounded-md hover:bg-blue-500 text-xs sm:text-sm text-white flex items-center"
            >
              {isPaused ? <><FaPlay className="mr-1 sm:mr-2" size={12} sm={14}/> Resume</> : <><FaPause className="mr-1 sm:mr-2" size={12} sm={14}/> Pause</>}
            </button>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm sm:text-base flex items-center">SCORE: <FaStar className="mx-1 text-yellow-400" /> <span className="font-bold text-yellow-400">{score}</span></div>
            <div className="text-sm sm:text-base">LIVES: <span className="text-red-500">{'❤️'.repeat(lives) || '💔'}</span></div>
          </div>
        </div>
      )}

      <div className={`w-full max-w-3xl mx-auto flex flex-col items-center justify-center flex-grow`}>
        {!gameStarted && !gameOver && countdown === null && (
          <div className="text-center my-8 p-8 bg-gray-700 rounded-lg shadow-xl">
            <h2 className="text-3xl font-bold mb-3 text-yellow-400">{game?.name || 'Falling Math Game'}</h2>
            <p className="text-gray-300 mb-6">{game?.instructions || 'Solve the math problems before they fall off the screen!'}</p>
            <button
              onClick={startGame}
              className="px-8 py-4 bg-green-500 text-white rounded-lg text-xl font-bold hover:bg-green-600 transition-colors"
            >
              Start Game
            </button>
          </div>
        )}
        
        {countdown !== null && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="text-center">
              <h2 className="text-6xl font-bold text-white mb-4">Starting in</h2>
              <div className="text-8xl font-bold text-yellow-400 animate-pulse">
                {countdown}
              </div>
            </div>
          </div>
        )}
        
        {gameStarted && !gameOver && !isPaused && (
          <>
            <div
              ref={gameAreaRef}
              className="relative w-full h-[calc(100vh-220px)] sm:h-[calc(100vh-200px)] bg-gray-800 rounded-lg mb-4 overflow-hidden"
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
                    className={`absolute px-3 py-2 sm:px-4 sm:py-3 bg-gradient-to-br ${bgColor} text-white rounded-lg shadow-lg border-2 ${borderColor} transform transition-transform duration-100 hover:scale-110`}
                    style={{
                      left: `${problem.x}%`,
                      top: `${problem.y}%`,
                      transform: 'translate(-50%, -50%)',
                      fontSize: problem.question.length > 10 ? '1rem' : '1.25rem',
                      fontWeight: 'bold',
                      minWidth: '80px',
                      textAlign: 'center',
                      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <span className="font-bold">{problem.question}</span>
                  </div>
                );
              })}
            </div>
            
            <form onSubmit={handleSubmit} className="flex items-center w-full max-w-md mt-auto mb-4">
              <input
                type="text"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="flex-1 px-4 py-3 bg-white text-gray-900 border-2 border-blue-400 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder-gray-500 text-lg"
                placeholder={getPlaceholderText()}
                autoFocus
                disabled={isPaused || gameOver}
              />
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors border-2 border-blue-600 border-l-0 text-lg font-semibold"
                disabled={isPaused || gameOver || !userAnswer.trim()}
              >
                Submit
              </button>
            </form>
            <div className="w-full max-w-3xl mx-auto mt-8">
              <h4 className="text-white text-sm mb-2">[DEV] All Problems (for debugging):</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-200 bg-gray-900 p-2 rounded max-h-40 overflow-y-auto">
                {problems.map((p, i) => (
                  <div key={p.id} className="truncate">
                    {i + 1}. {p.question} = <span className="text-green-300">{p.answer}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* <div className="flex justify-end mb-2">
              <button
                onClick={handleExitGame}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                data-testid="exit-button"
              >
                Exit
              </button>
            </div> */}
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
                onClick={() => { 
                  if (onGameComplete) {
                    // For the "Back to Games" button, just pass the score number
                    onGameComplete(score);
                  }
                }}
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
                data-testid="exit-button"
              >
                Exit Game
              </button>
               
              </div>
            </div>
          </div>
        )}

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
              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                     toggleSettingsModal();
                     if (gameStarted && !isPaused && !gameOver && selectedTableForProblems !== 'random') {
                        generateProblems();
                     }
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md text-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}


        {isLoadingProblems && countdown === null && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-black mt-2">Generating problems...</p>
            </div>
          </div>
        )}

        {showLevelSelector && (
          <LevelProgressionModal
          isOpen={true}
          onClose={() => setShowLevelSelector(false)}
          scoreData={null}
          gameName={game?.name || 'Game'}
          gameId={game.id}
          maxGameLevel={10}
          onLevelSelect={handleLevelSelect}
          showLevelSelection={true}
        />
        )}
      </div>
    </div>
  );
};

export default FallingGame; 