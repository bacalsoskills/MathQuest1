import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassroomService from '../../services/classroomService';
import { Button } from '../../ui/button';

const JoinClassroom = () => {
  const navigate = useNavigate();
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joinedClassroom, setJoinedClassroom] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!classCode.trim()) {
      setError('Please enter a class code');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const result = await ClassroomService.joinClassroom(classCode.trim());
      setJoinedClassroom(result);
      setClassCode('');
    } catch (err) {
      console.error('Join classroom error in component:', err);
      setError(err.message || 'Failed to join classroom. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToClassrooms = () => {
    navigate('/student/classrooms');
  };

  return (
    // <div className="fixed inset-0 bg-purple-700 bg-opacity-70 flex items-center justify-center z-50 p-4">
    //   <div className="w-full max-w-sm">
    <div className="bg-purple-700 bg-opacity-70 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 py-8 lg:py-16">
      <div className="max-w-5xl mx-auto">
        {joinedClassroom ? (
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-dark text-center">
            <h2 className="text-2xl sm:text-3xl font-semibold mb-3 sm:mb-4">Successfully Joined!</h2>
            <div className="mb-4 sm:mb-6">
              <p className="text-base sm:text-lg">
                You've joined: <span className="font-bold">{joinedClassroom.name}</span>
              </p>
              {joinedClassroom.description && (
                <p className="text-sm text-gray-800 mt-1">{joinedClassroom.description}</p>
              )}
              <p className="text-sm text-gray-800 mt-1">
                Teacher: {joinedClassroom.teacher?.firstName} {joinedClassroom.teacher?.lastName}
              </p>
            </div>
            <Button
              onClick={handleGoToClassrooms}
              variant="secondary"
              size="lg"
              className="w-full"
            >
              Go to My Classrooms
            </Button>
          </div>
        ) : (
          <>
            <h1 className="text-4xl sm:text-5xl font-bold text-white text-center mb-8 sm:mb-10">Join Classroom</h1>
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div>
                <input
                  id="classCode"
                  name="classCode"
                  type="text"
                  required
                  placeholder="Enter class code"
                  className="bg-white bg-opacity-20 border-2 border-white rounded-md p-3 sm:p-4 text-white placeholder-gray-300 w-full text-base sm:text-lg focus:ring-white focus:border-white focus:bg-opacity-30 transition-all disabled:opacity-70"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {error && !loading && (
                <p className="text-gray-200 text-sm text-center -mt-2 mb-2">{error}</p>
              )}

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  size="lg"
                  className="w-full "
                >
                  {loading ? 'Joining...' : 'Join'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default JoinClassroom; 