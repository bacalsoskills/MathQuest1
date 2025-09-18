import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ClassroomService from '../../services/classroomService';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Header } from '../../ui/heading';
import { Textarea } from '../../ui/textarea';
import { MdKeyboardBackspace } from "react-icons/md";


const CreateClassroom = () => {
  const navigate = useNavigate();
  const { isTeacher } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdClassroom, setCreatedClassroom] = useState(null);
  
  const [formData, setFormData] = useState({
    shortCode: '',
    name: '',
    description: '',
    image: null
  });

  // React.useEffect(() => {
  //   // Redirect if not a teacher
  //   if (!isTeacher()) {
  //     navigate('/');
  //   }
  // }, [isTeacher, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }
      setFormData(prev => ({
        ...prev,
        image: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');
    setSuccess('');
    setCreatedClassroom(null);
    
    try {
      // Create FormData object to handle multipart/form-data
      const requestData = new FormData();
      requestData.append('name', formData.name);
      requestData.append('description', formData.description);
      requestData.append('shortCode', formData.shortCode);
      if (formData.image) {
        requestData.append('image', formData.image);
      }
      
      const result = await ClassroomService.createClassroom(requestData);
      
      setCreatedClassroom(result);
      setSuccess(`Classroom "${result.name}" created successfully!`);
      
      // Reset the form
      setFormData({
        shortCode: '',
        name: '',
        description: '',
        image: null
      });
    } catch (err) {
      console.error('Create classroom error in component:', err);
      setError(err.message || 'Failed to create classroom');
    } finally {
      setLoading(false);
    }
  };

  const handleGoToClassrooms = () => {
    navigate('/teacher/classrooms');
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 lg:py-8">
      <div className="max-w-6xl mx-auto">
      <Header type="h1" fontSize="5xl" weight="bold" className="mb-6 text-primary dark:text-white">Create a New Classroom</Header>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-8">
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
          
          {createdClassroom ? (
            <div className="bg-green-50 border border-green-400 rounded-md p-6 mb-6">
              <Header type="h2" fontSize="lg" weight="medium" className="text-green-800 mb-2">Classroom Created Successfully!</Header>
              <div className="mb-4">
                <p className="text-green-700">Name: {createdClassroom.name}</p>
                <p className="text-green-700">Join Code: <span className="font-bold">{createdClassroom.classCode}</span></p>
                <p className="text-green-700">Short Code: <span className="font-bold">{createdClassroom.shortCode}</span></p>
                <p className="text-sm text-green-600 mt-2">Share the Class Code with your students so they can join your classroom.</p>
              </div>
              <button
                onClick={handleGoToClassrooms}
                className="w-full flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 rounded-full"
              >
                Go to My Classrooms
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                <Label htmlFor="shortCode" className="block text-sm font-medium text-gray-700 mb-1">
                  Classroom Code <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="shortCode"
                  name="shortCode"
                  type="text"
                  required
                  placeholder="e.g. Math 101"
                  variant="gray"
                  className="mt-1 block w-full rounded-none"
                  value={formData.shortCode}
                  onChange={handleChange}
                />
              </div>
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Classroom Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  variant="gray"
                  placeholder="e.g. Mathematics for Beginners"
                  className="mt-1 block w-full rounded-none"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  rows="3"
                  placeholder="Brief description of the classroom"
                  variant="gray"
                  className="mt-1 block w-full rounded-none"
                  value={formData.description}
                  required
                  onChange={handleChange}
                />
              </div>

              <div>
                <Label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                  Classroom Image (Optional)
                </Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  variant="gray"
                  className="mt-1 block w-full text-sm text-gray-500
                    file:mr-4 file:py-5 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100 !border-none rounded-none"
                  onChange={handleImageChange}
                />
                <p className="mt-1 text-sm text-gray-500">Maximum file size: 5MB</p>
              </div>
              
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  size="sm"
                  className="w-full "
                  rounded="full"
                >
                  {loading ? 'Creating...' : 'Create Classroom'}
                </Button>
              </div>
            </form>
          )}
          
          {!createdClassroom && (
            <div className="mt-6 max-w-[200px] md:max-w-none ">
              <p className="text-sm text-gray-600">
                Already have classrooms? <a href="/classrooms" className="text-blue-600 underline-offset-2 underline hover:text-blue-800">View your classrooms</a>
              </p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default CreateClassroom; 