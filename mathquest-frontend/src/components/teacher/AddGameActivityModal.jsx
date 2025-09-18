import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import gameService from '../../services/gameService';
import { Button } from '../../ui/button';
import Modal from '../../ui/modal';

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

  const modalFooter = (
    <>
      <Button
        variant="cancel"
        size="sm"
        rounded="full"
        onClick={onClose}
        disabled={loading}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="default"
        size="sm"
        onClick={handleSubmit}
        rounded="full"
        disabled={loading}
      >
        {loading ? 'Creating...' : 'Create Game'}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Game Activity"
      footer={modalFooter}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Game Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
            placeholder="Enter game name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions}
            onChange={handleChange}
            rows="3"
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors resize-none"
            placeholder="Enter game instructions"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Topic *
          </label>
          <input
            type="text"
            name="topic"
            value={formData.topic}
            onChange={handleChange}
            required
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
            placeholder="e.g., Addition, Multiplication, Fractions"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Game Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
          >
            <option value="FALLING_GAME">Falling Game</option>
            <option value="MULTIPLE_CHOICE">Multiple Choice Game</option>
          </select>
        </div>
      </form>
    </Modal>
  );
};

export default AddGameActivityModal; 


