import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProgress } from '../context/UserProgressContext';

const useHintSystem = (initialHints = 3) => {
  const [hintsRemaining, setHintsRemaining] = useState(initialHints);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const hintSound = useRef(new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'));

  const useHint = () => {
    if (hintsRemaining > 0) {
      setHintsRemaining(hintsRemaining - 1);
      if (soundEnabled) {
        try {
          hintSound.current.currentTime = 0;
          hintSound.current.play().catch(() => setSoundEnabled(false));
        } catch (error) {
          setSoundEnabled(false);
        }
      }
      return true;
    }
    return false;
  };

  const resetHints = () => {
    setHintsRemaining(initialHints);
  };

  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
  };

  return {
    hintsRemaining,
    useHint,
    resetHints,
    soundEnabled,
    toggleSound,
    hintSound
  };
};

const ChallengePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addPoints, awardBadge, userProgress } = useUserProgress();
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [bossHealth, setBossHealth] = useState(100);
  const [raceProgress, setRaceProgress] = useState(0);
  const [aiProgress, setAiProgress] = useState(0);
  const [level, setLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);
  const [showFeedback, setShowFeedback] = useState({ type: '', message: '' });

  const {
    hintsRemaining,
    useHint,
    resetHints,
    soundEnabled,
    toggleSound,
    hintSound
  } = useHintSystem();

  // Create audio elements
  const correctSound = useRef(new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'));
  const wrongSound = useRef(new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'));
  const levelUpSound = useRef(new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'));

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }

    // Initialize audio elements
    const initializeAudio = async () => {
      try {
        // Try to play a silent sound to check if audio is allowed
        await correctSound.current.play();
        correctSound.current.pause();
        correctSound.current.currentTime = 0;
      } catch (error) {
        console.log('Audio playback not allowed:', error);
      }
    };

    initializeAudio();

    return () => {
      // Cleanup audio elements
      correctSound.current.pause();
      wrongSound.current.pause();
      levelUpSound.current.pause();
    };
  }, [currentUser, navigate]);

  const playSound = async (type) => {
    if (!soundEnabled) return;

    try {
      const audio = {
        correct: correctSound.current,
        wrong: wrongSound.current,
        levelUp: levelUpSound.current
      }[type];

      if (audio) {
        audio.currentTime = 0;
        await audio.play();
      }
    } catch (error) {
      console.log('Audio playback failed:', error);
    }
  };

  const showTemporaryFeedback = (type, message) => {
    setShowFeedback({ type, message });
    setTimeout(() => setShowFeedback({ type: '', message: '' }), 2000);
  };

  const resetGameState = () => {
    setGameComplete(false);
    setScore(0);
    setStreak(0);
    setLevel(1);
    setBossHealth(100);
    setRaceProgress(0);
    setAiProgress(0);
    resetHints();
    setShowFeedback({ type: '', message: '' });
  };

  const PropertyMatchGame = () => {
    const [cards, setCards] = useState([
      { id: 1, expression: '3 × 4 = 4 × 3', property: 'Commutative', matched: false },
      { id: 2, expression: '(2 × 3) × 4 = 2 × (3 × 4)', property: 'Associative', matched: false },
      { id: 3, expression: '5 × 1 = 5', property: 'Identity', matched: false },
      { id: 4, expression: '6 × 0 = 0', property: 'Zero', matched: false }
    ]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [matches, setMatches] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const handleCardClick = (card) => {
      if (isAnimating || card.matched) return;
      
      if (selectedCard === null) {
        setSelectedCard(card);
      } else {
        setIsAnimating(true);
        if (selectedCard.property === card.property) {
          playSound('correct');
          const updatedCards = cards.map(c => 
            c.property === card.property ? { ...c, matched: true } : c
          );
          setCards(updatedCards);
          setMatches(matches + 1);
          setStreak(streak + 1);
          setScore(score + 10);
          showTemporaryFeedback('success', 'Correct match!');
          
          if (matches + 1 === cards.length / 2) {
            if (level < 3) {
              playSound('levelUp');
              setTimeout(() => {
                setLevel(level + 1);
                setCards(generateNewCards(level + 1));
                setMatches(0);
                setIsAnimating(false);
              }, 1000);
            } else {
              setGameComplete(true);
              addPoints(currentUser.email, 100);
              awardBadge(currentUser.email, challenges[0].badge);
              setIsAnimating(false);
            }
          } else {
            setTimeout(() => setIsAnimating(false), 1000);
          }
        } else {
          playSound('wrong');
          setStreak(0);
          showTemporaryFeedback('error', 'Try again!');
          setTimeout(() => {
            setSelectedCard(null);
            setIsAnimating(false);
          }, 1000);
        }
      }
    };

    const generateNewCards = (level) => {
      const newCards = [
        { id: 1, expression: `${level + 2} × ${level + 3} = ${level + 3} × ${level + 2}`, property: 'Commutative', matched: false },
        { id: 2, expression: `(${level + 1} × ${level + 2}) × ${level + 3} = ${level + 1} × (${level + 2} × ${level + 3})`, property: 'Associative', matched: false },
        { id: 3, expression: `${level + 4} × 1 = ${level + 4}`, property: 'Identity', matched: false },
        { id: 4, expression: `${level + 5} × 0 = 0`, property: 'Zero', matched: false }
      ];
      return newCards;
    };

    const handleHint = () => {
      if (hintsRemaining > 0) {
        // Play hint sound if enabled
        if (soundEnabled) {
          try {
            hintSound.current.currentTime = 0;
            hintSound.current.play().catch(() => {});
          } catch (error) {
            console.log('Hint sound failed:', error);
          }
        }

        const unmatchedCards = cards.filter(card => !card.matched);
        if (unmatchedCards.length >= 2) {
          const firstCard = unmatchedCards[0];
          const matchingCard = unmatchedCards.find(card => 
            card.id !== firstCard.id && card.property === firstCard.property
          );
          if (matchingCard) {
            setSelectedCard(firstCard);
            setTimeout(() => {
              handleCardClick(matchingCard);
            }, 1000);
          }
        }
      }
    };

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Level {level}</h2>
          <div className="flex items-center space-x-4">
            <span className="text-blue-600">Score: {score}</span>
            <span className="text-green-600">Streak: {streak}</span>
            <button
              onClick={handleHint}
              disabled={hintsRemaining === 0}
              className={`px-3 py-1 rounded-lg transition-all ${
                hintsRemaining > 0
                  ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Hint ({hintsRemaining})
            </button>
          </div>
        </div>
        {showFeedback.message && (
          <div className={`mb-4 p-2 rounded-lg text-center ${
            showFeedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {showFeedback.message}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => !card.matched && handleCardClick(card)}
              className={`p-4 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                card.matched
                  ? 'bg-green-100'
                  : selectedCard?.id === card.id
                  ? 'bg-blue-100'
                  : 'bg-white hover:bg-gray-50'
              }`}
            >
              <p className="text-center">{card.expression}</p>
            </div>
          ))}
        </div>
        {gameComplete && (
          <div className="mt-4 p-4 bg-green-100 rounded-lg animate-bounce">
            <p className="text-center text-green-800 font-bold">🎉 Congratulations! You've completed all levels!</p>
          </div>
        )}
      </div>
    );
  };

  const RaceGame = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [timeLeft, setTimeLeft] = useState(10);
    const [isRaceActive, setIsRaceActive] = useState(true);

    const questions = [
      {
        question: 'What property is shown in: 4 × 5 = 5 × 4?',
        answer: 'Commutative'
      },
      {
        question: 'What property is shown in: (2 × 3) × 4 = 2 × (3 × 4)?',
        answer: 'Associative'
      },
      {
        question: 'What property is shown in: 7 × 1 = 7?',
        answer: 'Identity'
      }
    ];

    useEffect(() => {
      if (timeLeft > 0 && isRaceActive) {
        const timer = setInterval(() => {
          setTimeLeft(timeLeft - 1);
          setAiProgress(Math.min(aiProgress + 1, 100));
        }, 1000);
        return () => clearInterval(timer);
      } else if (timeLeft === 0) {
        setIsRaceActive(false);
      }
    }, [timeLeft, isRaceActive]);

    const handleAnswer = (answer) => {
      if (answer === questions[currentQuestion].answer) {
        setRaceProgress(Math.min(raceProgress + 20, 100));
        setScore(score + 10);
        setStreak(streak + 1);
      } else {
        setStreak(0);
      }

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
        setTimeLeft(10);
      } else {
        setIsRaceActive(false);
        if (raceProgress > aiProgress) {
          addPoints(currentUser.email, 50);
          awardBadge(currentUser.email, challenges[1].badge);
        }
      }
    };

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Race to Solve 🏎️</h2>
          <span className="text-red-600">Time: {timeLeft}s</span>
        </div>
        <div className="mb-8">
          <div className="relative h-8 bg-gray-200 rounded-full">
            <div
              className="absolute h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${raceProgress}%` }}
            >
              <span className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-full">You</span>
            </div>
            <div
              className="absolute h-full bg-red-500 rounded-full transition-all duration-500"
              style={{ width: `${aiProgress}%` }}
            >
              <span className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-full">AI</span>
            </div>
          </div>
        </div>
        {isRaceActive ? (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-xl mb-4">{questions[currentQuestion].question}</p>
            <div className="grid grid-cols-2 gap-4">
              {['Commutative', 'Associative', 'Identity', 'Zero'].map(property => (
                <button
                  key={property}
                  onClick={() => handleAnswer(property)}
                  className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  {property}
            </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-2xl font-bold mb-4">Race Complete!</p>
            <p className="text-xl">Final Score: {score}</p>
            <p className="text-xl">Longest Streak: {streak}</p>
          </div>
        )}
      </div>
    );
  };

  const PuzzleGame = () => {
    const [puzzle, setPuzzle] = useState({
      expression: '3 × (4 × 2)',
      target: '(3 × 4) × 2',
      property: 'Associative'
    });
    const [tiles, setTiles] = useState(['3', '×', '(', '4', '×', '2', ')']);
    const [isComplete, setIsComplete] = useState(false);

    const handleTileDrop = (fromIndex, toIndex) => {
      const newTiles = [...tiles];
      const [movedTile] = newTiles.splice(fromIndex, 1);
      newTiles.splice(toIndex, 0, movedTile);
      setTiles(newTiles);

      const currentExpression = newTiles.join(' ');
      if (currentExpression === puzzle.target) {
        setIsComplete(true);
        setScore(score + 20);
        setStreak(streak + 1);
        addPoints(currentUser.email, 30);
        awardBadge(currentUser.email, challenges[2].badge);
      }
    };

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Property Puzzle 🧩</h2>
          <div className="flex items-center space-x-4">
            <span className="text-blue-600">Score: {score}</span>
            <span className="text-green-600">Streak: {streak}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-xl mb-4">Rearrange the tiles to show the {puzzle.property} Property:</p>
          <div className="flex flex-wrap gap-2 p-4 bg-gray-100 rounded-lg min-h-20">
            {tiles.map((tile, index) => (
              <div
                key={index}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                  handleTileDrop(fromIndex, index);
                }}
                className="p-2 bg-white rounded-lg shadow cursor-move hover:bg-blue-50"
              >
                {tile}
              </div>
            ))}
          </div>
          {isComplete && (
            <div className="mt-4 p-4 bg-green-100 rounded-lg">
              <p className="text-center text-green-800 font-bold">🎉 Correct! You've solved the puzzle!</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BossBattle = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [questionsAnswered, setQuestionsAnswered] = useState(0);

    const questions = [
      {
        question: 'What property allows you to change the order of factors?',
        answer: 'Commutative',
        options: ['Commutative', 'Associative', 'Identity', 'Zero']
      },
      {
        question: 'Which property shows that 5 × 1 = 5?',
        answer: 'Identity',
        options: ['Commutative', 'Associative', 'Identity', 'Zero']
      },
      {
        question: 'What property is used in (2 × 3) × 4 = 2 × (3 × 4)?',
        answer: 'Associative',
        options: ['Commutative', 'Associative', 'Identity', 'Zero']
      }
    ];

    const handleAnswer = (answer) => {
      if (answer === questions[currentQuestion].answer) {
        setBossHealth(Math.max(0, bossHealth - 20));
        setQuestionsAnswered(questionsAnswered + 1);
        setScore(score + 10);
        setStreak(streak + 1);
      } else {
        setStreak(0);
      }

      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        if (bossHealth <= 0) {
          addPoints(currentUser.email, 150);
          awardBadge(currentUser.email, challenges[3].badge);
        }
        setGameComplete(true);
      }
    };

  return (
      <div className="p-6">
          <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Boss Battle 🐉</h2>
          <div className="flex items-center space-x-4">
            <span className="text-blue-600">Score: {score}</span>
            <span className="text-green-600">Streak: {streak}</span>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="mb-4">
            <div className="relative h-4 bg-gray-200 rounded-full">
              <div
                className="absolute h-full bg-red-500 rounded-full transition-all duration-500"
                style={{ width: `${bossHealth}%` }}
              >
                <span className="absolute right-0 top-0 transform translate-x-1/2 -translate-y-full">
                  Boss Health: {bossHealth}%
                </span>
              </div>
            </div>
          </div>
          {!gameComplete ? (
            <>
              <p className="text-xl mb-4">{questions[currentQuestion].question}</p>
              <div className="grid grid-cols-2 gap-4">
                {questions[currentQuestion].options.map(option => (
                  <button
                    key={option}
                    onClick={() => handleAnswer(option)}
                    className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">
                {bossHealth <= 0 ? '🎉 Victory! You defeated the boss!' : 'Game Over!'}
              </p>
              <p className="text-xl">Final Score: {score}</p>
              <p className="text-xl">Questions Answered: {questionsAnswered}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Challenge data
  const challenges = [
    {
      id: 'property-match',
      title: 'Property Match Game 🎴',
      description: 'Match equations with their properties!',
      icon: '🎴',
      badge: 'Property Matcher'
    },
    {
      id: 'race',
      title: 'Race to Solve 🏎️',
      description: 'Race against the AI to solve problems!',
      icon: '🏎️',
      badge: 'Speed Racer'
    },
    {
      id: 'puzzle',
      title: 'Property Puzzle 🧩',
      description: 'Rearrange multiplication sentences!',
      icon: '🧩',
      badge: 'Puzzle Master'
    },
    {
      id: 'boss',
      title: 'Boss Battle 🐉',
      description: 'Defeat the multiplication monster!',
      icon: '🐉',
      badge: 'Boss Slayer'
    }
  ];

  const renderChallenge = () => {
    switch (activeChallenge) {
      case 'property-match':
        return <PropertyMatchGame />;
      case 'race':
        return <RaceGame />;
      case 'puzzle':
        return <PuzzleGame />;
      case 'boss':
        return <BossBattle />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {challenges.map(challenge => (
              <div
                key={challenge.id}
                onClick={() => {
                  resetGameState();
                  setActiveChallenge(challenge.id);
                }}
                className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{challenge.icon}</div>
                <h3 className="text-xl font-bold mb-2">{challenge.title}</h3>
                <p className="text-gray-600">{challenge.description}</p>
                {userProgress?.badges?.includes(challenge.badge) && (
                  <div className="mt-2 text-green-600">🏆 Badge Earned!</div>
                )}
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
      <div className="max-w-6xl mx-auto py-8">
        {activeChallenge && (
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={() => {
                resetGameState();
                setActiveChallenge(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all"
            >
              ← Back to Challenges
            </button>
            <button
              onClick={toggleSound}
              className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 transition-all"
            >
              {soundEnabled ? '🔊 Sound On' : '🔈 Sound Off'}
            </button>
          </div>
        )}
        {renderChallenge()}
      </div>
    </div>
  );
};

export default ChallengePage; 