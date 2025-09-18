import React, { useState, useEffect } from "react";
import lessonService from "../../services/lessonService";
import contentBlockService from "../../services/contentBlockService";
import activityService from "../../services/activityService";
import quizService from "../../services/quizService";
import { Button } from "../../ui/button";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import AddQuizModal from './AddQuizModal';
import Modal from "../../ui/modal";
import { FaTimes } from "react-icons/fa";
import { toast } from 'react-hot-toast';

// Quill editor modules and formats
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['blockquote', 'code-block'],
    ['clean']
  ]
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'image',
  'blockquote', 'code-block'
];

const AddLessonModal = ({ isOpen, onClose, classroomId, onLessonAdded }) => {
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
    classroomId: classroomId,
    image: null
  });
  
  const [contentBlock, setContentBlock] = useState({
    title: "",
    subtitle: "",
    content: "",
    structuredContent: "",
    orderIndex: 0
  });

  const [quizData, setQuizData] = useState({
    title: '',
    description: '',
    overallScore: 0,
    passingScore: 60,
    timeLimitMinutes: 30,
    repeatable: false,
    maxAttempts: 1,
    quizType: 'PRACTICE_QUIZ',
    availableFrom: new Date().toISOString().slice(0, 19),
    availableTo: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 19),
    questions: [
      {
        question: '',
        questionType: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctAnswers: [],
        points: 10,
      },
    ],
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [hasQuiz, setHasQuiz] = useState(false);

  const questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'IDENTIFICATION', label: 'Identification' },
    { value: 'CHECKBOX', label: 'Checkboxes' },
  ];

  const formatLocalDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    // If input is 'YYYY-MM-DDTHH:mm', add ':00' for seconds
    return dateTimeStr.length === 16
      ? dateTimeStr + ':00'
      : dateTimeStr;
  };

  const handleLessonChange = (e) => {
    const { name, value } = e.target;
    setLessonData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContentBlockChange = (e) => {
    const { name, value } = e.target;
    setContentBlock(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStructuredContentChange = (value) => {
    setContentBlock(prev => ({ ...prev, structuredContent: value }));
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLessonData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
  };

  const handleAddQuestion = () => {
    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          questionType: 'MULTIPLE_CHOICE',
          options: ['', '', '', ''],
          correctAnswers: [],
          points: 10,
        },
      ],
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...quizData.questions];
    const currentQuestion = updatedQuestions[index];

    if (field === 'options') {
      currentQuestion.options = value;
    } else if (field === 'questionType') {
      currentQuestion[field] = value;
      if (value === 'IDENTIFICATION') {
        currentQuestion.options = [''];
        currentQuestion.correctAnswers = [''];
      } else {
        currentQuestion.options = ['', '', '', ''];
        currentQuestion.correctAnswers = [];
      }
    } else if (field === 'correctAnswers') {
      if (currentQuestion.questionType === 'CHECKBOX') {
        const optionIndex = parseInt(value, 10);
        if (!Array.isArray(currentQuestion.correctAnswers)) {
          currentQuestion.correctAnswers = [];
        }
        const currentIndex = currentQuestion.correctAnswers.indexOf(optionIndex);
        if (currentIndex === -1) {
          currentQuestion.correctAnswers.push(optionIndex);
        } else {
          currentQuestion.correctAnswers.splice(currentIndex, 1);
        }
      } else if (currentQuestion.questionType === 'IDENTIFICATION') {
        currentQuestion.correctAnswers = [value];
      } else {
        currentQuestion.correctAnswers = [parseInt(value, 10)];
      }
    } else {
      currentQuestion[field] = value;
    }
    setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Only validate quiz answers if hasQuiz is true
      if (hasQuiz) {
        const invalidQuestions = quizData.questions.filter((q, index) => {
          if (q.questionType === 'CHECKBOX') {
            return q.correctAnswers.length === 0;
          } else if (q.questionType === 'IDENTIFICATION') {
            return !q.correctAnswers[0] || q.correctAnswers[0].trim() === '';
          } else {
            return q.correctAnswers.length === 0;
          }
        });

        if (invalidQuestions.length > 0) {
          setError('Please provide correct answers for all questions before submitting');
          setIsSubmitting(false);
          return;
        }
      }

      // Create lesson first
      const lesson = await lessonService.createLesson(lessonData);
      
      // Add content block if provided
      if (contentBlock.structuredContent.trim() !== "") {
        await contentBlockService.createContentBlock({
          ...contentBlock,
          lessonId: lesson.id
        });
      }

      // Create quiz if hasQuiz is true
      if (hasQuiz) {
        const timestamp = new Date().toISOString();
        const activityData = {
          title: `Quiz: ${quizData.title}`,
          description: quizData.description || 'Quiz activity',
          type: 'QUIZ',
          classroomId: classroomId,
          content: JSON.stringify({
            quizName: quizData.title,
            description: quizData.description,
            type: 'QUIZ',
            timestamp
          })
        };

        // Create the activity first
        const activity = await activityService.createActivity(activityData);
        
        if (!activity || !activity.id) {
          throw new Error('Failed to create activity for quiz');
        }

        // Create the quiz with the lesson ID
        const quizToCreate = {
          quizName: quizData.title,
          description: quizData.description,
          overallScore: parseInt(quizData.overallScore, 10),
          passingScore: parseInt(quizData.passingScore, 10),
          availableFrom: formatLocalDateTime(quizData.availableFrom),
          availableTo: quizData.availableTo ? formatLocalDateTime(quizData.availableTo) : null,
          repeatable: quizData.repeatable,
          timeLimitMinutes: quizData.timeLimitMinutes,
          maxAttempts: quizData.repeatable ? parseInt(quizData.maxAttempts, 10) : null,
          totalItems: quizData.questions.length,
          lessonId: lesson.id,
          quizType: quizData.quizType,
          quizContent: JSON.stringify(quizData.questions.map(q => ({
            questionText: q.question,
            questionType: q.questionType,
            options: q.questionType !== 'IDENTIFICATION' ? q.options : null,
            correctAnswer: q.questionType === 'IDENTIFICATION' 
              ? q.correctAnswers[0]
              : q.questionType === 'CHECKBOX'
                ? q.correctAnswers.map(index => q.options[index])
                : q.correctAnswers.length > 0 ? q.options[q.correctAnswers[0]] : null,
            points: parseInt(q.points) || 10
          })))
        };

        

        await quizService.createQuiz(activity.id, quizToCreate);
      }
      
      // Reset form
      setLessonData({
        title: "",
        description: "",
        classroomId: classroomId,
        image: null
      });
      
      setContentBlock({
        title: "",
        subtitle: "",
        content: "",
        structuredContent: "",
        orderIndex: 0
      });
      
      setQuizData({
        title: '',
        description: '',
        overallScore: 0,
        passingScore: 60,
        timeLimitMinutes: 30,
        repeatable: false,
        maxAttempts: 1,
        quizType: 'PRACTICE_QUIZ',
        availableFrom: new Date().toISOString().slice(0, 19),
        availableTo: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 19),
        questions: [
          {
            question: '',
            questionType: 'MULTIPLE_CHOICE',
            options: ['', '', '', ''],
            correctAnswers: [],
            points: 10,
          },
        ],
      });
      
      setImagePreview(null);
      setHasQuiz(false);
      
      if (onLessonAdded) {
        onLessonAdded(lesson);
      }
      
      onClose();
    } catch (err) {
      console.error("Error creating lesson:", err);
      setError(err.message || "Failed to create lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add useEffect to calculate overall score whenever questions change
  useEffect(() => {
    if (!hasQuiz) return; // Only calculate if quiz is enabled
    
    const totalScore = quizData.questions.reduce((sum, question) => {
      return sum + (parseInt(question.points) || 0);
    }, 0);
    
    // Only update if the score has actually changed
    if (totalScore !== quizData.overallScore) {
      setQuizData(prev => ({ ...prev, overallScore: totalScore }));
    }
  }, [quizData.questions, hasQuiz]); // Add hasQuiz as dependency

  if (!isOpen) return null;

  const modalFooter = (
    <>
      <Button
        variant="cancel"
        size="sm"
        rounded="full"
        onClick={onClose}
        disabled={isSubmitting}
      >
        Cancel
      </Button>
      <Button
        type="submit"
        variant="default"
        size="sm"
        onClick={handleSubmit}
        rounded="full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Saving..." : "Create Lesson"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Lesson"
      footer={modalFooter}
    >
      <div className="border-b border-gray-300 dark:border-gray-600 flex-shrink-0">
        <div className="flex justify-center">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => handleTabChange(0)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeTab === 0
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Lesson Content
            </button>
            <button
              onClick={() => handleTabChange(1)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                activeTab === 1
                  ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Add Quiz
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden mt-5">
        <div className="overflow-y-auto flex-grow">
          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
              {error}
            </div>
          )}

          {activeTab === 0 && (
            <>
              <div className="mb-4">
                <h6 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Details
                </h6>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Lesson Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={lessonData.title}
                    onChange={handleLessonChange}
                    required
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-colors"
                    placeholder="Enter lesson title"
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <h6 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Lesson Content
                </h6>
                
                <div className="mb-4">
                  <div className="border border-gray-300 dark:border-gray-600 rounded-md">
                    <ReactQuill 
                      theme="snow"
                      value={contentBlock.structuredContent} 
                      onChange={handleStructuredContentChange}
                      modules={quillModules}
                      formats={quillFormats}
                      style={{ height: '250px', marginBottom: '40px' }}
                      className="dark:!text-gray-300"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 1 && (
            <div className="space-y-4">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="has-quiz"
                  checked={hasQuiz}
                  onChange={(e) => setHasQuiz(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded mr-2"
                />
                <label htmlFor="has-quiz" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Add Quiz to this Lesson
                </label>
              </div>

              {hasQuiz && (
                <div className="space-y-6 mt-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quiz Title *
                      </label>
                      <input
                        type="text"
                        value={quizData.title}
                        onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        required={true}
                        placeholder="Enter quiz title"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Quiz Type
                      </label>
                      <select
                        value={quizData.quizType}
                        onChange={(e) => setQuizData(prev => ({ ...prev, quizType: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm"
                        required={true}
                      >
                        <option value="PRACTICE_QUIZ">Practice Quiz</option>
                        <option value="MAJOR_EXAMS">Major Exams</option>
                        <option value="POP_QUIZ">Pop Quiz</option>
                        <option value="DIAGNOSTIC_QUIZ">Diagnostic Quiz</option>
                        <option value="ACTIVITY">Activity</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Overall Score
                      </label>
                      <input
                        type="number"
                        value={quizData.overallScore}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                        readOnly
                        disabled
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Passing Score
                      </label>
                      <input
                        type="number"
                        value={quizData.passingScore}
                        onChange={(e) => setQuizData(prev => ({ ...prev, passingScore: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        required
                        min="0"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Time Limit (minutes)
                      </label>
                      <input
                        type="number"
                        value={quizData.timeLimitMinutes}
                        onChange={(e) => setQuizData(prev => ({ ...prev, timeLimitMinutes: e.target.value }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        required
                        min="1"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Available From
                      </label>
                      <input
                        type="datetime-local"
                        value={quizData.availableFrom.slice(0, 16)}
                        onChange={(e) => setQuizData(prev => ({ 
                          ...prev, 
                          availableFrom: e.target.value + ':00'
                        }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Available To
                      </label>
                      <input
                        type="datetime-local"
                        value={quizData.availableTo.slice(0, 16)}
                        onChange={(e) => setQuizData(prev => ({ 
                          ...prev, 
                          availableTo: e.target.value + ':00'
                        }))}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center mb-2">
                        <input
                          type="checkbox"
                          checked={quizData.repeatable}
                          onChange={(e) => setQuizData(prev => ({
                            ...prev,
                            repeatable: e.target.checked,
                            maxAttempts: e.target.checked ? 2 : 1
                          }))}
                          className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded mr-2"
                          id="allow-multiple-attempts"
                        />
                        <label htmlFor="allow-multiple-attempts" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Allow Multiple Attempts
                        </label>
                      </div>
                      {quizData.repeatable && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Max Attempts (per student)
                          </label>
                          <input
                            type="number"
                            value={quizData.maxAttempts}
                            min="2"
                            max="5"
                            onChange={(e) => setQuizData(prev => ({ ...prev, maxAttempts: e.target.value }))}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                            required={quizData.repeatable}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be between 2 and 5 attempts</p>
                        </div>
                      )}
                      {!quizData.repeatable && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Single attempt only</p>
                      )}
                    </div>
                  </div>

                  {/* Questions Section */}
                  <div className="space-y-6">
                    {quizData.questions.map((question, qIndex) => (
                      <div key={qIndex} className="p-4 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800">
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-semibold text-gray-800 dark:text-gray-300">
                            Question {qIndex + 1}
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mr-2">
                                Points:
                              </label>
                              <input
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={question.points || 10}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (/^\d*$/.test(value)) {
                                    const numValue = value === '' ? 1 : parseInt(value);
                                    handleQuestionChange(qIndex, 'points', numValue);
                                  }
                                }}
                                onBlur={(e) => {
                                  const value = parseInt(e.target.value) || 1;
                                  handleQuestionChange(qIndex, 'points', value);
                                }}
                                className="w-16 p-1 border border-gray-300 dark:border-gray-600 rounded text-center text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                required
                              />
                            </div>
                            {quizData.questions.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedQuestions = quizData.questions.filter((_, i) => i !== qIndex);
                                  setQuizData(prev => ({ ...prev, questions: updatedQuestions }));
                                }}
                                className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                title="Remove question"
                              >
                                <FaTimes size={14} />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Question Type
                            </label>
                            <select
                              value={question.questionType}
                              onChange={(e) => handleQuestionChange(qIndex, 'questionType', e.target.value)}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm"
                            >
                              {questionTypes.map((type) => (
                                <option key={type.value} value={type.value}>
                                  {type.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Question Text
                            </label>
                            <input
                              type="text"
                              value={question.question}
                              onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                              required
                              placeholder="Enter the question"
                            />
                          </div>

                          {question.questionType === 'MULTIPLE_CHOICE' && (
                            <>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Options (select correct answer)
                              </label>
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center space-x-2">
                                  <input
                                    type="radio"
                                    name={`correct-${qIndex}`}
                                    checked={question.correctAnswers.includes(oIndex)}
                                    onChange={() => handleQuestionChange(qIndex, 'correctAnswers', oIndex)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600"
                                    required={question.correctAnswers.length === 0}
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      newOptions[oIndex] = e.target.value;
                                      handleQuestionChange(qIndex, 'options', newOptions);
                                    }}
                                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    placeholder={`Option ${oIndex + 1}`}
                                    required
                                  />
                                </div>
                              ))}
                              {question.correctAnswers.length === 0 && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">Please select a correct answer</p>
                              )}
                            </>
                          )}

                          {question.questionType === 'CHECKBOX' && (
                            <>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Options (select all correct answers)
                              </label>
                              {question.options.map((option, oIndex) => (
                                <div key={oIndex} className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    checked={question.correctAnswers.includes(oIndex)}
                                    onChange={() => handleQuestionChange(qIndex, 'correctAnswers', oIndex)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded"
                                    required={question.correctAnswers.length === 0}
                                  />
                                  <input
                                    type="text"
                                    value={option}
                                    onChange={(e) => {
                                      const newOptions = [...question.options];
                                      newOptions[oIndex] = e.target.value;
                                      handleQuestionChange(qIndex, 'options', newOptions);
                                    }}
                                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                    placeholder={`Option ${oIndex + 1}`}
                                    required
                                  />
                                </div>
                              ))}
                              {question.correctAnswers.length === 0 && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">Please select at least one correct answer</p>
                              )}
                            </>
                          )}
                          
                          {question.questionType === 'IDENTIFICATION' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Correct Answer
                              </label>
                              <input
                                type="text"
                                value={Array.isArray(question.correctAnswers) ? (question.correctAnswers[0] || '') : ''}
                                onChange={(e) => handleQuestionChange(qIndex, 'correctAnswers', e.target.value)}
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                                placeholder="Enter the exact correct answer"
                                required
                              />
                              {(!question.correctAnswers[0] || question.correctAnswers[0].trim() === '') && (
                                <p className="text-xs text-red-500 dark:text-red-400 mt-1">Please provide a correct answer</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={handleAddQuestion}
                    variant="outlineWhite"
                    size="sm"
                  >
                    Add Question
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};

export default AddLessonModal; 