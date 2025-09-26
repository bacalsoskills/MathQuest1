import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClassroomService from '../../services/classroomService';
import { CiSearch } from "react-icons/ci";
import { Button } from "../../ui/button"
import { Header } from "../../ui/heading"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import Modal from "../../ui/modal"
import { AiOutlinePlusCircle } from "react-icons/ai";
import { TbDotsVertical } from "react-icons/tb";
import { FaCompass, FaSkullCrossbones, FaShip, FaAnchor, FaMapMarkedAlt, FaUsers, FaUserPlus, FaTrash, FaEye } from "react-icons/fa";
import { useTheme } from '../../context/ThemeContext';



const TeacherClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState(null);
  const [classroomStudents, setClassroomStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [studentIdToAdd, setStudentIdToAdd] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('alphabetical');
  const [studentSearchResults, setStudentSearchResults] = useState([]);
  const [searchingStudents, setSearchingStudents] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');

  const [isViewStudentsModalOpen, setIsViewStudentsModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  
  const { darkMode } = useTheme();

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
     
        const classroomData = await ClassroomService.getTeacherClassrooms();
        

        
        setClassrooms(classroomData);
      } catch (err) {
       
        setError(err.message || 'Failed to load classrooms');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [sortOption]);

  // Handle clicking outside dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  const handleViewStudents = async (classroom) => {
    setSelectedClassroom(classroom);
    setIsViewStudentsModalOpen(true);
    setLoadingStudents(true);
    try {
      const students = await ClassroomService.getStudentsInClassroom(classroom.id);
      setClassroomStudents(students);
    } catch (err) {
      console.error('Fetch students error:', err);
      setError(`Failed to load students for ${classroom.name}`);
    } finally {
      setLoadingStudents(false);
    }
  };

  const openAddStudentModal = (classroom) => {
    setSelectedClassroom(classroom);
    setStudentIdToAdd('');
    setStudentSearchTerm('');
    setStudentSearchResults([]);
    setIsAddStudentModalOpen(true);
  };

  const handleSearchStudents = async (searchTerm) => {
    if (!selectedClassroom || !searchTerm.trim()) {
      setStudentSearchResults([]);
      return;
    }
    
    setSearchingStudents(true);
    try {
      const results = await ClassroomService.searchStudents(
        searchTerm, 
        selectedClassroom.id
      );
      setStudentSearchResults(results);
      setError('');
    } catch (err) {
      console.error('Search students error:', err);
      setError(err.message || 'Failed to search for students');
      setStudentSearchResults([]);
    } finally {
      setSearchingStudents(false);
    }
  };

  const handleAddStudent = async (studentId) => {
    if (!studentId || !selectedClassroom) return;
    
    // Find the student in the search results
    const studentToAdd = studentSearchResults.find(s => s.id === studentId);
    if (!studentToAdd || studentToAdd.inClassroom) return;
    
    // Optimistically update UI
    setStudentSearchResults(prevResults => 
      prevResults.map(student => 
        student.id === studentId 
          ? { ...student, inClassroom: true, isAdding: true } 
          : student
      )
    );
    
    try {
      await ClassroomService.addStudentToClassroom(selectedClassroom.id, studentId);
      
      // Update the student search results to mark this student as in the classroom
      setStudentSearchResults(prevResults => 
        prevResults.map(student => 
          student.id === studentId 
            ? { ...student, inClassroom: true, isAdding: false } 
            : student
        )
      );
      
      setError('');
    } catch (err) {
      console.error('Add student error:', err);
      setError(err.message || 'Failed to add student to classroom');
      
      // Revert the optimistic update
      setStudentSearchResults(prevResults => 
        prevResults.map(student => 
          student.id === studentId 
            ? { ...student, inClassroom: false, isAdding: false } 
            : student
        )
      );
    }
  };

  // Debounce student search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (studentSearchTerm) {
        handleSearchStudents(studentSearchTerm);
      } else {
        setStudentSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [studentSearchTerm, selectedClassroom]);

  const handleRemoveStudent = async (studentId) => {
    if (!selectedClassroom) return;
 
    if (!window.confirm('Are you sure you want to remove this student from the classroom?')) {
      return;
    }
    
    try {
      await ClassroomService.removeStudentFromClassroom(selectedClassroom.id, studentId);
      setClassroomStudents(prevStudents => prevStudents.filter(s => s.id !== studentId));
    } catch (err) {
      console.error('Remove student error:', err);
      setError(err.message || 'Failed to remove student from classroom');
    }
  };

  const handleDeleteClassroom = async (classroomId) => {
    if (!window.confirm('Are you sure you want to delete this classroom? This action cannot be undone.')) {
      return;
    }
    
    try {
      await ClassroomService.deleteClassroom(classroomId);
      setClassrooms(classrooms.filter(c => c.id !== classroomId));
      
      if (selectedClassroom && selectedClassroom.id === classroomId) {
        setSelectedClassroom(null);
        setClassroomStudents([]);
      }
    } catch (err) {
      console.error('Delete classroom error:', err);
      setError(err.message || 'Failed to delete classroom');
    }
  };

  // Filter classrooms based on search term
  const filteredClassrooms = classrooms.filter(classroom => 
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classroom.shortCode && classroom.shortCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Sort classrooms based on the selected option
  const sortedClassrooms = [...filteredClassrooms].sort((a, b) => {
    if (sortOption === 'alphabetical') {
      return a.name.localeCompare(b.name);
    } else if (sortOption === 'date') {
      // Log the entire classroom objects to see all available fields

      
      // Try different possible date field names
      const dateA = new Date(a.createdDate || a.created_at || a.createdAt || a.created_date);
      const dateB = new Date(b.createdDate || b.created_at || b.createdAt || b.created_date);

      
      return dateB - dateA; // Reverse the order to get newest first
    }
    return 0;
  });

  if (loading) {
    return (
      <div 
        className="flex justify-center items-center h-screen"
        style={{
          backgroundImage: darkMode
            ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
            : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          <p className={(darkMode ? 'text-yellow-300' : 'text-yellow-800') + ' text-lg font-semibold'}>Hoisting the sails...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="px-4 sm:px-6 lg:px-8 lg:py-8 min-h-screen"
      style={{
        backgroundImage: darkMode
          ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header with pirate theme */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-3 mt-6 sm:mt-8 mb-4">
          <div className="flex items-center gap-3">
            <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-xl sm:text-2xl'} />
            <Header type="h1" fontSize="4xl" weight="bold" className={(darkMode ? 'text-yellow-300' : 'text-blue-800') + ' tracking-wide'}>
              Captain's Fleet
            </Header>
            <FaSkullCrossbones className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-xl sm:text-2xl'} />
          </div>
        </div>

        {/* Decorative divider */}
        <div className="max-w-6xl w-full">
          <div className="h-[2px] w-full bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 opacity-80 mb-6"></div>
        </div>
        {/* Search and controls section */}
        <div className={`rounded-2xl shadow-2xl p-4 sm:p-6 border-2 backdrop-blur-sm mb-6 ${
          darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
        }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkedAlt className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-lg'} />
                </div>
                <Input
                  type="search"
                  name="search"
                  id="search"
                  className={`block w-full sm:w-64 pl-10 pr-3 py-2 sm:text-sm border-2 rounded-lg ${
                    darkMode ? 'bg-[#0f1428] text-gray-100 border-yellow-700/40' : 'bg-[#fbf4de] text-gray-900 border-yellow-300'
                  }`}
                  placeholder="Search your fleet..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-sm'} />
                <span className={`text-sm ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>Sort by:</span>
                <select 
                  className={`text-sm bg-transparent focus:outline-none font-medium rounded-lg px-2 py-1 ${
                    darkMode ? 'text-yellow-200 bg-[#0f1428]' : 'text-yellow-800 bg-[#fbf4de]'
                  }`}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="alphabetical">Alphabetical</option>
                  <option value="date">Most Recent</option>
                </select>
              </div>
            </div>
          
            <Link
              to="/teacher/add-classroom"
              className={`font-semibold flex items-center gap-2 h-10 px-4 rounded-lg transition-all duration-300 hover:scale-105 ${
                darkMode 
                  ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                  : 'bg-yellow-500 hover:bg-yellow-600 text-white'
              }`}
            >
              <FaShip className="w-4 h-4" />
              Launch New Ship
            </Link>
          </div>
        </div>
        {error && !isViewStudentsModalOpen && !isAddStudentModalOpen && (
          <div className={`border-2 px-4 py-3 rounded-lg relative mb-4 ${
            darkMode ? 'bg-red-900/30 border-red-600/50 text-red-300' : 'bg-red-100 border-red-400 text-red-700'
          }`} role="alert">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError('')}
            >
              <span className="sr-only">Close</span>
              <span className={darkMode ? 'text-red-300' : 'text-red-500'}>×</span>
            </button>
          </div>
        )}

        {sortedClassrooms.length === 0 ? (
          <div className={`rounded-2xl shadow-2xl p-8 text-center border-2 backdrop-blur-sm ${
            darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
          }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
            <FaShip className={`mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-4xl`} />
            <p className={`mb-6 text-lg ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
              Your fleet is empty, Captain! Time to launch your first ship.
            </p>
            <Link to="/teacher/add-classroom">
              <Button 
                variant="default" 
                size="sm" 
                className={`flex items-center gap-2 mx-auto ${
                  darkMode 
                    ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                }`}
              >
                <FaShip className="w-4 h-4" />
                Launch New Ship
              </Button>
            </Link>
          </div>
        ) : filteredClassrooms.length === 0 && searchTerm ? (
          <div className={`rounded-2xl shadow-2xl p-8 text-center border-2 backdrop-blur-sm ${
            darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
          }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
            <FaMapMarkedAlt className={`mx-auto mb-4 ${darkMode ? 'text-yellow-400' : 'text-yellow-600'} text-4xl`} />
            <p className={`text-lg ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
              No ships found for '{searchTerm}' in your fleet
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedClassrooms.map(classroom => (
              <div
                key={classroom.id}
                className={`rounded-2xl shadow-2xl overflow-hidden flex flex-col sm:flex-row border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
                  darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
                }`}
                style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}
              >
                {/* Ship Image - Clickable */}
                <Link
                  to={`/teacher/classrooms/${classroom.id}`}
                  className="sm:w-1/3 md:w-1/3 flex-shrink-0 cursor-pointer relative"
                >
                  {classroom.image ? (
                    <img 
                      src={`data:image/jpeg;base64,${classroom.image}`} 
                      alt={classroom.name} 
                      className="w-full h-[200px] object-cover"
                    />
                  ) : (
                    <div className="w-full h-[200px] bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 flex items-center justify-center relative">
                      <FaShip className="text-white text-4xl mb-2" />
                      <span className="text-white font-bold text-lg lg:text-2xl absolute bottom-4">{classroom.shortCode || 'N/A'}</span>
                    </div>
                  )}
                  {/* Nautical corner pins */}
                  <div className="absolute top-2 right-2 text-yellow-500/70 text-sm">⚓</div>
                  <div className="absolute bottom-2 left-2 text-yellow-500/70 text-sm">🧭</div>
                </Link>
                
                {/* Ship Details */}
                <div className="p-5 flex-grow sm:w-2/3 md:w-2/3">
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <Link
                        to={`/teacher/classrooms/${classroom.id}`}
                        className="block cursor-pointer"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FaAnchor className={(darkMode ? 'text-yellow-400' : 'text-yellow-600') + ' text-sm'} />
                          <p className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                            Ship Code: {classroom.shortCode || 'N/A'}
                          </p>
                        </div>
                        <Header type="h2" fontSize="2xl" weight="bold" className={`mt-1 mb-1 transition-colors ${
                          darkMode ? 'text-yellow-200 hover:text-yellow-100' : 'text-gray-800 hover:text-blue-600'
                        }`}>
                          {classroom.name}
                        </Header>
                      </Link>
                      <div className="flex items-center gap-2 mb-2">
                        <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-600') + ' text-sm'} />
                        <p className={`text-sm italic ${darkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                          Boarding Code: {classroom.classCode || 'N/A'}
                        </p>
                      </div>
                      
                      {classroom.description && (
                        <p className={`text-sm mb-4 line-clamp-3 sm:line-clamp-2 whitespace-normal ${
                          darkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>{classroom.description}</p>
                      )}
                    </div>
                    
                    {/* Captain's Menu */}
                    <div className="relative ml-4 dropdown-container">
                      <button
                        onClick={() => setOpenDropdownId(openDropdownId === classroom.id ? null : classroom.id)}
                        className={`p-2 rounded-full transition-colors ${
                          darkMode 
                            ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-700/30' 
                            : 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-100'
                        }`}
                      >
                        <TbDotsVertical className="w-5 h-5" />
                      </button>
                      
                      {openDropdownId === classroom.id && (
                        <div className={`absolute right-0 -top-28 md:top-full mt-1 w-48 rounded-lg shadow-lg border-2 z-10 ${
                          darkMode 
                            ? 'bg-[#0b1022] border-yellow-700/40' 
                            : 'bg-[#f5ecd2] border-yellow-300'
                        }`}>
                          <div className="py-1">
                            <button
                              onClick={() => {
                                handleViewStudents(classroom);
                                setOpenDropdownId(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                                darkMode 
                                  ? 'text-yellow-200 hover:bg-yellow-700/30' 
                                  : 'text-yellow-800 hover:bg-yellow-200'
                              }`}
                            >
                              <FaUsers className="w-4 h-4" />
                              View Crew
                            </button>
                            <button
                              onClick={() => {
                                openAddStudentModal(classroom);
                                setOpenDropdownId(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                                darkMode 
                                  ? 'text-yellow-200 hover:bg-yellow-700/30' 
                                  : 'text-yellow-800 hover:bg-yellow-200'
                              }`}
                            >
                              <FaUserPlus className="w-4 h-4" />
                              Recruit Crew
                            </button>
                            <button
                              onClick={() => {
                                handleDeleteClassroom(classroom.id);
                                setOpenDropdownId(null);
                              }}
                              className={`block w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2 ${
                                darkMode 
                                  ? 'text-red-400 hover:bg-red-900/30' 
                                  : 'text-red-600 hover:bg-red-50'
                              }`}
                            >
                              <FaTrash className="w-4 h-4" />
                              Scuttle Ship
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Students Modal */}
      <Modal 
        isOpen={isViewStudentsModalOpen} 
        onClose={() => {
          setIsViewStudentsModalOpen(false);
          setSelectedClassroom(null);
          setClassroomStudents([]);
          setError('');
        }}
        title={selectedClassroom ? `Crew of ${selectedClassroom.name}` : 'Ship Crew'}
        maxWidth="max-w-4xl"
      >
        {loadingStudents ? (
          <div className="text-center py-4 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-yellow-500"></div>
            <span>Gathering the crew...</span>
          </div>
        ) : error && isViewStudentsModalOpen ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : classroomStudents.length === 0 ? (
          <div className="text-center py-4 text-gray-500 flex flex-col items-center gap-2">
            <FaUsers className="text-4xl text-gray-400" />
            <span>No crew members aboard this ship yet.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Crew Member</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200">
                {classroomStudents.map(student => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-300">
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-600 hover:text-red-900 flex items-center gap-1"
                      >
                        <FaTrash className="w-3 h-3" />
                        Walk the Plank
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      {/* Add Student Modal */}
      <Modal 
        isOpen={isAddStudentModalOpen} 
        onClose={() => {
          setIsAddStudentModalOpen(false);
          setStudentIdToAdd('');
          setStudentSearchTerm('');
          setStudentSearchResults([]);
          setError('');
        }}
        title={selectedClassroom ? `Recruit Crew for ${selectedClassroom.name}` : 'Recruit Crew'}
        maxWidth="max-w-lg"
      >
        {error && isAddStudentModalOpen && (
          <div className="text-red-500 mb-3">{error}</div>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="studentSearch" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search for New Crew Members
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CiSearch className="text-gray-400 dark:text-gray-300" />
              </div>
              <Input
                type="text"
                id="studentSearch"
                placeholder="Search by name or username..."
                className="w-full pl-10 pr-3 py-2 border dark:text-gray-300 border-gray-300 dark:border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {searchingStudents ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300 flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-yellow-500"></div>
              <span>Searching the seas...</span>
            </div>
          ) : studentSearchTerm && studentSearchResults.length === 0 ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300 flex flex-col items-center gap-2">
              <FaUsers className="text-2xl text-gray-400" />
              <span>No crew members found matching '{studentSearchTerm}'</span>
            </div>
          ) : !studentSearchTerm ? (
            <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-300 flex flex-col items-center gap-2">
              <FaCompass className="text-2xl text-gray-400" />
              <span>Type to search for new crew members</span>
            </div>
          ) : (
            <div className="mt-2 max-h-60 overflow-y-auto">
              {studentSearchResults.map(student => (
                <div 
                  key={student.id} 
                  className={`flex justify-between items-center p-3 border-b border-gray-100 ${
                    !student.inClassroom 
                      ? 'hover:bg-blue-50 cursor-pointer transition-colors duration-150' 
                      : ''
                  }`}
                  onClick={() => !student.inClassroom && handleAddStudent(student.id)}
                >
                  <div className="flex-grow">
                    <p className="font-medium text-gray-800 dark:text-gray-300">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-300">@{student.username}</p>
                  </div>
                  {student.inClassroom ? (
                    <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                      <FaAnchor className="w-3 h-3" />
                      Already aboard
                    </span>
                  ) : student.isAdding ? (
                    <span className="text-sm text-blue-600 font-medium animate-pulse flex items-center gap-1">
                      <FaShip className="w-3 h-3" />
                      Recruiting...
                    </span>
                  ) : (
                    <div className="flex items-center">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleAddStudent(student.id);
                        }}
                        variant="default"
                        size="sm"
                        className="text-sm flex items-center gap-1"
                      >
                        <FaUserPlus className="w-3 h-3" />
                        Recruit
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default TeacherClassrooms; 