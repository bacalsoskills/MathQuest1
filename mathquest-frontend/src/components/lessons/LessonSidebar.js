import React from "react";
import { Header } from "../../ui/heading";
import { IoBookSharp } from "react-icons/io5";

const LessonSidebar = ({ lessons, currentLessonId, onSelectLesson }) => {
  if (!lessons?.length) {
    return (
      <aside className="lesson-sidebar">
        <Header type="h2" size="2xl" className="text-white">
          Contents
        </Header>
        <p>No lessons available for this classroom.</p>
      </aside>
    );
  }

  return (
    <aside className="lesson-sidebar">
      <Header
        type="h2"
        weight="bold"
        size="2xl"
        className="!text-2xl text-white mb-5"
      >
        Contents
      </Header>

      <ul>
        {lessons.map((lesson) => {
          const isActive = lesson.id === currentLessonId;

          return (
            <li
              key={lesson.id}
              onClick={() => onSelectLesson(lesson.id)}
              className={`
                lesson-item flex items-center gap-2 cursor-pointer rounded-md
                px-3 py-2 transition-colors font-semibold font-xl hover:text-gray-100 
                ${isActive ? " text-white" : "text-black "}
              `}
            >
              <IoBookSharp className="h-4 w-4 shrink-0" />

              <span className="flex-1 truncate">Lesson: {lesson.title}</span>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default LessonSidebar;
