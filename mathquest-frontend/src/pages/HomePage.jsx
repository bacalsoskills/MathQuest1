import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Header, Input, Button } from '../ui';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleRegister = () => navigate('/register');
  const handleLearnMore = () => navigate('/login');

  const HeroContent = (
    <div className="w-full flex flex-col items-center justify-center max-w-5xl mx-4 2xl:mx-auto  rounded-2xl shadow-xl py-12 2xl:py-28 px-8 border border-white/10 dark:border-gray-700 backdrop-blur-md bg-gray-100 dark:bg-transparent">
      <Input
        className="mb-6 w-48 sm:w-64 md:w-72 2xl:w-80 max-w-full mx-auto bg-transparent border-gray-400 dark:border-gray-500 text-center text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-400 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 px-4 py-2"
        type="text"
        value="MathQuest"
        readOnly
        aria-label="Brand name"
      />
      <Header
        type="h1"
        fontSize="6xl"
        weight="bold"
        className="mb-2 text-center text-gray-900 dark:text-white leading-tight"
      >
        Modern gamified Math
        <br />
        for the <span className="text-blue-500 dark:text-gray-500">modern world</span>
      </Header>
      <p className="mt-4 mb-8 text-lg text-gray-600 dark:text-gray-300 text-center max-w-xl">
      Improving Grade 4 Students' Multiplication Mastery with Interactive Learning
      </p>
      <div className="flex flex-col md:flex-row gap-4 justify-center">
        <Button
          variant="primaryWhite"
          size="sm"
          rounded="full"
          onClick={handleRegister}
        >
          Register Now!
        </Button>
        <Button
          variant="outlineWhite"
          size="sm"
          onClick={handleLearnMore}
          rounded="full"
        >
          Learn more...
        </Button>
      </div>
    </div>
  );

  return (
    <div className="md:py-28 flex items-center justify-center">
      {HeroContent}
    </div>
  );
};

export default HomePage; 