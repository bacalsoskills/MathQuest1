import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import GamePage from './pages/GamePage';
import LearningPage from './pages/LearningPage';
import PracticePage from './pages/PracticePage';
import ChallengePage from './pages/ChallengePage';
import AboutPage from './pages/AboutPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import LeaderboardPage from './pages/LeaderboardPage';
import { AuthProvider } from './context/AuthContext';
import { ContentProvider } from './context/ContentContext';
import { UserProgressProvider } from './context/UserProgressContext';

function App() {
  return (
    <AuthProvider>
      <ContentProvider>
        <UserProgressProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/game" element={<GamePage />} />
                <Route path="/learning" element={<LearningPage />} />
                <Route path="/practice" element={<PracticePage />} />
                <Route path="/challenge" element={<ChallengePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/leaderboard" element={<LeaderboardPage />} />
              </Routes>
            </div>
          </Router>
        </UserProgressProvider>
      </ContentProvider>
    </AuthProvider>
  );
}

export default App; 