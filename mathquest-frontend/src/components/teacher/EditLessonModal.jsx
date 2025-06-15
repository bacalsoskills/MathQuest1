import React, { useState, useEffect } from "react";
import lessonService from "../../services/lessonService";
import contentBlockService from "../../services/contentBlockService";
import activityService from "../../services/activityService";
import quizService from "../../services/quizService";
import { 
  Box, 
  Typography,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tabs,
  Tab
} from "@mui/material";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

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

const EditLessonModal = ({ isOpen, onClose, lesson, classroomId, onLessonUpdated }) => {
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
    classroomId: classroomId,
    image: null
  });
  
  const [contentBlock, setContentBlock] = useState({
    id: null,
    title: "",
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
    availableFrom: '',
    availableTo: '',
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
  const [success, setSuccess] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [hasQuiz, setHasQuiz] = useState(false);

  const questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'IDENTIFICATION', label: 'Identification' },
    { value: 'CHECKBOX', label: 'Checkboxes' },
  ];

  // Initialize form data when lesson changes
  useEffect(() => {
    if (lesson) {
      console.log('Lesson data received:', lesson);
      console.log('Lesson activities:', lesson.activities);
      
      // Check for quiz activity specifically
      const quizActivity = lesson.activities?.find(activity => activity.type === 'QUIZ');
      console.log('Quiz activity details:', {
        found: !!quizActivity,
        activity: quizActivity,
        content: quizActivity?.content,
        quizData: quizActivity?.quizData
      });

      setLessonData({
        title: lesson.title || "",
        description: lesson.description || "",
        classroomId: classroomId,
        image: null
      });
      
      // Initialize content block data if available
      if (lesson.contentBlocks && lesson.contentBlocks.length > 0) {
        const mainBlock = lesson.contentBlocks[0];
        setContentBlock({
          id: mainBlock.id,
          title: mainBlock.title || "",
          content: mainBlock.content || "",
          structuredContent: mainBlock.structuredContent || "",
          orderIndex: mainBlock.orderIndex || 0
        });
      } else {
        setContentBlock({
          id: null,
          title: "",
          content: "",
          structuredContent: "",
          orderIndex: 0
        });
      }

      // Initialize quiz data if available
      if (lesson.activities && lesson.activities.length > 0) {
        if (quizActivity) {
          console.log('Processing quiz activity:', quizActivity);
          
          // Automatically set hasQuiz to true when editing an existing quiz
          setHasQuiz(true);
          try {
            // Parse the content string to get quiz details
            const quizContent = JSON.parse(quizActivity.content || '{}');
            console.log('Parsed quiz content:', quizContent);

            // Fetch the quiz data using the activity ID
            const fetchQuizData = async () => {
              try {
                const quizDetails = await quizService.getQuizByActivityId(quizActivity.id);
                console.log('Fetched quiz details:', quizDetails);

                if (quizDetails) {
                  const questions = JSON.parse(quizDetails.quizContent || '[]');
                  console.log('Parsed questions:', questions);

                  const quizDataToSet = {
                    title: quizActivity.title.replace('Quiz: ', '') || '',
                    description: quizActivity.description || '',
                    overallScore: quizDetails.overallScore || 100,
                    passingScore: quizDetails.passingScore || 60,
                    timeLimitMinutes: quizDetails.timeLimitMinutes || 30,
                    repeatable: quizDetails.repeatable || false,
                    maxAttempts: quizDetails.maxAttempts || 2,
                    quizType: quizDetails.quizType || 'PRACTICE_QUIZ',
                    availableFrom: quizDetails.availableFrom || new Date().toISOString().slice(0, 16),
                    availableTo: quizDetails.availableTo || new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 16),
                    questions: questions.map(q => {
                      let correctAnswers = [];
                      if (q.questionType === 'IDENTIFICATION') {
                        correctAnswers = [q.correctAnswer || ''];
                      } else if (q.questionType === 'CHECKBOX') {
                        correctAnswers = Array.isArray(q.correctAnswer) 
                          ? q.correctAnswer.map(ans => q.options.indexOf(ans))
                          : [];
                      } else {
                        correctAnswers = [q.options.indexOf(q.correctAnswer)];
                      }
                      
                      return {
                        question: q.questionText || '',
                        questionType: q.questionType || 'MULTIPLE_CHOICE',
                        options: q.options || ['', '', '', ''],
                        correctAnswers: correctAnswers,
                        points: q.points || 10,
                      };
                    }) || [
                      {
                        question: '',
                        questionType: 'MULTIPLE_CHOICE',
                        options: ['', '', '', ''],
                        correctAnswers: [],
                        points: 10,
                      },
                    ],
                  };
                  console.log('Final quiz data to be set:', quizDataToSet);
                  setQuizData(quizDataToSet);
                }
              } catch (error) {
                console.error('Error fetching quiz details:', error);
                setError('Failed to fetch quiz details. Please try again.');
              }
            };

            fetchQuizData();
          } catch (error) {
            console.error('Error parsing quiz content:', error);
            console.error('Raw quiz content that failed to parse:', quizActivity.content);
            setError('Failed to parse quiz content. Please try again.');
          }
        } else {
          console.log('No quiz activity found in lesson');
          // Reset quiz data if no quiz exists
          setHasQuiz(false);
          setQuizData({
            title: '',
            description: '',
            overallScore: 100,
            passingScore: 60,
            timeLimitMinutes: 30,
            repeatable: false,
            maxAttempts: 1,
            quizType: 'PRACTICE_QUIZ',
            availableFrom: new Date().toISOString().slice(0, 16),
            availableTo: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 16),
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
        }
      } else {
        console.log('No activities found in lesson');
      }
    }
  }, [lesson, classroomId]);

  // Add useEffect to calculate overall score whenever questions change
  useEffect(() => {
    const totalScore = quizData.questions.reduce((sum, question) => {
      return sum + (parseInt(question.points) || 0);
    }, 0);
    setQuizData(prev => ({ ...prev, overallScore: totalScore }));
  }, [quizData.questions]);

  const handleLessonChange = (e) => {
    const { name, value } = e.target;
    setLessonData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStructuredContentChange = (value) => {
    setContentBlock(prev => ({ ...prev, structuredContent: value }));
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLessonData(prev => ({ ...prev, image: file }));
      
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
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
    setSuccess(null);

    try {
      // Validate that all questions have correct answers
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

      // Create form data for multipart/form-data
      const formData = new FormData();
      
      formData.append('title', lessonData.title || "");
      
      if (lessonData.description) {
        formData.append('description', lessonData.description);
      }
      
      if (classroomId && classroomId !== 'undefined' && classroomId !== 'null') {
        formData.append('classroomId', classroomId);
      }
      
      if (lessonData.image) {
        formData.append('image', lessonData.image);
      }
      
      // Update lesson
      const updatedLesson = await lessonService.updateLesson(lesson.id, formData);
      
      // Update or create content block if content is provided
      if (contentBlock.structuredContent.trim() !== "") {
        if (contentBlock.id) {
          await contentBlockService.updateContentBlock(contentBlock.id, {
            structuredContent: contentBlock.structuredContent,
            lessonId: lesson.id
          });
        } else {
          await contentBlockService.createContentBlock({
            structuredContent: contentBlock.structuredContent,
            lessonId: lesson.id,
            orderIndex: 0
          });
        }
      }

      // Handle quiz creation/update if hasQuiz is true
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

        // Create form data for the activity update
        const activityFormData = new FormData();
        activityFormData.append('title', activityData.title);
        activityFormData.append('description', activityData.description);
        activityFormData.append('type', activityData.type);
        activityFormData.append('classroomId', activityData.classroomId);
        activityFormData.append('content', activityData.content);

        // Create or update the quiz
        const quizToCreate = {
          quizName: quizData.title,
          description: quizData.description,
          overallScore: quizData.overallScore,
          passingScore: quizData.passingScore,
          timeLimitMinutes: quizData.timeLimitMinutes,
          repeatable: quizData.repeatable,
          maxAttempts: quizData.repeatable ? quizData.maxAttempts : null,
          quizType: quizData.quizType,
          totalItems: quizData.questions.length,
          lessonId: lesson.id,
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
          }))),
          availableFrom: quizData.availableFrom ? new Date(quizData.availableFrom).toISOString().slice(0, 19) : null,
          availableTo: quizData.availableTo ? new Date(quizData.availableTo).toISOString().slice(0, 19) : null
        };

        // Create or update the activity
        let activity;
        const existingQuizActivity = lesson.activities?.find(a => a.type === 'QUIZ');
        
        try {
          if (existingQuizActivity) {
            console.log('Updating existing quiz activity:', existingQuizActivity.id);
            activity = await activityService.updateActivity(existingQuizActivity.id, activityFormData);
            
            // Get the existing quiz ID
            const existingQuiz = await quizService.getQuizByActivityId(existingQuizActivity.id);
            if (existingQuiz && existingQuiz.id) {
              console.log('Updating existing quiz:', existingQuiz.id);
              await quizService.updateQuiz(existingQuiz.id, quizToCreate);
            } else {
              console.log('Creating new quiz for existing activity');
              await quizService.createQuiz(existingQuizActivity.id, quizToCreate);
            }
          } else {
            console.log('Creating new quiz activity');
            activity = await activityService.createActivity(activityData);
            if (!activity || !activity.id) {
              throw new Error('Failed to create activity for quiz');
            }
            await quizService.createQuiz(activity.id, quizToCreate);
          }
        } catch (error) {
          console.error('Error handling quiz activity:', error);
          throw new Error(`Failed to handle quiz activity: ${error.message}`);
        }
      }
      
      setSuccess("Lesson updated successfully!");
      
      if (onLessonUpdated) {
        const refreshedLesson = await lessonService.getLessonById(lesson.id);
        onLessonUpdated(refreshedLesson);
      }
      
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating lesson:", err);
      setError(err.message || "Failed to update lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await lessonService.deleteLesson(lesson.id);
      setSuccess("Lesson deleted successfully!");
      if (onLessonUpdated) {
        onLessonUpdated(null);
      }
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error deleting lesson:", err);
      setError(err.message || "Failed to delete lesson. Please try again.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteDialogOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
          <div className="flex justify-between items-center border-b px-6 py-4 flex-shrink-0">
            <h3 className="text-xl font-semibold text-gray-900">
              Edit Lesson
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="border-b flex-shrink-0">
            <Tabs value={activeTab} onChange={handleTabChange} centered>
              <Tab label="Lesson Content" />
              <Tab label={lesson?.activities?.find(a => a.type === 'QUIZ') ? "Edit Quiz" : "Add Quiz"} />
            </Tabs>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
            <div className="p-6 overflow-y-auto flex-grow">
              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
                  {success}
                </div>
              )}

              {activeTab === 0 && (
                <>
                  <div className="mb-4">
                    <Typography variant="h6" gutterBottom>
                      Lesson Details
                    </Typography>
                    
                    <div className="mb-4">
                      <TextField
                        fullWidth
                        required
                        label="Lesson Title"
                        name="title"
                        value={lessonData.title}
                        onChange={handleLessonChange}
                        margin="normal"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <Typography variant="h6" gutterBottom>
                      Lesson Content
                    </Typography>
                    
                    <div className="mb-4">
                      <div className="border border-gray-300 rounded">
                        <ReactQuill 
                          theme="snow"
                          value={contentBlock.structuredContent} 
                          onChange={handleStructuredContentChange}
                          modules={quillModules}
                          formats={quillFormats}
                          style={{ height: '250px', marginBottom: '40px' }}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 1 && (
                <div className="space-y-4">
                  {!lesson?.activities?.find(a => a.type === 'QUIZ') && (
                    <div className="flex items-center mb-4">
                      <input
                        type="checkbox"
                        id="has-quiz"
                        checked={hasQuiz}
                        onChange={(e) => setHasQuiz(e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                      />
                      <label htmlFor="has-quiz" className="text-sm font-medium text-gray-700">
                        Add Quiz to this Lesson
                      </label>
                    </div>
                  )}

                  {(hasQuiz || lesson?.activities?.find(a => a.type === 'QUIZ')) && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quiz Title
                          </label>
                          <input
                            type="text"
                            value={quizData.title}
                            onChange={(e) => setQuizData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full p-2 border rounded"
                            required={hasQuiz}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quiz Type
                          </label>
                          <select
                            value={quizData.quizType}
                            onChange={(e) => setQuizData(prev => ({ ...prev, quizType: e.target.value }))}
                            className="w-full p-2 border rounded bg-white text-sm"
                            required={hasQuiz}
                          >
                            <option value="PRACTICE_QUIZ">Practice Quiz</option>
                            <option value="MAJOR_EXAMS">Major Exams</option>
                            <option value="POP_QUIZ">Pop Quiz</option>
                            <option value="DIAGNOSTIC_QUIZ">Diagnostic Quiz</option>
                            <option value="ACTIVITY">Activity</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Overall Score
                          </label>
                          <input
                            type="number"
                            value={quizData.overallScore}
                            className="w-full p-2 border rounded bg-gray-100"
                            readOnly
                            disabled
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Passing Score
                          </label>
                          <input
                            type="number"
                            value={quizData.passingScore}
                            onChange={(e) => setQuizData(prev => ({ ...prev, passingScore: e.target.value }))}
                            className="w-full p-2 border rounded"
                            required
                            min="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Time Limit (minutes)
                          </label>
                          <input
                            type="number"
                            value={quizData.timeLimitMinutes}
                            onChange={(e) => setQuizData(prev => ({ ...prev, timeLimitMinutes: e.target.value }))}
                            className="w-full p-2 border rounded"
                            required
                            min="1"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Available From
                          </label>
                          <input
                            type="datetime-local"
                            value={quizData.availableFrom}
                            onChange={(e) => setQuizData(prev => ({ ...prev, availableFrom: e.target.value }))}
                            className="w-full p-2 border rounded"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Available To
                          </label>
                          <input
                            type="datetime-local"
                            value={quizData.availableTo}
                            onChange={(e) => setQuizData(prev => ({ ...prev, availableTo: e.target.value }))}
                            className="w-full p-2 border rounded"
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
                              className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                              id="allow-multiple-attempts"
                            />
                            <label htmlFor="allow-multiple-attempts" className="text-sm font-medium text-gray-700">
                              Allow Multiple Attempts
                            </label>
                          </div>
                          {quizData.repeatable && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Attempts (per student)
                              </label>
                              <input
                                type="number"
                                value={quizData.maxAttempts}
                                min="2"
                                max="5"
                                onChange={(e) => setQuizData(prev => ({ ...prev, maxAttempts: e.target.value }))}
                                className="w-full p-2 border rounded"
                                required={quizData.repeatable}
                              />
                              <p className="text-xs text-gray-500 mt-1">Must be between 2 and 5 attempts</p>
                            </div>
                          )}
                          {!quizData.repeatable && (
                            <p className="text-xs text-gray-500 mt-1">Single attempt only</p>
                          )}
                        </div>
                      </div>

                      {/* Questions Section */}
                      <div className="space-y-6">
                        {quizData.questions.map((question, qIndex) => (
                          <div key={qIndex} className="p-4 border rounded bg-gray-50">
                            <div className="flex justify-between items-center mb-3">
                              <label className="block text-sm font-semibold text-gray-800">
                                Question {qIndex + 1}
                              </label>
                              <div className="flex items-center">
                                <label className="text-xs font-medium text-gray-600 mr-2">
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
                                  className="w-16 p-1 border rounded text-center text-sm"
                                  required
                                />
                              </div>
                            </div>

                            <div className="space-y-4">
                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Question Type
                                </label>
                                <select
                                  value={question.questionType}
                                  onChange={(e) => handleQuestionChange(qIndex, 'questionType', e.target.value)}
                                  className="w-full p-2 border rounded bg-white text-sm"
                                >
                                  {questionTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Question Text
                                </label>
                                <input
                                  type="text"
                                  value={question.question}
                                  onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
                                  className="w-full p-2 border rounded text-sm"
                                  required
                                  placeholder="Enter the question"
                                />
                              </div>

                              {question.questionType === 'MULTIPLE_CHOICE' && (
                                <>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Options (select correct answer)
                                  </label>
                                  {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center space-x-2">
                                      <input
                                        type="radio"
                                        name={`correct-${qIndex}`}
                                        checked={question.correctAnswers.includes(oIndex)}
                                        onChange={() => handleQuestionChange(qIndex, 'correctAnswers', oIndex)}
                                        className="h-4 w-4 text-blue-600 border-gray-300"
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
                                        className="flex-1 p-2 border rounded text-sm"
                                        placeholder={`Option ${oIndex + 1}`}
                                        required
                                      />
                                    </div>
                                  ))}
                                  {question.correctAnswers.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">Please select a correct answer</p>
                                  )}
                                </>
                              )}

                              {question.questionType === 'CHECKBOX' && (
                                <>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Options (select all correct answers)
                                  </label>
                                  {question.options.map((option, oIndex) => (
                                    <div key={oIndex} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        checked={question.correctAnswers.includes(oIndex)}
                                        onChange={() => handleQuestionChange(qIndex, 'correctAnswers', oIndex)}
                                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
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
                                        className="flex-1 p-2 border rounded text-sm"
                                        placeholder={`Option ${oIndex + 1}`}
                                        required
                                      />
                                    </div>
                                  ))}
                                  {question.correctAnswers.length === 0 && (
                                    <p className="text-xs text-red-500 mt-1">Please select at least one correct answer</p>
                                  )}
                                </>
                              )}
                              
                              {question.questionType === 'IDENTIFICATION' && (
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Correct Answer
                                  </label>
                                  <input
                                    type="text"
                                    value={Array.isArray(question.correctAnswers) ? (question.correctAnswers[0] || '') : ''}
                                    onChange={(e) => handleQuestionChange(qIndex, 'correctAnswers', e.target.value)}
                                    className="w-full p-2 border rounded text-sm"
                                    placeholder="Enter the exact correct answer"
                                    required
                                  />
                                  {(!question.correctAnswers[0] || question.correctAnswers[0].trim() === '') && (
                                    <p className="text-xs text-red-500 mt-1">Please provide a correct answer</p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={handleAddQuestion}
                        className="mt-4 px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                      >
                        Add Question
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

<div className="border-t px-6 py-4 bg-gray-50 flex-shrink-0">    
  <div className="flex justify-end space-x-3 mt-6 ">
              <Button
                variant="outlined"
                color="error"
                onClick={handleDeleteClick}
                disabled={isSubmitting || isDeleting}
              >
                Delete Lesson
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting || isDeleting}
              >
                {isSubmitting ? "Updating..." : "Update Lesson"}
              </Button>
            </div></div>
        
          </form>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>Delete Lesson</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this lesson? This action cannot be undone and all lesson data including content blocks will be permanently removed.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default EditLessonModal; 