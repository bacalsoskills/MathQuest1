import React, { useState } from "react";
import FeedbackForm from "../components/feedback/FeedbackForm";
import FeedbackList from "../components/feedback/FeedbackList";
import { Header } from "../ui/heading";


const FeedbackPage = () => {
  const [activeTab, setActiveTab] = useState("form");

  return (
    <div className="px-4 sm:px-6  lg:py-8">
      <div className="max-w-6xl mx-auto">

      <Header type="h1" fontSize="5xl" weight="bold" className=" mb-2 text-primary dark:text-white"> Feedback </Header>
      <p className="dark:text-gray-50 text-gray-600 mb-6">
          Share your thoughts, report issues, or suggest improvements.
        </p> 
      <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] mb-5 md:mb-8"></div>




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
    </div>
  );
};

export default FeedbackPage;
