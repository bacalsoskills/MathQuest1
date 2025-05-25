import React from 'react';
import { Link } from 'react-router-dom';

const LearningPage = () => {
  const properties = [
    {
      name: "Commutative Property",
      formula: "a × b = b × a",
      description: "The order of factors doesn't change the product.",
      example: "5 × 3 = 3 × 5 = 15",
      icon: "🔄"
    },
    {
      name: "Associative Property",
      formula: "(a × b) × c = a × (b × c)",
      description: "The way factors are grouped doesn't change the product.",
      example: "(2 × 3) × 4 = 2 × (3 × 4) = 24",
      icon: "🔗"
    },
    {
      name: "Distributive Property",
      formula: "a × (b + c) = a × b + a × c",
      description: "Multiplying a sum by a number is the same as multiplying each addend by the number and then adding the products.",
      example: "3 × (4 + 2) = 3 × 4 + 3 × 2 = 12 + 6 = 18",
      icon: "📦"
    },
    {
      name: "Identity Property",
      formula: "a × 1 = a",
      description: "Any number multiplied by 1 equals itself.",
      example: "7 × 1 = 7",
      icon: "🆔"
    },
    {
      name: "Zero Property",
      formula: "a × 0 = 0",
      description: "Any number multiplied by 0 equals 0.",
      example: "9 × 0 = 0",
      icon: "0️⃣"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-blue-800 mb-8 text-center">
          Learn Multiplication Properties 📚
        </h1>
        
        <div className="space-y-8">
          {properties.map((property, index) => (
            <div key={index} className="bg-white rounded-lg shadow-lg p-6 transform transition-all hover:scale-102 hover:shadow-xl">
              <div className="flex items-center mb-4">
                <span className="text-4xl mr-4">{property.icon}</span>
                <h2 className="text-2xl font-bold text-purple-700">{property.name}</h2>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg mb-4">
                <p className="text-xl font-mono text-blue-800">{property.formula}</p>
              </div>
              
              <p className="text-gray-700 mb-4">{property.description}</p>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-lg font-medium text-green-800">Example: {property.example}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-gray-600 italic mb-6">
            "Understanding these properties helps you solve multiplication problems more efficiently!"
          </p>
          <Link 
            to="/challenge" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full transition duration-300 transform hover:scale-105"
          >
            Try the Challenge! 🎮
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LearningPage; 