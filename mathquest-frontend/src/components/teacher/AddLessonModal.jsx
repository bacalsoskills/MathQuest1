import React, { useState } from "react";
import lessonService from "../../services/lessonService";
import contentBlockService from "../../services/contentBlockService";
import { 
  Box, 
  Typography,
  TextField,
  Button
} from "@mui/material";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Quill editor modules and formats
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['blockquote', 'code-block'],
    ['clean']
  ]
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'image',
  'blockquote', 'code-block'
];

const AddLessonModal = ({ isOpen, onClose, classroomId, onLessonAdded }) => {
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
    classroomId: classroomId,
    image: null
  });
  
  const [contentBlock, setContentBlock] = useState({
    title: "",
    subtitle: "",
    content: "",
    structuredContent: "",
    orderIndex: 0
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleLessonChange = (e) => {
    const { name, value } = e.target;
    setLessonData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContentBlockChange = (e) => {
    const { name, value } = e.target;
    setContentBlock(prev => ({ ...prev, [name]: value }));
  };
  
  const handleStructuredContentChange = (value) => {
    setContentBlock(prev => ({ ...prev, structuredContent: value }));
  };
  
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLessonData(prev => ({ ...prev, image: file }));
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create lesson first
      const lesson = await lessonService.createLesson(lessonData);
      
      // Add content block if provided
      if (contentBlock.structuredContent.trim() !== "") {
        await contentBlockService.createContentBlock({
          ...contentBlock,
          lessonId: lesson.id
        });
      }
      
      // Reset form
      setLessonData({
        title: "",
        description: "",
        classroomId: classroomId,
        image: null
      });
      
      setContentBlock({
        title: "",
        subtitle: "",
        content: "",
        structuredContent: "",
        orderIndex: 0
      });
      
      setImagePreview(null);
      
      if (onLessonAdded) {
        onLessonAdded(lesson);
      }
      
      onClose();
    } catch (err) {
      console.error("Error creating lesson:", err);
      setError(err.message || "Failed to create lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center border-b px-6 py-4 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900">
            Add New Lesson
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
          <div className="p-6 overflow-y-auto flex-grow">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <div className="mb-4">
              <Typography variant="h6" gutterBottom>
                Lesson Details
              </Typography>
              
              <div className="mb-4">
                <TextField
                  fullWidth
                  required
                  label="Lesson Title"
                  name="title"
                  value={lessonData.title}
                  onChange={handleLessonChange}
                  margin="normal"
                />
              </div>
              
              {/* <div className="mb-4">
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={lessonData.description}
                  onChange={handleLessonChange}
                  multiline
                  rows={3}
                  margin="normal"
                />
              </div> */}
              
              {/* <div className="mb-4">
                <Typography variant="body2" gutterBottom>
                  Lesson Image (optional)
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="lesson-image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="lesson-image-upload">
                  <Button variant="contained" component="span" size="small">
                    Upload Image
                  </Button>
                </label>
                
                {imagePreview && (
                  <Box sx={{ mt: 2 }}>
                    <img 
                      src={imagePreview} 
                      alt="Lesson preview" 
                      style={{ maxWidth: '100%', maxHeight: '150px' }} 
                    />
                  </Box>
                )}
              </div> */}
            </div>
            
            <div className="mb-4">
              <Typography variant="h6" gutterBottom>
                Lesson Content
              </Typography>
              
              <div className="mb-4">
             
                <div className="border border-gray-300 rounded">
                  <ReactQuill 
                    theme="snow"
                    value={contentBlock.structuredContent} 
                    onChange={handleStructuredContentChange}
                    modules={quillModules}
                    formats={quillFormats}
                    style={{ height: '250px', marginBottom: '40px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-4 bg-gray-50 flex-shrink-0">
            <div className="flex justify-end space-x-3">
              <Button
                variant="outlined"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Create Lesson"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddLessonModal; 