import React from 'react';
import { useContent } from '../../context/ContentContext';

const ChallengeSection = () => {
  const { challengeQuestions, updateContent } = useContent();

  const handleEdit = (question) => {
    // Implement edit functionality
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      updateContent('challenge', id, null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Challenge Questions</h2>
      <div className="space-y-4">
        {challengeQuestions.map(question => (
          <div key={question.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{question.question}</p>
                <p className="text-sm text-gray-500">Property: {question.property}</p>
                <p className="text-sm text-gray-500">Correct Answer: {question.correctAnswer}</p>
                <p className="text-sm text-gray-500">Explanation: {question.explanation}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(question)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(question.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChallengeSection; 