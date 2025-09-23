import React, { useState, useEffect } from "react";
import { FaLock, FaCheckCircle, FaMedal, FaMap, FaCompass, FaShip, FaMountain, FaWater, FaGem } from "react-icons/fa";
import { Button } from "../../ui";
import { Header } from "../../ui";
import { useAuth } from "../../context/AuthContext";
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
        content: "Mental math: What's easier to calculate - (2×5)×3 or 2×(5×3)? Why?",
        answer: "2×15",
        explanation: "2×(5×3) = 2×15 = 30 is easier than (2×5)×3 = 10×3 = 30"
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

  React.useEffect(() => {
    if (mapRef.current) {
      setMapSize({
        width: mapRef.current.offsetWidth,
        height: mapRef.current.offsetHeight,
      });
    }
  }, []);

  // Load progress from backend on component mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!currentUser) return;
      
      // Debug authentication
      console.log('Current user:', currentUser);
      console.log('Token exists:', !!localStorage.getItem('token'));
      
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
        console.error('Error loading progress:', error);
        // If backend fails, continue with default state and mark backend as unavailable
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
    const saveProgress = async () => {
      if (!currentUser || loading || !backendAvailable) return;
      
      try {
        setSaving(true);
        // Convert UI booleans -> backend expected indices array
        const completedIndices = completed
          .map((isDone, idx) => (isDone ? idx : null))
          .filter((v) => v !== null);

        const progressData = {
          completedProperties: completedIndices,
          activePropertyIndex: active,
          totalPropertiesCompleted: completedIndices.length
        };
        
        console.log('Saving progress to backend:', progressData);
        const result = await saveMultiplicationProgress(progressData);
        console.log('Progress saved successfully:', result);
      } catch (error) {
        console.error('Error saving progress:', error);
        setBackendAvailable(false);
        // Don't throw error, just log it so the app continues to work
      } finally {
        setSaving(false);
      }
    };

    // Debounce the save operation
    const timeoutId = setTimeout(saveProgress, 1000);
    return () => clearTimeout(timeoutId);
  }, [completed, active, currentUser, loading, backendAvailable]);

  const handleComplete = async (idx) => {
    try {
      setSaving(true);
      
      // Update local state first
      const updated = [...completed];
      updated[idx] = true;
      setCompleted(updated);
      
      if (idx + 1 < 5) setActive(idx + 1);
      
      // Save to backend if available
      if (backendAvailable) {
        const propertyData = {
          propertyName: properties[idx].title,
          badgeName: properties[idx].badge,
          totalSteps: properties[idx].steps.length,
          completionTimeSeconds: 0 // You can track this if needed
        };
        
        console.log('Completing property:', idx, propertyData);
        const result = await completeMultiplicationProperty(idx, propertyData);
        console.log('Property completed successfully:', result);
      }
      
      setModalOpen(false);
      setStepIdx(0);
      setQuizInput("");
      setQuizFeedback("");
      setShowHint(false);
    } catch (error) {
      console.error('Error completing property:', error);
      // Don't revert local state changes, just log the error
    } finally {
      setSaving(false);
    }
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
      <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 text-lg">Loading your progress...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Header type="h1" fontSize="5xl" weight="bold" className="text-primary dark:text-white">Learning Multiplication: Treasure Hunt</Header>
          <div className="flex items-center gap-4">
            {!backendAvailable && (
              <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                <span>⚠️</span>
                <span>Offline Mode</span>
              </div>
            )}
            {saving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-600"></div>
                <span>Saving progress...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="mb-6 bg-white rounded-lg p-4 shadow-md border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-800">Multiplication Properties Badges</span>
            <span className="text-sm text-gray-500">{completed.filter(Boolean).length}/5 Completed</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {properties.slice(0, 5).map((prop, idx) => (
              <div key={prop.key} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                  completed[idx] 
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-lg' 
                    : 'bg-gray-200 border-2 border-gray-300'
                }`}>
                  {completed[idx] ? (
                    <FaMedal className="text-white text-2xl" />
                  ) : (
                    <FaLock className="text-gray-500 text-xl" />
                  )}
                </div>
                <span className={`text-xs font-medium text-center ${
                  completed[idx] ? 'text-yellow-700' : 'text-gray-500'
                }`}>
                  {prop.badge}
                </span>
                <span className={`text-xs text-center mt-1 ${
                  completed[idx] ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {completed[idx] ? '✓ Achieved' : 'Locked'}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative w-full h-[40vw] min-h-[350px]" ref={mapRef}>
          {/* Map background */}
          <img src="/images/game-images/map.png" alt="Treasure Map" className="w-full h-full object-cover rounded-2xl shadow-xl border-4 border-yellow-300" />
          {/* SVG Dashed Path: connects properties in order */}
          <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" width={mapSize.width} height={mapSize.height} style={{overflow: 'visible'}}>
            <polyline
              points={getSVGPoints(propertyPositions, mapSize.width, mapSize.height)}
              fill="none"
              stroke="#000000"
              strokeWidth="4"
              strokeDasharray="10,8"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(0 1px 2px #000000aa)' }}
            />
          </svg>
          {/* Map locations */}
          {properties.slice(0, 5).map((prop, idx) => (
            <button
              key={prop.key}
              className={`absolute ${prop.style} z-20 group focus:outline-none`}
              style={{ width: '160px', height: '160px', transform: 'translate(-50%, -50%)' }}
              onClick={() => openModal(idx)}
              disabled={idx > active}
              aria-label={prop.title}
            >
              <img
                src={prop.image}
                alt={prop.title}
                className={`w-full h-full object-contain drop-shadow-lg transition-all duration-300 ${idx > active ? 'opacity-40 grayscale' : ''}`}
              />
              {/* Overlay icon */}
              <span className="absolute bottom-1 right-1">
                {completed[idx] ? (
                  <FaCheckCircle className="text-green-500 text-xl" />
                ) : idx === active ? (
                  <span className="inline-block text-2xl font-bold text-blue-700">×</span>
                ) : (
                  <FaLock className="text-gray-400 text-xl" />
                )}
              </span>
            </button>
          ))}
        </div>
        {/* Modal for property details with comprehensive lesson structure */}
        {modalOpen && selectedIdx !== null && properties[selectedIdx] && properties[selectedIdx].steps && properties[selectedIdx].steps[stepIdx] && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative border-4 border-yellow-300">
              <button className="absolute top-4 right-4 text-gray-400 hover:text-red-500 text-2xl z-10" onClick={() => setModalOpen(false)}>&times;</button>
              
              {/* Header with story intro */}
              <div className="mb-6">
                <Header type="h3" className="text-xl font-bold text-blue-700 mb-2">{properties[selectedIdx].title}</Header>
                <p className="text-gray-700 mb-3">{properties[selectedIdx].description}</p>
                {stepIdx === 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                    <p className="text-blue-800 italic">{properties[selectedIdx].storyIntro}</p>
                  </div>
                )}
              </div>

              {/* Step content */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium capitalize">
                    {properties[selectedIdx].steps[stepIdx]?.type || 'Unknown'}
                  </span>
                  {properties[selectedIdx].steps[stepIdx]?.title && (
                    <span className="text-lg font-semibold text-gray-800">
                      {properties[selectedIdx].steps[stepIdx].title}
                    </span>
                  )}
                </div>

                {/* Content based on step type */}
                {properties[selectedIdx].steps[stepIdx].type === "quiz" ? (
                  <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                    <form onSubmit={handleQuizSubmit} className="flex flex-col gap-3">
                      <p className="text-gray-800 font-medium text-center">{properties[selectedIdx].steps[stepIdx].content.question}</p>
                      <input
                        className="border-2 border-yellow-400 rounded-lg px-4 py-2 text-lg text-center focus:outline-none focus:ring-2 focus:ring-yellow-400"
                        value={quizInput}
                        onChange={e => setQuizInput(e.target.value)}
                        placeholder="Enter your answer..."
                        autoFocus
                      />
                      <Button size="sm" variant="primary" type="submit" className="mt-2">Check Answer</Button>
                      {quizFeedback && (
                        <div className={`p-3 rounded-lg ${quizFeedback === 'Correct! 🎉' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          <span className="font-semibold">{quizFeedback}</span>
                          {quizFeedback === 'Correct! 🎉' && properties[selectedIdx].steps[stepIdx].content.explanation && (
                            <p className="mt-2 text-sm">{properties[selectedIdx].steps[stepIdx].content.explanation}</p>
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                ) : properties[selectedIdx].steps[stepIdx].type === "challenge" ? (
                  <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
                    <p className="text-gray-800 font-medium mb-3">{properties[selectedIdx].steps[stepIdx].content}</p>
                    <form onSubmit={handleQuizSubmit} className="flex flex-col gap-3">
                      <input
                        className="border-2 border-purple-400 rounded-lg px-4 py-2 text-lg text-center focus:outline-none focus:ring-2 focus:ring-purple-400"
                        value={quizInput}
                        onChange={e => setQuizInput(e.target.value)}
                        placeholder="Enter your answer..."
                        autoFocus
                      />
                      <Button size="sm" variant="primary" type="submit" className="mt-2">Submit Challenge</Button>
                      {quizFeedback && (
                        <div className={`p-3 rounded-lg ${quizFeedback === 'Correct! 🎉' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          <span className="font-semibold">{quizFeedback}</span>
                          {quizFeedback === 'Correct! 🎉' && properties[selectedIdx].steps[stepIdx].explanation && (
                            <p className="mt-2 text-sm">{properties[selectedIdx].steps[stepIdx].explanation}</p>
                          )}
                        </div>
                      )}
                    </form>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                    <p className="text-gray-800 leading-relaxed mb-4">{properties[selectedIdx].steps[stepIdx].content}</p>
                    
                    {/* Examples section */}
                    {properties[selectedIdx].steps[stepIdx].examples && (
                      <div className="bg-blue-50 p-3 rounded-lg mb-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Examples:</h4>
                        <ul className="space-y-1">
                          {properties[selectedIdx].steps[stepIdx].examples.map((example, idx) => (
                            <li key={idx} className="text-blue-700 font-mono">{example}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Visual example */}
                    {properties[selectedIdx].steps[stepIdx].visualExample && (
                      <div className="bg-green-50 p-3 rounded-lg mb-4">
                        <h4 className="font-semibold text-green-800 mb-2">Visual Example:</h4>
                        <p className="text-green-700 font-mono text-sm">{properties[selectedIdx].steps[stepIdx].visualExample}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Step navigation */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Step {stepIdx + 1} of {properties[selectedIdx]?.steps?.length || 0}
                </div>
                
                <div className="flex gap-2">
                  {stepIdx > 0 && (
                    <Button size="sm" variant="secondary" onClick={() => setStepIdx(stepIdx - 1)}>
                      Previous
                    </Button>
                  )}
                  
                  {properties[selectedIdx].steps[stepIdx] && 
                   properties[selectedIdx].steps[stepIdx].type !== "quiz" && 
                   properties[selectedIdx].steps[stepIdx].type !== "challenge" && 
                   stepIdx < properties[selectedIdx].steps.length - 1 && (
                    <Button size="sm" variant="primary" onClick={() => setStepIdx(stepIdx + 1)}>
                      Next
                    </Button>
                  )}
                  
                  {/* Auto-complete button for last step if it's not a quiz/challenge */}
                  {properties[selectedIdx].steps[stepIdx] && 
                   properties[selectedIdx].steps[stepIdx].type !== "quiz" && 
                   properties[selectedIdx].steps[stepIdx].type !== "challenge" && 
                   stepIdx === properties[selectedIdx].steps.length - 1 && 
                   !completed[selectedIdx] && 
                   selectedIdx === active && (
                    <Button size="sm" variant="primary" onClick={() => handleComplete(selectedIdx)}>
                      Complete Lesson
                    </Button>
                  )}
                </div>
              </div>

              {/* Badge display */}
              {completed[selectedIdx] && selectedIdx < 5 && (
                <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <FaMedal className="text-yellow-500 text-xl" />
                  <span className="text-green-700 font-semibold">{properties[selectedIdx].badge}</span>
                </div>
              )}

              {/* Treasure chest after all complete */}
              {selectedIdx === 4 && completed.every(Boolean) && (
                <div className="flex flex-col items-center mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <span className="text-4xl mb-2">🏆</span>
                  <span className="text-yellow-700 font-bold text-lg">You found the treasure!</span>
                  <p className="text-yellow-600 text-center mt-2">Congratulations! You've mastered all properties of multiplication!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LearningMultiplication; 