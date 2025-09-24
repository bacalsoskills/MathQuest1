import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ClassroomService from '../../services/classroomService';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Header } from '../../ui/heading';
import { Textarea } from '../../ui/textarea';
import { FaShip, FaCompass, FaScroll, FaCoins } from 'react-icons/fa';


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
    <div className="relative px-4 sm:px-6 lg:px-8 pt-16 md:pt-0 lg:py-8 transition-colors duration-300">
      {/* Pirate background layers */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-70 dark:opacity-0"
          style={{
            backgroundImage: "url('/images/game-images/map.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '600px 600px'
          }}
        />
        <div
          className="absolute inset-0 opacity-0 dark:opacity-70"
          style={{
            backgroundImage: "linear-gradient(180deg, rgba(1,10,20,0.9), rgba(1,10,20,0.95)), url('/images/game-images/underwater.png')",
            backgroundRepeat: 'repeat',
            backgroundSize: '700px 700px'
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.25))]" />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Nautical banner */}
        <div className="flex items-center gap-3 mb-4 text-amber-900 dark:text-yellow-200">
          <FaShip className="text-blue-700 dark:text-yellow-400" />
          <span className="text-sm font-semibold tracking-wide">Set Sail on a New Classroom Adventure</span>
        </div>
        <Header type="h1" fontSize="5xl" weight="bold" className="mb-6 text-amber-900 dark:text-yellow-50">Create a New Classroom</Header>
      
        <div className="rounded-2xl overflow-hidden border border-amber-200 dark:border-yellow-500/30 shadow-lg bg-amber-50/80 dark:bg-slate-900/60">
          {/* Rope divider */}
          <div className="h-[2px] w-full bg-[repeating-linear-gradient(90deg,rgba(180,83,9,0.35)_0px,rgba(180,83,9,0.35)_10px,transparent_10px,transparent_20px)] dark:bg-[repeating-linear-gradient(90deg,rgba(234,179,8,0.5)_0px,rgba(234,179,8,0.5)_10px,transparent_10px,transparent_20px)]" />
          <div className="p-6 sm:p-8">
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
              {/* Classroom Code */}
              <div>
                <Label htmlFor="shortCode" className="block text-sm font-medium text-amber-900 dark:text-yellow-200 mb-1">
                  Classroom Code <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-amber-700 dark:text-yellow-300">
                    <FaCompass />
                  </span>
                  <Input
                    id="shortCode"
                    name="shortCode"
                    type="text"
                    required
                    placeholder="e.g. MATH-101"
                    variant="gray"
                    className="mt-1 block w-full rounded-none pl-10"
                    value={formData.shortCode}
                    onChange={handleChange}
                    title="A short code to identify your classroom (e.g., MATH-101)"
                  />
                </div>
              </div>

              {/* Classroom Name */}
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-amber-900 dark:text-yellow-200 mb-1">
                  Classroom Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-amber-700 dark:text-yellow-300">
                    <FaScroll />
                  </span>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    required
                    variant="gray"
                    placeholder="e.g. Mathematics for Beginners"
                    className="mt-1 block w-full rounded-none pl-10"
                    value={formData.name}
                    onChange={handleChange}
                    title="The display name of your classroom"
                  />
                </div>
              </div>
              
              {/* Description */}
              <div>
                <Label htmlFor="description" className="block text-sm font-medium text-amber-900 dark:text-yellow-200 mb-1">
                  Description <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <span className="absolute top-3 left-3 text-amber-700 dark:text-yellow-300">
                    <FaShip />
                  </span>
                  <Textarea
                    id="description"
                    name="description"
                    rows="3"
                    placeholder="Brief description of the classroom (mission, topics, schedule)"
                    variant="gray"
                    className="mt-1 block w-full rounded-none pl-10"
                    value={formData.description}
                    required
                    onChange={handleChange}
                    title="A short summary to guide your crew"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div>
                <Label htmlFor="image" className="block text-sm font-medium text-amber-900 dark:text-yellow-200 mb-1">
                  Classroom Image (Optional)
                </Label>
                <Input
                  id="image"
                  name="image"
                  type="file"
                  accept="image/*"
                  variant="gray"
                  className="mt-1 block w-full text-sm text-gray-700 dark:text-yellow-100
                    file:mr-4 file:py-5 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-amber-100 file:text-amber-800 dark:file:bg-yellow-200 dark:file:text-amber-900
                    hover:file:bg-amber-200 dark:hover:file:bg-yellow-300 !border-none rounded-none"
                  onChange={handleImageChange}
                  title="Optional banner for your classroom"
                />
                <p className="mt-1 text-sm text-amber-800 dark:text-yellow-200">Maximum file size: 5MB</p>
              </div>
              
              {/* Submit */}
              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  variant="default"
                  size="sm"
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-amber-900 hover:from-yellow-500 hover:via-amber-500 hover:to-yellow-600 transition-colors shadow-md border-amber-300 dark:border-yellow-400"
                  rounded="full"
                  title="Create classroom"
                >
                  <span className="inline-flex items-center gap-2">
                    <FaCoins />
                    {loading ? 'Creating...' : 'Create Classroom'}
                  </span>
                </Button>
              </div>
            </form>
          )}
          
          {!createdClassroom && (
            <div className="mt-6 max-w-[200px] md:max-w-none ">
              <p className="text-sm text-amber-800 dark:text-yellow-100">
                Already have classrooms? <a href="/classrooms" className="text-blue-700 dark:text-yellow-300 underline-offset-2 underline hover:text-blue-900 dark:hover:text-yellow-200">View your classrooms</a>
              </p>
            </div>
          )}
          {/* Close inner content (p-6) */}
          </div>
          {/* Rope divider */
          }
          <div className="h-[2px] w-full bg-[repeating-linear-gradient(90deg,rgba(180,83,9,0.35)_0px,rgba(180,83,9,0.35)_10px,transparent_10px,transparent_20px)] dark:bg-[repeating-linear-gradient(90deg,rgba(234,179,8,0.5)_0px,rgba(234,179,8,0.5)_10px,transparent_10px,transparent_20px)]" />
        </div>
        {/* End parchment container */}
      </div>
    </div>
  );
};

export default CreateClassroom; 