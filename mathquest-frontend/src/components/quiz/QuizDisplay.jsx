// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Button } from '../../ui/button';
// import { toast } from 'react-hot-toast';
// import quizService from '../../services/quizService';
// import { useAuth } from '../../context/AuthContext';

// const MultipleChoiceQuestion = ({ question, onAnswer, selectedAnswer }) => {
//   return (
//     <div className="space-y-3">
//       {question.options.map((option, index) => {
//         const isSelected = selectedAnswer === option;
//         let buttonClass = `w-full text-left p-4 rounded-lg transition-colors
//           ${isSelected ? 'ring-2 ring-blue-300 font-semibold' : 'opacity-85 hover:opacity-100'} `;
        
//         if (isSelected) {
//           if (index === 0) buttonClass += 'bg-blue-700 text-white';
//           else if (index === 1) buttonClass += 'bg-green-700 text-white';
//           else if (index === 2) buttonClass += 'bg-pink-700 text-white';
//           else if (index === 3) buttonClass += 'bg-yellow-700 text-white';
//         } else {
//           if (index === 0) buttonClass += 'bg-blue-400 text-white';
//           else if (index === 1) buttonClass += 'bg-green-400 text-white';
//           else if (index === 2) buttonClass += 'bg-pink-400 text-white';
//           else if (index === 3) buttonClass += 'bg-yellow-400 text-white';
//         }
        
//         return (
//           <button
//             key={index}
//             onClick={() => onAnswer(question.id, option)}
//             className={buttonClass}
//           >
//             {option}
//           </button>
//         );
//       })}
//     </div>
//   );
// };

// const IdentificationQuestion = ({ question, onAnswer, currentAnswer }) => {
//   return (
//     <div>
//       <input
//         type="text"
//         value={currentAnswer || ''}
//         onChange={(e) => onAnswer(question.id, e.target.value)}
//         placeholder="Type your answer here"
//         className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
//       />
//     </div>
//   );
// };

// const CheckboxQuestion = ({ question, onAnswer, selectedAnswers = [] }) => {
//   const handleCheckboxChange = (option) => {
//     const newAnswers = selectedAnswers.includes(option)
//       ? selectedAnswers.filter(ans => ans !== option)
//       : [...selectedAnswers, option];
//     onAnswer(question.id, newAnswers);
//   };

//   return (
//     <div className="space-y-3">
//       {question.options.map((option, index) => {
//         const isSelected = selectedAnswers.includes(option);
//         return (
//           <label
//             key={index}
//             className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors border 
//               ${isSelected 
//                 ? 'bg-blue-100 border-blue-500 font-semibold' 
//                 : 'bg-gray-50 border-gray-300 opacity-85 hover:opacity-100 hover:bg-gray-100'}`}
//           >
//             <input
//               type="checkbox"
//               checked={isSelected}
//               onChange={() => handleCheckboxChange(option)}
//               className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
//             />
//             <span className={`${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{option}</span>
//           </label>
//         );
//       })}
//     </div>
//   );
// };

// const QuizDisplay = ({ activity, onComplete }) => {
//   const [quiz, setQuiz] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const navigate = useNavigate();
//   const { currentUser: user } = useAuth();

//   useEffect(() => {
//     const fetchQuiz = async () => {
//       try {
//         const quizData = await quizService.getQuizByActivityId(activity.id);
//         setQuiz(quizData);
//       } catch (error) {
//         console.error('Error fetching quiz:', error);
//         toast.error('Failed to load quiz');
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchQuiz();
//   }, [activity.id]);

//   const handleStartQuiz = () => {
//     navigate(`/quiz-attempt/${quiz.id}`);
//   };

//   if (loading) {
//     return <div>Loading quiz...</div>;
//   }

//   if (!quiz) {
//     return <div>No quiz available for this activity.</div>;
//   }

//   return (
//     <div className="border rounded-lg p-6 mb-4">
//       <h4 className="text-lg font-semibold mb-2">{quiz.quizName}</h4>
//       <p className="text-gray-600 mb-4">{quiz.description}</p>
      
//       <div className="flex flex-wrap gap-2 mb-4">
//         <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
//           {quiz.totalItems} questions
//         </span>
//         <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
//           {quiz.timeLimitMinutes} minutes
//         </span>
//         {quiz.repeatable && (
//           <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
//             Repeatable
//           </span>
//         )}
//       </div>

//       <div className="flex justify-between items-center">
//         <div className="text-sm text-gray-600">
//           Passing Score: {quiz.passingScore}%
//         </div>
//         <Button onClick={handleStartQuiz}>
//           Start Quiz
//         </Button>
//       </div>
//     </div>
//   );
// };

// export default QuizDisplay;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "../../ui/button"
import { toast } from 'react-hot-toast';
import quizService from '../../services/quizService';
import { useAuth } from '../../context/AuthContext';

const MultipleChoiceQuestion = ({ question, onAnswer, selectedAnswer }) => {
  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswer === option;
        let buttonClass = `w-full text-left p-4 rounded-lg transition-colors
          ${isSelected ? 'ring-2 ring-blue-300 font-semibold' : 'opacity-85 hover:opacity-100'} `;
        
        if (isSelected) {
          if (index === 0) buttonClass += 'bg-blue-700 text-white';
          else if (index === 1) buttonClass += 'bg-green-700 text-white';
          else if (index === 2) buttonClass += 'bg-pink-700 text-white';
          else if (index === 3) buttonClass += 'bg-yellow-700 text-white';
        } else {
          if (index === 0) buttonClass += 'bg-blue-400 text-white';
          else if (index === 1) buttonClass += 'bg-green-400 text-white';
          else if (index === 2) buttonClass += 'bg-pink-400 text-white';
          else if (index === 3) buttonClass += 'bg-yellow-400 text-white';
        }
        
        return (
          <button
            key={index}
            onClick={() => onAnswer(question.id, option)}
            className={buttonClass}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

const IdentificationQuestion = ({ question, onAnswer, currentAnswer }) => {
  return (
    <div>
      <input
        type="text"
        value={currentAnswer || ''}
        onChange={(e) => onAnswer(question.id, e.target.value)}
        placeholder="Type your answer here"
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
      />
    </div>
  );
};

const CheckboxQuestion = ({ question, onAnswer, selectedAnswers = [] }) => {
  const handleCheckboxChange = (option) => {
    const newAnswers = selectedAnswers.includes(option)
      ? selectedAnswers.filter(ans => ans !== option)
      : [...selectedAnswers, option];
    onAnswer(question.id, newAnswers);
  };

  return (
    <div className="space-y-3">
      {question.options.map((option, index) => {
        const isSelected = selectedAnswers.includes(option);
        return (
          <label
            key={index}
            className={`flex items-center p-4 rounded-lg cursor-pointer transition-colors border 
              ${isSelected 
                ? 'bg-blue-100 border-blue-500 font-semibold' 
                : 'bg-gray-50 border-gray-300 opacity-85 hover:opacity-100 hover:bg-gray-100'}`}
          >
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => handleCheckboxChange(option)}
              className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
            />
            <span className={`${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{option}</span>
          </label>
        );
      })}
    </div>
  );
};

const QuizDisplay = ({ activity, onComplete }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { currentUser: user } = useAuth();

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const quizData = await quizService.getQuizByActivityId(activity.id);
        setQuiz(quizData);
      } catch (error) {
        console.error('Error fetching quiz:', error);
        toast.error('Failed to load quiz');
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [activity.id]);

  const handleStartQuiz = async () => {
    try {
      // Create a new quiz attempt
      const attempt = await quizService.createQuizAttempt(quiz.id, user.id);
  
      
      // Navigate to the quiz attempt page with the attempt ID
      navigate(`/quiz-attempt/${quiz.id}/attempt/${attempt.id}`, {
        state: { 
          onComplete: onComplete,
          activityId: activity.id
        }
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz');
    }
  };

  if (loading) {
    return <div>Loading quiz...</div>;
  }

  if (!quiz) {
    return <div>No quiz available for this activity.</div>;
  }

  return (
    <div className="border rounded-lg p-6 mb-4">
      <h4 className="text-lg font-semibold mb-2">{quiz.quizName}</h4>
      <p className="text-gray-600 mb-4">{quiz.description}</p>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
          {quiz.totalItems} questions
        </span>
        <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
          {quiz.timeLimitMinutes} minutes
        </span>
        {quiz.repeatable && (
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            Repeatable
          </span>
        )}
      </div>

      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Passing Score: {quiz.passingScore}%
        </div>
        <Button onClick={handleStartQuiz}>
          Start Quiz
        </Button>
      </div>
    </div>
  );
};

export default QuizDisplay;