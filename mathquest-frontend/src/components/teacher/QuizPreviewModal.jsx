import React, { useEffect, useState } from 'react';
import { Dialog } from '@headlessui/react';
import { Header } from '../../ui/heading';
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
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex justify-between items-center mb-4">
              <Header type="h2" fontSize="2xl" weight="bold" className="mb-6">
                Quiz Preview
              </Header>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
            {loading ? (
              <div>Loading...</div>
            ) : error ? (
              <div className="text-red-500">{error}</div>
            ) : quiz ? (
              <div>
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-1">{quiz.quizName}</h3>
                  <p className="text-gray-700 mb-2">{quiz.description}</p>
                  <div className="text-xs text-gray-600 space-x-2">
                    <span>Available From: {formatDate(quiz.availableFrom)}</span>
                    <span>Available To: {formatDate(quiz.availableTo)}</span>
                  </div>
                  <div className="text-xs text-gray-600 space-x-2 mt-1">
                    <span>Time Limit: {quiz.timeLimitMinutes} min</span>
                    <span>Passing Score: {quiz.passingScore}/{quiz.overallScore}</span>
                  </div>
                </div>
                <div className="space-y-6">
                  {quiz.questions && quiz.questions.length > 0 ? quiz.questions.map((q, idx) => (
                    <div key={idx} className="p-4 border rounded bg-gray-50">
                      <div className="mb-2 font-semibold">Q{idx + 1}: {q.questionText}</div>
                      <div className="mb-1 text-xs text-gray-600">Type: {q.questionType.replace('_', ' ')}</div>
                      {q.questionType === 'MULTIPLE_CHOICE' && q.options && (
                        <ul className="space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <li key={oIdx} className={`p-2 rounded ${q.correctAnswer === opt ? 'bg-green-100 font-bold' : ''}`}>{opt}</li>
                          ))}
                        </ul>
                      )}
                      {q.questionType === 'CHECKBOX' && q.options && (
                        <ul className="space-y-1">
                          {q.options.map((opt, oIdx) => (
                            <li key={oIdx} className={`p-2 rounded ${Array.isArray(q.correctAnswer) && q.correctAnswer.includes(opt) ? 'bg-green-100 font-bold' : ''}`}>{opt}</li>
                          ))}
                        </ul>
                      )}
                      {q.questionType === 'IDENTIFICATION' && (
                        <div className="p-2 rounded bg-green-100 font-bold">Correct Answer: {q.correctAnswer}</div>
                      )}
                      <div className="mt-2 text-xs text-gray-500">Points: {q.points}</div>
                    </div>
                  )) : <div className="text-gray-500">No questions found.</div>}
                </div>
              </div>
            ) : null}
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default QuizPreviewModal; 