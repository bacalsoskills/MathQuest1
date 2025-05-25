import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleNavigation = (path) => {
    if (!currentUser) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-blue-800 mb-6">
          Math Properties Adventure! 🚀
        </h1>
        <p className="text-xl text-gray-700 mb-8">
          Master multiplication properties through fun and interactive quizzes!
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <button
            onClick={() => handleNavigation('/game')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105 flex flex-col items-center justify-center p-6"
          >
            <span className="text-3xl mb-2">🎮</span>
            <span className="text-lg">Start Game</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/learning')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105 flex flex-col items-center justify-center p-6"
          >
            <span className="text-3xl mb-2">📚</span>
            <span className="text-lg">Learn Properties</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/practice')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105 flex flex-col items-center justify-center p-6"
          >
            <span className="text-3xl mb-2">✏️</span>
            <span className="text-lg">Practice Problems</span>
          </button>
          
          <button
            onClick={() => handleNavigation('/challenge')}
            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105 flex flex-col items-center justify-center p-6"
          >
            <span className="text-3xl mb-2">🏆</span>
            <span className="text-lg">Take the Challenge</span>
          </button>
        </div>
        
        <button
          onClick={() => handleNavigation('/about')}
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105"
        >
          Learn More ℹ️
        </button>
      </div>
    </div>
  );
};

export default HomePage; 