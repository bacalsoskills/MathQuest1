import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClassroomService from '../../services/classroomService';
import { CiSearch } from "react-icons/ci";
import { Button } from "../../ui/button"
import { Header } from "../../ui/heading"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { AiOutlinePlusCircle } from "react-icons/ai";
import { useTheme } from '../../context/ThemeContext';
import { MapPin, Compass, Ship, Scroll, Crown, Sword, Anchor } from "lucide-react";

const StudentClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { darkMode, isInitialized } = useTheme();

  // Function to get a random pastel color
  const getRandomColor = (code) => {
    const defaultCode = 'DEFAULT_CODE'; 
    const effectiveCode = code && code.length > 0 ? code : defaultCode;

    const colors = [
      'bg-purple-600', 'bg-orange-500', 'bg-green-500', 'bg-blue-600',
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-600', 'bg-pink-600',
      'bg-teal-500', 'bg-cyan-500'
    ];

    const index = effectiveCode.charCodeAt(0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const classroomData = await ClassroomService.getStudentClassrooms();
        setClassrooms(classroomData);
      } catch (err) {
        setError(err.message || 'Failed to load classrooms');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, []);

  //remove this students can't leave a classroom
  // const handleLeaveClassroom = async (classroomId) => {
  //   if (!window.confirm('Are you sure you want to leave this classroom?')) {
  //     return;
  //   }
    
  //   try {
  //     await ClassroomService.leaveClassroom(classroomId);
  //     setClassrooms(classrooms.filter(c => c.id !== classroomId));
  //   } catch (err) {
  //     console.error('Leave classroom error:', err);
  //     setError(err.message || 'Failed to leave classroom');
  //   }
  // };

  // Filter classrooms based on search term
  const filteredClassrooms = classrooms.filter(classroom => 
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classroom.subject && classroom.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
          : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100'
      } relative overflow-hidden flex justify-center items-center`}>
        {/* Pirate-themed background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 text-6xl">⚓</div>
          <div className="absolute top-20 right-20 text-5xl">🗺️</div>
          <div className="absolute bottom-20 left-20 text-5xl">🏴‍☠️</div>
          <div className="absolute bottom-10 right-10 text-6xl">⚔️</div>
        </div>
        
        <div className="flex flex-col items-center gap-6 relative z-10">
          <div className="relative">
            <div className={`animate-spin rounded-full h-16 w-16 border-4 ${
              darkMode
                ? 'border-amber-200 border-t-amber-600'
                : 'border-amber-200 border-t-amber-600'
            }`}></div>
            <div className={`absolute inset-0 rounded-full border-4 border-transparent animate-spin ${
              darkMode
                ? 'border-t-amber-400'
                : 'border-t-amber-400'
            }`} style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <div className="text-center">
            <h3 className={`text-xl font-semibold mb-2 ${
              darkMode
                ? 'text-amber-300'
                : 'text-amber-800'
            }`}>⚓ Preparing Your Pirate Adventure</h3>
            <p className={`${
              darkMode
                ? 'text-amber-400'
                : 'text-amber-600'
            }`}>Charting the course to your classrooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900'
        : 'bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-100'
    } relative overflow-hidden`}>
      {/* Pirate-themed background elements */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 left-10 text-8xl">⚓</div>
        <div className="absolute top-40 right-20 text-6xl">🗺️</div>
        <div className="absolute bottom-40 left-20 text-7xl">🏴‍☠️</div>
        <div className="absolute bottom-20 right-10 text-8xl">⚔️</div>
        <div className="absolute top-1/2 left-1/4 text-5xl">🏴</div>
        <div className="absolute top-1/3 right-1/3 text-6xl">⚓</div>
        <div className="absolute bottom-1/3 left-1/2 text-5xl">🗺️</div>
      </div>
      
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
        {/* Pirate Treasure Map Header */}
        <div className={`rounded-3xl shadow-2xl border-4 mb-8 overflow-hidden relative transition-colors duration-300 ${
          darkMode
            ? 'bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-gray-600'
            : 'bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 border-amber-600'
        }`}>
          {/* Map texture overlay */}
          <div className={`absolute inset-0 transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-b from-gray-900/20 to-transparent'
              : 'bg-gradient-to-b from-amber-900/20 to-transparent'
          }`}></div>
          <div className="absolute inset-0 opacity-20" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%23d97706\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M0 30h60v30H0z\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
          
          <div className="relative z-10 p-8 text-center">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="text-4xl">🗺️</div>
              <Header type="h1" fontSize="5xl" weight="bold" className={`transition-colors duration-300 ${
                darkMode
                  ? 'text-gray-100'
                  : 'text-amber-100'
              }`}>My Treasure Maps</Header>
              <div className="text-4xl">🏴‍☠️</div>
            </div>
            <p className={`text-lg transition-colors duration-300 ${
              darkMode
                ? 'text-gray-300'
                : 'text-amber-200'
            }`}>Explore your collection of classroom adventures</p>
          </div>
        </div>
        {/* Pirate Navigation Panel */}
        <div className={`rounded-2xl shadow-xl border-4 mb-8 overflow-hidden relative transition-colors duration-300 ${
          darkMode
            ? 'bg-gradient-to-r from-gray-800 to-gray-700 border-gray-600'
            : 'bg-gradient-to-r from-amber-800 to-amber-700 border-amber-600'
        }`}>
          {/* Scroll texture overlay */}
          <div className={`absolute inset-0 transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-b from-gray-900/20 to-transparent'
              : 'bg-gradient-to-b from-amber-900/20 to-transparent'
          }`}></div>
          <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\"40\" height=\"40\" viewBox=\"0 0 40 40\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"%23d97706\" fill-opacity=\"0.1\"%3E%3Cpath d=\"M0 20h40v20H0z\"/%3E%3C/g%3E%3C/svg%3E')"}}></div>
          
          <div className="relative z-10 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              {/* Search Compass */}
              <div className="relative w-full sm:w-auto">
                <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors duration-300 ${
                  darkMode
                    ? 'text-gray-300'
                    : 'text-amber-700'
                }`}>
                  <Compass className="w-5 h-5" />
                </div>
                <Input
                  type="search"
                  name="search"
                  id="search"
                  className={`block w-full sm:w-64 pl-10 pr-3 py-3 sm:text-sm transition-colors duration-300 ${
                    darkMode
                      ? 'border-gray-300 text-gray-300 bg-gray-700/50'
                      : 'border-amber-700 text-amber-700 bg-amber-100/50'
                  }`}
                  placeholder="Search treasure maps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            
              {/* Join Classroom Button */}
              <Link
                to="/student/join-classroom"
                className={`font-semibold flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                  darkMode
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                    : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800'
                }`}
              >
                <AiOutlinePlusCircle className="w-5 h-5" />
                Join New Adventure
              </Link>
            </div>
          </div>
        </div>

        {error && (
          <div className={`border-2 rounded-xl p-6 mb-6 flex items-center gap-3 shadow-lg transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-r from-red-100 to-orange-100 border-red-400'
              : 'bg-gradient-to-r from-red-100 to-orange-100 border-red-400'
          }`}>
            <div className="text-2xl">🚨</div>
            <span className="block sm:inline text-red-800 font-medium">{error}</span>
            <button 
              className="ml-auto text-red-600 hover:text-red-800 transition-colors duration-300"
              onClick={() => setError('')}
            >
              <span className="sr-only">Close</span>
              <span className="text-xl">×</span>
            </button>
          </div>
        )}

        {classrooms.length === 0 ? (
          <div className={`rounded-2xl shadow-2xl border-4 p-8 text-center transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300'
              : 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-400'
          }`}>
            <div className="text-6xl mb-4">🗺️</div>
            <p className={`text-lg font-medium mb-6 transition-colors duration-300 ${
              darkMode
                ? 'text-gray-700'
                : 'text-amber-700'
            }`}>Ahoy! You haven't joined any classroom adventures yet!</p>
            <Link to="/student/join-classroom">
              <Button className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg ${
                darkMode
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800'
                  : 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-700 hover:to-amber-800'
              }`}>
                <AiOutlinePlusCircle className="w-5 h-5" />
                Join Your First Adventure
              </Button>
            </Link>
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className={`rounded-2xl shadow-2xl border-4 p-8 text-center transition-colors duration-300 ${
            darkMode
              ? 'bg-gradient-to-br from-gray-100 to-gray-50 border-gray-300'
              : 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-400'
          }`}>
            <div className="text-6xl mb-4">🔍</div>
            <p className={`text-lg font-medium transition-colors duration-300 ${
              darkMode
                ? 'text-gray-700'
                : 'text-amber-700'
            }`}>No treasure maps found for '{searchTerm}'</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClassrooms.map(classroom => (
              <Link to={`/student/classrooms/${classroom.id}`} key={classroom.id} className="block group">
                <div className={`rounded-2xl shadow-xl overflow-hidden flex flex-col transition-all duration-300 transform group-hover:scale-105 group-hover:shadow-2xl ${
                  darkMode
                    ? 'bg-gradient-to-br from-gray-100 to-gray-50 border-4 border-gray-300'
                    : 'bg-gradient-to-br from-amber-100 to-amber-50 border-4 border-amber-400'
                }`}>
                  {/* Treasure Map Header */}
                  <div className={`px-4 py-3 text-white text-base sm:text-lg font-semibold text-left relative overflow-hidden transition-colors duration-300 ${
                    darkMode
                      ? 'bg-gradient-to-r from-gray-700 to-gray-600'
                      : 'bg-gradient-to-r from-amber-700 to-amber-600'
                  }`}>
                    {/* Decorative elements */}
                    <div className="absolute top-2 right-2 text-lg opacity-60">🗺️</div>
                    <div className="absolute bottom-2 left-2 text-sm opacity-40">⚓</div>
                    <div className="relative z-10">
                      {classroom.shortCode || classroom.subject?.substring(0, 3)?.toUpperCase() || 'CLASS'}
                    </div>
                  </div>
                  
                  {/* Treasure Map Image */}
                  <div className="w-full h-48 relative overflow-hidden">
                    {classroom.image ? (
                      <img 
                        src={`data:image/jpeg;base64,${classroom.image}`} 
                        alt={classroom.name} 
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center transition-colors duration-300 ${
                        darkMode
                          ? 'bg-gradient-to-br from-gray-800 to-gray-900'
                          : 'bg-gradient-to-br from-amber-800 to-amber-900'
                      }`}>
                        <div className="text-center">
                          <div className="text-4xl mb-2">🏴‍☠️</div>
                          <span className={`font-medium text-lg lg:text-3xl transition-colors duration-300 ${
                            darkMode
                              ? 'text-gray-100'
                              : 'text-amber-100'
                          }`}>{classroom.shortCode || 'N/A'}</span>
                        </div>
                      </div>
                    )}
                    {/* Overlay for hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  
                  {/* Treasure Map Details */}
                  <div className="p-5 text-left flex-grow flex flex-col justify-start">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="text-xl">🗺️</div>
                      <Header type="h2" fontSize="xl" weight="bold" className={`truncate transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-800'
                          : 'text-amber-800'
                      }`} title={classroom.name}>{classroom.name}</Header>
                    </div>
                    <div className="flex items-center gap-2">
                      <Ship className={`w-4 h-4 transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-600'
                          : 'text-amber-600'
                      }`} />
                      <p className={`text-sm sm:text-base font-medium transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-700'
                          : 'text-amber-700'
                      }`}>
                        Captain: {
                          classroom.teacher?.firstName && classroom.teacher?.lastName 
                          ? `${classroom.teacher.firstName} ${classroom.teacher.lastName}` 
                          : classroom.teacher?.name || 'N/A' 
                        }
                      </p>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="text-lg">⚔️</div>
                      <p className={`text-sm transition-colors duration-300 ${
                        darkMode
                          ? 'text-gray-600'
                          : 'text-amber-600'
                      }`}>Ready for adventure!</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default StudentClassrooms; 