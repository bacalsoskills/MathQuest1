import React, { useState, useEffect } from 'react';
import quizService from '../../services/quizService';
import { Header } from '../../ui/heading';

const QuizTaker = ({ quizId, studentId, onComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizData = await quizService.getQuizById(quizId);
        setQuiz(quizData);
        // Initialize answers object
        const initialAnswers = {};
        quizData.questions.forEach((_, index) => {
          initialAnswers[index] = null;
        });
        setAnswers(initialAnswers);
      } catch (err) {
        setError('Failed to load quiz');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setAnswers({
      ...answers,
      [questionIndex]: answerIndex
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await quizService.submitQuizAnswers(quizId, {
        studentId,
        answers: Object.entries(answers).map(([questionIndex, answerIndex]) => ({
          questionIndex: parseInt(questionIndex),
          selectedAnswer: answerIndex
        }))
      });
      setResults(response);
      setSubmitted(true);
      if (onComplete) {
        onComplete(response);
      }
    } catch (err) {
      setError('Failed to submit quiz');
      console.error(err);
    }
  };

  if (loading) {
    return <div>Loading quiz...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!quiz) {
    return <div>Quiz not found</div>;
  }

  if (submitted && results) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <Header type="h2" className="mb-6">Quiz Results</Header>
        <div className="text-xl mb-4">
          Score: {results.score}%
        </div>
        <div className="mb-4">
          Correct Answers: {results.correctAnswers} / {quiz.questions.length}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Take Another Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <Header type="h2" className="mb-6">{quiz.title}</Header>
      <p className="text-gray-600 mb-8">{quiz.description}</p>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Header type="h3" className="text-xl">
            Question {currentQuestion + 1} of {quiz.questions.length}
          </Header>
          <div className="text-sm text-gray-500">
            {Object.values(answers).filter(a => a !== null).length} of {quiz.questions.length} answered
          </div>
        </div>

        <div className="mb-6">
          <p className="text-lg mb-4">{quiz.questions[currentQuestion].question}</p>
          <div className="space-y-3">
            {quiz.questions[currentQuestion].options.map((option, index) => (
              <label
                key={index}
                className={`block p-4 border rounded cursor-pointer hover:bg-gray-50 ${
                  answers[currentQuestion] === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name={`question-${currentQuestion}`}
                  checked={answers[currentQuestion] === index}
                  onChange={() => handleAnswerSelect(currentQuestion, index)}
                  className="mr-3"
                />
                {option}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
            disabled={currentQuestion === 0}
            className="px-4 py-2 text-blue-600 disabled:text-gray-400"
          >
            Previous
          </button>
          <button
            onClick={() => setCurrentQuestion(prev => Math.min(quiz.questions.length - 1, prev + 1))}
            disabled={currentQuestion === quiz.questions.length - 1}
            className="px-4 py-2 text-blue-600 disabled:text-gray-400"
          >
            Next
          </button>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={Object.values(answers).some(a => a === null)}
          className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
        >
          Submit Quiz
        </button>
      </div>
    </div>
  );
};

export default QuizTaker; 