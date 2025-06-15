// import React, { useState, useEffect, useRef } from 'react';
// import { Dialog } from '@headlessui/react';
// import { Header } from '../../ui/heading';
// import { toast } from 'react-hot-toast';
// import axios from 'axios';
// import api from '../../services/api';
// import { useAuth } from '../../context/AuthContext';
// import quizService from '../../services/quizService';
// import activityService from '../../services/activityService';


// const AddQuizModal = ({ isOpen, onClose, activityId, classroomId, onQuizCreated, quizId, isEdit = false }) => {
//   const { token } = useAuth();
//   const [formData, setFormData] = useState({
//     title: '',
//     description: '',
//     overallScore: 100, 
//     passingScore: 60, 
//     availableFrom: new Date().toISOString().slice(0, 16), 
//     availableTo: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 16), 
//     repeatable: false,
//     timeLimitMinutes: 30, 
//     maxAttempts: 2,
//     questions: [
//       {
//         question: '',
//         questionType: 'MULTIPLE_CHOICE',
//         options: ['', '', '', ''],
//         correctAnswers: [], // Array for multiple correct answers
//         points: 10, // Default points per question
//       },
//     ],
//   });

//   const [loading, setLoading] = useState(false);
//   const submitButtonRef = useRef(null);
//   const [isSubmitting, setIsSubmitting] = useState(false);

//   // Calculate overall score based on the sum of question points
//   const calculateOverallScore = () => {
//     return formData.questions.reduce((total, question) => {
//       return total + (parseInt(question.points) || 0);
//     }, 0);
//   };

//     // Helper to convert backend date string to local datetime-local string for input fields
//     function toDatetimeLocal(dtString) {
//       if (!dtString) return '';
//       // dtString is like '2025-05-26T00:30:00' or '2025-05-26T00:30:00.000'
//       const date = new Date(dtString);
//       // Get local time in 'YYYY-MM-DDTHH:mm'
//       const offset = date.getTimezoneOffset();
//       const localDate = new Date(date.getTime() - offset * 60000);
//       return localDate.toISOString().slice(0, 16);
//     }
  

//   const formatLocalDateTime = (dateTimeStr) => {
//     if (!dateTimeStr) return null;
//     // If input is 'YYYY-MM-DDTHH:mm', add ':00' for seconds
//     return dateTimeStr.length === 16
//       ? dateTimeStr + ':00'
//       : dateTimeStr;
//   };

//   // Update overall score whenever questions change
//   useEffect(() => {
//     const totalScore = calculateOverallScore();
//     setFormData(prev => ({
//       ...prev,
//       overallScore: totalScore
//     }));
//   }, [formData.questions]);

//   useEffect(() => {
//     if (isEdit && quizId && isOpen) {
//       // Fetch quiz data and populate form
//       (async () => {
//         try {
//           const quiz = await quizService.getQuiz(quizId);
//           let questions = quiz.quizContent;
//           if (typeof questions === 'string') {
//             questions = JSON.parse(questions);
//           }
//           // Ensure correctAnswers is always an array and all fields exist
//           questions = (questions || []).map(q => ({
//             question: q.questionText || q.question || '',
//             questionType: q.questionType || 'MULTIPLE_CHOICE',
//             options: q.options || ['', '', '', ''],
//             correctAnswers: Array.isArray(q.correctAnswers)
//               ? q.correctAnswers
//               : q.questionType === 'IDENTIFICATION'
//                 ? [q.correctAnswer || '']
//                 : (typeof q.correctAnswer !== 'undefined' && q.correctAnswer !== null)
//                   ? [q.options && q.options.indexOf(q.correctAnswer) !== -1 ? q.options.indexOf(q.correctAnswer) : 0]
//                   : [],
//             points: typeof q.points === 'number' ? q.points : 10,
//           }));

//             // Format date to 'YYYY-MM-DDTHH:mm' (local time) for input
//             const formatForInput = (dateStr) => {
//               if (!dateStr) return '';
//               const d = new Date(dateStr);
//               const pad = (n) => n.toString().padStart(2, '0');
//               return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
//             };
//           setFormData({
//             title: quiz.quizName || '',
//             description: quiz.description || '',
//             overallScore: quiz.overallScore || 100,
//             passingScore: quiz.passingScore || 60,
//             // availableFrom: quiz.availableFrom ? new Date(quiz.availableFrom).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
//             // availableTo: quiz.availableTo ? new Date(quiz.availableTo).toISOString().slice(0, 16) : '',
//             availableFrom: toDatetimeLocal(quiz.availableFrom),
//             availableTo: toDatetimeLocal(quiz.availableTo),
//             repeatable: quiz.repeatable || false,
//             timeLimitMinutes: quiz.timeLimitMinutes || 30,
//             maxAttempts: quiz.maxAttempts || 2,
//             questions: questions,
//           });
//         } catch (err) {
//           toast.error('Failed to load quiz for editing');
//         }
//       })();
//     }
//   }, [isEdit, quizId, isOpen]);

//   const handleInputChange = (e) => {
//     const { name, value, checked, type } = e.target;
//     setFormData({
//       ...formData,
//       [name]: type === 'checkbox' ? checked : value,
//     });
//   };

//   const questionTypes = [
//     { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
//     { value: 'IDENTIFICATION', label: 'Identification' },
//     { value: 'CHECKBOX', label: 'Checkboxes' },
//   ];

//   const handleAddQuestion = () => {
//     setFormData({
//       ...formData,
//       questions: [
//         ...formData.questions,
//         {
//           question: '',
//           questionType: 'MULTIPLE_CHOICE',
//           options: ['', '', '', ''],
//           correctAnswers: [], 
//           points: 10,
//         },
//       ],
//     });
//   };

//   const handleQuestionChange = (index, field, value) => {
//     const updatedQuestions = [...formData.questions];
//     const currentQuestion = updatedQuestions[index];

//     if (field === 'options') {
//       currentQuestion.options = value;
//     } else if (field === 'questionType') {
//       currentQuestion[field] = value;
//       if (value === 'IDENTIFICATION') {
//         currentQuestion.options = [''];
//         currentQuestion.correctAnswers = [''];
//       } else {
//         currentQuestion.options = ['', '', '', ''];
//         currentQuestion.correctAnswers = [];
//       }
//     } else if (field === 'correctAnswers') {
//       if (currentQuestion.questionType === 'CHECKBOX') {
//         // For checkbox, toggle the option in correctAnswers array
//         const optionIndex = parseInt(value, 10);
//         const currentCorrectAnswers = new Set(currentQuestion.correctAnswers);
//         if (currentCorrectAnswers.has(optionIndex)) {
//           currentCorrectAnswers.delete(optionIndex);
//         } else {
//           currentCorrectAnswers.add(optionIndex);
//         }
//         currentQuestion.correctAnswers = Array.from(currentCorrectAnswers).sort();
//       } else if (currentQuestion.questionType === 'IDENTIFICATION') {
//         currentQuestion.correctAnswers = [value];
//       } else {
//         // For multiple choice, just set a single correct answer
//         currentQuestion.correctAnswers = [parseInt(value, 10)];
//       }
//     } else {
//       currentQuestion[field] = value;
//     }
//     setFormData({ ...formData, questions: updatedQuestions });
//   };
  
//   if (!isOpen) return null;

//   const handleChange = (e) => {
//     const { name, type, checked, value } = e.target;
  
//     // Special handling for repeatable checkbox
//     if (name === 'repeatable') {
//       setFormData((prevData) => ({
//         ...prevData,
//         repeatable: checked,
//         // Reset maxAttempts to 2 when enabling multiple attempts
//         maxAttempts: checked ? 2 : null
//       }));
//       return;
//     }
  
//     setFormData((prevData) => ({
//       ...prevData,
//       [name]: type === 'checkbox' ? checked : value,
//     }));
//   };
  
  

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     if (!classroomId) {
//       toast.error('No classroom selected. Please select one first.');
//       return;
//     }

//     // Validate max attempts
//     if (formData.repeatable) {
//       const attempts = parseInt(formData.maxAttempts, 10);
//       if (attempts < 2 || attempts > 5) {
//         toast.error('Maximum attempts must be between 2 and 5 when multiple attempts are allowed');
//         return;
//       }
//     }

//     // Validate dates
//     if (new Date(formData.availableTo) <= new Date(formData.availableFrom)) {
//       toast.error('Available To must be after Available From.');
//       return;
//     }

//     // Return if already loading or submitting to prevent multiple submissions
//     if (loading || isSubmitting) {
//       return;
//     }

//     setLoading(true);
//     setIsSubmitting(true);
    
//     // Disable the submit button
//     if (submitButtonRef.current) {
//       submitButtonRef.current.disabled = true;
//     }

//     try {
//       const quizData = {
//         quizName: formData.title,
//         description: formData.description,
//         overallScore: parseInt(formData.overallScore, 10),
//         passingScore: parseInt(formData.passingScore, 10),
//         // availableFrom: new Date(formData.availableFrom).toISOString().slice(0, 19),
//         // availableTo: formData.availableTo ? new Date(formData.availableTo).toISOString().slice(0, 19) : null,
//         availableFrom: formatLocalDateTime(formData.availableFrom),
//         availableTo: formData.availableTo ? formatLocalDateTime(formData.availableTo) : null,
//         repeatable: formData.repeatable,
//         timeLimitMinutes: formData.timeLimitMinutes,
//         maxAttempts: formData.repeatable ? parseInt(formData.maxAttempts, 10) : null,
//         totalItems: formData.questions.length,
//         quizContent: JSON.stringify(formData.questions.map(q => {
//           let correctAnswers;
//           if (q.questionType === 'IDENTIFICATION') {
//             correctAnswers = q.correctAnswers[0];
//           } else if (q.questionType === 'CHECKBOX') {
//             correctAnswers = q.correctAnswers.map(index => q.options[index]);
//           } else {
//             correctAnswers = q.correctAnswers.length > 0 ? q.options[q.correctAnswers[0]] : null;
//           }
//           return {
//             questionText: q.question,
//             questionType: q.questionType,
//             options: q.questionType !== 'IDENTIFICATION' ? q.options : null,
//             correctAnswer: correctAnswers,
//             points: parseInt(q.points) || 10
//           };
//         }))
//       };

//       if (isEdit && quizId) {
//         await quizService.updateQuiz(quizId, quizData);
//         toast.success('Quiz updated successfully!');
//         onQuizCreated && onQuizCreated();
//         onClose();
//       } else {
//         // Create a new activity for this quiz with a unique timestamp to prevent duplication
//         const timestamp = new Date().toISOString();
//         const activityData = {
//           title: `Quiz: ${formData.title}`,
//           description: formData.description || 'Quiz activity',
//           type: 'QUIZ',
//           classroomId: classroomId,
//           content: JSON.stringify({
//             quizName: formData.title,
//             description: formData.description,
//             type: 'QUIZ',
//             timestamp // Add timestamp to make each request unique
//           })
//         };

//         // Create the activity first
//         const activity = await activityService.createActivity(activityData);
        
//         if (!activity || !activity.id) {
//           throw new Error('Failed to create activity for quiz');
//         }

//         // Now create the quiz with the new activity ID
//         const savedQuiz = await quizService.createQuiz(activity.id, quizData);

//         toast.success('Quiz created successfully!');
//         onQuizCreated(savedQuiz);
//         onClose();
//       }
//     } catch (error) {
//       console.error('Error creating quiz activity:', error);
//       const errorMessage = error.response?.data?.message || error.message || 'Failed to create quiz';
//       toast.error(errorMessage);
//     } finally {
//       setLoading(false);
//       setIsSubmitting(false);
      
//       // Re-enable the submit button after processing
//       if (submitButtonRef.current) {
//         submitButtonRef.current.disabled = false;
//       }
//     }
//   };

//   return (
//     <Dialog open={isOpen} onClose={onClose} className="relative z-50">
//       <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
//       <div className="fixed inset-0 flex items-center justify-center p-4">
//         <Dialog.Panel className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
//         <div className="p-8">
//           <div className="flex justify-between items-center mb-4">
//         <Header type="h2" fontSize="2xl" weight="bold" className="mb-6">
//               {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
//             </Header>
//           <button
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             &times;
//           </button>
//         </div>

//         <form onSubmit={handleSubmit}>
//               {/* Basic Quiz Information */}
//               <div className="space-y-4 mb-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Quiz Title
//                   </label>
//                   <input
//                     type="text"
//                     name="title"
//                     value={formData.title}
//                     onChange={handleChange}
//                     className="w-full p-2 border rounded"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-2">
//                     Description
//                   </label>
//                   <textarea
//                     name="description"
//                     value={formData.description}
//                     onChange={handleChange}
//                     className="w-full p-2 border rounded"
//                     rows="3"
//                   />
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Overall Score
//                     </label>
//                     <input
//                       type="number"
//                       name="overallScore"
//                       value={formData.overallScore}
//                       onChange={handleChange}
//                       className="w-full p-2 border rounded"
//                       required
//                       min="0"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Passing Score
//                     </label>
//                     <input
//                       type="number"
//                       name="passingScore"
//                       value={formData.passingScore}
//                       onChange={handleChange}
//                       className="w-full p-2 border rounded"
//                       required
//                       min="0"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Available From
//                     </label>
//                     <input
//                       type="datetime-local"
//                       name="availableFrom"
//                       value={formData.availableFrom}
//                       onChange={handleChange}
//                       className="w-full p-2 border rounded"
//                       required
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Available To
//                     </label>
//                     <input
//                       type="datetime-local"
//                       name="availableTo"
//                       value={formData.availableTo}
//                       onChange={handleChange}
//                       className="w-full p-2 border rounded"
//                     />
//                   </div>

//                   <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">
//                       Time Limit (minutes)
//                     </label>
//                     <input
//                       type="number"
//                       name="timeLimitMinutes"
//                       value={formData.timeLimitMinutes}
//                       onChange={handleChange}
//                       className="w-full p-2 border rounded"
//                       required
//                       min="1"
//                     />
//                   </div>

//                   {/* Attempts column: vertically stack Allow Multiple Attempts and Max Attempts */}
//                   <div>
//                     <div className="flex items-center mb-2">
//                       <input
//                         type="checkbox"
//                         name="repeatable"
//                         checked={formData.repeatable}
//                         onChange={handleChange}
//                         className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
//                         id="allow-multiple-attempts"
//                       />
//                       <label htmlFor="allow-multiple-attempts" className="text-sm font-medium text-gray-700">
//                         Allow Multiple Attempts
//                       </label>
//                     </div>
//                     {formData.repeatable && (
//                       <div>
//                         <label className="block text-sm font-medium text-gray-700 mb-2">
//                           Max Attempts (per student)
//                         </label>
//                         <input
//                           type="number"
//                           name="maxAttempts"
//                           value={formData.maxAttempts}
//                           min="2"
//                           max="5"
//                           onChange={handleChange}
//                           className="w-full p-2 border rounded"
//                           required={formData.repeatable}
//                         />
//                         <p className="text-xs text-gray-500 mt-1">Must be between 2 and 5 attempts</p>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Questions Section */}
//               <div className="space-y-6">
//                 {formData.questions.map((question, qIndex) => (
//                   <div key={qIndex} className="p-4 border rounded bg-gray-50">
//                     <div className="flex justify-between items-center mb-3">
//                       <label className="block text-sm font-semibold text-gray-800">
//                         Question {qIndex + 1}
//                       </label>
//                       <div className="flex items-center">
//                         <label className="text-xs font-medium text-gray-600 mr-2">
//                           Points:
//                         </label>
//                         <input
//                           type="text"
//                           inputMode="numeric"
//                           pattern="[0-9]*"
//                           value={question.points || 10}
//                           onChange={(e) => {
//                             const value = e.target.value;
//                             // Only allow numbers
//                             if (/^\d*$/.test(value)) {
//                               const numValue = value === '' ? 1 : parseInt(value);
//                               handleQuestionChange(qIndex, 'points', numValue);
//                             }
//                           }}
//                           onBlur={(e) => {
//                             // Ensure minimum value of 1 on blur
//                             const value = parseInt(e.target.value) || 1;
//                             handleQuestionChange(qIndex, 'points', value);
//                           }}
//                           className="w-16 p-1 border rounded text-center text-sm"
//                           required
//                         />
//                       </div>
//                     </div>

//                     <div className="space-y-4">
//                       <div>
//                         <label className="block text-xs font-medium text-gray-600 mb-1">
//                           Question Type
//                         </label>
//                         <select
//                           value={question.questionType}
//                           onChange={(e) => handleQuestionChange(qIndex, 'questionType', e.target.value)}
//                           className="w-full p-2 border rounded bg-white text-sm"
//                         >
//                           {questionTypes.map((type) => (
//                             <option key={type.value} value={type.value}>
//                               {type.label}
//                             </option>
//                           ))}
//                         </select>
//                       </div>

//                       <div>
//                         <label className="block text-xs font-medium text-gray-600 mb-1">
//                           Question Text
//                         </label>
//                         <input
//                           type="text"
//                           value={question.question}
//                           onChange={(e) => handleQuestionChange(qIndex, 'question', e.target.value)}
//                           className="w-full p-2 border rounded text-sm"
//                           required
//                           placeholder="Enter the question"
//                         />
//                       </div>

//                       {question.questionType === 'MULTIPLE_CHOICE' && (
//                         <>
//                           <label className="block text-xs font-medium text-gray-600 mb-1">
//                             Options (select correct answer)
//                           </label>
//                           {question.options.map((option, oIndex) => (
//                             <div key={oIndex} className="flex items-center space-x-2">
//                               <input
//                                 type="radio"
//                                 name={`correct-${qIndex}`}
//                                 checked={question.correctAnswers.includes(oIndex)}
//                                 onChange={() => handleQuestionChange(qIndex, 'correctAnswers', oIndex)}
//                                 className="h-4 w-4 text-blue-600 border-gray-300"
//                               />
//                               <input
//                                 type="text"
//                                 value={option}
//                                 onChange={(e) => {
//                                   const newOptions = [...question.options];
//                                   newOptions[oIndex] = e.target.value;
//                                   handleQuestionChange(qIndex, 'options', newOptions);
//                                 }}
//                                 className="flex-1 p-2 border rounded text-sm"
//                                 placeholder={`Option ${oIndex + 1}`}
//                                 required
//                               />
//                             </div>
//                           ))}
//                         </>
//                       )}

//                       {question.questionType === 'CHECKBOX' && (
//                         <>
//                           <label className="block text-xs font-medium text-gray-600 mb-1">
//                             Options (select all correct answers)
//                           </label>
//                           {question.options.map((option, oIndex) => (
//                             <div key={oIndex} className="flex items-center space-x-2">
//                               <input
//                                 type="checkbox"
//                                 checked={question.correctAnswers.includes(oIndex)}
//                                 onChange={() => handleQuestionChange(qIndex, 'correctAnswers', oIndex)}
//                                 className="h-4 w-4 text-blue-600 border-gray-300 rounded"
//                               />
//                               <input
//                                 type="text"
//                                 value={option}
//                                 onChange={(e) => {
//                                   const newOptions = [...question.options];
//                                   newOptions[oIndex] = e.target.value;
//                                   handleQuestionChange(qIndex, 'options', newOptions);
//                                 }}
//                                 className="flex-1 p-2 border rounded text-sm"
//                                 placeholder={`Option ${oIndex + 1}`}
//                                 required
//                               />
//                             </div>
//                           ))}
//                         </>
//                       )}
                      
//                       {question.questionType === 'IDENTIFICATION' && (
//                         <div>
//                           <label className="block text-xs font-medium text-gray-600 mb-1">
//                             Correct Answer
//                           </label>
//                           <input
//                             type="text"
//                             value={Array.isArray(question.correctAnswers) ? (question.correctAnswers[0] || '') : ''}
//                             onChange={(e) => handleQuestionChange(qIndex, 'correctAnswers', e.target.value)}
//                             className="w-full p-2 border rounded text-sm"
//                             placeholder="Enter the exact correct answer"
//                             required
//                           />
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 ))}
//               </div>

//               <button
//                 type="button"
//                 onClick={handleAddQuestion}
//                 className="mt-4 px-4 py-2 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
//               >
//                 Add Question
//               </button>

//               <div className="flex justify-end gap-4 mt-6">
//                 <button
//                   type="button"
//                   onClick={onClose}
//                   className="px-4 py-2 text-gray-600 hover:text-gray-800"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   ref={submitButtonRef}
//                   disabled={loading || isSubmitting}
//                   className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${(loading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
//                 >
//                   {loading ? 'Saving...' : 'Save Quiz'}
//                 </button>
//               </div>
//             </form>
//         </div>
//         </Dialog.Panel>
//       </div>
//     </Dialog>
//   );
// };

// export default AddQuizModal; 


import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@headlessui/react';
import { Header } from '../../ui/heading';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import quizService from '../../services/quizService';
import activityService from '../../services/activityService';


const AddQuizModal = ({ isOpen, onClose, activityId, classroomId, onQuizCreated, quizId, isEdit = false, lessonId = null }) => {
  const { token } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    overallScore: 100, 
    passingScore: 60, 
    availableFrom: new Date().toISOString().slice(0, 16), 
    availableTo: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().slice(0, 16), 
    repeatable: false,
    timeLimitMinutes: 30, 
    maxAttempts: 2,
    quizType: 'PRACTICE_QUIZ',
    questions: [
      {
        question: '',
        questionType: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctAnswers: [], // Array for multiple correct answers
        points: 10, // Default points per question
      },
    ],
  });

  const [loading, setLoading] = useState(false);
  const submitButtonRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate overall score based on the sum of question points
  const calculateOverallScore = () => {
    return formData.questions.reduce((total, question) => {
      return total + (parseInt(question.points) || 0);
    }, 0);
  };

    // Helper to convert backend date string to local datetime-local string for input fields
    function toDatetimeLocal(dtString) {
      if (!dtString) return '';
      // dtString is like '2025-05-26T00:30:00' or '2025-05-26T00:30:00.000'
      const date = new Date(dtString);
      // Get local time in 'YYYY-MM-DDTHH:mm'
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - offset * 60000);
      return localDate.toISOString().slice(0, 16);
    }
  

  const formatLocalDateTime = (dateTimeStr) => {
    if (!dateTimeStr) return null;
    // If input is 'YYYY-MM-DDTHH:mm', add ':00' for seconds
    return dateTimeStr.length === 16
      ? dateTimeStr + ':00'
      : dateTimeStr;
  };

  // Update overall score whenever questions change
  useEffect(() => {
    const totalScore = calculateOverallScore();
    setFormData(prev => ({
      ...prev,
      overallScore: totalScore
    }));
  }, [formData.questions]);

  useEffect(() => {
    if (isEdit && quizId && isOpen) {
      // Fetch quiz data and populate form
      (async () => {
        try {
          const quiz = await quizService.getQuiz(quizId);
          let questions = quiz.quizContent;
          if (typeof questions === 'string') {
            questions = JSON.parse(questions);
          }
          // Ensure correctAnswers is always an array and all fields exist
          questions = (questions || []).map(q => ({
            question: q.questionText || q.question || '',
            questionType: q.questionType || 'MULTIPLE_CHOICE',
            options: q.options || ['', '', '', ''],
            correctAnswers: Array.isArray(q.correctAnswers)
              ? q.correctAnswers
              : q.questionType === 'IDENTIFICATION'
                ? [q.correctAnswer || '']
                : (typeof q.correctAnswer !== 'undefined' && q.correctAnswer !== null)
                  ? [q.options && q.options.indexOf(q.correctAnswer) !== -1 ? q.options.indexOf(q.correctAnswer) : 0]
                  : [],
            points: typeof q.points === 'number' ? q.points : 10,
          }));

            // Format date to 'YYYY-MM-DDTHH:mm' (local time) for input
            const formatForInput = (dateStr) => {
              if (!dateStr) return '';
              const d = new Date(dateStr);
              const pad = (n) => n.toString().padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            };
          setFormData({
            title: quiz.quizName || '',
            description: quiz.description || '',
            overallScore: quiz.overallScore || 100,
            passingScore: quiz.passingScore || 60,
            // availableFrom: quiz.availableFrom ? new Date(quiz.availableFrom).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
            // availableTo: quiz.availableTo ? new Date(quiz.availableTo).toISOString().slice(0, 16) : '',
            availableFrom: toDatetimeLocal(quiz.availableFrom),
            availableTo: toDatetimeLocal(quiz.availableTo),
            repeatable: quiz.repeatable || false,
            timeLimitMinutes: quiz.timeLimitMinutes || 30,
            maxAttempts: quiz.maxAttempts || 2,
            quizType: quiz.quizType || 'PRACTICE_QUIZ',
            questions: questions,
          });
        } catch (err) {
          toast.error('Failed to load quiz for editing');
        }
      })();
    } else if (!isEdit && lessonId) {
      // If creating a new quiz for a lesson, reset form and set lessonId
      setFormData(prev => ({ ...prev, quizType: 'PRACTICE_QUIZ' }));
    }
  }, [isEdit, quizId, isOpen, lessonId]);

  const handleInputChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const questionTypes = [
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Choice' },
    { value: 'IDENTIFICATION', label: 'Identification' },
    { value: 'CHECKBOX', label: 'Checkboxes' },
  ];

  const handleAddQuestion = () => {
    setFormData({
      ...formData,
      questions: [
        ...formData.questions,
        {
          question: '',
          questionType: 'MULTIPLE_CHOICE',
          options: ['', '', '', ''],
          correctAnswers: [], 
          points: 10,
        },
      ],
    });
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
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
        // For checkbox, toggle the option in correctAnswers array
        const optionIndex = parseInt(value, 10);
        const currentCorrectAnswers = new Set(currentQuestion.correctAnswers);
        if (currentCorrectAnswers.has(optionIndex)) {
          currentCorrectAnswers.delete(optionIndex);
        } else {
          currentCorrectAnswers.add(optionIndex);
        }
        currentQuestion.correctAnswers = Array.from(currentCorrectAnswers).sort();
      } else if (currentQuestion.questionType === 'IDENTIFICATION') {
        currentQuestion.correctAnswers = [value];
      } else {
        // For multiple choice, just set a single correct answer
        currentQuestion.correctAnswers = [parseInt(value, 10)];
      }
    } else {
      currentQuestion[field] = value;
    }
    setFormData({ ...formData, questions: updatedQuestions });
  };
  
  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
  
    // Special handling for repeatable checkbox
    if (name === 'repeatable') {
      setFormData((prevData) => ({
        ...prevData,
        repeatable: checked,
        // Reset maxAttempts to 2 when enabling multiple attempts
        maxAttempts: checked ? 2 : null
      }));
      return;
    }
  
    if (name === 'quizType') {
      setFormData((prevData) => ({ ...prevData, quizType: value }));
      return;
    }
  
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!classroomId) {
      toast.error('No classroom selected. Please select one first.');
      return;
    }

      // Validate that all questions have answers
      const hasInvalidAnswers = formData.questions.some(question => {
        if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'CHECKBOX') {
          // Check if any option is empty
          const hasEmptyOptions = question.options.some(option => !option || option.trim() === '');
          if (hasEmptyOptions) {
            toast.error('Please fill out all options for multiple choice and checkbox questions.');
            return true;
          }
          return question.correctAnswers.length === 0;
        } else if (question.questionType === 'IDENTIFICATION') {
          return !question.correctAnswers[0] || question.correctAnswers[0].trim() === '';
        }
        return true;
      });
  
      if (hasInvalidAnswers) {
        return;
      }

    // Validate max attempts
    if (formData.repeatable) {
      const attempts = parseInt(formData.maxAttempts, 10);
      if (attempts < 2 || attempts > 5) {
        toast.error('Maximum attempts must be between 2 and 5 when multiple attempts are allowed');
        return;
      }
    }

    // Validate dates
    if (new Date(formData.availableTo) <= new Date(formData.availableFrom)) {
      toast.error('Available To must be after Available From.');
      return;
    }

    // Return if already loading or submitting to prevent multiple submissions
    if (loading || isSubmitting) {
      return;
    }

    setLoading(true);
    setIsSubmitting(true);
    
    // Disable the submit button
    if (submitButtonRef.current) {
      submitButtonRef.current.disabled = true;
    }

        // Log the quizType and quizData before sending to backend
        console.log('Submitting quizType:', formData.quizType);


    try {
      const quizData = {
        quizName: formData.title,
        description: formData.description,
        overallScore: parseInt(formData.overallScore, 10),
        passingScore: parseInt(formData.passingScore, 10),
        // availableFrom: new Date(formData.availableFrom).toISOString().slice(0, 19),
        // availableTo: formData.availableTo ? new Date(formData.availableTo).toISOString().slice(0, 19) : null,
        availableFrom: formatLocalDateTime(formData.availableFrom),
        availableTo: formData.availableTo ? formatLocalDateTime(formData.availableTo) : null,
        repeatable: formData.repeatable,
        timeLimitMinutes: formData.timeLimitMinutes,
        maxAttempts: formData.repeatable ? parseInt(formData.maxAttempts, 10) : null,
        totalItems: formData.questions.length,
        quizContent: JSON.stringify(formData.questions.map(q => {
          let correctAnswers;
          if (q.questionType === 'IDENTIFICATION') {
            correctAnswers = q.correctAnswers[0];
          } else if (q.questionType === 'CHECKBOX') {
            correctAnswers = q.correctAnswers.map(index => q.options[index]);
          } else {
            correctAnswers = q.correctAnswers.length > 0 ? q.options[q.correctAnswers[0]] : null;
          }
          return {
            questionText: q.question,
            questionType: q.questionType,
            options: q.questionType !== 'IDENTIFICATION' ? q.options : null,
            correctAnswer: correctAnswers,
            points: parseInt(q.points) || 10
          };
        })),
        quizType: formData.quizType,
        lessonId: lessonId || null,
      };

      if (isEdit && quizId) {
        await quizService.updateQuiz(quizId, quizData);
        toast.success('Quiz updated successfully!');
        onQuizCreated && onQuizCreated();
        onClose();
      } else {
        // Create a new activity for this quiz with a unique timestamp to prevent duplication
        const timestamp = new Date().toISOString();
        const activityData = {
          title: `Quiz: ${formData.title}`,
          description: formData.description || 'Quiz activity',
          type: 'QUIZ',
          classroomId: classroomId,
          content: JSON.stringify({
            quizName: formData.title,
            description: formData.description,
            type: 'QUIZ',
            timestamp // Add timestamp to make each request unique
          })
        };

        // Create the activity first
        const activity = await activityService.createActivity(activityData);
        
        if (!activity || !activity.id) {
          throw new Error('Failed to create activity for quiz');
        }

        // Now create the quiz with the new activity ID
        const savedQuiz = await quizService.createQuiz(activity.id, quizData);

        toast.success('Quiz created successfully!');
        onQuizCreated(savedQuiz);
        onClose();
      }
    } catch (error) {
      console.error('Error creating quiz activity:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create quiz';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setIsSubmitting(false);
      
      // Re-enable the submit button after processing
      if (submitButtonRef.current) {
        submitButtonRef.current.disabled = false;
      }
    }
  };

  const quizTypeOptions = [
    { value: 'PRACTICE_QUIZ', label: 'Practice Quiz' },
    { value: 'MAJOR_EXAMS', label: 'Major Exams' },
    { value: 'POP_QUIZ', label: 'Pop Quiz' },
    { value: 'DIAGNOSTIC_QUIZ', label: 'Diagnostic Quiz' },
    { value: 'ACTIVITY', label: 'Activity' },
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="relative bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex justify-between items-center mb-4">
        <Header type="h2" fontSize="2xl" weight="bold" className="mb-6">
              {isEdit ? 'Edit Quiz' : 'Create New Quiz'}
            </Header>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
              {/* Basic Quiz Information */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quiz Title
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="w-full p-2 border rounded"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overall Score
                    </label>
                    <input
                      type="number"
                      name="overallScore"
                      value={formData.overallScore}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passing Score
                    </label>
                    <input
                      type="number"
                      name="passingScore"
                      value={formData.passingScore}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Available From
                    </label>
                    <input
                      type="datetime-local"
                      name="availableFrom"
                      value={formData.availableFrom}
                      onChange={handleChange}
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
                      name="availableTo"
                      value={formData.availableTo}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Time Limit (minutes)
                    </label>
                    <input
                      type="number"
                      name="timeLimitMinutes"
                      value={formData.timeLimitMinutes}
                      onChange={handleChange}
                      className="w-full p-2 border rounded"
                      required
                      min="1"
                    />
                  </div>

                  {/* Attempts column: vertically stack Allow Multiple Attempts and Max Attempts */}
                  <div>
                    <div className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        name="repeatable"
                        checked={formData.repeatable}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded mr-2"
                        id="allow-multiple-attempts"
                      />
                      <label htmlFor="allow-multiple-attempts" className="text-sm font-medium text-gray-700">
                        Allow Multiple Attempts
                      </label>
                    </div>
                    {formData.repeatable && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Max Attempts (per student)
                        </label>
                        <input
                          type="number"
                          name="maxAttempts"
                          value={formData.maxAttempts}
                          min="2"
                          max="5"
                          onChange={handleChange}
                          className="w-full p-2 border rounded"
                          required={formData.repeatable}
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be between 2 and 5 attempts</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quiz Type
                    </label>
                    <select
                      name="quizType"
                      value={formData.quizType}
                      onChange={handleChange}
                      className="w-full p-2 border rounded bg-white text-sm"
                      required
                    >
                      {quizTypeOptions.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-6">
                {formData.questions.map((question, qIndex) => (
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
                            // Only allow numbers
                            if (/^\d*$/.test(value)) {
                              const numValue = value === '' ? 1 : parseInt(value);
                              handleQuestionChange(qIndex, 'points', numValue);
                            }
                          }}
                          onBlur={(e) => {
                            // Ensure minimum value of 1 on blur
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

              <div className="flex justify-end gap-4 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  ref={submitButtonRef}
                  disabled={loading || isSubmitting}
                  className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 ${(loading || isSubmitting) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Saving...' : 'Save Quiz'}
                </button>
              </div>
            </form>
        </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default AddQuizModal; 













