import React from 'react';
import { useContent } from '../../context/ContentContext';

const PracticeSection = () => {
  const { practiceProblems, updateContent } = useContent();

  const handleEdit = (problem) => {
    // Implement edit functionality
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this problem?')) {
      updateContent('practice', id, null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Practice Problems</h2>
      <div className="space-y-4">
        {practiceProblems.map(problem => (
          <div key={problem.id} className="border p-4 rounded">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{problem.problem}</p>
                <p className="text-sm text-gray-500">Answer: {problem.answer}</p>
                <p className="text-sm text-gray-500">Hint: {problem.hint}</p>
                <p className="text-sm text-gray-500">Property: {problem.property}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(problem)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(problem.id)}
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

export default PracticeSection; 