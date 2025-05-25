import React, { useState, useEffect } from 'react';
import classroomService from '../../services/classroomService';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Header } from '../../ui/heading';
import { Textarea } from '../../ui/textarea';

const EditClassroomModal = ({ isOpen, onClose, classroom, onClassroomUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    shortCode: '',
    name: '',
    description: '',
    image: null
  });

  // Initialize form data when classroom changes
  useEffect(() => {
    if (classroom) {
      setFormData({
        shortCode: classroom.shortCode || '',
        name: classroom.name || '',
        description: classroom.description || '',
        image: null // We can't display the current image, but we can allow uploading a new one
      });
    }
  }, [classroom]);

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
    
    try {
      // Create FormData object to handle multipart/form-data
      const requestData = new FormData();
      requestData.append('name', formData.name);
      requestData.append('description', formData.description);
      requestData.append('shortCode', formData.shortCode);
      if (formData.image) {
        requestData.append('image', formData.image);
      }
      
      const result = await classroomService.updateClassroom(classroom.id, requestData);
      
      setSuccess(`Classroom "${result.name}" updated successfully!`);
      
      if (onClassroomUpdated) {
        onClassroomUpdated(result);
      }
      
      // Close the modal after a delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Update classroom error:', err);
      setError(err.message || 'Failed to update classroom');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <Header type="h3" fontSize="xl" weight="bold" className="text-gray-900">Edit Classroom</Header>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
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
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{success}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="shortCode" className="block text-sm font-medium text-gray-700 mb-1">
                Classroom Code*
              </Label>
              <Input
                id="shortCode"
                name="shortCode"
                type="text"
                required
                placeholder="e.g. Math 101"
                variant="gray"
                className="mt-1 block w-full"
                value={formData.shortCode}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Classroom Name*
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                required
                variant="gray"
                placeholder="e.g. Mathematics for Beginners"
                className="mt-1 block w-full"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                rows="3"
                placeholder="Brief description of the classroom"
                variant="gray"
                className="mt-1 block w-full"
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div>
              <Label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                New Classroom Image (Optional)
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
                  hover:file:bg-blue-100 !border-none"
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
                className="w-full"
              >
                {loading ? 'Updating...' : 'Update Classroom'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditClassroomModal; 