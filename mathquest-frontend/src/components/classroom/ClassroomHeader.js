import React from "react";

const ClassroomHeader = ({
  classroomDetails,
  lessonsCount,
  activitiesCount = 1,
  passedCount = 0,
  incompleteCount = 0,
}) => {
  if (!classroomDetails) {
    return (
      <header className="classroom-header classroom-header-loading">
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </header>
    );
  }

  const classroomName = classroomDetails.name || "Classroom";
  const classroomCode = classroomDetails.code || "N/A";
  const teacherName = classroomDetails.teacherName || "N/A";

  const headerImageUrl =
    classroomDetails.imageUrl ||
    "https://via.placeholder.com/300x150.png?text=Classroom+Image";

  return (
    <header className="classroom-header">
      <div className="classroom-header-image">
        <img
          src={headerImageUrl}
          alt={`${classroomName} header image`}
          style={{ width: "250px", height: "auto" }}
        />
      </div>
      <div className="classroom-header-info">
        <p className="classroom-code">{classroomCode}</p>
        <h1 className="classroom-title">{classroomName}</h1>
        <p className="classroom-teacher">Teacher: {teacherName}</p>
        <p className="classroom-description">
          {classroomDetails.description ||
            "In this course, students will explore the world of [topic] through fun and interactive lessons. They'll learn how to identify, compare, add, and subtract using real-life examples and visual aids. By the end of the course, students will be confident working with [topic] and understand how they are used in everyday situations."}
        </p>
      </div>
      <div className="classroom-header-stats">
        <div className="stat-item">
          <span className="stat-value">{lessonsCount}</span>
          <span className="stat-label">Lessons</span>
        </div>
        <div className="stat-item">
          <span className="stat-value">{activitiesCount}</span>
          <span className="stat-label">Activities</span>
        </div>
        <div className="stat-item passed">
          <span className="stat-value">{passedCount}</span>
          <span className="stat-label">Passed</span>
        </div>
        <div className="stat-item incomplete">
          <span className="stat-value">{incompleteCount}</span>
          <span className="stat-label">Incomplete</span>
        </div>
      </div>
    </header>
  );
};

export default ClassroomHeader;
