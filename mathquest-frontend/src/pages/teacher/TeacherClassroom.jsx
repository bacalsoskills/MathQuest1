import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClassroomService from '../../services/classroomService';
import { CiSearch } from "react-icons/ci";
import { Button } from "../../ui/button"
import { Header } from "../../ui/heading"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { AiOutlinePlusCircle } from "react-icons/ai";


// Basic Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
};

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

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        console.log("Fetching classrooms as teacher");
        const classroomData = await ClassroomService.getTeacherClassrooms();
        
        console.log("Retrieved classrooms:", classroomData);
        setClassrooms(classroomData);
      } catch (err) {
        console.error('Fetch classrooms error:', err);
        setError(err.message || 'Failed to load classrooms');
      } finally {
        setLoading(false);
      }
    };

    fetchClassrooms();
  }, [sortOption]);

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
      return new Date(a.createdDate) - new Date(b.createdDate);
    }
    return 0;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="text-center">Loading classrooms...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#E7EFFC] min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-5xl mx-auto">
      <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">Classrooms</Header>
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-300">
          <div className="flex items-center space-x-4 w-full sm:w-auto">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none  !text-gray-800">
                <CiSearch />
              </div>
              <Input
                type="search"
                name="search"
                id="search"
                className=" block w-full sm:w-64 pl-10 pr-3 py-2 sm:text-sm  !text-gray-800"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-gray-600">
              Sort by: 
              <select className="ml-2 !bg-transparent focus:outline-none font-medium text-gray-800" onChange={(e) => setSortOption(e.target.value)}>
                <option value="alphabetical">Alphabetical</option>
                <option value="date">Most Recent</option>
              </select>
            </div>
          </div>
          
            <Link
              to="/add-classroom"
             className="text-secondary font-semibold flex items-center gap-2 h-10"
           >
             <AiOutlinePlusCircle className="w-5 h-5" />
                  Create Classroom
             
              </Link>
        </div>

        {error && !isViewStudentsModalOpen && !isAddStudentModalOpen && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError('')}
            >
              <span className="sr-only">Close</span>
              <span className="text-red-500">×</span>
            </button>
          </div>
        )}

        {sortedClassrooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600 mb-4">You haven't created any classrooms yet.</p>
            <Link to="/add-classroom">
            <Button variant="default" size="sm" className="flex items-center gap-2">
                <AiOutlinePlusCircle className="w-5 h-5" />
                Create Classroom
              </Button>
            </Link>
          </div>
        ) : filteredClassrooms.length === 0 && searchTerm ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600">No classrooms found for '{searchTerm}'</p>
          </div>
        ) : (
          <div className="space-y-6"> {/* Changed from grid to vertical space */}
            {sortedClassrooms.map(classroom => (
              <div key={classroom.id} className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col sm:flex-row ">
                {/* Classroom Image */}
                <div className="sm:w-1/3 md:w-1/3 flex-shrink-0 ">
                  {classroom.image ? (
                    <img 
                      src={`data:image/jpeg;base64,${classroom.image}`} 
                      alt={classroom.name} 
                      className="w-full h-[200px] object-cover "
                    />
                  ) : (
                    <div className="w-full h-[200px] bg-gradient-to-r from-primary to-secondary flex items-center justify-center">
                      <span className="text-white font-medium text-lg lg:text-3xl">{classroom.shortCode || 'N/A'}</span>
                    </div>
                  )}
                </div>
                
                {/* Classroom Details */}
                <div className="p-5 flex-grow sm:w-2/3 md:w-2/3">
                  <p className="text-xs font-semibold text-secondary uppercase tracking-wide">{classroom.shortCode || 'N/A'}</p>
                  <Header type="h2" fontSize="2xl" weight="bold" className="text-gray-800 mt-1 mb-1">{classroom.name}</Header>
                  <p className="text-sm text-gray-500 italic mb-2">Join Code: {classroom.classCode || 'N/A'}</p>
                  
                  {classroom.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3 sm:line-clamp-2 whitespace-normal">{classroom.description}</p>
                  )}
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    <Link
                      to={`/teacher/classrooms/${classroom.id}`}
                      className="font-medium text-gray-600 hover:text-gray-900"
                    >
                      View
                    </Link>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleViewStudents(classroom)}
                      className="font-medium text-gray-600 hover:text-gray-900"
                    >
                      All Students
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => openAddStudentModal(classroom)}
                       className="font-medium text-gray-600 hover:text-gray-900"
                    >
                      Add Students
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={() => handleDeleteClassroom(classroom.id)}
                      className="font-medium text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
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
        title={selectedClassroom ? `Students in ${selectedClassroom.name}` : 'Students'}
      >
        {loadingStudents ? (
          <div className="text-center py-4">Loading students...</div>
        ) : error && isViewStudentsModalOpen ? (
          <div className="text-red-500 py-4">{error}</div>
        ) : classroomStudents.length === 0 ? (
          <div className="text-center py-4 text-gray-500">No students in this classroom yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {classroomStudents.map(student => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => handleRemoveStudent(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Remove
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
        title={selectedClassroom ? `Add Student to ${selectedClassroom.name}` : 'Add Student'}
      >
        {error && isAddStudentModalOpen && (
          <div className="text-red-500 mb-3">{error}</div>
        )}
        <div className="flex flex-col gap-4">
          <div>
            <Label htmlFor="studentSearch" className="block text-sm font-medium text-gray-700 mb-1">
              Search Students
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CiSearch className="text-gray-400" />
              </div>
              <Input
                type="text"
                id="studentSearch"
                placeholder="Search by name or username"
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={studentSearchTerm}
                onChange={(e) => setStudentSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          {searchingStudents ? (
            <div className="text-center py-2 text-sm text-gray-500">Searching...</div>
          ) : studentSearchTerm && studentSearchResults.length === 0 ? (
            <div className="text-center py-2 text-sm text-gray-500">No students found matching '{studentSearchTerm}'</div>
          ) : !studentSearchTerm ? (
            <div className="text-center py-2 text-sm text-gray-500">Type to search for students</div>
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
                    <p className="font-medium text-gray-800">{student.firstName} {student.lastName}</p>
                    <p className="text-sm text-gray-500">@{student.username}</p>
                  </div>
                  {student.inClassroom ? (
                    <span className="text-sm text-green-600 font-medium">Already in classroom</span>
                  ) : student.isAdding ? (
                    <span className="text-sm text-blue-600 font-medium animate-pulse">Adding...</span>
                  ) : (
                    <div className="flex items-center">
                     
                      <Button
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleAddStudent(student.id);
                        }}
                        variant="default"
                        size="sm"
                        className="text-sm"
                      >
                        Add
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