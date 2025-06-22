import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';
import ClassroomService from '../services/classroomService';

const ClassroomContext = createContext();

export const useClassroom = () => useContext(ClassroomContext);

export const ClassroomProvider = ({ children }) => {
  const { currentUser, isTeacher, isStudent } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [userClassrooms, setUserClassrooms] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load user's classrooms from API when the component mounts or user changes
  useEffect(() => {
    if (currentUser?.email) {
      loadUserClassrooms();
    }
  }, [currentUser]);

  const loadUserClassrooms = async () => {
    if (!currentUser?.email) return;
    
    try {
      setLoading(true);
      let classroomData = [];
      
      // Always try to fetch fresh data from API first
      if (isTeacher()) {
        classroomData = await ClassroomService.getTeacherClassrooms();
      } else if (isStudent()) {
        classroomData = await ClassroomService.getStudentClassrooms();
      }
      
      // If API call succeeds, use the fresh data
      if (classroomData && classroomData.length > 0) {
        setUserClassrooms(classroomData);
        
        // Also update the main classrooms state with the fetched data
        setClassrooms(prev => {
          const existingIds = new Set(prev.map(c => c.id));
          const newClassrooms = classroomData.filter(c => !existingIds.has(c.id));
          return [...prev, ...newClassrooms];
        });
      } else {
        // If API fails or returns empty, try to use localStorage as fallback
        const storedClassrooms = localStorage.getItem(`userClassrooms_${currentUser.email}`);
        if (storedClassrooms) {
          try {
            const parsedClassrooms = JSON.parse(storedClassrooms);
            setUserClassrooms(parsedClassrooms);
          } catch (parseError) {
            console.error('Failed to parse stored classrooms:', parseError);
            setUserClassrooms([]);
          }
        } else {
          setUserClassrooms([]);
        }
      }
      
    } catch (error) {
      console.error('Failed to load user classrooms from API:', error);
      
      // Fallback to localStorage if API fails
      try {
        const storedClassrooms = localStorage.getItem(`userClassrooms_${currentUser.email}`);
        if (storedClassrooms) {
          const parsedClassrooms = JSON.parse(storedClassrooms);
          setUserClassrooms(parsedClassrooms);
        } else {
          setUserClassrooms([]);
        }
      } catch (localStorageError) {
        console.error('Failed to load classrooms from localStorage:', localStorageError);
        setUserClassrooms([]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save user's classrooms to localStorage whenever they change
  useEffect(() => {
    if (currentUser?.email && userClassrooms.length > 0) {
      try {
        // Only store essential classroom data to reduce storage size
        const essentialClassroomData = userClassrooms.map(classroom => ({
          id: classroom.id,
          name: classroom.name,
          shortCode: classroom.shortCode,
          teacherId: classroom.teacherId,
          code: classroom.code,
          createdAt: classroom.createdAt
        }));
        
        localStorage.setItem(`userClassrooms_${currentUser.email}`, JSON.stringify(essentialClassroomData));
      } catch (error) {
        console.error('Failed to save classrooms to localStorage:', error);
        
        // If quota exceeded, try to clear old data and retry
        if (error.name === 'QuotaExceededError') {
          try {
            // Clear all classroom-related localStorage items
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('userClassrooms_')) {
                keysToRemove.push(key);
              }
            }
            
            // Remove old classroom data
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            // Try to save again with minimal data
            const minimalClassroomData = userClassrooms.map(classroom => ({
              id: classroom.id,
              name: classroom.name
            }));
            
            localStorage.setItem(`userClassrooms_${currentUser.email}`, JSON.stringify(minimalClassroomData));
          } catch (retryError) {
            console.error('Failed to save classrooms even after clearing old data:', retryError);
            // If still failing, just log the error and continue without localStorage
          }
        }
      }
    } else if (currentUser?.email && userClassrooms.length === 0) {
      // If userClassrooms is empty, remove the localStorage entry to free up space
      try {
        localStorage.removeItem(`userClassrooms_${currentUser.email}`);
      } catch (error) {
        console.error('Failed to remove empty classroom data from localStorage:', error);
      }
    }
  }, [userClassrooms, currentUser]);

  const generateClassroomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
  };

  const createClassroom = (name, teacherId, details = {}) => {
    const newClassroom = {
      id: Date.now().toString(),
      name,
      teacherId,
      code: generateClassroomCode(),
      students: [],
      createdAt: new Date().toISOString(),
      ...details,
      content: {
        lessons: [],
        quizzes: [],
        activities: [],
        exams: []
      }
    };

    setClassrooms(prev => [...prev, newClassroom]);
    return newClassroom;
  };

  const updateClassroom = (classroomId, updates) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (!classroom) {
      return { success: false, error: 'Classroom not found' };
    }

    const updatedClassroom = {
      ...classroom,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    setClassrooms(prev => prev.map(c => 
      c.id === classroomId ? updatedClassroom : c
    ));

    // Update in userClassrooms if the user is a member
    setUserClassrooms(prev => prev.map(c => 
      c.id === classroomId ? updatedClassroom : c
    ));

    return { success: true, classroom: updatedClassroom };
  };

  const deleteClassroom = (classroomId) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (!classroom) {
      return { success: false, error: 'Classroom not found' };
    }

    setClassrooms(prev => prev.filter(c => c.id !== classroomId));
    setUserClassrooms(prev => prev.filter(c => c.id !== classroomId));
    return { success: true };
  };

  const addContent = (classroomId, contentType, content) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (!classroom) {
      return { success: false, error: 'Classroom not found' };
    }

    const updatedClassroom = {
      ...classroom,
      content: {
        ...classroom.content,
        [contentType]: [...(classroom.content[contentType] || []), { ...content, id: Date.now().toString() }]
      }
    };

    setClassrooms(prev => prev.map(c => 
      c.id === classroomId ? updatedClassroom : c
    ));

    // Update in userClassrooms if the user is a member
    setUserClassrooms(prev => prev.map(c => 
      c.id === classroomId ? updatedClassroom : c
    ));

    return { success: true, classroom: updatedClassroom };
  };

  const removeContent = (classroomId, contentType, contentId) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (!classroom) {
      return { success: false, error: 'Classroom not found' };
    }

    const updatedClassroom = {
      ...classroom,
      content: {
        ...classroom.content,
        [contentType]: classroom.content[contentType].filter(item => item.id !== contentId)
      }
    };

    setClassrooms(prev => prev.map(c => 
      c.id === classroomId ? updatedClassroom : c
    ));

    // Update in userClassrooms if the user is a member
    setUserClassrooms(prev => prev.map(c => 
      c.id === classroomId ? updatedClassroom : c
    ));

    return { success: true, classroom: updatedClassroom };
  };

  const joinClassroom = (code, userId) => {
    const classroom = classrooms.find(c => c.code === code);
    if (!classroom) {
      return { success: false, error: 'Invalid classroom code' };
    }

    if (classroom.students.includes(userId)) {
      return { success: false, error: 'Already joined this classroom' };
    }

    const updatedClassroom = {
      ...classroom,
      students: [...classroom.students, userId]
    };

    setClassrooms(prev => prev.map(c => 
      c.id === classroom.id ? updatedClassroom : c
    ));

    setUserClassrooms(prev => [...prev, updatedClassroom]);
    return { success: true, classroom: updatedClassroom };
  };

  const leaveClassroom = (classroomId, userId) => {
    const classroom = classrooms.find(c => c.id === classroomId);
    if (!classroom) {
      return { success: false, error: 'Classroom not found' };
    }

    const updatedClassroom = {
      ...classroom,
      students: classroom.students.filter(id => id !== userId)
    };

    setClassrooms(prev => prev.map(c => 
      c.id === classroomId ? updatedClassroom : c
    ));

    setUserClassrooms(prev => prev.filter(c => c.id !== classroomId));
    return { success: true };
  };

  const getClassroomById = (id) => {
    return classrooms.find(c => c.id === id);
  };

  const getUserClassrooms = (userId) => {
    return userClassrooms;
  };

  const getTeacherClassrooms = (teacherId) => {
    return classrooms.filter(c => c.teacherId === teacherId);
  };

  const getAllClassrooms = () => {
    return classrooms;
  };

  // Utility function to clear localStorage when needed
  const clearClassroomStorage = () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('userClassrooms_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      console.log('Cleared classroom localStorage data');
    } catch (error) {
      console.error('Failed to clear classroom localStorage:', error);
    }
  };

  const value = {
    classrooms,
    userClassrooms,
    loading,
    createClassroom,
    updateClassroom,
    deleteClassroom,
    addContent,
    removeContent,
    joinClassroom,
    leaveClassroom,
    getClassroomById,
    getUserClassrooms,
    getTeacherClassrooms,
    getAllClassrooms,
    loadUserClassrooms,
    clearClassroomStorage
  };

  return (
    <ClassroomContext.Provider value={value}>
      {children}
    </ClassroomContext.Provider>
  );
};

export default ClassroomContext; 