import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import lessonService from '../../services/lessonService';
import { Header } from '../../ui/heading';
import ContentBlockDisplay from './ContentBlockDisplay';
import QuizDisplay from '../quiz/QuizDisplay';
import { CheckCircle, BookOpen, AlertCircle } from 'lucide-react';

const LessonDetailView = ({ lesson, isStudent, onQuizComplete }) => {
  const { user } = useAuth();
  const [completionStatus, setCompletionStatus] = useState(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (lesson?.id && user?.id) {
      // Fetch completion status
      lessonService.getLessonCompletionStatus(lesson.id, user.id)
        .then(status => {
          setCompletionStatus(status);
          // If content is already read, show quiz
          if (status.contentRead) {
            setShowQuiz(true);
            setHasScrolledToBottom(true);
          }
        })
        .catch(err => console.error('Error fetching completion status:', err));

      // If teacher, fetch completion stats
      if (!isStudent) {
        lessonService.getLessonCompletionStats(lesson.id)
          .then(stats => setStats(stats))
          .catch(err => console.error('Error fetching completion stats:', err));
      }
    }
  }, [lesson?.id, user?.id, isStudent]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = Math.abs(scrollHeight - scrollTop - clientHeight) < 1;
    
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
      if (isStudent && !completionStatus?.contentRead) {
    
        lessonService.markLessonContentAsRead(lesson.id, user.id)
          .then(() => {
            
            setCompletionStatus(prev => ({ ...prev, contentRead: true }));
            setShowQuiz(true);
            
            // Log quiz availability
            const hasQuiz = lesson.activities?.some(activity => activity.type === 'QUIZ');
        
          })
          .catch(err => {
            console.error(`[Lesson ${lesson.id}] Error marking content as read for student ${user.id}:`, err);
          });
      }
    }
  };

  const handleQuizComplete = (score) => {
    if (isStudent) {
  
      lessonService.markLessonQuizAsCompleted(lesson.id, user.id, score)
        .then(() => {
          
          setCompletionStatus(prev => ({ ...prev, quizCompleted: true, quizScore: score }));
          if (onQuizComplete) {
            onQuizComplete(score);
          }
        })
        .catch(err => {
          console.error(`[Lesson ${lesson.id}] Error marking quiz as completed for student ${user.id}:`, err);
        });
    }
  };

  if (!lesson) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Fixed Title Section */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <Header type="h2" weight="bold" size="3xl" className="!text-4xl text-black">
            {lesson.title}
          </Header>
          {!isStudent && stats && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <BookOpen className="w-4 h-4" />
                <span>{Math.round(stats.readPercentage)}% Read</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                <span>{Math.round(stats.quizCompletionPercentage)}% Completed Quiz</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Content Section */}
      <div 
        className="flex-1 overflow-y-auto p-5"
        onScroll={handleScroll}
      >
        {lesson.contentBlocks?.length > 0 ? (
          <div className="content-blocks space-y-8">
            {lesson.contentBlocks.map((block) => (
              <div key={block.id} className="content-block">
                <ContentBlockDisplay block={block} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No content has been added to this lesson yet.</p>
          </div>
        )}

        {/* Quiz Section */}
        {lesson.activities?.filter(activity => activity.type === 'QUIZ').length > 0 && (
          <div className="mt-8 border-t pt-8">
            {!showQuiz && isStudent && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-700">
                  Please read through the entire lesson content to access the quiz.
                </p>
              </div>
            )}
            
            {showQuiz && (
              <div className="quiz-section">
                <Header type="h3" weight="semibold" className="mb-4">
                  Lesson Quiz
                </Header>
                {lesson.activities
                  .filter(activity => activity.type === 'QUIZ')
                  .sort((a, b) => a.id - b.id)
                  .map(activity => (
                    <QuizDisplay
                      key={activity.id}
                      quiz={activity}
                      isStudent={isStudent}
                      onComplete={handleQuizComplete}
                      disabled={isStudent && !hasScrolledToBottom}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Completion Status for Students */}
        {isStudent && completionStatus && (
          <div className="mt-8 border-t pt-4">
            <div className="flex items-center gap-4 text-sm">
              {completionStatus.contentRead ? (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Content Read</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-gray-500">
                  <BookOpen className="w-4 h-4" />
                  <span>Content Not Read</span>
                </div>
              )}
              
              {completionStatus.quizCompleted && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span>Quiz Completed (Score: {completionStatus.quizScore}%)</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonDetailView; 