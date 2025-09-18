import React from 'react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">
          About MathQuest - Math Properties Adventure 🎓
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-purple-700 mb-4">What We Teach</h2>
          <p className="text-gray-700 mb-6">
            Math Properties Adventure is designed to help students master essential multiplication properties
            through interactive quizzes and engaging content. Our game focuses on making math learning
            fun and accessible for everyone.
          </p>
          
          <h2 className="text-2xl font-bold text-purple-700 mb-4">Multiplication Properties Covered</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
            <li>Commutative Property (a × b = b × a)</li>
            <li>Associative Property ((a × b) × c = a × (b × c))</li>
            <li>Distributive Property (a × (b + c) = a × b + a × c)</li>
            <li>Identity Property (a × 1 = a)</li>
            <li>Zero Property (a × 0 = 0)</li>
          </ul>
          
          <h2 className="text-2xl font-bold text-purple-700 mb-4">Educational Goals</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>Build a strong foundation in multiplication properties</li>
            <li>Develop problem-solving skills</li>
            <li>Enhance mathematical thinking</li>
            <li>Make learning math enjoyable and engaging</li>
            <li>Track progress through interactive quizzes</li>
          </ul>
        </div>
        
        <div className="text-center">
          <p className="text-gray-600 italic">
            "Mathematics is not about numbers, equations, computations, or algorithms: 
            it is about understanding." - William Paul Thurston
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage; 