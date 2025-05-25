import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useUserProgress } from '../context/UserProgressContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { properties, practiceProblems, challengeQuestions, updateContent } = useContent();
  const { userProgress, leaderboard, addPoints, awardBadge } = useUserProgress();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    formula: '',
    description: '',
    example: '',
    icon: '',
    problem: '',
    answer: '',
    hint: '',
    property: '',
    question: '',
    answers: [],
    correctAnswer: '',
    explanation: ''
  });
  const [customChallenge, setCustomChallenge] = useState({
    title: '',
    description: '',
    points: 0,
    assignedTo: []
  });
  const [reportType, setReportType] = useState('overall');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    if (!isAdmin()) {
      navigate('/');
    }
    console.log('Properties:', properties);
    console.log('Practice Problems:', practiceProblems);
    console.log('Challenge Questions:', challengeQuestions);
    console.log('User Progress:', userProgress);
  }, [isAdmin, navigate, properties, practiceProblems, challengeQuestions, userProgress]);

  const handleUpdate = (type, id, updatedData) => {
    console.log('Updating content:', { type, id, updatedData });
    updateContent(type, id, updatedData);
  };

  const handleDelete = (type, id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      updateContent(type, id, null);
    }
  };

  const handleAdd = (type, newData) => {
    updateContent(type, null, newData);
  };

  const handleAssignCustomChallenge = () => {
    if (customChallenge.title && customChallenge.description && customChallenge.points > 0) {
      console.log('Custom challenge assigned:', customChallenge);
      alert('Custom challenge assigned successfully!');
      setCustomChallenge({
        title: '',
        description: '',
        points: 0,
        assignedTo: []
      });
    }
  };

  const generateReport = () => {
    let data = null;
    switch (reportType) {
      case 'overall':
        data = {
          totalStudents: Object.keys(userProgress).length,
          averagePoints: leaderboard.reduce((acc, curr) => acc + curr.points, 0) / leaderboard.length,
          topStudents: leaderboard.slice(0, 5),
          badgesDistribution: calculateBadgesDistribution()
        };
        break;
      case 'student':
        if (selectedStudent) {
          data = {
            student: selectedStudent,
            progress: userProgress[selectedStudent],
            completedChallenges: getCompletedChallenges(selectedStudent),
            badges: getStudentBadges(selectedStudent)
          };
        }
        break;
      case 'challenges':
        data = {
          totalChallenges: challengeQuestions.length,
          averageCompletionRate: calculateChallengeCompletionRate(),
          mostDifficultChallenges: getMostDifficultChallenges()
        };
        break;
    }
    setReportData(data);
  };

  const calculateBadgesDistribution = () => {
    const distribution = {};
    Object.values(userProgress).forEach(progress => {
      progress.badges?.forEach(badge => {
        distribution[badge] = (distribution[badge] || 0) + 1;
      });
    });
    return distribution;
  };

  const getCompletedChallenges = (studentId) => {
    return userProgress[studentId]?.completedChallenges || [];
  };

  const getStudentBadges = (studentId) => {
    return userProgress[studentId]?.badges || [];
  };

  const calculateChallengeCompletionRate = () => {
    const totalAttempts = Object.values(userProgress).reduce((acc, curr) => 
      acc + (curr.completedChallenges?.length || 0), 0);
    return totalAttempts / (challengeQuestions.length * Object.keys(userProgress).length);
  };

  const getMostDifficultChallenges = () => {
    return challengeQuestions.slice(0, 3);
  };

  const exportData = () => {
    const data = {
      students: userProgress,
      leaderboard,
      challenges: challengeQuestions,
      practiceProblems,
      properties
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'math-properties-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEdit = (type, item) => {
    setEditingItem({ type, id: item.id });
    switch (type) {
      case 'properties':
        setEditForm({
          name: item.name,
          formula: item.formula,
          description: item.description,
          example: item.example,
          icon: item.icon
        });
        break;
      case 'practice':
        setEditForm({
          problem: item.problem,
          answer: item.answer,
          hint: item.hint,
          property: item.property
        });
        break;
      case 'challenge':
        setEditForm({
          question: item.question,
          answers: [...item.answers],
          correctAnswer: item.correctAnswer,
          explanation: item.explanation
        });
        break;
      default:
        break;
    }
  };

  const handleSaveEdit = () => {
    if (editingItem) {
      const { type, id } = editingItem;
      updateContent(type, id, editForm);
      setEditingItem(null);
      setEditForm({
        name: '',
        formula: '',
        description: '',
        example: '',
        icon: '',
        problem: '',
        answer: '',
        hint: '',
        property: '',
        question: '',
        answers: [],
        correctAnswer: '',
        explanation: ''
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditForm({
      name: '',
      formula: '',
      description: '',
      example: '',
      icon: '',
      problem: '',
      answer: '',
      hint: '',
      property: '',
      question: '',
      answers: [],
      correctAnswer: '',
      explanation: ''
    });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Admin Dashboard</h2>
      
      {/* Properties Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Properties</h3>
        <div className="space-y-4">
          {properties.map(property => (
            <div key={property.id} className="border p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{property.name}</h4>
                  <p className="text-gray-600">{property.formula}</p>
                  <p className="text-sm text-gray-500">{property.description}</p>
                  <p className="text-sm text-gray-500">Example: {property.example}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit('properties', property)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete('properties', property.id)}
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

      {/* Practice Problems Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Practice Problems</h3>
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
                    onClick={() => handleEdit('practice', problem)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete('practice', problem.id)}
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

      {/* Challenge Questions Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Challenge Questions</h3>
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
                    onClick={() => handleEdit('challenge', question)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete('challenge', question.id)}
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

      {/* Student Progress Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold mb-4">Student Progress</h3>
        <div className="space-y-4">
          {Object.entries(userProgress).map(([studentId, progress]) => (
            <div key={studentId} className="border p-4 rounded">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">Student ID: {studentId}</h4>
                  <p className="text-sm text-gray-500">Points: {progress.points || 0}</p>
                  <p className="text-sm text-gray-500">Badges: {progress.badges?.join(', ') || 'None'}</p>
                  <p className="text-sm text-gray-500">
                    Completed Challenges: {progress.completedChallenges?.length || 0}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedStudent(studentId)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Edit {editingItem.type}</h3>
            <div className="space-y-4">
              {Object.entries(editForm).map(([key, value]) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700">{key}</label>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard; 