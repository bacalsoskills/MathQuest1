import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../config/config';
import { useAuth } from '../../context/AuthContext';

const CreateGameForm = ({ classroomId, lessonId, activityId, onSuccess }) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    topic: '',
    level: 'EASY', // Default value
    type: 'FALLING_GAME' // Default value
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        `${API_URL}/games`,
        {
          ...formData,
          activityId
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      toast.success('Game created successfully!');
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (error) {
      console.error('Error creating game:', error);
      toast.error(error.response?.data?.message || 'Failed to create game');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-4">Create Game</h2>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Game Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter game name111111111"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Instructions</label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter game instructions"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Topic</label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Addition, Multiplication, Fractions"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">Difficulty Level</label>
          <select
            name="level"
            value={formData.level}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">Game Type</label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="FALLING_GAME">Falling Game</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice Game</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onSuccess ? onSuccess() : navigate(-1)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md mr-2 hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 ${
              isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {isSubmitting ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGameForm; 