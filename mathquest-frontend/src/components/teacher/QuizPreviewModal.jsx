import React, { useEffect, useState } from 'react';
import { Header } from '../../ui/heading';
import Modal from '../../ui/modal';
import quizService from '../../services/quizService';

const QuizPreviewModal = ({ isOpen, onClose, quizId }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && quizId) {
      setLoading(true);
      quizService.getQuiz(quizId)
        .then(data => {
          let questions = data.quizContent;
          if (typeof questions === 'string') {
            try { questions = JSON.parse(questions); } catch { questions = []; }
          }
          setQuiz({ ...data, questions });
        })
        .catch(() => setError('Failed to load quiz'))
        .finally(() => setLoading(false));
    }
    if (!isOpen) {
      setQuiz(null);
      setError('');
    }
  }, [isOpen, quizId]);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Quiz Preview"
      maxWidth="max-w-[95vw] md:max-w-5xl lg:max-w-6xl"
    >
      {loading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-8">{error}</div>
      ) : quiz ? (
        <div>
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-xl font-bold mb-2 text-gray-900">{quiz.quizName}</h3>
            <p className="text-gray-700 mb-3">{quiz.description}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-semibold">Available From:</span>
                <br />
                {formatDate(quiz.availableFrom)}
              </div>
              <div>
                <span className="font-semibold">Available To:</span>
                <br />
                {formatDate(quiz.availableTo)}
              </div>
              <div>
                <span className="font-semibold">Time Limit:</span>
                <br />
                {quiz.timeLimitMinutes} minutes
              </div>
              <div>
                <span className="font-semibold">Passing Score:</span>
                <br />
                {quiz.passingScore}/{quiz.overallScore}
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-semibold dark:text-gray-300 text-gray-900 border-b border-gray-200 pb-2">
              Questions ({quiz.questions?.length || 0})
            </h4>
            
            {quiz.questions && quiz.questions.length > 0 ? quiz.questions.map((q, idx) => (
              <div key={idx} className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="mb-3">
                  <div className="flex items-start gap-3">
                    <span className="bg-blue-100 text-blue-800 text-sm font-semibold px-2 py-1 rounded-full min-w-[2rem] text-center">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 mb-1 break-words whitespace-pre-wrap">{q.questionText}</div>
                      <div className="text-xs text-gray-500 mb-2">
                        Type: {q.questionType.replace(/_/g, ' ')} | Points: {q.points}
                      </div>
                    </div>
                  </div>
                </div>
                
                {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                  <div className="ml-11">
                    <ul className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <li key={oIdx} className={`p-3 rounded-lg border break-words whitespace-pre-wrap ${
                          q.correctAnswer === opt 
                            ? 'bg-green-50 border-green-200 text-green-800 font-medium' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <span className="mr-2 text-sm font-medium">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {opt}
                          {q.correctAnswer === opt && (
                            <span className="ml-2 text-green-600 text-sm">✓ Correct Answer</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {q.questionType === 'CHECKBOX' && q.options && (
                  <div className="ml-11">
                    <ul className="space-y-2">
                      {q.options.map((opt, oIdx) => (
                        <li key={oIdx} className={`p-3 rounded-lg border break-words whitespace-pre-wrap ${
                          Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt)
                            ? 'bg-green-50 border-green-200 text-green-800 font-medium' 
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <span className="mr-2 text-sm font-medium">
                            {String.fromCharCode(65 + oIdx)}.
                          </span>
                          {opt}
                          {Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt) && (
                            <span className="ml-2 text-green-600 text-sm">✓ Correct Answer</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {q.questionType === 'IDENTIFICATION' && (
                  <div className="ml-11">
                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 font-medium break-words whitespace-pre-wrap">
                      <span className="font-semibold">Correct Answer:</span> {q.correctAnswer}
                    </div>
                  </div>
                )}
              </div>
            )) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No questions found for this quiz.
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default QuizPreviewModal; 