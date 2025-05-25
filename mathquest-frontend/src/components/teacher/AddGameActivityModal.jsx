import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import gameService from '../../services/gameService';



const AddGameActivityModal = ({ isOpen, onClose, classroomId, activityId, onActivityCreated }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    instructions: '',
    topic: '',
    type: 'FALLING_GAME'
  });
  const [loading, setLoading] = useState(false);
  
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!classroomId && !activityId) {
      toast.error('No classroom or activity selected. Please select one first.');
      return;
    }

    setLoading(true);

    try {
      // Create the game with either activityId or classroomId
      const gameData = {
        name: formData.name,
        instructions: formData.instructions,
        topic: formData.topic,
        type: formData.type
      };

      // If activityId is provided, use it, otherwise use classroomId
      if (activityId) {
        gameData.activityId = activityId;
      } else {
        gameData.classroomId = classroomId;
      }
      
      const gameResponse = await gameService.createGame(gameData);

      toast.success('Game activity created successfully!');
      onActivityCreated(gameResponse);
      onClose();
    } catch (error) {
      console.error('Error creating game activity:', error);
      toast.error(error.response?.data?.message || 'Failed to create game activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Add Game Activity</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

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
              placeholder="Enter game name"
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
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md mr-2 hover:bg-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 ${
                loading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Creating...' : 'Create Game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGameActivityModal; 


