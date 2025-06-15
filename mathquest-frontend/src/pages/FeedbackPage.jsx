import React, { useState } from "react";
import FeedbackForm from "../components/feedback/FeedbackForm";
import FeedbackList from "../components/feedback/FeedbackList";

const FeedbackPage = () => {
  const [activeTab, setActiveTab] = useState("form");

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Feedback</h1>
        <p className="text-gray-600">
          Share your thoughts, report issues, or suggest improvements.
        </p>
      </div>

      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("form")}
              className={`${
                activeTab === "form"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Send Feedback
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`${
                activeTab === "history"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Feedback History
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "form" ? <FeedbackForm /> : <FeedbackList />}
      </div>
    </div>
  );
};

export default FeedbackPage;
