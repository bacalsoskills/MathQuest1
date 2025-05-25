import React from "react";
import { marked } from "marked"; 
const LessonDetailView = ({ lesson, isTeacher, isStudent }) => {
  const isQuiz = lesson?.type === "quiz";
  
  // Function to safely render HTML content (from markdown)
  const renderMarkdown = (content) => {
    if (!content) return "";
    try {
      return { __html: marked(content) };
    } catch (error) {
      console.error("Error parsing markdown:", error);
      return { __html: "<p>Error displaying content</p>" };
    }
  };

  // Function to parse quiz content if it's a quiz
  const parseQuizContent = () => {
    if (!isQuiz || !lesson.content) return null;
    
    try {
      // Attempt to parse JSON if it's a quiz
      return typeof lesson.content === 'string' 
        ? JSON.parse(lesson.content) 
        : lesson.content;
    } catch (error) {
      console.error("Error parsing quiz content:", error);
      return null;
    }
  };

  const quizData = isQuiz ? parseQuizContent() : null;

  if (!lesson) {
    return (
      <div className="no-lesson-selected p-6 bg-gray-50 rounded-md flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500 text-lg">Select a lesson to view its content</p>
      </div>
    );
  }

  return (
    <div className="lesson-detail-view bg-white rounded-md shadow overflow-hidden">
      {/* Lesson Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-white">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">{lesson.title}</h1>
        <p className="text-gray-600">{lesson.description}</p>
        {isTeacher && (
          <div className="mt-3 flex items-center text-sm text-gray-500">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
              {isQuiz ? "Quiz" : "Lesson"}
            </span>
            <button className="text-blue-600 hover:text-blue-800 text-sm mr-4">
              Edit
            </button>
            <button className="text-red-600 hover:text-red-800 text-sm">
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Lesson Content */}
      <div className="p-6">
        {isQuiz ? (
          <div className="quiz-content">
            <h2 className="text-xl font-semibold mb-4">Quiz Questions</h2>
            {quizData ? (
              <div className="space-y-6">
                {quizData.questions?.map((question, index) => (
                  <div key={index} className="quiz-question p-4 border rounded-md bg-gray-50">
                    <h3 className="font-medium mb-2">
                      {index + 1}. {question.question}
                    </h3>
                    <div className="space-y-2 mt-3">
                      {question.options?.map((option, optIndex) => (
                        <div key={optIndex} className="flex items-center">
                          <input
                            type="radio"
                            id={`q${index}-opt${optIndex}`}
                            name={`question-${index}`}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                            disabled={isTeacher}
                          />
                          <label
                            htmlFor={`q${index}-opt${optIndex}`}
                            className={`ml-2 block text-sm ${
                              isTeacher && optIndex === question.correctOption 
                                ? "font-bold text-green-600" 
                                : "text-gray-700"
                            }`}
                          >
                            {option}
                            {isTeacher && optIndex === question.correctOption && " (Correct)"}
                          </label>
                        </div>
                      ))}
                    </div>
                    {isTeacher && question.explanation && (
                      <div className="mt-3 text-sm border-t pt-2 text-gray-600">
                        <span className="font-medium">Explanation: </span>
                        {question.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-red-500">
                Error loading quiz questions. Invalid quiz format.
              </p>
            )}

            {isStudent && (
              <div className="mt-6">
                <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                  Submit Answers
                </button>
              </div>
            )}
          </div>
        ) : (
          <div 
            className="lesson-content prose max-w-none"
            dangerouslySetInnerHTML={renderMarkdown(lesson.content)}
          />
        )}
      </div>

      {/* Actions for students */}
      {isStudent && !isQuiz && (
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
          <div className="flex items-center">
            <button className="mr-4 text-gray-600 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              Bookmark
            </button>
            <button className="text-gray-600 flex items-center">
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Help
            </button>
          </div>
          <button className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
            Mark as Completed
          </button>
        </div>
      )}
    </div>
  );
};

export default LessonDetailView; 