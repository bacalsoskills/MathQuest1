import React, { useState, useEffect } from "react";
import { FaLock, FaCheckCircle, FaMedal, FaMap, FaCompass, FaShip, FaMountain, FaWater, FaGem } from "react-icons/fa";
import { Button } from "../../ui";
import { Header } from "../../ui";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { debugAuth } from "../../utils/debugAuth";

const properties = [
  {
    key: "zero",
    title: "Zero Property House",
    description: "Welcome to the Zero Property House! Here you'll learn the mysterious power of zero.",
    storyIntro: "Welcome, young mathematician! You've arrived at the Zero Property House, where the mysterious Zero Property awaits. Legend says that anything that touches zero becomes zero itself!",
    steps: [
      { 
        type: "story", 
        content: "The House Guardian welcomes you. 'Welcome, brave explorer! Here in the Zero Property House, we have a special rule: anything multiplied by zero becomes zero. It's like magic!'",
        title: "The Legend of Zero House"
      },
      { 
        type: "lesson", 
        content: "The Zero Property of Multiplication states that any number multiplied by zero equals zero. This is written as: a × 0 = 0, where 'a' can be any number.",
        title: "Understanding the Zero Property",
        examples: [
          "5 × 0 = 0",
          "12 × 0 = 0", 
          "100 × 0 = 0",
          "0.5 × 0 = 0"
        ]
      },
      { 
        type: "explanation", 
        content: "Think of it this way: if you have 5 groups of nothing (0), you still have nothing! Or if you have 0 groups of 5, you still have nothing. Zero is like a magic eraser that makes everything disappear!",
        title: "Why Does This Work?",
        visualExample: "Imagine 5 empty boxes: [ ] [ ] [ ] [ ] [ ] - each box has 0 items, so total = 0"
      },
      { 
        type: "trivia", 
        content: "Did you know? The concept of zero was first developed in ancient India around 500 CE. Before zero, people had a very hard time doing calculations!",
        title: "Historical Trivia"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 7 × 0?", 
          answer: "0",
          explanation: "Any number times zero equals zero!"
        },
        title: "Quiz 1: Basic Zero Property"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 0 × 15?", 
          answer: "0",
          explanation: "Zero times any number also equals zero!"
        },
        title: "Quiz 2: Zero First"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 23 × 0?", 
          answer: "0",
          explanation: "Even big numbers become zero when multiplied by zero!"
        },
        title: "Quiz 3: Big Numbers"
      },
      { 
        type: "challenge", 
        content: "Solve this word problem: If you have 8 baskets and each basket has 0 apples, how many apples do you have total?",
        answer: "0",
        explanation: "8 baskets × 0 apples = 0 apples total"
      }
    ],
    badge: "Zero Hero!",
    unlocked: true,
    image: "/images/game-images/house.png",
    style: "left-[10%] top-[50%]",
    icon: FaShip
  },
  {
    key: "identity",
    title: "Identity River",
    description: "Cross the Identity River where numbers stay true to themselves.",
    storyIntro: "You've reached the mighty Identity River! Here, numbers have a special power - they stay exactly who they are when multiplied by one.",
    steps: [
      { 
        type: "story", 
        content: "The River Guardian appears. 'Welcome to Identity River! Here, the number 1 is like a mirror - it shows numbers exactly as they are. Nothing changes when you multiply by 1!'",
        title: "The River Guardian's Tale"
      },
      { 
        type: "lesson", 
        content: "The Identity Property of Multiplication states that any number multiplied by one equals the original number. This is written as: a × 1 = a, where 'a' can be any number.",
        title: "Understanding the Identity Property",
        examples: [
          "9 × 1 = 9",
          "25 × 1 = 25",
          "100 × 1 = 100",
          "0.7 × 1 = 0.7"
        ]
      },
      { 
        type: "explanation", 
        content: "Think of it like this: if you have 1 group of 9 items, you have 9 items. The number 1 is called the 'multiplicative identity' because it doesn't change the identity of other numbers.",
        title: "Why Does This Work?",
        visualExample: "1 group of 9 stars: ★★★★★★★★★ = 9 stars"
      },
      { 
        type: "trivia", 
        content: "The number 1 is called the 'multiplicative identity' in mathematics. Just like how 0 is the additive identity (a + 0 = a), 1 is the multiplicative identity!",
        title: "Mathematical Trivia"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 12 × 1?", 
          answer: "12",
          explanation: "Any number times 1 equals the number itself!"
        },
        title: "Quiz 1: Basic Identity"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 1 × 18?", 
          answer: "18",
          explanation: "1 times any number equals the number itself!"
        },
        title: "Quiz 2: One First"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 45 × 1?", 
          answer: "45",
          explanation: "Even large numbers stay the same when multiplied by 1!"
        },
        title: "Quiz 3: Large Numbers"
      },
      { 
        type: "challenge", 
        content: "Solve this word problem: If you have 1 box containing 7 marbles, how many marbles do you have?",
        answer: "7",
        explanation: "1 box × 7 marbles = 7 marbles total"
      }
    ],
    badge: "Identity Ace!",
    unlocked: false,
    image: "/images/game-images/river.png",
    style: "left-[30%] top-[70%]",
    icon: FaWater
  },
  {
    key: "commutative",
    title: "Commutative Mountains",
    description: "Climb the Commutative Mountains where order doesn't matter!",
    storyIntro: "Welcome to the Commutative Mountains! Here, you'll learn that the order of numbers doesn't matter in multiplication - you can swap them around and get the same result!",
    steps: [
      { 
        type: "story", 
        content: "The Mountain Sage greets you. 'Ah, young adventurer! In these mountains, we have a special rule: you can swap numbers around and still get the same answer. It's like having two different paths to the same treasure!'",
        title: "The Mountain Sage's Wisdom"
      },
      { 
        type: "lesson", 
        content: "The Commutative Property of Multiplication states that changing the order of factors doesn't change the product. This is written as: a × b = b × a.",
        title: "Understanding the Commutative Property",
        examples: [
          "3 × 4 = 12 and 4 × 3 = 12",
          "6 × 2 = 12 and 2 × 6 = 12",
          "5 × 7 = 35 and 7 × 5 = 35",
          "8 × 9 = 72 and 9 × 8 = 72"
        ]
      },
      { 
        type: "explanation", 
        content: "Think of it like arranging objects: 3 rows of 4 objects is the same as 4 rows of 3 objects. Both give you 12 objects total! This property makes multiplication much easier.",
        title: "Why Does This Work?",
        visualExample: "3×4: ████ ████ ████ = 12 squares\n4×3: ███ ███ ███ ███ = 12 squares"
      },
      { 
        type: "trivia", 
        content: "The word 'commutative' comes from the Latin word 'commutare' which means 'to change' or 'to exchange'. It describes how we can change the order without changing the result!",
        title: "Etymology Trivia"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 2 × 5? What is 5 × 2? (comma separated)", 
          answer: "10,10",
          explanation: "Both give the same result: 10!"
        },
        title: "Quiz 1: Basic Commutative"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 7 × 3? What is 3 × 7? (comma separated)", 
          answer: "21,21",
          explanation: "Both equal 21 - order doesn't matter!"
        },
        title: "Quiz 2: Larger Numbers"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 4 × 6? What is 6 × 4? (comma separated)", 
          answer: "24,24",
          explanation: "Both equal 24 - commutative property works!"
        },
        title: "Quiz 3: Practice"
      },
      { 
        type: "challenge", 
        content: "Word problem: If you have 5 bags with 3 apples each, or 3 bags with 5 apples each, which gives you more apples?",
        answer: "15",
        explanation: "5×3=15 and 3×5=15 - they're equal!"
      }
    ],
    badge: "Commutative Champ!",
    unlocked: false,
    image: "/images/game-images/mountains.png",
    style: "left-[45%] top-[25%]",
    icon: FaMountain
  },
  {
    key: "associative",
    title: "Associative Underwater Cave",
    description: "Dive into the Associative Cave where grouping doesn't matter!",
    storyIntro: "You've discovered the mysterious Associative Underwater Cave! Here, you'll learn that how you group numbers doesn't affect the final result.",
    steps: [
      { 
        type: "story", 
        content: "The Cave Guardian emerges from the depths. 'Welcome to the Associative Cave! Here, we have a special power: you can group numbers however you want, and the result stays the same!'",
        title: "The Cave Guardian's Secret"
      },
      { 
        type: "lesson", 
        content: "The Associative Property of Multiplication states that when multiplying three or more numbers, the way you group them doesn't change the result. This is written as: (a × b) × c = a × (b × c).",
        title: "Understanding the Associative Property",
        examples: [
          "(2 × 3) × 4 = 6 × 4 = 24 and 2 × (3 × 4) = 2 × 12 = 24",
          "(5 × 2) × 3 = 10 × 3 = 30 and 5 × (2 × 3) = 5 × 6 = 30",
          "(4 × 1) × 7 = 4 × 7 = 28 and 4 × (1 × 7) = 4 × 7 = 28"
        ]
      },
      { 
        type: "explanation", 
        content: "Think of it like building blocks: whether you group (2×3) first then multiply by 4, or group (3×4) first then multiply by 2, you get the same final result!",
        title: "Why Does This Work?",
        visualExample: "(2×3)×4: ██ ██ ██ × 4 = 24\n2×(3×4): 2 × ████ ████ ████ = 24"
      },
      { 
        type: "trivia", 
        content: "The word 'associative' comes from 'associate' which means 'to group together'. This property is very useful for mental math - you can group numbers in ways that are easier to calculate!",
        title: "Mental Math Trivia"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is (1 × 2) × 3? What is 1 × (2 × 3)? (comma separated)", 
          answer: "6,6",
          explanation: "Both equal 6 - grouping doesn't matter!"
        },
        title: "Quiz 1: Basic Associative"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is (3 × 2) × 4? What is 3 × (2 × 4)? (comma separated)", 
          answer: "24,24",
          explanation: "Both equal 24 - associative property works!"
        },
        title: "Quiz 2: Larger Numbers"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is (5 × 1) × 6? What is 5 × (1 × 6)? (comma separated)", 
          answer: "30,30",
          explanation: "Both equal 30 - grouping is flexible!"
        },
        title: "Quiz 3: Practice"
      },
      { 
        type: "challenge", 
        content: "Mental math: calculate (12 × 8) × 15  ?",
        answer: "1440",
        explanation: "12 × 8) × 15 First, 12 × 8 = 96 Then, 96 × 15 = 1,440 12 × (8 × 15) First, 8 × 15 = 120 Then, 12 × 120 = 1,440"
      }
    ],
    badge: "Associative Adventurer!",
    unlocked: false,
    image: "/images/game-images/underwater.png",
    style: "left-[60%] top-[55%]",
    icon: FaWater
  },

  {
    key: "distributive",
    title: "Distributive Treasure Cave",
    description: "Explore the Distributive Treasure Cave where multiplication spreads out!",
    storyIntro: "You've reached the legendary Distributive Treasure Cave! Here, you'll learn how multiplication can be distributed over addition - a powerful tool for breaking down complex problems!",
    steps: [
      { 
        type: "story", 
        content: "The Treasure Guardian emerges from the cave. 'Welcome to the Distributive Treasure Cave! Here, multiplication has a special power - it can spread out over addition like treasure scattered across the cave floor!'",
        title: "The Treasure Guardian's Lesson"
      },
      { 
        type: "lesson", 
        content: "The Distributive Property of Multiplication over Addition states that a × (b + c) = (a × b) + (a × c). This means you can multiply each part separately, then add the results.",
        title: "Understanding the Distributive Property",
        examples: [
          "2 × (3 + 4) = 2 × 7 = 14 and (2 × 3) + (2 × 4) = 6 + 8 = 14",
          "3 × (2 + 5) = 3 × 7 = 21 and (3 × 2) + (3 × 5) = 6 + 15 = 21",
          "4 × (1 + 6) = 4 × 7 = 28 and (4 × 1) + (4 × 6) = 4 + 24 = 28"
        ]
      },
      { 
        type: "explanation", 
        content: "Think of it like sharing treasure: if you have 2 treasure chests and each chest contains 3 gold coins plus 4 silver coins, you can either: 1) Count total coins in each chest first, or 2) Count all gold coins, then all silver coins, then add them up.",
        title: "Why Does This Work?",
        visualExample: "2×(3+4): 2 chests of (💰💰💰+🪙🪙🪙🪙) = 2×7 = 14\n(2×3)+(2×4): (💰💰💰💰💰💰) + (🪙🪙🪙🪙🪙🪙🪙🪙) = 6+8 = 14"
      },
      { 
        type: "trivia", 
        content: "The distributive property is one of the most important properties in algebra! It's what allows us to expand expressions like 2(x + 3) = 2x + 6. This property is used in almost every area of mathematics!",
        title: "Algebra Trivia"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 3 × (2 + 5)?", 
          answer: "21",
          explanation: "3 × (2 + 5) = 3 × 7 = 21"
        },
        title: "Quiz 1: Basic Distributive"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is (4 × 3) + (4 × 2)?", 
          answer: "20",
          explanation: "(4 × 3) + (4 × 2) = 12 + 8 = 20"
        },
        title: "Quiz 2: Expanded Form"
      },
      { 
        type: "quiz", 
        content: { 
          question: "What is 5 × (1 + 4)?", 
          answer: "25",
          explanation: "5 × (1 + 4) = 5 × 5 = 25"
        },
        title: "Quiz 3: Practice"
      },
      { 
        type: "challenge", 
        content: "Word problem: If you have 3 treasure chests, and each chest contains 2 gold coins and 3 silver coins, how many coins do you have total?",
        answer: "15",
        explanation: "3 × (2 + 3) = 3 × 5 = 15 coins"
      },
      { 
        type: "celebration", 
        content: "🏆 Congratulations! You've mastered all 5 properties of multiplication! 🏆\n\nYou are now a Multiplication Properties Master!\n\nYou can:\n• Use zero property to quickly solve problems with zero\n• Use identity property to understand why ×1 doesn't change numbers\n• Use commutative property to rearrange multiplication problems\n• Use associative property to group numbers for easier mental math\n• Use distributive property to break down complex problems",
        title: "Master of All Properties!"
      }
    ],
    badge: "Distributive Master!",
    unlocked: false,
    image: "/images/game-images/treasure.png",
    style: "left-[80%] top-[20%]",
    icon: FaGem
  },
];

const propertyPositions = [
  { left: 10, top: 50 },  // Zero Property House
  { left: 30, top: 70 },  // Identity River
  { left: 45, top: 25 },  // Commutative Mountains
  { left: 60, top: 55 },  // Associative Underwater Cave
  { left: 80, top: 20 },  // Distributive Treasure Cave
];

const getSVGPoints = (positions, width, height) => {
  // width and height are the pixel size of the map container
  return positions
    .map(pos => `${(pos.left / 100) * width},${(pos.top / 100) * height}`)
    .join(" ");
};

const LearningMultiplication = () => {
  const [completed, setCompleted] = useState([false, false, false, false, false]);
  const [active, setActive] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [quizInput, setQuizInput] = useState("");
  const [quizFeedback, setQuizFeedback] = useState("");
  const [mapSize, setMapSize] = useState({ width: 1000, height: 400 });
  const [showHint, setShowHint] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);
  const mapRef = React.useRef(null);
  const {
    currentUser,
    multiplicationProgress,
    loadMultiplicationProgress,
    saveMultiplicationProgress,
    completeMultiplicationProperty,
    saveMultiplicationQuizAttempt,
  } = useAuth();
  const { darkMode, isInitialized } = useTheme();

  // Add CSS animation for dashed path
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dash {
        to {
          stroke-dashoffset: -100;
        }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  React.useEffect(() => {
    const updateMapSize = () => {
      if (mapRef.current) {
        setMapSize({
          width: mapRef.current.offsetWidth,
          height: mapRef.current.offsetHeight,
        });
      }
    };

    // Initial size calculation with a small delay to ensure DOM is ready
    const timeoutId = setTimeout(updateMapSize, 100);

    // Update on window resize
    window.addEventListener('resize', updateMapSize);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateMapSize);
    };
  }, []);

  // Update map size when loading completes
  React.useEffect(() => {
    if (!loading && mapRef.current) {
      const updateMapSize = () => {
        if (mapRef.current) {
          setMapSize({
            width: mapRef.current.offsetWidth,
            height: mapRef.current.offsetHeight,
          });
        }
      };
      
      // Small delay to ensure the map container is fully rendered
      setTimeout(updateMapSize, 200);
    }
  }, [loading]);

  // Load progress from backend on component mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!currentUser) return;
      
      // Debug authentication
      console.log('Current user:', currentUser);
      console.log('Token exists:', localStorage.getItem('token'));
      
      try {
        setLoading(true);
        const progress = await loadMultiplicationProgress();
        
        console.log('Loaded progress from backend:', progress);
        
        if (progress) {
          // Normalize backend representation (indices) to UI representation (booleans)
          const total = 5; // number of properties
          let completedBooleans = Array(total).fill(false);

          if (progress.completedProperties) {
            let raw = progress.completedProperties;
            try {
              if (typeof raw === 'string') raw = JSON.parse(raw);
            } catch (e) {
              console.error('Error parsing completedProperties:', e);
            }

            if (Array.isArray(raw)) {
              // If array of numbers (indices), mark booleans true at those indices
              if (raw.every((v) => typeof v === 'number')) {
                raw.forEach((idx) => {
                  if (idx >= 0 && idx < total) completedBooleans[idx] = true;
                });
              }
              // If array of booleans, take as-is (pad/trim to total)
              else if (raw.every((v) => typeof v === 'boolean')) {
                completedBooleans = raw.slice(0, total);
                while (completedBooleans.length < total) completedBooleans.push(false);
              }
            }
          }

          const activePropertyIndex =
            typeof progress.activePropertyIndex === 'number' ? progress.activePropertyIndex : 0;

          setCompleted(completedBooleans);
          setActive(activePropertyIndex);
        }
      } catch (error) {
        console.log('Error loading progress');
        setBackendAvailable(false);
        setCompleted([false, false, false, false, false]);
        setActive(0);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [currentUser]);

  // Make debug functions available globally
  React.useEffect(() => {
    window.debugAuth = debugAuth;
    console.log('Auth debug function available as window.debugAuth()');
  }, []);

  // Save progress to backend whenever it changes
  useEffect(() => {
      console.log("Effect triggered:", { completed, active, currentUser, loading, backendAvailable });

  if (!currentUser || loading ) return;

  const saveProgress = async () => {
    try {
      setSaving(true);

      const completedIndices = completed
        .map((isDone, idx) => (isDone ? idx : null))
        .filter((v) => v !== null);
            console.log("Effect triggered again:", { completed, active, currentUser, loading, backendAvailable });

      const progressData = {
        completedProperties: completedIndices,
        activePropertyIndex: active,
        totalPropertiesCompleted: completedIndices.length,
      };

      console.log("Saving progress to backend:", progressData);
      const result = await saveMultiplicationProgress(progressData);
      console.log("Progress saved successfully:", result);
    } catch (error) {
      console.error("Error saving progress:", error);
      setBackendAvailable(false);
    } finally {
      setSaving(false);
    }
  };

  const timeoutId = setTimeout(saveProgress, 500); // shorter debounce
  return () => clearTimeout(timeoutId);
}, [completed, active, currentUser, loading, backendAvailable]);

const handleComplete = (idx) => {
  console.log('handleComplete called with idx:', idx);

  // Just update local state
  const updatedCompleted = [...completed];
  updatedCompleted[idx] = true;

  let newActive = active;
  if (idx + 1 < 5) newActive = idx + 1;

  setCompleted(updatedCompleted);
  setActive(newActive);
  setModalOpen(false);
  setSelectedIdx(null);
  setStepIdx(0);
  setQuizInput("");
  setQuizFeedback("");
  setShowHint(false);
};

  const openModal = (idx) => {
    if (idx > active || idx >= properties.length) return;
    setSelectedIdx(idx);
    setModalOpen(true);
    setStepIdx(0);
    setQuizInput("");
    setQuizFeedback("");
    setShowHint(false);
  };

  const handleQuizSubmit = async (e) => {
    e.preventDefault();
    
    // Safety checks
    if (selectedIdx === null || !properties[selectedIdx] || !properties[selectedIdx].steps || !properties[selectedIdx].steps[stepIdx]) {
      console.error("Invalid state: missing property or step data");
      return;
    }
    
    const currentStep = properties[selectedIdx].steps[stepIdx];
    let correct = false;
    
    if (currentStep.type === "quiz" && currentStep.content && currentStep.content.answer) {
      correct = quizInput.trim().replace(/\s+/g, "").toLowerCase() ===
                currentStep.content.answer.replace(/\s+/g, "").toLowerCase();
    } else if (currentStep.type === "challenge" && currentStep.answer) {
      correct = quizInput.trim().replace(/\s+/g, "").toLowerCase() ===
                currentStep.answer.replace(/\s+/g, "").toLowerCase();
    }
    
    // Save quiz attempt to backend if available
    if (backendAvailable) {
      try {
        const quizData = {
          question: currentStep.type === "quiz" ? currentStep.content.question : currentStep.content,
          userAnswer: quizInput.trim(),
          correctAnswer: currentStep.type === "quiz" ? currentStep.content.answer : currentStep.answer,
          isCorrect: correct,
          stepType: currentStep.type,
          stepTitle: currentStep.title
        };
        
        console.log('Saving quiz attempt:', selectedIdx, stepIdx, quizData);
        const result = await saveMultiplicationQuizAttempt(selectedIdx, stepIdx, quizData);
        console.log('Quiz attempt saved successfully:', result);
      } catch (error) {
        console.error('Error saving quiz attempt:', error);
        setBackendAvailable(false);
        // Don't prevent the quiz from continuing, just log the error
      }
    }
    
    if (correct) {
      setQuizFeedback("Correct! 🎉");
      setTimeout(() => {
        setQuizFeedback("");
        setQuizInput("");
        
        // Check if this is the last step of the current property
        if (stepIdx === properties[selectedIdx].steps.length - 1) {
          // Automatically complete the property and move to next
          handleComplete(selectedIdx);
        } else {
          // Move to next step
          setStepIdx(stepIdx + 1);
        }
      }, 1500);
    } else {
      setQuizFeedback("Try again!");
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
          : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
      }`}>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className={`animate-spin rounded-full h-16 w-16 border-4 ${
                    darkMode 
                      ? 'border-gray-700 border-t-blue-400' 
                      : 'border-blue-200 border-t-blue-600'
                  }`}></div>
                  <div className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin ${
                    darkMode 
                      ? 'border-t-blue-500' 
                      : 'border-t-blue-400'
                  }`} style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                </div>
                <div className="text-center">
                  <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>Loading Your Adventure</h3>
                  <p className={`transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Preparing your multiplication journey...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Enhanced Header Section */}
          <div className="relative mb-8">
            <div className={`backdrop-blur-sm rounded-2xl shadow-xl border p-6 sm:p-8 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800/80 border-gray-700/20' 
                : 'bg-white/80 border-white/20'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FaMap className="text-white text-xl" />
                    </div>
                    <div>
                      <Header type="h1" fontSize="4xl" weight="bold" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                        Learning Multiplication: Treasure Hunt
                      </Header>
                      <p className={`text-sm mt-1 transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>Master the properties of multiplication through an epic adventure!</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                  {saving && (
                    <div className={`flex items-center gap-2 text-sm px-4 py-2 rounded-full shadow-sm transition-colors duration-300 ${
                      darkMode 
                        ? 'text-blue-300 bg-blue-900/30 border border-blue-700/50' 
                        : 'text-blue-700 bg-blue-100 border border-blue-200'
                    }`}>
                      <div className={`animate-spin rounded-full h-4 w-4 border-2 ${
                        darkMode 
                          ? 'border-blue-700 border-t-blue-400' 
                          : 'border-blue-200 border-t-blue-600'
                      }`}></div>
                      <span className="font-medium">Saving progress...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        
          {/* Enhanced Progress Badges Section */}
          <div className="mb-8">
            <div className={`backdrop-blur-sm rounded-2xl shadow-xl border p-6 sm:p-8 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800/90 border-gray-700/20' 
                : 'bg-white/90 border-white/20'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
                <div className="flex items-center gap-3 mb-3 sm:mb-0">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                    <FaMedal className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>Multiplication Properties Badges</h2>
                    <p className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Collect all badges to become a multiplication master!</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                    <span className="font-bold text-lg">{completed.filter(Boolean).length}</span>
                    <span className="text-sm opacity-90">/5</span>
                  </div>
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>Completed</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {properties.slice(0, 5).map((prop, idx) => (
                  <div key={prop.key} className={`group relative overflow-hidden rounded-2xl p-4 transition-all duration-300 transform hover:scale-105 hover:shadow-xl ${
                    completed[idx] 
                      ? darkMode
                        ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-2 border-yellow-700/50 shadow-lg'
                        : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 shadow-lg'
                      : darkMode
                        ? 'bg-gray-700/50 border-2 border-gray-600 hover:border-gray-500'
                        : 'bg-gray-50 border-2 border-gray-200 hover:border-gray-300'
                  }`}>
                    {/* Badge Icon */}
                    <div className="flex justify-center mb-3">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                        completed[idx] 
                          ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 group-hover:from-yellow-500 group-hover:to-yellow-700' 
                          : darkMode
                            ? 'bg-gray-600 group-hover:bg-gray-500'
                            : 'bg-gray-200 group-hover:bg-gray-300'
                      }`}>
                        {completed[idx] ? (
                          <FaMedal className="text-white text-2xl animate-pulse" />
                        ) : (
                          <FaLock className={`text-xl ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        )}
                      </div>
                    </div>
                    
                    {/* Badge Info */}
                    <div className="text-center">
                      <span className={`text-sm font-bold text-center block mb-1 transition-colors duration-300 ${
                        completed[idx] 
                          ? darkMode 
                            ? 'text-yellow-300' 
                            : 'text-yellow-800'
                          : darkMode 
                            ? 'text-gray-300' 
                            : 'text-gray-600'
                      }`}>
                        {prop.badge}
                      </span>
                      <span className={`text-xs text-center px-2 py-1 rounded-full font-medium transition-colors duration-300 ${
                        completed[idx] 
                          ? darkMode
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-green-100 text-green-700'
                          : darkMode
                            ? 'bg-gray-600 text-gray-400'
                            : 'bg-gray-200 text-gray-500'
                      }`}>
                        {completed[idx] ? '✓ Achieved' : 'Locked'}
                      </span>
                    </div>
                    
                    {/* Hover Effect Overlay */}
                    {completed[idx] && (
                      <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                        darkMode 
                          ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20' 
                          : 'bg-gradient-to-br from-yellow-400/10 to-orange-500/10'
                      }`}></div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium transition-colors duration-300 ${
                    darkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>Overall Progress</span>
                  <span className={`text-sm font-bold transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>{Math.round((completed.filter(Boolean).length / 5) * 100)}%</span>
                </div>
                <div className={`w-full rounded-full h-3 overflow-hidden transition-colors duration-300 ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out shadow-sm"
                    style={{ width: `${(completed.filter(Boolean).length / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
          {/* Enhanced Treasure Map Section */}
          <div className="relative mb-8">
            <div className={`backdrop-blur-sm rounded-3xl shadow-2xl border p-6 sm:p-8 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800/90 border-gray-700/20' 
                : 'bg-white/90 border-white/20'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaMap className="text-white text-lg" />
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>Treasure Map</h2>
                    <p className={`text-sm transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>Follow the path to discover all multiplication properties!</p>
                  </div>
                </div>
              </div>
              
              <div className="relative w-full h-[55vw] min-h-[260px] sm:min-h-[360px] md:min-h-[460px] lg:min-h-[560px] xl:min-h-[640px] max-h-[760px]" ref={mapRef}>
                {/* Enhanced Map Background */}
                <div className={`relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border-4 transition-colors duration-300 ${
                  darkMode 
                    ? 'border-yellow-600 bg-gradient-to-br from-gray-800 to-gray-900' 
                    : 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-orange-50'
                }`}>
                  <img 
                    src="/images/game-images/map.png" 
                    alt="Treasure Map" 
                    className={`w-full h-full object-cover transition-all duration-300 hover:scale-105 ${
                      darkMode ? 'brightness-75 contrast-110' : ''
                    }`}
                  />
                  {/* Map Overlay Effects */}
                  <div className={`absolute inset-0 pointer-events-none transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-yellow-400/20 to-orange-500/20' 
                      : 'bg-gradient-to-br from-yellow-400/10 to-orange-500/10'
                  }`}></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                </div>
                
                {/* Enhanced SVG Dashed Path */}
                <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" viewBox={`0 0 ${mapSize.width} ${mapSize.height}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
                      <stop offset="50%" stopColor="#8B5CF6" stopOpacity="0.8"/>
                      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.8"/>
                    </linearGradient>
                  </defs>
                  <polyline
                    points={getSVGPoints(propertyPositions, mapSize.width, mapSize.height)}
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="6"
                    strokeDasharray="15,10"
                    strokeLinecap="round"
                    style={{ 
                      filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      animation: 'dash 3s linear infinite'
                    }}
                  />
                </svg>
                
                {/* Enhanced Map Locations */}
                {properties.slice(0, 5).map((prop, idx) => (
                  <button
                    key={prop.key}
                    className={`absolute ${prop.style} z-20 group focus:outline-none focus:ring-4 focus:ring-blue-300 focus:ring-opacity-50 rounded-2xl transition-all duration-300 ${
                      idx > active ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
                    } w-24 h-24 sm:w-32 sm:h-32 lg:w-40 lg:h-40`}
                    style={{ transform: 'translate(-50%, -50%)' }}
                    onClick={() => openModal(idx)}
                    disabled={idx > active}
                    aria-label={prop.title}
                  >
                    <div className={`relative w-full h-full rounded-2xl overflow-hidden transition-all duration-300 ${
                      completed[idx] 
                        ? 'shadow-2xl ring-4 ring-yellow-400 ring-opacity-50' 
                        : idx === active 
                          ? 'shadow-xl ring-4 ring-blue-400 ring-opacity-50' 
                          : 'shadow-lg'
                    }`}>
                      <img
                        src={prop.image}
                        alt={prop.title}
                        className={`w-full h-full object-contain transition-all duration-300 ${
                          idx > active 
                            ? 'opacity-40 grayscale blur-sm' 
                            : completed[idx] 
                              ? 'brightness-110 saturate-110' 
                              : 'hover:brightness-105 hover:saturate-105'
                        }`}
                      />
                      
                      {/* Enhanced Overlay Effects */}
                      {completed[idx] && (
                        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 to-orange-500/20 pointer-events-none"></div>
                      )}
                      
                      {/* Status Icon */}
                      <div className="absolute bottom-2 right-2 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300">
                        {completed[idx] ? (
                          <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center animate-pulse">
                            <FaCheckCircle className="text-white text-sm sm:text-lg" />
                          </div>
                        ) : idx === active ? (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-white text-sm sm:text-base font-bold">×</span>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gray-400 rounded-full flex items-center justify-center">
                            <FaLock className="text-white text-xs sm:text-sm" />
                          </div>
                        )}
                      </div>
                      
                      {/* Property Title Overlay */}
                      <div className={`absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 text-center transition-all duration-300 ${
                        completed[idx] 
                          ? 'bg-gradient-to-t from-yellow-500/90 to-yellow-400/70' 
                          : idx === active 
                            ? 'bg-gradient-to-t from-blue-500/90 to-blue-400/70' 
                            : 'bg-gradient-to-t from-gray-500/90 to-gray-400/70'
                      }`}>
                        <span className={`block font-bold text-white drop-shadow-sm text-[10px] sm:text-xs md:text-sm ${
                          completed[idx] ? 'text-yellow-900' : idx === active ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {prop.title}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                
                {/* Map Legend */}
                <div className={`absolute top-2 left-2 sm:top-4 sm:left-4 backdrop-blur-sm rounded-xl p-2 sm:p-3 shadow-lg border transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gray-800/90 border-gray-700/20' 
                    : 'bg-white/90 border-white/20'
                }`}>
                  <div className="flex flex-col gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className={`font-medium transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
                      <span className={`font-medium transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Current</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className={`font-medium transition-colors duration-300 ${
                        darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Locked</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        {/* Enhanced Modal for property details */}
        {modalOpen && selectedIdx !== null && properties[selectedIdx] && properties[selectedIdx].steps && properties[selectedIdx].steps[stepIdx] && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className={`backdrop-blur-md rounded-3xl shadow-2xl border p-6 sm:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-300 transition-colors duration-300 ${
              darkMode 
                ? 'bg-gray-800/95 border-gray-700/20' 
                : 'bg-white/95 border-white/20'
            }`}>
              <button 
                className={`absolute top-4 right-4 w-10 h-10 rounded-full text-xl z-10 flex items-center justify-center transition-all duration-200 hover:scale-110 ${
                  darkMode 
                    ? 'bg-gray-700 hover:bg-red-900 text-gray-300 hover:text-red-400' 
                    : 'bg-gray-100 hover:bg-red-100 text-gray-500 hover:text-red-600'
                }`}
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
              
              {/* Enhanced Header with story intro */}
              <div className="mb-8">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                    {React.createElement(properties[selectedIdx].icon, { className: "text-white text-2xl" })}
                  </div>
                  <div className="flex-1">
                    <Header type="h3" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                      {properties[selectedIdx].title}
                    </Header>
                    <p className={`text-lg transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>{properties[selectedIdx].description}</p>
                  </div>
                </div>
                {stepIdx === 0 && (
                  <div className={`p-6 rounded-2xl border shadow-lg transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-700/50' 
                      : 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <span className="text-white text-sm">📖</span>
                      </div>
                      <div>
                        <h4 className={`font-semibold mb-2 transition-colors duration-300 ${
                          darkMode ? 'text-blue-300' : 'text-blue-800'
                        }`}>Story Introduction</h4>
                        <p className={`italic leading-relaxed transition-colors duration-300 ${
                          darkMode ? 'text-blue-200' : 'text-blue-700'
                        }`}>{properties[selectedIdx].storyIntro}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Step content */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${
                      properties[selectedIdx].steps[stepIdx]?.type === 'quiz' ? 'bg-gradient-to-br from-yellow-400 to-orange-500' :
                      properties[selectedIdx].steps[stepIdx]?.type === 'challenge' ? 'bg-gradient-to-br from-purple-400 to-pink-500' :
                      properties[selectedIdx].steps[stepIdx]?.type === 'lesson' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                      'bg-gradient-to-br from-gray-400 to-gray-500'
                    }`}>
                      <span className="text-white text-sm font-bold">
                        {properties[selectedIdx].steps[stepIdx]?.type === 'quiz' ? '❓' :
                         properties[selectedIdx].steps[stepIdx]?.type === 'challenge' ? '⚡' :
                         properties[selectedIdx].steps[stepIdx]?.type === 'lesson' ? '📚' :
                         properties[selectedIdx].steps[stepIdx]?.type === 'story' ? '📖' :
                         properties[selectedIdx].steps[stepIdx]?.type === 'explanation' ? '💡' :
                         properties[selectedIdx].steps[stepIdx]?.type === 'trivia' ? '🎯' :
                         properties[selectedIdx].steps[stepIdx]?.type === 'celebration' ? '🎉' : '📄'}
                      </span>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                      properties[selectedIdx].steps[stepIdx]?.type === 'quiz' ? 'bg-yellow-100 text-yellow-800' :
                      properties[selectedIdx].steps[stepIdx]?.type === 'challenge' ? 'bg-purple-100 text-purple-800' :
                      properties[selectedIdx].steps[stepIdx]?.type === 'lesson' ? 'bg-blue-100 text-blue-800' :
                      properties[selectedIdx].steps[stepIdx]?.type === 'story' ? 'bg-green-100 text-green-800' :
                      properties[selectedIdx].steps[stepIdx]?.type === 'explanation' ? 'bg-indigo-100 text-indigo-800' :
                      properties[selectedIdx].steps[stepIdx]?.type === 'trivia' ? 'bg-orange-100 text-orange-800' :
                      properties[selectedIdx].steps[stepIdx]?.type === 'celebration' ? 'bg-pink-100 text-pink-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {properties[selectedIdx].steps[stepIdx]?.type || 'Unknown'}
                    </span>
                  </div>
                  {properties[selectedIdx].steps[stepIdx]?.title && (
                    <span className={`text-xl font-bold transition-colors duration-300 ${
                      darkMode ? 'text-white' : 'text-gray-800'
                    }`}>
                      {properties[selectedIdx].steps[stepIdx].title}
                    </span>
                  )}
                </div>

                {/* Types content unchanged for logic */}
                {properties[selectedIdx].steps[stepIdx].type === "quiz" ? (
                  <div className={`p-6 rounded-2xl border-2 shadow-lg transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-yellow-900/30 to-orange-900/30 border-yellow-700/50' 
                      : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">❓</span>
                      </div>
                      <h4 className={`text-lg font-bold transition-colors duration-300 ${
                        darkMode ? 'text-yellow-300' : 'text-yellow-800'
                      }`}>Quiz Time!</h4>
                    </div>
                    <form onSubmit={handleQuizSubmit} className="flex flex-col gap-4">
                      <div className={`p-4 rounded-xl border transition-colors duration-300 ${
                        darkMode 
                          ? 'bg-gray-700/70 border-yellow-700/50' 
                          : 'bg-white/70 border-yellow-200'
                      }`}>
                        <p className={`font-semibold text-center text-lg transition-colors duration-300 ${
                          darkMode ? 'text-gray-100' : 'text-gray-800'
                        }`}>{properties[selectedIdx].steps[stepIdx].content.question}</p>
                      </div>
                      <div className="relative">
                        <input
                          className={`w-full border-2 rounded-xl px-6 py-4 text-xl text-center focus:outline-none focus:ring-4 transition-all duration-200 ${
                            darkMode 
                              ? 'border-yellow-600 focus:ring-yellow-500/30 focus:border-yellow-500 bg-gray-700 text-white placeholder-gray-400' 
                              : 'border-yellow-400 focus:ring-yellow-300 focus:border-yellow-500 bg-white/80 text-gray-900 placeholder-gray-500'
                          }`}
                          value={quizInput}
                          onChange={e => setQuizInput(e.target.value)}
                          placeholder="Type your answer here..."
                          autoFocus
                        />
                      </div>
                      <Button 
                        size="lg" 
                        variant="primary" 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        Check Answer
                      </Button>
                      {quizFeedback && (
                        <div className={`p-4 rounded-xl border-2 shadow-lg transition-all duration-300 ${
                          quizFeedback === 'Correct! 🎉' 
                            ? darkMode
                              ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-700/50 text-green-300'
                              : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 text-green-800'
                            : darkMode
                              ? 'bg-gradient-to-br from-red-900/50 to-pink-900/50 border-red-700/50 text-red-300'
                              : 'bg-gradient-to-br from-red-100 to-pink-100 border-red-300 text-red-800'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{quizFeedback === 'Correct! 🎉' ? '🎉' : '😅'}</span>
                            <span className="font-bold text-lg">{quizFeedback}</span>
                          </div>
                          {quizFeedback === 'Correct! 🎉' && properties[selectedIdx].steps[stepIdx].content.explanation && (
                            <p className={`text-sm p-2 rounded-lg transition-colors duration-300 ${
                              darkMode 
                                ? 'bg-gray-700/50 text-gray-300' 
                                : 'bg-white/50 text-gray-700'
                            }`}>{properties[selectedIdx].steps[stepIdx].content.explanation}</p>
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                ) : properties[selectedIdx].steps[stepIdx].type === "challenge" ? (
                  <div className={`p-6 rounded-2xl border-2 shadow-lg transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-purple-900/30 to-pink-900/30 border-purple-700/50' 
                      : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">⚡</span>
                      </div>
                      <h4 className={`text-lg font-bold transition-colors duration-300 ${
                        darkMode ? 'text-purple-300' : 'text-purple-800'
                      }`}>Challenge Time!</h4>
                    </div>
                    <div className={`p-4 rounded-xl border mb-4 transition-colors duration-300 ${
                      darkMode 
                        ? 'bg-gray-700/70 border-purple-700/50' 
                        : 'bg-white/70 border-purple-200'
                    }`}>
                      <p className={`font-medium text-lg transition-colors duration-300 ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>{properties[selectedIdx].steps[stepIdx].content}</p>
                    </div>
                    <form onSubmit={handleQuizSubmit} className="flex flex-col gap-4">
                      <div className="relative">
                        <input
                          className={`w-full border-2 rounded-xl px-6 py-4 text-xl text-center focus:outline-none focus:ring-4 transition-all duration-200 ${
                            darkMode 
                              ? 'border-purple-600 focus:ring-purple-500/30 focus:border-purple-500 bg-gray-700 text-white placeholder-gray-400' 
                              : 'border-purple-400 focus:ring-purple-300 focus:border-purple-500 bg-white/80 text-gray-900 placeholder-gray-500'
                          }`}
                          value={quizInput}
                          onChange={e => setQuizInput(e.target.value)}
                          placeholder="Type your answer here..."
                          autoFocus
                        />
                      </div>
                      <Button 
                        size="lg" 
                        variant="primary" 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        Submit Challenge
                      </Button>
                      {quizFeedback && (
                        <div className={`p-4 rounded-xl border-2 shadow-lg transition-all duration-300 ${
                          quizFeedback === 'Correct! 🎉' 
                            ? darkMode
                              ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-700/50 text-green-300'
                              : 'bg-gradient-to-br from-green-100 to-emerald-100 border-green-300 text-green-800'
                            : darkMode
                              ? 'bg-gradient-to-br from-red-900/50 to-pink-900/50 border-red-700/50 text-red-300'
                              : 'bg-gradient-to-br from-red-100 to-pink-100 border-red-300 text-red-800'
                        }`}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-2xl">{quizFeedback === 'Correct! 🎉' ? '🎉' : '😅'}</span>
                            <span className="font-bold text-lg">{quizFeedback}</span>
                          </div>
                          {quizFeedback === 'Correct! 🎉' && properties[selectedIdx].steps[stepIdx].explanation && (
                            <p className={`text-sm p-2 rounded-lg transition-colors duration-300 ${
                              darkMode 
                                ? 'bg-gray-700/50 text-gray-300' 
                                : 'bg-white/50 text-gray-700'
                            }`}>{properties[selectedIdx].steps[stepIdx].explanation}</p>
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                ) : (
                  <div className={`p-6 rounded-2xl border-2 shadow-lg transition-colors duration-300 ${
                    darkMode 
                      ? 'bg-gradient-to-br from-blue-900/30 to-indigo-900/30 border-blue-700/50' 
                      : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
                  }`}>
                    <div className={`p-6 rounded-xl border transition-colors duration-300 ${
                      darkMode 
                        ? 'bg-gray-700/80 border-blue-700/30' 
                        : 'bg-white/80 border-blue-100'
                    }`}>
                      <p className={`leading-relaxed mb-6 text-lg transition-colors duration-300 ${
                        darkMode ? 'text-gray-100' : 'text-gray-800'
                      }`}>{properties[selectedIdx].steps[stepIdx].content}</p>
                      
                      {/* Examples section */}
                      {properties[selectedIdx].steps[stepIdx].examples && (
                        <div className={`p-5 rounded-xl mb-6 border transition-colors duration-300 ${
                          darkMode 
                            ? 'bg-gradient-to-r from-blue-900/50 to-indigo-900/50 border-blue-700/50' 
                            : 'bg-gradient-to-r from-blue-100 to-indigo-100 border-blue-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">💡</span>
                            </div>
                            <h4 className={`font-bold text-lg transition-colors duration-300 ${
                              darkMode ? 'text-blue-300' : 'text-blue-800'
                            }`}>Examples:</h4>
                          </div>
                          <div className="grid gap-2">
                            {properties[selectedIdx].steps[stepIdx].examples.map((example, idx) => (
                              <div key={idx} className={`p-3 rounded-lg border transition-colors duration-300 ${
                                darkMode 
                                  ? 'bg-gray-700/70 border-blue-700/50' 
                                  : 'bg-white/70 border-blue-200'
                              }`}>
                                <span className={`font-mono text-lg font-semibold transition-colors duration-300 ${
                                  darkMode ? 'text-blue-300' : 'text-blue-700'
                                }`}>{example}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Visual example */}
                      {properties[selectedIdx].steps[stepIdx].visualExample && (
                        <div className={`p-5 rounded-xl border transition-colors duration-300 ${
                          darkMode 
                            ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-700/50' 
                            : 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200'
                        }`}>
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">👁️</span>
                            </div>
                            <h4 className={`font-bold text-lg transition-colors duration-300 ${
                              darkMode ? 'text-green-300' : 'text-green-800'
                            }`}>Visual Example:</h4>
                          </div>
                          <div className={`p-4 rounded-lg border transition-colors duration-300 ${
                            darkMode 
                              ? 'bg-gray-700/70 border-green-700/50' 
                              : 'bg-white/70 border-green-200'
                          }`}>
                            <p className={`font-mono text-sm whitespace-pre-line transition-colors duration-300 ${
                              darkMode ? 'text-green-300' : 'text-green-700'
                            }`}>{properties[selectedIdx].steps[stepIdx].visualExample}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Step navigation */}
              <div className={`rounded-2xl p-6 border transition-colors duration-300 ${
                darkMode 
                  ? 'bg-gray-700/50 border-gray-600' 
                  : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg">
                      <span className="font-bold text-lg">{stepIdx + 1}</span>
                      <span className="text-sm opacity-90">/{properties[selectedIdx]?.steps?.length || 0}</span>
                    </div>
                    <span className={`font-medium transition-colors duration-300 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>Step Progress</span>
                  </div>
                  
                  <div className="flex gap-3">
                    {stepIdx > 0 && (
                      <Button 
                        size="md" 
                        variant="secondary" 
                        onClick={() => setStepIdx(stepIdx - 1)}
                        className="bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-700 font-semibold px-6 py-2 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                      >
                        ← Previous
                      </Button>
                    )}
                    
                    {properties[selectedIdx].steps[stepIdx] && 
                     properties[selectedIdx].steps[stepIdx].type !== "quiz" && 
                     properties[selectedIdx].steps[stepIdx].type !== "challenge" && 
                     stepIdx < properties[selectedIdx].steps.length - 1 && (
                      <Button 
                        size="md" 
                        variant="primary" 
                        onClick={() => setStepIdx(stepIdx + 1)}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        Next →
                      </Button>
                    )}
                    
                    {/* Auto-complete button for last step if it's not a quiz/challenge */}
                    {properties[selectedIdx].steps[stepIdx] && 
                     properties[selectedIdx].steps[stepIdx].type !== "quiz" && 
                     properties[selectedIdx].steps[stepIdx].type !== "challenge" && 
                     stepIdx === properties[selectedIdx].steps.length - 1 && 
                     !completed[selectedIdx] && 
                     selectedIdx === active && (
                      <Button 
                        size="md" 
                        variant="primary" 
                        onClick={() => handleComplete(selectedIdx)}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                      >
                        🏆 Complete Lesson
                      </Button>
                    )}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-4">
                  <div className={`w-full rounded-full h-2 overflow-hidden transition-colors duration-300 ${
                    darkMode ? 'bg-gray-600' : 'bg-gray-200'
                  }`}>
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${((stepIdx + 1) / (properties[selectedIdx]?.steps?.length || 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Enhanced Badge display */}
              {completed[selectedIdx] && selectedIdx < 5 && (
                <div className={`mt-6 p-6 rounded-2xl border-2 shadow-lg transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border-yellow-700/50' 
                    : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <FaMedal className="text-white text-2xl" />
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold mb-1 transition-colors duration-300 ${
                        darkMode ? 'text-yellow-300' : 'text-yellow-800'
                      }`}>Badge Earned!</h4>
                      <span className={`font-semibold text-lg transition-colors duration-300 ${
                        darkMode ? 'text-yellow-200' : 'text-yellow-700'
                      }`}>{properties[selectedIdx].badge}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Treasure chest after all complete */}
              {selectedIdx === 4 && completed.every(Boolean) && (
                <div className={`mt-8 p-8 rounded-3xl border-4 shadow-2xl transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-br from-yellow-900/30 via-orange-900/30 to-red-900/30 border-yellow-600' 
                    : 'bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 border-yellow-300'
                }`}>
                  <div className="flex flex-col items-center text-center">
                    <div className="text-8xl mb-4 animate-bounce">🏆</div>
                    <h3 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-3">
                      You Found the Treasure!
                    </h3>
                    <p className={`text-xl font-medium leading-relaxed transition-colors duration-300 ${
                      darkMode ? 'text-yellow-200' : 'text-yellow-700'
                    }`}>
                      Congratulations! You've mastered all properties of multiplication! 
                    </p>
                    <div className={`mt-4 p-4 rounded-xl border transition-colors duration-300 ${
                      darkMode 
                        ? 'bg-gray-700/70 border-yellow-700/50' 
                        : 'bg-white/70 border-yellow-200'
                    }`}>
                      <p className={`font-semibold transition-colors duration-300 ${
                        darkMode ? 'text-gray-200' : 'text-gray-700'
                      }`}>
                        You are now a true Multiplication Master! 🎉
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default LearningMultiplication; 