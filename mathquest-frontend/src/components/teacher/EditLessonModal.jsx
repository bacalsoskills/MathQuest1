import React, { useState, useEffect } from "react";
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

const EditLessonModal = ({ isOpen, onClose, lesson, classroomId, onLessonUpdated }) => {
  const [lessonData, setLessonData] = useState({
    title: "",
    description: "",
    classroomId: classroomId,
    image: null
  });
  
  const [contentBlock, setContentBlock] = useState({
    id: null,
    title: "",
    content: "",
    structuredContent: "",
    orderIndex: 0
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Initialize form data when lesson changes
  useEffect(() => {
    if (lesson) {
      setLessonData({
        title: lesson.title || "",
        description: lesson.description || "",
        classroomId: classroomId,
        image: null // We can't display the current image, but we can allow uploading a new one
      });
      
      // Initialize content block data if available
      if (lesson.contentBlocks && lesson.contentBlocks.length > 0) {
        const mainBlock = lesson.contentBlocks[0]; // Get the first content block
        setContentBlock({
          id: mainBlock.id,
          title: mainBlock.title || "",
          content: mainBlock.content || "",
          structuredContent: mainBlock.structuredContent || "",
          orderIndex: mainBlock.orderIndex || 0
        });
      } else {
        // Reset content block if lesson has no content blocks
        setContentBlock({
          id: null,
          title: "",
          content: "",
          structuredContent: "",
          orderIndex: 0
        });
      }
    }
  }, [lesson, classroomId]);

  const handleLessonChange = (e) => {
    const { name, value } = e.target;
    setLessonData(prev => ({ ...prev, [name]: value }));
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
    setSuccess(null);

    try {
     // Create form data for multipart/form-data
    const formData = new FormData();
    
    // Always include the title, using empty string if undefined
    formData.append('title', lessonData.title || "");
    
    if (lessonData.description) {
      formData.append('description', lessonData.description);
    }
    
    // Only append classroomId if it has a valid value
    if (classroomId && classroomId !== 'undefined' && classroomId !== 'null') {
      formData.append('classroomId', classroomId);
    }
    
    if (lessonData.image) {
      formData.append('image', lessonData.image);
    }
    
    console.log("Form data being sent:", {
      title: lessonData.title,
      description: lessonData.description,
      classroomId: classroomId,
      hasImage: !!lessonData.image
    });
    
    // Update lesson
    const updatedLesson = await lessonService.updateLesson(lesson.id, formData);
    
      
      // Update or create content block if content is provided
      if (contentBlock.structuredContent.trim() !== "") {
        if (contentBlock.id) {
          // Update existing content block
          await contentBlockService.updateContentBlock(contentBlock.id, {
            structuredContent: contentBlock.structuredContent,
            lessonId: lesson.id
          });
        } else {
          // Create new content block
          await contentBlockService.createContentBlock({
            structuredContent: contentBlock.structuredContent,
            lessonId: lesson.id,
            orderIndex: 0
          });
        }
      }
      
      setSuccess("Lesson updated successfully!");
      
      if (onLessonUpdated) {
        // Re-fetch the updated lesson with content blocks
        const refreshedLesson = await lessonService.getLessonById(lesson.id);
        onLessonUpdated(refreshedLesson);
      }
      
      // Close modal after success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating lesson:", err);
      setError(err.message || "Failed to update lesson. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex justify-between items-center border-b px-6 py-4">
          <h3 className="text-xl font-semibold text-gray-900">
            Edit Lesson
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

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
              {success}
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
            
            <div className="mb-4">
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
            </div>
            
            <div className="mb-4">
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
                  Upload New Image
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
              
              {!imagePreview && lesson?.imageUrl && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="body2" color="textSecondary">Current image:</Typography>
                  <img 
                    src={lesson.imageUrl} 
                    alt="Current lesson" 
                    style={{ maxWidth: '100%', maxHeight: '150px' }} 
                  />
                </Box>
              )}
            </div>
          </div>
          
          <div className="mb-4">
            <Typography variant="h6" gutterBottom>
              Lesson Content
            </Typography>
            
            <div className="mb-4">
              <Typography variant="body2" gutterBottom>
                Rich Content Editor
              </Typography>
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

          <div className="flex justify-end space-x-3 mt-6">
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
              {isSubmitting ? "Updating..." : "Update Lesson"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditLessonModal; 