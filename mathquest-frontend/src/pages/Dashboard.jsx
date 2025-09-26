import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useClassroom } from '../context/ClassroomContext';
import { Header as Heading } from '../ui/heading';
import { Button } from '../ui/button';
import { FaChartLine, FaChalkboardTeacher, FaTrophy, FaComments, FaCompass, FaSkullCrossbones, FaAnchor, FaShip, FaMapMarkedAlt, FaTools, FaCode, FaDatabase } from 'react-icons/fa';
import { IoCodeSharp } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

// Import developer photos
import michaelPhoto from '../assets/developers/Michael Ferdinand C. Bacalso.jpg';
import angeloPhoto from '../assets/developers/Angelo B. Cajegas.jpg';
import kristofferPhoto from '../assets/developers/Kristoffer Josh Tesaluna.jpg';
import aaronPhoto from '../assets/developers/Aaron Cloyd Villarta.jpg';
import emmanuelPhoto from '../assets/developers/Emmanuel A. Cagampang Jr.jpg';

const Dashboard = () => {
  const { isAdmin, isTeacher, isStudent } = useAuth();
  const { userClassrooms, getClassroomById, loading } = useClassroom();
  const navigate = useNavigate();
  const { darkMode } = useTheme();

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
        icon: <FaChartLine className="text-3xl text-yellow-500 drop-shadow-sm" />,
        title: 'Analytics Dashboard',
        desc: 'Navigate your ship through class data seas with clear charts and real-time updates—find the hidden trends and treasure insights.',
        button: firstClassroomId ? 'View dashboard' : 'Create Classroom First',
        onClick: () => firstClassroomId ? navigate(`/teacher/classrooms/${firstClassroomId}#class-record-tab`) : navigate('/teacher/classrooms'),
        disabled: false
      },
      {
        icon: <FaChalkboardTeacher className="text-3xl text-yellow-500 drop-shadow-sm" />,
        title: 'Classroom',
        desc: 'Manage your crew and set the course. Reward explorers, organize lessons, and steer learning adventures.',
        button: 'View Classroom',
        onClick: () => navigate('/teacher/classrooms'),
      },
    ];
  } else if (isStudent()) {
    cards = [
      {
        icon: <FaTrophy className="text-3xl text-yellow-500 drop-shadow-sm" />,
        title: 'Leaderboard Dashboard',
        desc: 'Climb the ranks to legend status. Track your loot of points and compare with fellow adventurers.',
        button: firstClassroomId ? 'View leaderboard' : 'Join Classroom First',
        onClick: () => firstClassroomId ? navigate(`/student/classrooms/${firstClassroomId}#leaderboard-tab`) : navigate('/student/classrooms'),
        disabled: false
      },
      {
        icon: <FaChalkboardTeacher className="text-3xl text-yellow-500 drop-shadow-sm" />,
        title: 'Classroom',
        desc: 'Join your fleet and embark on quests. Access lessons, quizzes, and activities to level up.',
        button: 'View Classroom',
        onClick: () => navigate('/student/classrooms'),
      },
    ];
  } else if (isAdmin()) {
    cards = [
      {
        icon: <FaComments className="text-3xl text-yellow-500 drop-shadow-sm" />,
        title: 'Feedback',
        desc: 'Review messages in a bottle. Keep the seas calm by addressing issues and celebrating wins.',
        button: 'View feedback',
        onClick: () => navigate('/admin/feedback'),
      },
      {
        icon: <FaChalkboardTeacher className="text-3xl text-yellow-500 drop-shadow-sm" />,
        title: 'Classroom',
        desc: 'Oversee all ships in the MathQuest fleet. Support captains and crew for smooth voyages.',
        button: 'View Classroom',
        onClick: () => navigate('/admin/classrooms'),
      },
    ];
  }

  // Developers list with imported photos
  const developers = [
    { name: 'Michael Ferdinand C. Bacalso', role: 'Frontend Developer', skills: ['React', 'UI'], icon: <FaCode />, photo: michaelPhoto },
    { name: 'Angelo B. Cajegas', role: 'Frontend Developer', skills: ['React', 'UX'], icon: <FaCode />, photo: angeloPhoto },
    { name: 'Kristoffer Josh Tesalunay', role: 'Frontend Developer', skills: ['React', 'SPA'], icon: <FaCode />, photo: kristofferPhoto },
    { name: 'Aaron Cloyd Villarta', role: 'Backend Developer', skills: ['API', 'Auth'], icon: <FaAnchor />, photo: aaronPhoto },
    { name: 'Emmanuel A. Cagampang Jr.', role: 'Backend Developer', skills: ['DB', 'Analytics'], icon: <FaAnchor />, photo: emmanuelPhoto },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500 mb-4"></div>
      </div>
    );
  }

  return (
    <div
      className="w-full min-h-[70vh] px-4 sm:px-6 lg:px-8 lg:py-8 flex flex-col items-center justify-start"
      style={{
        backgroundImage: darkMode
          ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Header */}
      <div className="max-w-6xl w-full flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 mt-6 sm:mt-8 mb-4">
        <div className="flex items-center gap-3">
          <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-xl sm:text-2xl'} />
          <Heading type="h1" fontSize="4xl" weight="bold" className={(darkMode ? 'text-yellow-200' : 'text-blue-800') + ' tracking-wide'}>
            MathQuest Dashboard
          </Heading>
          <FaSkullCrossbones className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-xl sm:text-2xl'} />
        </div>
      </div>

      {/* Decorative divider */}
      <div className="max-w-6xl w-full">
        <div className="h-[2px] w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 opacity-80 mb-6"></div>
      </div>

      {/* Cards grid */}
      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
        {cards.map((card, idx) => (
          <div
            key={card.title}
            className={`rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 flex flex-col min-h-[220px] sm:min-h-[260px] relative border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
              darkMode
                ? 'bg-[#0b1022]/85 border-yellow-700/40'
                : 'bg-[#f5ecd2] border-yellow-300'
            } ${card.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
            style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}
          >
            {/* Scroll top band */}
            <div className={`absolute -top-1 left-4 right-4 h-2 rounded-b-full ${darkMode ? 'bg-yellow-700/40' : 'bg-yellow-300/70'}`}></div>

            <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className={`${darkMode ? 'bg-yellow-700/30' : 'bg-yellow-500/20'} rounded-xl p-2 sm:p-3 flex items-center justify-center ring-2 ${darkMode ? 'ring-yellow-700/50' : 'ring-yellow-300/70'}`}>
                {card.icon}
              </div>
              <Heading type="h2" fontSize="xl" sm="2xl" weight="bold" className={(darkMode ? 'text-yellow-200' : 'text-gray-800') + ' tracking-wide'}>
                {card.title}
              </Heading>
            </div>
            <p className={(darkMode ? 'text-gray-300' : 'text-gray-700') + ' text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed max-w-md'}>{card.desc}</p>
            <div className="mt-auto">
              <Button 
                variant="link" 
                size="sm" 
                onClick={card.onClick} 
                className={(darkMode ? 'text-yellow-300' : 'text-yellow-800') + ' !px-0 hover:underline'}
                disabled={card.disabled}
              >
                {card.button}
              </Button>
            </div>

            {/* Nautical corner pins */}
            <div className="absolute top-2 right-2 text-yellow-500/70">⚓</div>
            <div className="absolute bottom-2 left-2 text-yellow-500/70">🧭</div>
          </div>
        ))}

        {/* Developers section replaces previous info card */}
        <div
          className={`col-span-1 md:col-span-2 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 border-2 backdrop-blur-sm mt-2 relative transition-all duration-300 ${
            darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
          }`}
          style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}
        >
          {/* Section header */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`${darkMode ? 'bg-yellow-700/30' : 'bg-yellow-500/20'} rounded-xl p-2 sm:p-3 flex items-center justify-center ring-2 ${darkMode ? 'ring-yellow-700/50' : 'ring-yellow-300/70'}`}>
                <FaShip className="text-yellow-500 text-xl sm:text-2xl" />
              </div>
              <Heading type="h2" fontSize="xl" sm="2xl" weight="bold" className={(darkMode ? 'text-yellow-200' : 'text-gray-800') + ' tracking-wide'}>
                Developers Crew
              </Heading>
            </div>
          </div>

          {/* Crew grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {developers.map((dev, i) => (
              <div
                key={dev.name + i}
                className={`relative rounded-2xl p-4 border-2 shadow-xl transition-all duration-300 hover:scale-[1.02] ${
                  darkMode ? 'bg-[#0f1428]/80 border-yellow-700/40' : 'bg-[#fff6dc] border-yellow-300'
                }`}
                style={{ boxShadow: darkMode ? '0 8px 18px rgba(255,215,0,0.08)' : '0 8px 18px rgba(0,0,0,0.06)' }}
              >
                {/* top scroll band */}
                <div className={`absolute -top-1 left-3 right-3 h-2 rounded-b-full ${darkMode ? 'bg-yellow-700/40' : 'bg-yellow-300/70'}`}></div>

                {/* Pirate photo frame */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative">
                    <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden ring-4 ${darkMode ? 'ring-yellow-700/60' : 'ring-yellow-300'} shadow-lg flex items-center justify-center ${darkMode ? 'bg-yellow-800/30' : 'bg-yellow-200'}`}>
                      <img
                        src={dev.photo}
                        alt={dev.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { 
                          console.log('Image failed to load:', dev.photo);
                          e.currentTarget.style.display = 'none'; 
                          // Show fallback icon
                          const fallback = document.createElement('div');
                          fallback.className = 'w-full h-full flex items-center justify-center text-2xl text-yellow-600';
                          fallback.innerHTML = '👤';
                          e.currentTarget.parentElement?.appendChild(fallback);
                        }}
                        onLoad={() => console.log('Image loaded successfully:', dev.photo)}
                      />
                    </div>
                    <div className={`absolute -inset-1 rounded-full pointer-events-none ${darkMode ? 'ring-2 ring-yellow-800/50' : 'ring-2 ring-yellow-400/60'}`}></div>
                    <div className="absolute -right-2 -bottom-2 text-yellow-500">🧭</div>
                  </div>
                  <div className="min-w-0">
                    <div className={(darkMode ? 'text-yellow-200' : 'text-gray-800') + ' font-bold text-base sm:text-lg truncate'}>{dev.name}</div>
                    <div className={(darkMode ? 'text-yellow-300/80' : 'text-yellow-700') + ' text-xs sm:text-sm'}>{dev.role}</div>
                  </div>
                </div>

                {/* Skills scroll */}
                <div className={`rounded-xl p-3 border flex items-center gap-2 flex-wrap ${darkMode ? 'bg-[#0b1022]/70 border-yellow-700/40' : 'bg-[#fdf2cf] border-yellow-300'}`}>
                  <span className={(darkMode ? 'text-yellow-300' : 'text-yellow-800') + ' text-lg'}>{dev.icon}</span>
                  {dev.skills.map((s, idx) => (
                    <span
                      key={s + idx}
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${darkMode ? 'bg-yellow-700/30 text-yellow-200' : 'bg-yellow-200 text-yellow-800'}`}
                    >
                      {s}
                    </span>
                  ))}
                </div>

                {/* Nautical pins */}
                <div className="absolute top-2 right-2 text-yellow-500/70 text-sm">⚓</div>
                <div className="absolute bottom-2 left-2 text-yellow-500/70 text-sm">🧭</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 