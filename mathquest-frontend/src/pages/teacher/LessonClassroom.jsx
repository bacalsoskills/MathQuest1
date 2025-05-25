import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import lessonService from '../../services/lessonService';
import contentBlockService from '../../services/contentBlockService';
import activityService from '../../services/activityService';
import { 
  Box, Button, TextField, Typography, Grid, FormControl, 
  InputLabel, Select, MenuItem, Paper, IconButton, Divider,
  List, ListItem, ListItemText, Chip, Stack, Fab
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ImageIcon from '@mui/icons-material/Image';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import CodeIcon from '@mui/icons-material/Code';
import LinkIcon from '@mui/icons-material/Link';
import FunctionsIcon from '@mui/icons-material/Functions'; // For Math Formula
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import TableChartIcon from '@mui/icons-material/TableChart';
import RemoveIcon from '@mui/icons-material/Remove'; // For Divider
import OndemandVideoIcon from '@mui/icons-material/OndemandVideo';

import moment from 'moment';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Backend ContentBlockType Enum (ensure this matches your backend)
const ContentBlockType = {
  TEXT: 'TEXT',
  HEADING1: 'HEADING1',
  HEADING2: 'HEADING2',
  HEADING3: 'HEADING3',
  IMAGE: 'IMAGE',
  VIDEO: 'VIDEO',
  LINK: 'LINK',
  CODE: 'CODE',
  MATH_FORMULA: 'MATH_FORMULA',
  BULLET_LIST: 'BULLET_LIST',
  NUMBERED_LIST: 'NUMBERED_LIST',
  TABLE: 'TABLE',
  DIVIDER: 'DIVIDER',
  // RICH_TEXT is no longer the primary way, but the enum might still exist in backend
};

const ActivityType = {
  QUIZ: 'QUIZ',
  GAME: 'GAME',
  ASSIGNMENT: 'ASSIGNMENT',
  CHALLENGE: 'CHALLENGE',
  INTERACTIVE: 'INTERACTIVE',
  DISCUSSION: 'DISCUSSION',
  MATH_PRACTICE: 'MATH_PRACTICE'
};

// Helper to generate unique temp IDs
const generateTempId = () => `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Quill editor modules and formats
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    ['link', 'image', 'video'],
    ['blockquote', 'code-block'],
    [{ 'color': [] }, { 'background': [] }],
    ['clean']
  ]
};

const quillFormats = [
  'header',
  'bold', 'italic', 'underline', 'strike',
  'list', 'bullet',
  'link', 'image', 'video',
  'blockquote', 'code-block',
  'color', 'background'
];

const LessonForm = () => {
  const { classroomId, lessonId } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!lessonId;
  
  const [lesson, setLesson] = useState({
    title: '',
    description: '',
    classroomId: classroomId || '',
    image: null,
    orderIndex: 0,
    createdDate: null,
    updatedDate: null
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  
  // Single content block with structured content
  const [contentBlock, setContentBlock] = useState({
    id: null,
    title: '',
    subtitle: '',
    content: '',
    structuredContent: '',
    images: null,
    attachments: null,
    orderIndex: 0,
    lessonId: lessonId || ''
  });
  
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({
    title: '',
    description: '',
    type: ActivityType.QUIZ,
    content: '',
    image: null,
    orderIndex: 0,
    maxScore: 10,
    timeLimit: 300,
    lessonId: lessonId || ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode) {
      const fetchLessonData = async () => {
        setIsLoading(true);
        try {
          const lessonData = await lessonService.getLessonById(lessonId);
          setLesson({
            ...lessonData,
            classroomId: lessonData.classroomId || classroomId,
            orderIndex: lessonData.orderIndex === null || lessonData.orderIndex === undefined ? 0 : lessonData.orderIndex
          });
          if (lessonData.imageUrl) setImagePreview(lessonData.imageUrl);

          // Fetch content blocks - we expect one block with structuredContent
          const blocksData = await contentBlockService.getContentBlocksByLessonId(lessonId);
          if (blocksData && blocksData.length > 0) {
            // Use the first block or merge them if there are multiple (legacy)
            const mainBlock = blocksData[0];
            setContentBlock({
              id: mainBlock.id,
              title: mainBlock.title || '',
              subtitle: mainBlock.subtitle || '',
              content: mainBlock.content || '',
              structuredContent: mainBlock.structuredContent || '',
              orderIndex: mainBlock.orderIndex || 0,
              lessonId: lessonId
            });
          }
          
          const activitiesData = await activityService.getActivitiesByLessonId(lessonId);
          setActivities(activitiesData.sort((a, b) => a.orderIndex - b.orderIndex));
          
          setNewActivity(prev => ({ ...prev, lessonId, orderIndex: activitiesData.length }));

        } catch (err) {
          setError('Failed to load lesson data: ' + err.message);
          console.error("Error loading lesson:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchLessonData();
    } else {
      setLesson(prev => ({ ...prev, classroomId: classroomId || '', orderIndex: 0 }));
      setContentBlock(prev => ({ ...prev, lessonId: '', orderIndex: 0 }));
      setActivities([]);
      setNewActivity(prev => ({...prev, orderIndex: 0, lessonId: ''}));
    }
  }, [isEditMode, lessonId, classroomId]);
  
  const handleLessonChange = (e) => {
    const { name, value } = e.target;
    setLesson(prev => ({ ...prev, [name]: name === 'orderIndex' ? (parseInt(value, 10) || 0) : value }));
  };
  
  const handleLessonImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLesson(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (event) => setImagePreview(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle content block changes
  const handleContentBlockChange = (e) => {
    const { name, value } = e.target;
    setContentBlock(prev => ({ ...prev, [name]: value }));
  };
  
  const handleContentBlockStructuredChange = (value) => {
    setContentBlock(prev => ({ ...prev, structuredContent: value }));
  };

  const handleContentBlockImagesChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setContentBlock(prev => ({ ...prev, images: file }));
    }
  };
  
  const handleContentBlockAttachmentsChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setContentBlock(prev => ({ ...prev, attachments: file }));
    }
  };
  
  // --- Activity Handlers ---
  const handleActivityChange = (e) => {
    const { name, value } = e.target;
    setNewActivity(prev => ({ ...prev, [name]: name === 'orderIndex' || name === 'maxScore' || name === 'timeLimit' ? (parseInt(value, 10) || 0) : value }));
  };
  
  const handleActivityImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setNewActivity(prev => ({ ...prev, image: file }));
    }
  };
  
  const addActivityToList = async () => {
    if (!newActivity.title || !newActivity.content) {
      setError('Activity must have a title and content');
      return;
    }
    const activityToAdd = {
      ...newActivity,
      id: generateTempId(), // Temp ID for list management
      orderIndex: activities.length, // Append to end
    };
    setActivities(prev => [...prev, activityToAdd]);
    setNewActivity({
      title: '', description: '', type: ActivityType.QUIZ, content: '',
      image: null, orderIndex: activities.length + 1, 
      maxScore: 10, timeLimit: 300, lessonId: lessonId || ''
    });
  };
  
  const removeActivityFromList = (id) => {
    setActivities(prev => prev.filter(act => act.id !== id).map((a, index) => ({...a, orderIndex: index })));
  };
  
  // --- Submit Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      let savedLesson;
      const lessonPayload = { ...lesson, orderIndex: parseInt(lesson.orderIndex, 10) || 0 }; 

      if (isEditMode) {
        savedLesson = await lessonService.updateLesson(lessonId, lessonPayload);
        
        // Update or create content block with structured content
        const contentBlockData = { 
          ...contentBlock, 
          lessonId: savedLesson.id 
        };
        
        if (contentBlock.id && !contentBlock.id.toString().startsWith('temp-')) {
          await contentBlockService.updateContentBlock(contentBlock.id, contentBlockData);
        } else {
          await contentBlockService.createContentBlock(contentBlockData);
        }

      } else { // Create mode
        savedLesson = await lessonService.createLesson(lessonPayload);
        
        // Create content block with structured content
        const contentBlockData = {
          ...contentBlock,
          lessonId: savedLesson.id
        };
        await contentBlockService.createContentBlock(contentBlockData);
        
        // Create all activities
        for (let i = 0; i < activities.length; i++) {
          const activity = { ...activities[i], orderIndex: i, lessonId: savedLesson.id };
          await activityService.createActivity(activity);
        }
      }
      
      // Handle activities for edit mode (similar CUD logic as content blocks)
      if (isEditMode) {
        const existingDbActivities = await activityService.getActivitiesByLessonId(lessonId);
        const frontendActivityIds = activities.map(a => a.id.toString());

        for (const dbActivity of existingDbActivities) {
          if (!frontendActivityIds.includes(dbActivity.id.toString())) {
            await activityService.deleteActivity(dbActivity.id);
          }
        }
        for (let i = 0; i < activities.length; i++) {
          const activity = { ...activities[i], orderIndex: i, lessonId: savedLesson.id };
          if (activity.id && !activity.id.toString().startsWith('temp-')) {
            await activityService.updateActivity(activity.id, activity);
          } else {
            await activityService.createActivity(activity);
          }
        }
      }

      navigate(`/teachers/classrooms/${savedLesson.classroomId || classroomId}`);
    } catch (err) {
      setError('Failed to save lesson: ' + (err.response?.data?.message || err.message));
      console.error("Error submitting lesson:", err.response || err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h4" gutterBottom>
        {isEditMode ? 'Edit Lesson' : 'Create New Lesson'}
      </Typography>
      
      {error && <Typography color="error" sx={{ mb: 2 }}>{error}</Typography>}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Lesson Details</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={8}><TextField fullWidth required label="Lesson Title" name="title" value={lesson.title} onChange={handleLessonChange}/></Grid>
          <Grid item xs={12} md={4}><TextField fullWidth type="number" label="Order Index" name="orderIndex" value={lesson.orderIndex || '0'} onChange={handleLessonChange} helperText="Position in list"/></Grid>
          <Grid item xs={12}><TextField fullWidth label="Description" name="description" value={lesson.description} onChange={handleLessonChange} multiline rows={3}/></Grid>
          <Grid item xs={12} >
            <Button variant="outlined" component="label">
              Upload Lesson Cover Image
              <input type="file" hidden accept="image/*" onChange={handleLessonImageChange} />
            </Button>
            {imagePreview && <Box sx={{ mt: 2 }}><img src={imagePreview} alt="Lesson preview" style={{ maxWidth: '100%', maxHeight: '200px' }} /></Box>}
          </Grid>
          {isEditMode && lesson.createdDate && (
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip label={`Created: ${moment(lesson.createdDate).format('MMM D, YYYY h:mm A')}`} color="primary" variant="outlined" size="small"/>
                {lesson.updatedDate && <Chip label={`Updated: ${moment(lesson.updatedDate).format('MMM D, YYYY h:mm A')}`} color="secondary" variant="outlined" size="small"/>}
              </Box>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Lesson Content</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Title (Optional)" 
              name="title"
              value={contentBlock.title || ''}
              onChange={handleContentBlockChange}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField 
              fullWidth 
              label="Subtitle (Optional)" 
              name="subtitle"
              value={contentBlock.subtitle || ''}
              onChange={handleContentBlockChange}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>Rich Content Editor</Typography>
            <Box sx={{ border: '1px solid #ddd', borderRadius: 1, mb: 2 }}>
              <ReactQuill 
                theme="snow"
                value={contentBlock.structuredContent || ''} 
                onChange={handleContentBlockStructuredChange}
                modules={quillModules}
                formats={quillFormats}
                style={{ height: '300px', marginBottom: '40px' }}
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Button variant="outlined" component="label" fullWidth sx={{ mb: 1 }}>
              Upload Images
              <input type="file" hidden accept="image/*" onChange={handleContentBlockImagesChange} />
            </Button>
            {contentBlock.images && <Typography variant="caption">Selected: {contentBlock.images.name}</Typography>}
          </Grid>
          <Grid item xs={12} md={6}>
            <Button variant="outlined" component="label" fullWidth sx={{ mb: 1 }}>
              Upload Attachments
              <input type="file" hidden onChange={handleContentBlockAttachmentsChange} />
            </Button>
            {contentBlock.attachments && <Typography variant="caption">Selected: {contentBlock.attachments.name}</Typography>}
          </Grid>
        </Grid>
      </Paper>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>Practice Activities (End of Lesson)</Typography>
        <List>
          {activities.map((activity, index) => (
            <ListItem
              key={activity.id}
              secondaryAction={<IconButton edge="end" onClick={() => removeActivityFromList(activity.id)}><DeleteIcon /></IconButton>}
              divider
            >
              <ListItemText
                primary={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><span>{`${index + 1}. ${activity.title} (${activity.type})`}</span>{activity.createdDate && !activity.id.startsWith('temp-') && (<Chip label={`Added: ${moment(activity.createdDate).format('MMM D, YYYY')}`} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }}/>)}</Box>}
                secondary={activity.description}
              />
            </ListItem>
          ))}
        </List>
        <Box sx={{ mt: 3, p: 2, border: '1px dashed grey', borderRadius: 1 }}>
          <Typography variant="h6" gutterBottom>Add New Activity</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><TextField fullWidth required label="Activity Title" name="title" value={newActivity.title} onChange={handleActivityChange}/></Grid>
            <Grid item xs={12} sm={6}><FormControl fullWidth><InputLabel>Activity Type</InputLabel><Select name="type" value={newActivity.type} onChange={handleActivityChange} label="Activity Type">{Object.entries(ActivityType).map(([key, value]) => ( <MenuItem key={key} value={value}>{key}</MenuItem> ))}</Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth label="Description" name="description" value={newActivity.description} onChange={handleActivityChange} multiline rows={2}/></Grid>
            <Grid item xs={12}><TextField fullWidth required label="Content" name="content" value={newActivity.content} onChange={handleActivityChange} multiline rows={3} helperText="JSON for quizzes, instructions etc."/></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Max Score" name="maxScore" value={newActivity.maxScore || ''} onChange={handleActivityChange}/></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Time (sec)" name="timeLimit" value={newActivity.timeLimit || ''} onChange={handleActivityChange}/></Grid>
            <Grid item xs={6} sm={3}><TextField fullWidth type="number" label="Order Index" name="orderIndex" value={newActivity.orderIndex || '0'} onChange={handleActivityChange}/></Grid>
            <Grid item xs={6} sm={3}><input accept="image/*" style={{ display: 'none' }} id="activity-image-upload" type="file" onChange={handleActivityImageChange}/><label htmlFor="activity-image-upload"><Button variant="outlined" component="span" size="small">Image</Button></label></Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}><Button variant="contained" startIcon={<AddIcon />} onClick={addActivityToList}>Add Activity to List</Button></Grid>
          </Grid>
        </Box>
      </Paper>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4, mb: 2 }}>
        <Button variant="outlined" onClick={() => navigate(`/classrooms/${lesson.classroomId || classroomId}`)}>Cancel</Button>
        <Button type="submit" variant="contained" color="primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : isEditMode ? 'Update Lesson' : 'Create Lesson'}
        </Button>
      </Box>
    </Box>
  );
};

export default LessonForm; 