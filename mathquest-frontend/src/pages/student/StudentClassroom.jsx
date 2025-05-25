import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ClassroomService from '../../services/classroomService';
import { CiSearch } from "react-icons/ci";
import { Button } from "../../ui/button"
import { Header } from "../../ui/heading"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { AiOutlinePlusCircle } from "react-icons/ai";

const StudentClassrooms = () => {
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Function to get a random pastel color
  const getRandomColor = (code) => {
    const defaultCode = 'DEFAULT_CODE'; // A default string if code is null/undefined/empty
    const effectiveCode = code && code.length > 0 ? code : defaultCode;

    const colors = [
      'bg-purple-600', 'bg-orange-500', 'bg-green-500', 'bg-blue-600',
      'bg-red-500', 'bg-yellow-500', 'bg-indigo-600', 'bg-pink-600',
      'bg-teal-500', 'bg-cyan-500'
    ];
    // Simple hashing to pick a color based on the first character of the code
    const index = effectiveCode.charCodeAt(0) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        console.log("Fetching classrooms as student");
        const classroomData = await ClassroomService.getStudentClassrooms();
        
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
  }, []);

  const handleLeaveClassroom = async (classroomId) => {
    if (!window.confirm('Are you sure you want to leave this classroom?')) {
      return;
    }
    
    try {
      await ClassroomService.leaveClassroom(classroomId);
      setClassrooms(classrooms.filter(c => c.id !== classroomId));
    } catch (err) {
      console.error('Leave classroom error:', err);
      setError(err.message || 'Failed to leave classroom');
    }
  };

  // Filter classrooms based on search term
  const filteredClassrooms = classrooms.filter(classroom => 
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (classroom.subject && classroom.subject.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
      <Header type="h1" fontSize="3xl" weight="bold" className="mb-6">My Classrooms</Header>
        
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-300">
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
        
          <Link
              to="/student/join-classroom"
             className="text-secondary font-semibold flex items-center gap-2 h-10"
           >
             <AiOutlinePlusCircle className="w-5 h-5" />
                  Join Classroom
             
              </Link>
        </div>

        {error && (
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

        {classrooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600 mb-4">You haven't joined any classrooms yet.</p>
            <Link to="/student/join-classroom">
              <Button variant="default" size="sm" className="flex items-center gap-2">
                <AiOutlinePlusCircle className="w-5 h-5" />
                Join Classroom
              </Button>
            </Link>
          </div>
        ) : filteredClassrooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-gray-600">No classrooms found for '{searchTerm}'</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredClassrooms.map(classroom => (
              <div key={classroom.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
            
                <div className={`${getRandomColor(classroom.shortCode)} px-4 py-3 text-white text-base sm:text-lg font-semibold text-left`}>
                  {classroom.shortCode || classroom.subject?.substring(0, 3)?.toUpperCase() || 'CLASS'}
                </div>
                
        
                <div className="w-full h-48 bg-gray-100">
                  {classroom.image ? (
                    <img 
                      src={`data:image/jpeg;base64,${classroom.image}`} 
                      alt={classroom.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-[200px] bg-dark flex items-center justify-center">
                      <span className="text-white font-medium text-lg lg:text-3xl">{classroom.shortCode || 'N/A'}</span>
                    </div>
                  )}
                </div>
                
                {/* Content: Name and Teacher */}
                <div className="p-5 text-left flex-grow flex flex-col justify-start">
                  <Header type="h2" fontSize="xl" weight="bold" className="text-gray-800 mb-2 truncate " title={classroom.name}>{classroom.name}</Header>
                  <p className="text-sm sm:text-base text-primary font-normal">
                    Teacher: {
                      classroom.teacher?.firstName && classroom.teacher?.lastName 
                      ? `${classroom.teacher.firstName} ${classroom.teacher.lastName}` 
                      : classroom.teacher?.name || 'N/A' 
                    }
                  </p>
                  <div className="flex items-center space-x-2 mt-5">
                    
                    <Link
                      to={`/student/classrooms/${classroom.id}`}
                      className="font-medium text-gray-600 hover:text-gray-900"
                    >
                      <button className="text-primary text-left text-xs font-normal">View</button>
                    </Link>
                    <span className="text-xs text-gray-400">|</span>
                    <button onClick={() => handleLeaveClassroom(classroom.id)} className="text-left text-xs text-error font-normal">Leave</button>
                  </div>


                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentClassrooms; 