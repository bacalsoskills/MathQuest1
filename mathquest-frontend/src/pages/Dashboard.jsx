import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClassroom } from '../context/ClassroomContext';
import { Header as Heading } from '../ui/heading';
import { Button } from '../ui/button';
import { FaChartLine, FaChalkboardTeacher, FaTrophy, FaComments } from 'react-icons/fa';
import { IoCodeSharp } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { isAdmin, isTeacher, isStudent } = useAuth();
  const { userClassrooms, getClassroomById, loading } = useClassroom();
  const navigate = useNavigate();

  // Get first classroom id for teacher/student
  const firstClassroom = userClassrooms && userClassrooms.length > 0 ? userClassrooms[0] : null;
  const firstClassroomId = firstClassroom ? firstClassroom.id : null;
  
  // Fetch the actual classroom data using the ID
  const firstClassroomData = firstClassroomId ? getClassroomById(firstClassroomId) : null;

  // Card data based on role
  let cards = [];
  if (isTeacher()) {
    cards = [
      {
        icon: <FaChartLine className="text-3xl text-blue-400" />,
        title: 'Analytics Dashboard',
        desc: 'Our Analytics Dashboard provides a clear and intuitive interface for you to easily analyze your class data. From customizable graphs to real-time data updates, our dashboard offers everything you need to gain valuable insights.',
        button: firstClassroomId ? 'View dashboard' : 'Create Classroom First',
        onClick: () => firstClassroomId ? navigate(`/teacher/classrooms/${firstClassroomId}#class-record-tab`) : navigate('/teacher/classrooms'),
        disabled: false
      },
      {
        icon: <FaChalkboardTeacher className="text-3xl text-purple-400" />,
        title: 'Classroom',
        desc: 'Reward your students and incentivize engagement with our innovative digital classroom tools. Easily manage your classroom and drive student success.',
        button: 'View Classroom',
        onClick: () => navigate('/teacher/classrooms'),
      },
    ];
  } else if (isStudent()) {
    cards = [
      {
        icon: <FaTrophy className="text-3xl text-yellow-400" />,
        title: 'Leaderboard Dashboard',
        desc: 'Track your progress and see how you rank among your peers. The leaderboard dashboard motivates you to keep learning and improving your math skills.',
        button: firstClassroomId ? 'View leaderboard' : 'Join Classroom First',
        onClick: () => firstClassroomId ? navigate(`/student/classrooms/${firstClassroomId}#leaderboard-tab`) : navigate('/student/classrooms'),
        disabled: false
      },
      {
        icon: <FaChalkboardTeacher className="text-3xl text-purple-400" />,
        title: 'Classroom',
        desc: 'Join and participate in your classrooms. Access lessons, quizzes, and activities to enhance your learning experience.',
        button: 'View Classroom',
        onClick: () => navigate('/student/classrooms'),
      },
    ];
  } else if (isAdmin()) {
    cards = [
      {
        icon: <FaComments className="text-3xl text-pink-400" />,
        title: 'Feedback',
        desc: 'Manage and review feedback from users. Ensure the platform is running smoothly and address any concerns or suggestions.',
        button: 'View feedback',
        onClick: () => navigate('/admin/feedback'),
      },
      {
        icon: <FaChalkboardTeacher className="text-3xl text-purple-400" />,
        title: 'Classroom',
        desc: 'Oversee all classrooms on the platform. Manage teachers, students, and classroom activities efficiently.',
        button: 'View Classroom',
        onClick: () => navigate('/admin/classrooms'),
      },
    ];
  }

  // Show loading state
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading your classrooms...</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 lg:py-8 flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {/* Top two cards */}
        {cards.map((card, idx) => (
          <div
            key={card.title}
            className={`rounded-2xl shadow-xl dark:bg-transparent p-4 sm:p-6 lg:p-8 flex flex-col min-h-[200px] sm:min-h-[260px] relative border border-white/10 hover:scale-[1.02] transition-all duration-300 ${card.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="dark:bg-white/10 bg-blue-800 rounded-xl p-2 sm:p-3 flex items-center justify-center">
                {card.icon}
              </div>
              <Heading type="h2" fontSize="xl" sm="2xl" weight="semibold" className="text-primary dark:text-white">
                {card.title}
              </Heading>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed max-w-md">{card.desc}</p>
            <div className="mt-auto">
              <Button 
                variant="link" 
                size="sm" 
                onClick={card.onClick} 
                className="!px-0"
                disabled={card.disabled}
              >
                {card.button}
              </Button>
            </div>
          </div>
        ))}
        
        {/* MathQuest info card */}
        <div className="col-span-1 md:col-span-2 rounded-2xl shadow-xl dark:bg-transparent p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row items-center justify-between min-h-[200px] sm:min-h-[260px] border border-white/10 mt-2 relative">
          <div className="w-full md:w-1/2">
            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="dark:bg-white/10 bg-blue-800 rounded-xl p-2 sm:p-3 flex items-center justify-center">
                <IoCodeSharp className="text-2xl sm:text-3xl text-white dark:text-blue-400" />
              </div>
              <Heading type="h2" fontSize="xl" sm="2xl" weight="semibold" className="text-primary dark:text-white">
                MathQuest
              </Heading>
            </div>
            <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed max-w-xl">
              Our advanced code synchronization technology ensures that your data is always up-to-date and accurate, no matter where it's coming from. Whether you're integrating data from multiple sources or working with a team of developers, our synchronization technology makes it easy to collaborate and ensure that your data is consistent and reliable.
            </p>
            <Button variant="link" size="sm" to="/" target="_blank" className="!px-0">
              View code collaboration
            </Button>
          </div>

          {/* Logo container */}
          <div className="w-full md:w-1/2 flex items-center justify-center mt-4 sm:mt-6 md:mt-0">
            <img
              src="/images/new-logo.png"
              alt="MathQuest Logo"
              className="w-32 h-32 sm:w-40 sm:h-40 md:w-60 md:h-60 object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 