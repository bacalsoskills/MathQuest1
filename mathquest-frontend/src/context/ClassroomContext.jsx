import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const ClassroomContext = createContext();

export const useClassroom = () => useContext(ClassroomContext);

export const ClassroomProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [classrooms, setClassrooms] = useState([]);
  const [userClassrooms, setUserClassrooms] = useState([]);

  // Load user's classrooms from localStorage when the component mounts or user changes
  useEffect(() => {
    if (currentUser?.email) {
      const storedClassrooms = localStorage.getItem(`userClassrooms_${currentUser.email}`);
      if (storedClassrooms) {
        setUserClassrooms(JSON.parse(storedClassrooms));
      }
    }
  }, [currentUser]);

  // Save user's classrooms to localStorage whenever they change
  useEffect(() => {
    if (currentUser?.email) {
      localStorage.setItem(`userClassrooms_${currentUser.email}`, JSON.stringify(userClassrooms));
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

  const value = {
    classrooms,
    userClassrooms,
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
    getAllClassrooms
  };

  return (
    <ClassroomContext.Provider value={value}>
      {children}
    </ClassroomContext.Provider>
  );
};

export default ClassroomContext; 