import React from "react";
import ContentBlockDisplay from "./ContentBlockDisplay";

const LessonDetailView = ({ lesson }) => {
  if (!lesson) {
    return (
      <main className="lesson-detail-view lesson-detail-loading">
        <p>Select a lesson to view its details, or the lesson is loading...</p>
      </main>
    );
  }

  return (
    <main className="lesson-detail-view">
      <h2 className="lesson-title">{lesson.title}</h2>
      {lesson.description && (
        <p className="lesson-description">{lesson.description}</p>
      )}

      <div className="lesson-content-blocks">
        <h3>Content:</h3>
        {lesson.contentBlocks && lesson.contentBlocks.length > 0 ? (
          lesson.contentBlocks.map((block) => (
            <ContentBlockDisplay key={block.id} block={block} />
          ))
        ) : (
          <p>No content blocks for this lesson.</p>
        )}
      </div>

      {lesson.activities && lesson.activities.length > 0 && (
        <div className="lesson-activities-list">
          <h3>Activities:</h3>
          <ul>
            {lesson.activities.map((activity) => (
              <li key={activity.id} className="activity-item">
                {activity.title} ({activity.type})
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
};

export default LessonDetailView;
