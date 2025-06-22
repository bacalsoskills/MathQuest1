import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ClassroomService from '../../services/classroomService';
import { Button } from '../../ui/button';
import { Header } from '../../ui/heading';
import { Input } from '../../ui/input';

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
    <div className="md:min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 mt-20 md:-mt-32">
      <div className="w-full max-w-md mx-auto">
        {joinedClassroom ? (
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl text-dark text-center">
            <Header type="h2" fontSize="3xl" weight="semibold" className="mb-3 sm:mb-4">Successfully Joined!</Header>
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
          <div className="text-center">
           <Header type="h1" fontSize="5xl" weight="bold" className="mb-4 text-primary dark:text-white">Join Classroom</Header>
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div> 
                <Input
                  id="classCode"
                  name="classCode"
                  type="text"
                  required
                  placeholder="Enter class code"
                 variant="form"

                 className="!bg-gray-300"
                  value={classCode}
                  onChange={(e) => setClassCode(e.target.value)}
                  disabled={loading}
                />
              </div>
              
              {error && !loading && (
                <p className="dark:text-gray-200 text-gray-700 text-sm text-center -mt-2 mb-2">{error}</p>
              )}

              <div>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  size="lg"
                  className="w-full"
                >
                  {loading ? 'Joining...' : 'Join'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinClassroom; 