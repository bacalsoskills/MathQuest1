import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import lessonService from "../../services/lessonService";
import { CheckCircle, BookOpen, Lock } from "lucide-react";

const LessonSidebar = ({
  lessons,
  currentLessonId,
  onSelectLesson,
  isStudent,
  unlockedLessons = new Set(),
}) => {
  const { user } = useAuth();
  const [completionStatuses, setCompletionStatuses] = useState({});
  const [stats, setStats] = useState({});

  useEffect(() => {
    const fetchCompletionStatuses = async () => {
      if (!isStudent || !user?.id) return;

      const statuses = {};
      for (const lesson of lessons) {
        try {
          const status = await lessonService.getLessonCompletionStatus(
            lesson.id,
            user.id
          );
          console.log(
            `[LessonSidebar] Fetched completion status for lesson ${lesson.id}:`,
            status
          );
          statuses[lesson.id] = status;
        } catch (error) {
          console.error(
            `Error fetching completion status for lesson ${lesson.id}:`,
            error
          );
        }
      }
      setCompletionStatuses(statuses);
    };

    fetchCompletionStatuses();
  }, [lessons, user?.id, isStudent]);

  const getLessonStatus = (lessonId) => {
    if (isStudent) {
      const status = completionStatuses[lessonId];
      if (!status) return null;

      if (status.quizCompleted) {
        return (
          <div
            className="flex items-center gap-1 text-green-600 flex-shrink-0"
            title="Lesson completed"
          >
            <BookOpen className="w-4 h-4" />
            <CheckCircle className="w-4 h-4" />
          </div>
        );
      } else if (status.contentRead) {
        return (
          <div
            className="flex items-center gap-1 text-blue-600 flex-shrink-0"
            title="Content read, quiz pending"
          >
            <BookOpen className="w-4 h-4" />
          </div>
        );
      }
    } else {
      const lessonStats = stats[lessonId];
      if (!lessonStats) return null;

      return (
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-shrink-0">
          <div
            className="flex items-center gap-1"
            title={`${Math.round(
              lessonStats.readPercentage
            )}% of students read the content`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{Math.round(lessonStats.readPercentage)}%</span>
          </div>
          <div
            className="flex items-center gap-1"
            title={`${Math.round(
              lessonStats.quizCompletionPercentage
            )}% of students completed the quiz`}
          >
            <CheckCircle className="w-4 h-4" />
            <span>{Math.round(lessonStats.quizCompletionPercentage)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const isLessonUnlocked = (lessonIndex) => {
    if (!isStudent) return true;
    if (lessonIndex === 0) return true;

    // Check if previous lesson is completed
    const previousLesson = lessons[lessonIndex - 1];
    if (!previousLesson) return true;

    const previousStatus = completionStatuses[previousLesson.id];
    const hasQuiz = previousLesson.activities?.some(
      (activity) => activity.type === "QUIZ"
    );

    // If previous lesson has no quiz, only check if content is read
    if (!hasQuiz) {
      return previousStatus?.contentRead;
    }

    // If previous lesson has a quiz, check if it's completed
    return previousStatus?.contentRead && previousStatus?.quizCompleted;
  };

  const isLessonCompleted = (lesson) => {
    const status = completionStatuses[lesson.id];
    const hasQuiz = lesson.activities?.some(
      (activity) => activity.type === "QUIZ"
    );

    if (!status) return false;

    // If lesson has no quiz, it's completed when content is read
    if (!hasQuiz) {
      return status.contentRead;
    }

    // If lesson has a quiz, it's completed when both content is read and quiz is completed
    return status.contentRead && status.quizCompleted;
  };

  // Sort activities to ensure quizzes are sequential by ID
  const sortActivities = (activities) => {
    if (!activities) return [];

    // Separate quizzes and other activities
    const quizzes = activities
      .filter((activity) => activity.type === "QUIZ")
      .sort((a, b) => a.id - b.id); // Sort quizzes by ID
    const otherActivities = activities.filter(
      (activity) => activity.type !== "QUIZ"
    );

    // Return quizzes first, followed by other activities
    return [...quizzes, ...otherActivities];
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-semibold mb-4 text-white">Lessons</h3>
      <div className="space-y-2 overflow-y-auto">
        {lessons.map((lesson, index) => {
          const isUnlocked =
            isLessonUnlocked(index) || unlockedLessons.has(lesson.id);
          const isCompleted = isLessonCompleted(lesson);
          const isCurrent = lesson.id === currentLessonId;
          const sortedActivities = sortActivities(lesson.activities);

          return (
            <button
              key={lesson.id}
              onClick={() => isUnlocked && onSelectLesson(lesson.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between
                ${
                  isCurrent
                    ? "bg-blue-100 text-gray-800"
                    : isUnlocked
                    ? "hover:bg-gray-100"
                    : "opacity-50 cursor-not-allowed"
                }`}
              disabled={!isUnlocked}
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {!isUnlocked && <Lock className="w-4 h-4 flex-shrink-0" />}
                {isUnlocked && <BookOpen className="w-4 h-4 flex-shrink-0" />}
                {isCompleted && (
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                )}
                <span className="break-words text-sm leading-tight">
                  {lesson.title}
                </span>
              </div>
              {getLessonStatus(lesson.id)}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LessonSidebar;
