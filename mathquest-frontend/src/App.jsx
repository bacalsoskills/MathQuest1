import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import MainLayout from './layouts/MainLayout';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import LearningPage from './pages/LearningPage';
import PracticePage from './pages/PracticePage';
import ChallengePage from './pages/ChallengePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ReportGenerator from './pages/ReportGenerator';
import AdministrativeControls from './pages/AdministrativeControls';
import JoinClassroom from './pages/student/JoinClassroom';
import CreateClassroom from './pages/teacher/CreateClassroom';
import TeacherClassroomPage from './pages/teacher/TeacherClassroomPage';
import StudentClassroomPage from './pages/student/StudentClassroomPage';
import TeacherClassroom from './pages/teacher/TeacherClassroom';
import StudentClassroom from './pages/student/StudentClassroom';
import ProfilePage from './pages/ProfilePage';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { UserProgressProvider } from './context/UserProgressContext';
import { ClassroomProvider } from './context/ClassroomContext';
import { useAuth } from './context/AuthContext';
import EmailUpdateVerification from './pages/EmailUpdateVerification';
import VerificationPage from './pages/VerificationPage';
import StudentProgressSection from './pages/admin/StudentProgressSection';
import ClassroomSection from './pages/admin/ClassroomSection';
import PropertiesSection from './pages/admin/PropertiesSection';
import PracticeSection from './pages/admin/PracticeSection';
import ChallengeSection from './pages/admin/ChallengeSection';
import TeachersSection from './pages/admin/TeachersSection';
import StudentsSection from './pages/admin/StudentsSection';
import GameContainer from './components/games/GameContainer';
import GameAnalytics from './components/teacher/GameAnalytics';
import QuizPage from './pages/QuizPage';
import ReportsPage from './pages/ReportsPage';
import QuizAttemptPage from './pages/student/QuizAttemptPage';
import SystemSettings from './pages/admin/SystemSettings';
import UserManagement from './pages/admin/UserManagement';
import FeedbackPage from './pages/FeedbackPage';
import AdminFeedbackPage from './pages/admin/AdminFeedbackPage';
import FeedbackTicketPage from './pages/admin/FeedbackTicketPage';

// Root redirect component to handle role-based redirection
const RootRedirect = () => {
  const { isAdmin, isTeacher, isStudent } = useAuth();
  
  if (isAdmin()) return <Navigate to="/admin/users" />;
  if (isTeacher()) return <Navigate to="/teacher/classrooms" />;
  if (isStudent()) return <Navigate to="/student/classrooms" />;
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

function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <UserProgressProvider>
          <ClassroomProvider>
            <Router>
              <div className="flex flex-col min-h-screen bg-gray-50">
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
                    <Route path="/" element={
                      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
                        <RootRedirect />
                      </ProtectedRoute>
                    } />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />
                    <Route path="/users/verify-email" element={<EmailUpdateVerification />} />
                    
                    {/* Student Routes */}
                    <Route path="/student" element={<Navigate to="/student/classrooms" />} />
                    <Route 
                      path="/student/game" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <GamePage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/games/:gameId" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <GameContainer />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/learning" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <LearningPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/practice" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <PracticePage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/student/challenge" 
                      element={
                        <ProtectedRoute allowedRoles={['student']}>
                          <ChallengePage />
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
                    <Route path="/student/feedback" element={
                      <ProtectedRoute allowedRoles={['STUDENT']}>
                        <FeedbackPage />
                      </ProtectedRoute>
                    } />
                    
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
                    <Route 
                      path="/teacher/reports" 
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <ReportGenerator />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/teacher/student-progress" 
                      element={
                        <ProtectedRoute allowedRoles={['teacher']}>
                          <StudentProgressSection />
                        </ProtectedRoute>
                      } 
                    />

                  <Route path="/teacher/feedback" element={
                      <ProtectedRoute allowedRoles={['TEACHER']}>
                        <FeedbackPage />
                      </ProtectedRoute>
                    } />
                    
                    {/* Redirect old paths to new role-based paths */}
                    <Route path="/game" element={<Navigate to="/student/game" />} />
                    <Route path="/learning" element={<Navigate to="/student/learning" />} />
                    <Route path="/practice" element={<Navigate to="/student/practice" />} />
                    <Route path="/challenge" element={<Navigate to="/student/challenge" />} />
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
                      path="/admin/reports" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <ReportGenerator />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/students-progress" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <StudentProgressSection />
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
                      path="/admin/settings" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <SystemSettings />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/properties" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <PropertiesSection />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/practice" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <PracticeSection />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/admin/challenge" 
                      element={
                        <ProtectedRoute allowedRoles={['admin']}>
                          <ChallengeSection />
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
                  </Route>

                   {/* Quiz Routes */}
                   <Route path="/classroom/:classroomId/quizzes" element={<QuizPage />} />
                   <Route path="/quiz/:quizId" element={<QuizPage />} />
                  
                  {/* Reports Routes */}
                  <Route path="/classroom/:classroomId/reports" element={<ReportsPage />} />
                  
                  {/* Fallback route */}
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </Router>
          </ClassroomProvider>
        </UserProgressProvider>
      </ContentProvider>
    </AuthProvider>
  );
}

export default App; 