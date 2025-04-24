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
  const [activeTab, setActiveTab] = useState('properties');
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
  }, [isAdmin, navigate]);

  const handleUpdate = (type, id, updatedData) => {
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
      // Here you would typically save the custom challenge to your backend
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
      default:
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
    // This would typically be calculated based on completion rates
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
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">
          Admin Dashboard 🛠️
        </h1>

        {/* Tabs */}
        <div className="flex space-x-4 mb-8 justify-center">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'properties'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-blue-50'
            }`}
          >
            Properties
          </button>
          <button
            onClick={() => setActiveTab('practice')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'practice'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-blue-50'
            }`}
          >
            Practice Problems
          </button>
          <button
            onClick={() => setActiveTab('challenge')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'challenge'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-blue-50'
            }`}
          >
            Challenge Questions
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'students'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-blue-50'
            }`}
          >
            Student Progress
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 hover:bg-blue-50'
            }`}
          >
            Reports & Analytics
          </button>
        </div>

        {/* Content Management */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          {activeTab === 'properties' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Manage Properties</h2>
              <button
                onClick={() => handleAdd('properties', {
                  name: 'New Property',
                  formula: 'a × b = b × a',
                  description: 'Description',
                  example: 'Example',
                  icon: '🔄'
                })}
                className="mb-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Add New Property
              </button>
              <div className="space-y-4">
                {properties.map((property) => (
                  <div key={property.id} className="border p-4 rounded-lg">
                    {editingItem?.type === 'properties' && editingItem.id === property.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Name
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Formula
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editForm.formula}
                            onChange={(e) => setEditForm({...editForm, formula: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Description
                          </label>
                          <textarea
                            className="w-full p-2 border rounded"
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Example
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editForm.example}
                            onChange={(e) => setEditForm({...editForm, example: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Icon
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editForm.icon}
                            onChange={(e) => setEditForm({...editForm, icon: e.target.value})}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{property.name}</h3>
                          <p className="text-gray-600">{property.formula}</p>
                          <p className="mt-2">{property.description}</p>
                          <p className="mt-2 text-blue-600">{property.example}</p>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleEdit('properties', property)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete('properties', property.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'practice' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Manage Practice Problems</h2>
              <button
                onClick={() => handleAdd('practice', {
                  problem: 'New Problem',
                  answer: 'Answer',
                  hint: 'Hint',
                  property: 'Property'
                })}
                className="mb-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Add New Problem
              </button>
              <div className="space-y-4">
                {practiceProblems.map((problem) => (
                  <div key={problem.id} className="border p-4 rounded-lg">
                    {editingItem?.type === 'practice' && editingItem.id === problem.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Problem
                          </label>
                          <textarea
                            className="w-full p-2 border rounded"
                            value={editForm.problem}
                            onChange={(e) => setEditForm({...editForm, problem: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Answer
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editForm.answer}
                            onChange={(e) => setEditForm({...editForm, answer: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Hint
                          </label>
                          <textarea
                            className="w-full p-2 border rounded"
                            value={editForm.hint}
                            onChange={(e) => setEditForm({...editForm, hint: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Property
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border rounded"
                            value={editForm.property}
                            onChange={(e) => setEditForm({...editForm, property: e.target.value})}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{problem.problem}</h3>
                          <p className="text-gray-600">Answer: {problem.answer}</p>
                          <p className="text-gray-600">Hint: {problem.hint}</p>
                          <p className="text-gray-600">Property: {problem.property}</p>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleEdit('practice', problem)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete('practice', problem.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'challenge' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Manage Challenge Questions</h2>
              <button
                onClick={() => handleAdd('challenge', {
                  question: 'New Question',
                  answers: ['Answer 1', 'Answer 2', 'Answer 3', 'Answer 4'],
                  correctAnswer: 'Answer 1',
                  explanation: 'Explanation'
                })}
                className="mb-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Add New Question
              </button>
              <div className="space-y-4">
                {challengeQuestions.map((question) => (
                  <div key={question.id} className="border p-4 rounded-lg">
                    {editingItem?.type === 'challenge' && editingItem.id === question.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Question
                          </label>
                          <textarea
                            className="w-full p-2 border rounded"
                            value={editForm.question}
                            onChange={(e) => setEditForm({...editForm, question: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Answers
                          </label>
                          {editForm.answers.map((answer, index) => (
                            <input
                              key={index}
                              type="text"
                              className="w-full p-2 border rounded mb-2"
                              value={answer}
                              onChange={(e) => {
                                const newAnswers = [...editForm.answers];
                                newAnswers[index] = e.target.value;
                                setEditForm({...editForm, answers: newAnswers});
                              }}
                            />
                          ))}
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Correct Answer
                          </label>
                          <select
                            className="w-full p-2 border rounded"
                            value={editForm.correctAnswer}
                            onChange={(e) => setEditForm({...editForm, correctAnswer: e.target.value})}
                          >
                            {editForm.answers.map((answer, index) => (
                              <option key={index} value={answer}>
                                {answer}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-bold mb-2">
                            Explanation
                          </label>
                          <textarea
                            className="w-full p-2 border rounded"
                            value={editForm.explanation}
                            onChange={(e) => setEditForm({...editForm, explanation: e.target.value})}
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold">{question.question}</h3>
                          <div className="mt-2">
                            <p className="text-gray-600">Answers:</p>
                            <ul className="list-disc list-inside ml-4">
                              {question.answers.map((answer, index) => (
                                <li key={index} className={answer === question.correctAnswer ? 'text-green-600' : ''}>
                                  {answer}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <p className="mt-2 text-gray-600">Explanation: {question.explanation}</p>
                        </div>
                        <div className="space-x-2">
                          <button
                            onClick={() => handleEdit('challenge', question)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete('challenge', question.id)}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Student Progress Monitoring */}
          {activeTab === 'students' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Student Progress Monitoring</h2>
              
              {/* Student Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Student
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={selectedStudent || ''}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">Select a student</option>
                  {Object.keys(userProgress).map((studentId) => (
                    <option key={studentId} value={studentId}>
                      {studentId}
                    </option>
                  ))}
                </select>
              </div>

              {/* Student Progress Details */}
              {selectedStudent && userProgress[selectedStudent] && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <h3 className="text-xl font-bold mb-4">Progress Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-bold">Points:</p>
                      <p>{userProgress[selectedStudent].points || 0}</p>
                    </div>
                    <div>
                      <p className="font-bold">Badges Earned:</p>
                      <div className="flex flex-wrap gap-2">
                        {userProgress[selectedStudent].badges?.map((badge, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {badge}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-bold">Completed Challenges:</p>
                      <p>{userProgress[selectedStudent].completedChallenges?.length || 0}</p>
                    </div>
                    <div>
                      <p className="font-bold">Last Activity:</p>
                      <p>{new Date(userProgress[selectedStudent].lastUpdated).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Challenge Assignment */}
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4">Assign Custom Challenge</h3>
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Challenge Title
                      </label>
                      <input
                        type="text"
                        className="w-full p-2 border rounded"
                        value={customChallenge.title}
                        onChange={(e) => setCustomChallenge({...customChallenge, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Description
                      </label>
                      <textarea
                        className="w-full p-2 border rounded"
                        value={customChallenge.description}
                        onChange={(e) => setCustomChallenge({...customChallenge, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Points
                      </label>
                      <input
                        type="number"
                        className="w-full p-2 border rounded"
                        value={customChallenge.points}
                        onChange={(e) => setCustomChallenge({...customChallenge, points: parseInt(e.target.value)})}
                      />
                    </div>
                    <button
                      onClick={handleAssignCustomChallenge}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                      Assign Challenge
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reports & Analytics */}
          {activeTab === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Reports & Analytics</h2>
              
              {/* Report Type Selection */}
              <div className="mb-6">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Select Report Type
                </label>
                <select
                  className="w-full p-2 border rounded"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="overall">Overall Progress</option>
                  <option value="student">Student Performance</option>
                  <option value="challenges">Challenge Analytics</option>
                </select>
              </div>

              {/* Generate Report Button */}
              <button
                onClick={generateReport}
                className="mb-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Generate Report
              </button>

              {/* Report Display */}
              {reportData && (
                <div className="bg-white p-6 rounded-lg shadow-lg">
                  {reportType === 'overall' && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Overall Progress Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-bold">Total Students:</p>
                          <p>{reportData.totalStudents}</p>
                        </div>
                        <div>
                          <p className="font-bold">Average Points:</p>
                          <p>{reportData.averagePoints.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="font-bold">Top Students:</p>
                          <ul className="list-disc list-inside">
                            {reportData.topStudents.map((student, index) => (
                              <li key={index}>{student.userId}: {student.points} points</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="font-bold">Badges Distribution:</p>
                          <ul className="list-disc list-inside">
                            {Object.entries(reportData.badgesDistribution).map(([badge, count]) => (
                              <li key={badge}>{badge}: {count} students</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'student' && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Student Performance Report</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-bold">Student ID:</p>
                          <p>{reportData.student}</p>
                        </div>
                        <div>
                          <p className="font-bold">Points:</p>
                          <p>{reportData.progress.points}</p>
                        </div>
                        <div>
                          <p className="font-bold">Completed Challenges:</p>
                          <p>{reportData.completedChallenges.length}</p>
                        </div>
                        <div>
                          <p className="font-bold">Badges Earned:</p>
                          <div className="flex flex-wrap gap-2">
                            {reportData.badges.map((badge, index) => (
                              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {reportType === 'challenges' && (
                    <div>
                      <h3 className="text-xl font-bold mb-4">Challenge Analytics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="font-bold">Total Challenges:</p>
                          <p>{reportData.totalChallenges}</p>
                        </div>
                        <div>
                          <p className="font-bold">Average Completion Rate:</p>
                          <p>{(reportData.averageCompletionRate * 100).toFixed(2)}%</p>
                        </div>
                        <div>
                          <p className="font-bold">Most Difficult Challenges:</p>
                          <ul className="list-disc list-inside">
                            {reportData.mostDifficultChallenges.map((challenge, index) => (
                              <li key={index}>{challenge.question}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Export Data Button */}
              <div className="mt-6">
                <button
                  onClick={exportData}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                >
                  Export Data for Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 