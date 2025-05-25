import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useUserProgress } from '../context/UserProgressContext';
import { Header } from "../ui/heading"

const GamePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { addPoints, awardBadge } = useUserProgress();
  const [activeGame, setActiveGame] = useState(null);
  const [score, setScore] = useState(0);
  const [gameComplete, setGameComplete] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Game data
  const games = [
    {
      id: 'matching',
      title: 'Property Matching Game 🎴',
      description: 'Drag and drop to match expressions with their properties!',
      icon: '🎴'
    },
    {
      id: 'quiz',
      title: 'True or False Quiz ❓',
      description: 'Test your knowledge with true/false questions!',
      icon: '❓'
    },
    {
      id: 'adventure',
      title: 'Property Adventure 🗺️',
      description: 'Embark on a journey through different properties!',
      icon: '🗺️'
    },
    {
      id: 'timed',
      title: 'Timed Challenge ⏱️',
      description: 'Race against time to identify properties!',
      icon: '⏱️'
    }
  ];

  const MatchingGame = () => {
    const [cards, setCards] = useState([
      { id: 1, expression: '4 × 5 = 5 × 4', property: 'Commutative', matched: false },
      { id: 2, expression: '(2 × 3) × 4 = 2 × (3 × 4)', property: 'Associative', matched: false },
      { id: 3, expression: '3 × (4 + 2) = 3 × 4 + 3 × 2', property: 'Distributive', matched: false },
      { id: 4, expression: '7 × 1 = 7', property: 'Identity', matched: false },
      { id: 5, expression: '9 × 0 = 0', property: 'Zero', matched: false }
    ]);
    const [selectedCard, setSelectedCard] = useState(null);
    const [matches, setMatches] = useState(0);

    const handleCardClick = (card) => {
      if (selectedCard === null) {
        setSelectedCard(card);
      } else {
        if (selectedCard.property === card.property) {
          const updatedCards = cards.map(c => 
            c.property === card.property ? { ...c, matched: true } : c
          );
          setCards(updatedCards);
          setMatches(matches + 1);
          if (matches + 1 === cards.length / 2) {
            setGameComplete(true);
            addPoints(currentUser.email, 50);
            awardBadge(currentUser.email, 1);
          }
        }
        setSelectedCard(null);
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Match the Properties!</h2>
        <div className="grid grid-cols-2 gap-4">
          {cards.map(card => (
            <div
              key={card.id}
              onClick={() => !card.matched && handleCardClick(card)}
              className={`p-4 rounded-lg cursor-pointer transition-all ${
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
          <div className="mt-4 p-4 bg-green-100 rounded-lg">
            <p className="text-center text-green-800 font-bold">🎉 Great job! You've matched all the properties!</p>
          </div>
        )}
      </div>

   
    );
  };

  const QuizGame = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [showFeedback, setShowFeedback] = useState(false);

    const questions = [
      {
        question: '4 × 5 = 5 × 4 demonstrates the Commutative Property',
        answer: true
      },
      {
        question: '(2 × 3) × 4 = 2 × (3 × 4) demonstrates the Distributive Property',
        answer: false
      },
      {
        question: '3 × (4 + 2) = 3 × 4 + 3 × 2 demonstrates the Associative Property',
        answer: false
      },
      {
        question: '7 × 1 = 7 demonstrates the Identity Property',
        answer: true
      },
      {
        question: '9 × 0 = 0 demonstrates the Zero Property',
        answer: true
      }
    ];

    const handleAnswer = (answer) => {
      const isCorrect = answer === questions[currentQuestion].answer;
      if (isCorrect) {
        setScore(score + 1);
      }
      setShowFeedback(true);
      
      setTimeout(() => {
        setShowFeedback(false);
        if (currentQuestion < questions.length - 1) {
          setCurrentQuestion(currentQuestion + 1);
        } else {
          setGameComplete(true);
          addPoints(currentUser.email, 30);
          awardBadge(currentUser.email, 2);
        }
      }, 1500);
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">True or False Quiz</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-xl mb-4">{questions[currentQuestion].question}</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleAnswer(true)}
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              True
            </button>
            <button
              onClick={() => handleAnswer(false)}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              False
            </button>
          </div>
          {showFeedback && (
            <p className={`mt-4 text-center font-bold ${
              score > currentQuestion ? 'text-green-600' : 'text-red-600'
            }`}>
              {score > currentQuestion ? '✅ Correct!' : '❌ Incorrect!'}
            </p>
          )}
        </div>
        <p className="mt-4 text-center">Score: {score}/{questions.length}</p>
      </div>
    );
  };

  const AdventureGame = () => {
    const [currentLevel, setCurrentLevel] = useState(0);
    const [userAnswer, setUserAnswer] = useState('');
    const [feedback, setFeedback] = useState('');

    const levels = [
      {
        name: 'Commutative Forest',
        question: 'What is 6 × 4 using the Commutative Property?',
        answer: '4 × 6',
        property: 'Commutative'
      },
      {
        name: 'Associative Cave',
        question: 'Rewrite (3 × 2) × 5 using the Associative Property',
        answer: '3 × (2 × 5)',
        property: 'Associative'
      },
      {
        name: 'Distributive Mountain',
        question: 'Use the Distributive Property to solve 4 × (3 + 2)',
        answer: '4 × 3 + 4 × 2',
        property: 'Distributive'
      }
    ];

    const handleSubmit = () => {
      const correct = userAnswer.trim().toLowerCase() === levels[currentLevel].answer.toLowerCase();
      setFeedback(correct ? '✅ Correct! Moving to next level!' : '❌ Try again!');
      
      if (correct) {
        setTimeout(() => {
          if (currentLevel < levels.length - 1) {
            setCurrentLevel(currentLevel + 1);
            setUserAnswer('');
            setFeedback('');
          } else {
            setGameComplete(true);
            addPoints(currentUser.email, 100);
            awardBadge(currentUser.email, 3);
          }
        }, 1500);
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Property Adventure</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h3 className="text-xl font-bold mb-4">{levels[currentLevel].name}</h3>
          <p className="mb-4">{levels[currentLevel].question}</p>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter your answer"
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600"
          >
            Submit
          </button>
          {feedback && (
            <p className={`mt-4 text-center font-bold ${
              feedback.includes('Correct') ? 'text-green-600' : 'text-red-600'
            }`}>
              {feedback}
            </p>
          )}
        </div>
        <p className="mt-4 text-center">Level: {currentLevel + 1}/{levels.length}</p>
      </div>
    );
  };

  const TimedGame = () => {
    const [timeLeft, setTimeLeft] = useState(60);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);

    const questions = [
      {
        expression: '4 × 5 = 5 × 4',
        property: 'Commutative'
      },
      {
        expression: '(2 × 3) × 4 = 2 × (3 × 4)',
        property: 'Associative'
      },
      {
        expression: '3 × (4 + 2) = 3 × 4 + 3 × 2',
        property: 'Distributive'
      }
    ];

    useEffect(() => {
      if (timeLeft > 0 && !gameComplete) {
        const timer = setInterval(() => {
          setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearInterval(timer);
      } else if (timeLeft === 0) {
        setGameComplete(true);
        addPoints(currentUser.email, score * 10);
        if (score >= questions.length) {
          awardBadge(currentUser.email, 4);
        }
      }
    }, [timeLeft, gameComplete]);

    const handleAnswer = (selectedProperty) => {
      if (selectedProperty === questions[currentQuestion].property) {
        setScore(score + 1);
      }
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setGameComplete(true);
      }
    };

    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">Timed Challenge</h2>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <div className="text-center mb-4">
            <p className="text-2xl font-bold text-red-600">Time: {timeLeft}s</p>
            <p className="text-xl">Score: {score}</p>
          </div>
          {!gameComplete ? (
            <>
              <p className="text-xl mb-4">{questions[currentQuestion].expression}</p>
              <div className="grid grid-cols-2 gap-4">
                {['Commutative', 'Associative', 'Distributive', 'Identity'].map(property => (
                  <button
                    key={property}
                    onClick={() => handleAnswer(property)}
                    className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    {property}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center">
              <p className="text-2xl font-bold mb-4">Game Over!</p>
              <p className="text-xl">Final Score: {score}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderGame = () => {
    switch (activeGame) {
      case 'matching':
        return <MatchingGame />;
      case 'quiz':
        return <QuizGame />;
      case 'adventure':
        return <AdventureGame />;
      case 'timed':
        return <TimedGame />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
            {games.map(game => (
              <div
                key={game.id}
                onClick={() => setActiveGame(game.id)}
                className="bg-white p-6 rounded-lg shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
              >
                <div className="text-4xl mb-4">{game.icon}</div>
                <h3 className="text-xl font-bold mb-2">{game.title}</h3>
                <p className="text-gray-600">{game.description}</p>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    // <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100">
    //   <div className="max-w-6xl mx-auto py-8">
    //     {activeGame && (
    //       <button
    //         onClick={() => {
    //           setActiveGame(null);
    //           setGameComplete(false);
    //           setScore(0);
    //         }}
    //         className="mb-4 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
    //       >
    //         ← Back to Games
    //       </button>
    //     )}
    //     {renderGame()}
    //   </div>
    // </div>
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-5xl mx-auto">
      <Header type="h1" fontSize="3xl" weight="bold" className="mb-6 text-center">Not yet available</Header>
  </div>
  </div>  
  );
};

export default GamePage; 