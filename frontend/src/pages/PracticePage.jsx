import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PracticePage = () => {
  const [currentProblem, setCurrentProblem] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isCorrect, setIsCorrect] = useState(null);
  const [showNext, setShowNext] = useState(false);
  const navigate = useNavigate();

  const practiceProblems = [
    {
      problem: "Use the commutative property to rewrite: 7 × 4",
      answer: "4 × 7",
      hint: "The commutative property allows you to change the order of factors.",
      property: "Commutative Property"
    },
    {
      problem: "Use the associative property to rewrite: (3 × 2) × 5",
      answer: "3 × (2 × 5)",
      hint: "The associative property allows you to change the grouping of factors.",
      property: "Associative Property"
    },
    {
      problem: "Use the distributive property to rewrite: 6 × (3 + 2)",
      answer: "(6 × 3) + (6 × 2)",
      hint: "The distributive property allows you to multiply each addend separately.",
      property: "Distributive Property"
    },
    {
      problem: "What is 9 × 1? (Use the identity property)",
      answer: "9",
      hint: "The identity property states that any number multiplied by 1 equals itself.",
      property: "Identity Property"
    },
    {
      problem: "What is 5 × 0? (Use the zero property)",
      answer: "0",
      hint: "The zero property states that any number multiplied by 0 equals 0.",
      property: "Zero Property"
    }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Normalize answers for comparison (remove spaces, convert to lowercase)
    const normalizedUserAnswer = userAnswer.trim().toLowerCase();
    const normalizedCorrectAnswer = practiceProblems[currentProblem].answer.trim().toLowerCase();
    
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;
    setIsCorrect(correct);
    
    if (correct) {
      setFeedback("✅ Correct! Well done!");
    } else {
      setFeedback(`❌ Not quite. The correct answer is: ${practiceProblems[currentProblem].answer}`);
    }
    
    setShowNext(true);
  };

  const handleNext = () => {
    if (currentProblem + 1 < practiceProblems.length) {
      setCurrentProblem(currentProblem + 1);
      setUserAnswer('');
      setFeedback('');
      setIsCorrect(null);
      setShowNext(false);
    } else {
      // All problems completed
      navigate('/challenge');
    }
  };

  const handleShowHint = () => {
    setFeedback(`💡 Hint: ${practiceProblems[currentProblem].hint}`);
    setShowNext(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl w-full">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600">Practice Problem {currentProblem + 1}/{practiceProblems.length}</span>
            <span className="text-purple-600 font-bold">{practiceProblems[currentProblem].property}</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            {practiceProblems[currentProblem].problem}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="mb-6">
          <div className="mb-4">
            <label htmlFor="answer" className="block text-gray-700 text-sm font-bold mb-2">
              Your Answer:
            </label>
            <input
              type="text"
              id="answer"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              placeholder="Type your answer here..."
              disabled={showNext}
            />
          </div>
          
          <div className="flex space-x-4">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-full"
              disabled={showNext}
            >
              Submit Answer
            </button>
            
            <button
              type="button"
              onClick={handleShowHint}
              className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-6 rounded-full"
              disabled={showNext}
            >
              Show Hint
            </button>
          </div>
        </form>

        {feedback && (
          <div className={`p-4 rounded-lg mb-6 ${
            isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            <p>{feedback}</p>
          </div>
        )}

        {showNext && (
          <div className="flex justify-center">
            <button
              onClick={handleNext}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-full"
            >
              {currentProblem + 1 < practiceProblems.length ? 'Next Problem' : 'Try the Challenge!'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PracticePage; 