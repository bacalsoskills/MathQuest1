import React from "react";

const ClassroomTabs = ({ activeTab, onTabChange }) => {
  return (
    <nav className="classroom-tabs">
      <button
        className={`tab-button ${activeTab === "lessons" ? "active" : ""}`}
        onClick={() => (onTabChange ? onTabChange("lessons") : null)}
      >
        Lessons
      </button>
      <button
        className={`tab-button ${activeTab === "activities" ? "active" : ""}`}
        onClick={() => (onTabChange ? onTabChange("activities") : null)}
      >
        Activities
      </button>
    </nav>
  );
};

export default ClassroomTabs;
