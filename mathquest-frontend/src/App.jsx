import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import MainLayout from './layouts/MainLayout';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdministrativeControls from './pages/AdministrativeControls';
import JoinClassroom from './pages/student/JoinClassroom';
import CreateClassroom from './pages/teacher/CreateClassroom';
import TeacherClassroomPage from './pages/teacher/TeacherClassroomPage';
import StudentClassroomPage from './pages/student/StudentClassroomPage';
import TeacherClassroom from './pages/teacher/TeacherClassroom';
import StudentClassroom from './pages/student/StudentClassroom';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { ClassroomProvider } from './context/ClassroomContext';
import { ThemeProvider } from './context/ThemeContext';
import EmailUpdateVerification from './pages/EmailUpdateVerification';
import VerificationPage from './pages/VerificationPage';
import ClassroomSection from './pages/admin/ClassroomSection';
import TeachersSection from './pages/admin/TeachersSection';
import StudentsSection from './pages/admin/StudentsSection';
import GameContainer from './components/games/GameContainer';
import GameAnalytics from './components/teacher/GameAnalytics';
import QuizPage from './pages/QuizPage';
import ReportsPage from './pages/ReportsPage';
import QuizAttemptPage from './pages/student/QuizAttemptPage';
import SystemAnnoucements from './pages/admin/SystemAnnoucements';
import UserManagement from './pages/admin/UserManagement';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import FeedbackTicketPage from './pages/admin/FeedbackTicketPage';
import Dashboard from './pages/Dashboard';
import ThemeToggleButton from './components/ThemeToggleButton';
import HelpPage from './pages/HelpPage';
import LearningMultiplication from './pages/student/LearningMultiplication';

// Auth Route component to prevent logged-in users from accessing auth pages
const AuthRoute = ({ children }) => {
  const { currentUser, isAdmin, isTeacher, isStudent } = useAuth();

  // If user is logged in, redirect them to appropriate dashboard
  if (currentUser) {
    if (isAdmin()) return <Navigate to="/admin/dashboard" />;
    if (isTeacher()) return <Navigate to="/teacher/dashboard" />;
    if (isStudent()) return <Navigate to="/student/dashboard" />;
    // Fallback to home if role is undefined
    return <Navigate to="/" />;
  }

  // If not logged in, show the auth page
  return children;
};

// Root redirect component to handle role-based redirection
const RootRedirect = () => {
  const { currentUser, isAdmin, isTeacher, isStudent } = useAuth();
  
  // If not logged in, show the homepage
  if (!currentUser) return <HomePage />;
  
  // If logged in, redirect based on role
  if (isAdmin()) return <Navigate to="/admin/dashboard" />;
  if (isTeacher()) return <Navigate to="/teacher/dashboard" />;
  if (isStudent()) return <Navigate to="/student/dashboard" />;
  
  // Fallback to homepage if role is undefined
  return <HomePage />;
};

// Protected Route component to handle role-based access
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { currentUser, isTeacher, isStudent, isAdmin } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If user is logged in but trying to access a route they don't have permission for
  if (allowedRoles.includes('admin') && !isAdmin()) {
    if (isTeacher()) {
      return <Navigate to="/teacher/classrooms" />;
    }
    if (isStudent()) {
      return <Navigate to="/student/classrooms" />;
    }
    return <Navigate to="/" />;
  }

  if (allowedRoles.includes('teacher') && !isTeacher()) {
    if (isAdmin()) {
      return <Navigate to="/admin/users" />;
    }
    if (isStudent()) {
      return <Navigate to="/student/classrooms" />;
    }
    return <Navigate to="/" />;
  }

  if (allowedRoles.includes('student') && !isStudent()) {
    if (isAdmin()) {
      return <Navigate to="/admin/users" />;
    }
    if (isTeacher()) {
      return <Navigate to="/teacher/classrooms" />;
    }
    return <Navigate to="/" />;
  }

  return children;
};

// Layout with Navbar
const NavbarLayout = () => (
  <>
    <Navbar />
    <MainLayout />
  </>
);

// ThemeToggle wrapper that only shows for non-logged in users
const ConditionalThemeToggle = () => {
  const { currentUser } = useAuth();
  
  if (!currentUser) {
    return <ThemeToggleButton />;
  }
  
  return null;
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ContentProvider>
          <ClassroomProvider>
            <ThemeProvider>
              <Router>
              <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
                {/* Theme Toggle Button - Only for non-logged in users */}
                <ConditionalThemeToggle />
                
                {/* Toast notifications */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#ffffff',
                      color: '#333333',
                    },
                    success: {
                      iconTheme: {
                        primary: '#4caf50',
                        secondary: '#ffffff',
                      },
                    },
                    error: {
                      iconTheme: {
                        primary: '#f44336',
                        secondary: '#ffffff',
                      },
                    },
                  }}
                />
                
                <Routes>
                  {/* Special routes without Navbar */}
                  <Route path="/auth/verify" element={<VerificationPage />} />

                  {/* Routes with Navbar */}
                  <Route element={<NavbarLayout />}>
                    {/* Public Routes */}
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/about" element={<AboutPage />} />
                    
                    {/* Auth Routes - Only accessible when not logged in */}
                    <Route path="/login" element={
                      <AuthRoute>
                        <LoginPage />
                      </AuthRoute>
                    } />
                    <Route path="/register" element={
                      <AuthRoute>
                        <RegisterPage />
                      </AuthRoute>
                    } />
                    <Route path="/forgot-password" element={
                      <AuthRoute>
                        <ForgotPasswordPage />
                      </AuthRoute>
                    } />
                    <Route path="/reset-password" element={
                      <AuthRoute>
                        <ResetPasswordPage />
                      </AuthRoute>
                    } />
                    <Route path="/users/verify-email" element={<EmailUpdateVerification />} />
                    
                    {/* Shared Dashboard Route */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute allowedRoles={['admin','teacher','student']}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    {/* Role-specific Dashboard Routes */}
                    <Route path="/student/dashboard" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/teacher/dashboard" element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/dashboard" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <Dashboard />
                      </ProtectedRoute>
                    } />
                    
                    {/* Student Routes */}
                    <Route path="/student" element={<Navigate to="/student/classrooms" />} />
                    
                    <Route 
                      path="/student/games/:gameId" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <GameContainer />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/student/profile" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <ProfilePage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/classrooms" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <StudentClassroom />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/join-classroom" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <JoinClassroom />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/classrooms/:classroomId" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <StudentClassroomPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/classrooms/:classroomId/lessons/:lessonId" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <StudentClassroomPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/quizzes/:quizId/attempt/:attemptId" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <QuizAttemptPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route path="/student/help" element={
                      <ProtectedRoute allowedRoles={['student']}>
                        <HelpPage />
                      </ProtectedRoute>
                    } />
                    <Route 
                      path="/student/learning-multiplication" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <LearningMultiplication />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Teacher Routes */}
                    <Route path="/teacher" element={<Navigate to="/teacher/classrooms" />} />
                    <Route 
                      path="/teacher/profile" 
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <ProfilePage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/teacher/classrooms" 
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <TeacherClassroom />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/teacher/add-classroom" 
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <CreateClassroom />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/teacher/games/:gameId/analytics" 
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <GameAnalytics />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/teacher/classrooms/:classroomId" 
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <TeacherClassroomPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/teacher/classrooms/:classroomId/lessons/:lessonId" 
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <TeacherClassroomPage />
                        </ProtectedRoute>
                      } 
                    />
                
               
                    <Route path="/teacher/help" element={
                      <ProtectedRoute allowedRoles={['teacher']}>
                        <HelpPage />
                      </ProtectedRoute>
                    } />
                    
                    {/* Redirect old paths to new role-based paths */}
                    <Route path="/game" element={<Navigate to="/student/game" />} />
                    <Route path="/profile" element={<Navigate to="/student/profile" />} />
                    <Route path="/classrooms" element={<Navigate to="/teacher/classrooms" />} />
                    <Route path="/join-classroom" element={<Navigate to="/student/join-classroom" />} />
                    <Route path="/add-classroom" element={<Navigate to="/teacher/add-classroom" />} />
                    <Route path="/classrooms/:classroomId" element={<Navigate to="/student/classrooms/:classroomId" />} />
                    <Route path="/classrooms/:classroomId/lessons/:lessonId" element={<Navigate to="/student/classrooms/:classroomId/lessons/:lessonId" />} />
                    <Route path="/reports" element={<Navigate to="/teacher/reports" />} />
                    <Route path="/student-progress" element={<Navigate to="/teacher/student-progress" />} />
                  
                    {/* Admin Routes */}
                    <Route 
                      path="/admin/profile" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <ProfilePage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <UserManagement />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users/teachers" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <TeachersSection />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/users/students" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <StudentsSection />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/classrooms" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <ClassroomSection />
                        </ProtectedRoute>
                      } 
                    />
              
              
              
                    <Route 
                      path="/admin/controls" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <AdministrativeControls />
                        </ProtectedRoute>
                      } 
                    />
                      <Route 
                      path="/admin/announcements" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <SystemAnnoucements />
                        </ProtectedRoute>
                      } 
                    />
                  
                 
                     <Route path="/admin/feedback" 
                     element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminFeedbackPage />
                      </ProtectedRoute>
                    }
                     />
                       <Route path="/admin/feedback/:ticketNumber" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <FeedbackTicketPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin/help" element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <HelpPage />
                      </ProtectedRoute>
                    } />
                  </Route>

                   {/* Quiz Routes */}
                   <Route path="/classroom/:classroomId/quizzes" element={<QuizPage />} />
                   <Route path="/quiz/:quizId" element={<QuizPage />} />
                  
                  {/* Reports Routes */}
                  <Route path="/classroom/:classroomId/reports" element={<ReportsPage />} />
                  
                  {/* Fallback route - handle any unmatched routes */}
                  <Route path="*" element={
                    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                      <div className="text-center">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Page Not Found</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">The page you're looking for doesn't exist.</p>
                        <Link to="/" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          Go back to home
                        </Link>
                      </div>
                    </div>
                  } />
                </Routes>
              </div>
              </Router>
            </ThemeProvider>
          </ClassroomProvider>
        </ContentProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App; 