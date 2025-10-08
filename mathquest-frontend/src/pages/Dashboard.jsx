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
    { name: 'Kristoffer Josh Tesaluna', role: 'Frontend Developer', skills: ['React', 'SPA'], icon: <FaCode />, photo: kristofferPhoto },
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
      className="w-full min-h-screen overflow-x-hidden flex flex-col items-center justify-start"
      style={{
        backgroundImage: darkMode
          ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Outer container with consistent padding */}
      <div className="w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 flex flex-col">
        {/* Header */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center">
            <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg sm:text-xl md:text-2xl flex-shrink-0'} />
            <Heading type="h1" fontSize="2xl" sm="3xl" md="4xl" weight="bold" className={(darkMode ? 'text-yellow-200' : 'text-blue-800') + ' tracking-wide text-center sm:text-left break-words'}>
              MathQuest Dashboard
            </Heading>
            <FaSkullCrossbones className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg sm:text-xl md:text-2xl flex-shrink-0'} />
          </div>
        </div>

        {/* Decorative divider */}
        <div className="w-full mb-4 sm:mb-6">
          <div className="h-[2px] w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 opacity-80"></div>
        </div>

        {/* Cards grid - responsive with proper overflow handling */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 lg:gap-6 auto-rows-auto">
          {cards.map((card, idx) => (
            <div
              key={card.title}
              className={`rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-3 sm:p-4 md:p-5 lg:p-6 flex flex-col relative border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] ${
                darkMode
                  ? 'bg-[#0b1022]/85 border-yellow-700/40'
                  : 'bg-[#f5ecd2] border-yellow-300'
              } ${card.disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              style={{ boxShadow: darkMode ? '0 8px 20px rgba(255, 215, 0, 0.08)' : '0 8px 20px rgba(0,0,0,0.08)' }}
            >
              {/* Scroll top band */}
              <div className={`absolute -top-1 left-3 sm:left-4 right-3 sm:right-4 h-1.5 sm:h-2 rounded-b-full ${darkMode ? 'bg-yellow-700/40' : 'bg-yellow-300/70'}`}></div>

              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`${darkMode ? 'bg-yellow-700/30' : 'bg-yellow-500/20'} rounded-lg sm:rounded-xl p-2 flex items-center justify-center ring-2 ${darkMode ? 'ring-yellow-700/50' : 'ring-yellow-300/70'} flex-shrink-0`}>
                  {card.icon}
                </div>
                <Heading type="h2" fontSize="lg" sm="xl" md="2xl" weight="bold" className={(darkMode ? 'text-yellow-200' : 'text-gray-800') + ' tracking-wide break-words flex-1 min-w-0'}>
                  {card.title}
                </Heading>
              </div>
              <p className={(darkMode ? 'text-gray-300' : 'text-gray-700') + ' text-xs sm:text-sm mb-3 sm:mb-4 leading-relaxed break-words'}>{card.desc}</p>
              <div className="mt-auto pt-2">
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={card.onClick} 
                  className={(darkMode ? 'text-yellow-300' : 'text-yellow-800') + ' !px-0 hover:underline text-xs sm:text-sm'}
                  disabled={card.disabled}
                >
                  {card.button}
                </Button>
              </div>

              {/* Nautical corner pins */}
              <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 text-yellow-500/70 text-sm sm:text-base">⚓</div>
              <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 text-yellow-500/70 text-sm sm:text-base">🧭</div>
            </div>
          ))}

          {/* Developers section - spans full width on larger screens */}
          <div
            className={`col-span-1 md:col-span-2 rounded-xl sm:rounded-2xl shadow-xl sm:shadow-2xl p-3 sm:p-4 md:p-5 lg:p-6 border-2 backdrop-blur-sm relative transition-all duration-300 ${
              darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
            }`}
            style={{ boxShadow: darkMode ? '0 8px 20px rgba(255, 215, 0, 0.08)' : '0 8px 20px rgba(0,0,0,0.08)' }}
          >
            {/* Section header */}
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-5">
              <div className={`${darkMode ? 'bg-yellow-700/30' : 'bg-yellow-500/20'} rounded-lg sm:rounded-xl p-2 flex items-center justify-center ring-2 ${darkMode ? 'ring-yellow-700/50' : 'ring-yellow-300/70'} flex-shrink-0`}>
                <FaShip className="text-yellow-500 text-lg sm:text-xl md:text-2xl" />
              </div>
              <Heading type="h2" fontSize="lg" sm="xl" md="2xl" weight="bold" className={(darkMode ? 'text-yellow-200' : 'text-gray-800') + ' tracking-wide break-words'}>
                Developers Crew
              </Heading>
            </div>

            {/* Crew grid - responsive layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 auto-rows-auto">
              {developers.map((dev, i) => (
                <div
                  key={dev.name + i}
                  className={`relative rounded-xl sm:rounded-2xl p-3 sm:p-4 border-2 shadow-lg sm:shadow-xl transition-all duration-300 hover:scale-[1.01] ${
                    darkMode ? 'bg-[#0f1428]/80 border-yellow-700/40' : 'bg-[#fff6dc] border-yellow-300'
                  }`}
                  style={{ boxShadow: darkMode ? '0 6px 15px rgba(255,215,0,0.08)' : '0 6px 15px rgba(0,0,0,0.06)' }}
                >
                  {/* top scroll band */}
                  <div className={`absolute -top-1 left-2 sm:left-3 right-2 sm:right-3 h-1.5 sm:h-2 rounded-b-full ${darkMode ? 'bg-yellow-700/40' : 'bg-yellow-300/70'}`}></div>

                  {/* Pirate photo frame */}
                  <div className="flex flex-col items-center gap-2 mb-2 sm:mb-3">
                    <div className="relative flex-shrink-0">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-full overflow-hidden ring-3 sm:ring-4 ${darkMode ? 'ring-yellow-700/60' : 'ring-yellow-300'} shadow-lg flex items-center justify-center ${darkMode ? 'bg-yellow-800/30' : 'bg-yellow-200'}`}>
                        <img
                          src={dev.photo}
                          alt={dev.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { 
                            console.log('Image failed to load:', dev.photo);
                            e.currentTarget.style.display = 'none'; 
                            // Show fallback icon
                            const fallback = document.createElement('div');
                            fallback.className = 'w-full h-full flex items-center justify-center text-xl sm:text-2xl text-yellow-600';
                            fallback.innerHTML = '👤';
                            e.currentTarget.parentElement?.appendChild(fallback);
                          }}
                          onLoad={() => console.log('Image loaded successfully:', dev.photo)}
                        />
                      </div>
                      <div className={`absolute -inset-1 rounded-full pointer-events-none ${darkMode ? 'ring-2 ring-yellow-800/50' : 'ring-2 ring-yellow-400/60'}`}></div>
                      <div className="absolute -right-1 sm:-right-2 -bottom-1 sm:-bottom-2 text-base sm:text-lg text-yellow-500">🧭</div>
                    </div>
                    <div className="w-full text-center">
                      <div className={(darkMode ? 'text-yellow-200' : 'text-gray-800') + ' font-bold text-xs sm:text-sm md:text-base break-words px-1'}>{dev.name}</div>
                      <div className={(darkMode ? 'text-yellow-300/80' : 'text-yellow-700') + ' text-[10px] sm:text-xs break-words'}>{dev.role}</div>
                    </div>
                  </div>

                  {/* Skills scroll */}
                  <div className={`rounded-lg sm:rounded-xl p-2 sm:p-3 border flex items-center justify-center gap-1.5 sm:gap-2 flex-wrap ${darkMode ? 'bg-[#0b1022]/70 border-yellow-700/40' : 'bg-[#fdf2cf] border-yellow-300'}`}>
                    <span className={(darkMode ? 'text-yellow-300' : 'text-yellow-800') + ' text-sm sm:text-base flex-shrink-0'}>{dev.icon}</span>
                    {dev.skills.map((s, idx) => (
                      <span
                        key={s + idx}
                        className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap ${darkMode ? 'bg-yellow-700/30 text-yellow-200' : 'bg-yellow-200 text-yellow-800'}`}
                      >
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Nautical pins */}
                  <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 text-yellow-500/70 text-xs sm:text-sm">⚓</div>
                  <div className="absolute bottom-1.5 sm:bottom-2 left-1.5 sm:left-2 text-yellow-500/70 text-xs sm:text-sm">🧭</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 