import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ContentContext = createContext();

export const useContent = () => useContext(ContentContext);

export const ContentProvider = ({ children }) => {
  const { isAdmin } = useAuth();
  const [properties, setProperties] = useState([]);
  const [practiceProblems, setPracticeProblems] = useState([]);
  const [challengeQuestions, setChallengeQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial content data
  const initialProperties = [
    {
      id: 1,
      name: "Commutative Property",
      formula: "a × b = b × a",
      description: "The order of factors doesn't change the product.",
      example: "5 × 3 = 3 × 5 = 15",
      icon: "🔄"
    },
    {
      id: 2,
      name: "Associative Property",
      formula: "(a × b) × c = a × (b × c)",
      description: "The way factors are grouped doesn't change the product.",
      example: "(2 × 3) × 4 = 2 × (3 × 4) = 24",
      icon: "🔗"
    },
    {
      id: 3,
      name: "Distributive Property",
      formula: "a × (b + c) = a × b + a × c",
      description: "Multiplying a sum by a number is the same as multiplying each addend by the number and then adding the products.",
      example: "3 × (4 + 2) = 3 × 4 + 3 × 2 = 12 + 6 = 18",
      icon: "📦"
    },
    {
      id: 4,
      name: "Identity Property",
      formula: "a × 1 = a",
      description: "Any number multiplied by 1 equals itself.",
      example: "7 × 1 = 7",
      icon: "🆔"
    },
    {
      id: 5,
      name: "Zero Property",
      formula: "a × 0 = 0",
      description: "Any number multiplied by 0 equals 0.",
      example: "9 × 0 = 0",
      icon: "0️⃣"
    }
  ];

  const initialPracticeProblems = [
    {
      id: 1,
      problem: "What is 4 × 5?",
      answer: "20",
      hint: "Remember the commutative property: 4 × 5 = 5 × 4",
      property: "Commutative Property"
    },
    {
      id: 2,
      problem: "What is (2 × 3) × 4?",
      answer: "24",
      hint: "Use the associative property to group the numbers differently",
      property: "Associative Property"
    },
    {
      id: 3,
      problem: "What is 3 × (4 + 2)?",
      answer: "18",
      hint: "Use the distributive property to multiply each addend separately",
      property: "Distributive Property"
    }
  ];

  const initialChallengeQuestions = [
    {
      id: 1,
      question: "If 6 × (3 + 4) = (6 × 3) + (6 × 4), which property is being demonstrated?",
      property: "Distributive Property",
      answers: ["Commutative Property", "Associative Property", "Distributive Property", "Identity Property"],
      correctAnswer: "Distributive Property",
      explanation: "The distributive property allows us to multiply a sum by multiplying each addend separately and then adding the products."
    },
    {
      id: 2,
      question: "What is the value of (5 × 2) × 3?",
      property: "Associative Property",
      answers: ["15", "30", "25", "20"],
      correctAnswer: "30",
      explanation: "Using the associative property: (5 × 2) × 3 = 10 × 3 = 30"
    },
    {
      id: 3,
      question: "If a × b = b × a, which property is being demonstrated?",
      property: "Commutative Property",
      answers: ["Commutative Property", "Associative Property", "Distributive Property", "Identity Property"],
      correctAnswer: "Commutative Property",
      explanation: "The commutative property states that changing the order of factors doesn't change the product."
    }
  ];

  useEffect(() => {
    // Load content from localStorage or use initial content
    const loadContent = () => {
      const storedProperties = localStorage.getItem('properties');
      const storedPracticeProblems = localStorage.getItem('practiceProblems');
      const storedChallengeQuestions = localStorage.getItem('challengeQuestions');

      console.log('Loading from localStorage:', {
        storedProperties,
        storedPracticeProblems,
        storedChallengeQuestions
      });

      // Initialize with default data if nothing is stored
      if (!storedProperties) {
        localStorage.setItem('properties', JSON.stringify(initialProperties));
      }
      if (!storedPracticeProblems) {
        localStorage.setItem('practiceProblems', JSON.stringify(initialPracticeProblems));
      }
      if (!storedChallengeQuestions) {
        localStorage.setItem('challengeQuestions', JSON.stringify(initialChallengeQuestions));
      }

      // Set the state with either stored or initial data
      setProperties(storedProperties ? JSON.parse(storedProperties) : initialProperties);
      setPracticeProblems(storedPracticeProblems ? JSON.parse(storedPracticeProblems) : initialPracticeProblems);
      setChallengeQuestions(storedChallengeQuestions ? JSON.parse(storedChallengeQuestions) : initialChallengeQuestions);
      setLoading(false);
    };

    loadContent();
  }, []);

  const updateContent = (type, id, data) => {
    if (!isAdmin()) return;

    console.log('Updating content in context:', { type, id, data });

    switch (type) {
      case 'properties':
        let updatedProperties;
        if (id === null) {
          // Add new property
          const newId = Math.max(...properties.map(p => p.id), 0) + 1;
          updatedProperties = [...properties, { ...data, id: newId }];
        } else if (data === null) {
          // Delete property
          updatedProperties = properties.filter(p => p.id !== id);
        } else {
          // Update property
          updatedProperties = properties.map(p => p.id === id ? { ...p, ...data } : p);
        }
        console.log('Updated properties:', updatedProperties);
        setProperties(updatedProperties);
        localStorage.setItem('properties', JSON.stringify(updatedProperties));
        break;

      case 'practice':
        let updatedPracticeProblems;
        if (id === null) {
          // Add new problem
          const newId = Math.max(...practiceProblems.map(p => p.id), 0) + 1;
          updatedPracticeProblems = [...practiceProblems, { ...data, id: newId }];
        } else if (data === null) {
          // Delete problem
          updatedPracticeProblems = practiceProblems.filter(p => p.id !== id);
        } else {
          // Update problem
          updatedPracticeProblems = practiceProblems.map(p => p.id === id ? { ...p, ...data } : p);
        }
        console.log('Updated practice problems:', updatedPracticeProblems);
        setPracticeProblems(updatedPracticeProblems);
        localStorage.setItem('practiceProblems', JSON.stringify(updatedPracticeProblems));
        break;

      case 'challenge':
        let updatedChallengeQuestions;
        if (id === null) {
          // Add new question
          const newId = Math.max(...challengeQuestions.map(q => q.id), 0) + 1;
          updatedChallengeQuestions = [...challengeQuestions, { ...data, id: newId }];
        } else if (data === null) {
          // Delete question
          updatedChallengeQuestions = challengeQuestions.filter(q => q.id !== id);
        } else {
          // Update question
          updatedChallengeQuestions = challengeQuestions.map(q => q.id === id ? { ...q, ...data } : q);
        }
        console.log('Updated challenge questions:', updatedChallengeQuestions);
        setChallengeQuestions(updatedChallengeQuestions);
        localStorage.setItem('challengeQuestions', JSON.stringify(updatedChallengeQuestions));
        break;

      default:
        break;
    }
  };

  const value = {
    properties,
    practiceProblems,
    challengeQuestions,
    updateContent,
    loading
  };

  return (
    <ContentContext.Provider value={value}>
      {!loading && children}
    </ContentContext.Provider>
  );
};

export default ContentContext; 