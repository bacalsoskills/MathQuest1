import React, { useState } from 'react';
import { Header } from '../ui/heading';
import { Button } from '../ui/button';
import  Modal  from '../ui/modal';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { FaQuestionCircle, FaGraduationCap, FaGamepad, FaChartLine, FaUsers, FaCog, FaEnvelope } from 'react-icons/fa';
import { MdOutlineFeedback } from 'react-icons/md';
import { BiGroup } from 'react-icons/bi';
import { LiaSchoolSolid } from 'react-icons/lia';
import { BsPersonFillCheck } from 'react-icons/bs';
import { MdOutlineAdminPanelSettings } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const HelpPage = () => {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [status, setStatus] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const { currentUser } = useAuth();

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/feedback', {
        subject: contactForm.subject,
        info: contactForm.message
      });
      setStatus('success');
      setTicketNumber(response.data.ticketNumber);
      setContactForm({ subject: '', message: '' });
    } catch (error) {
      setStatus('error');
      console.error('Error submitting feedback:', error);
    }
  };

  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const helpSections = [
    {
      icon: <FaGraduationCap className="text-4xl text-blue-600" />,
      title: "About MathQuest",
      content: `MathQuest is a web-based educational platform designed specifically for Grade 4 students to improve their multiplication skills. Our platform combines gamification, adaptive learning, and real-time feedback to make learning multiplication fun and effective.`
    },
    {
      icon: <FaGamepad className="text-4xl text-green-600" />,
      title: "Gamification Features",
      content: `• Interactive games with challenges and rewards
• Leaderboards to encourage friendly competition
• Achievement badges and progress tracking
• Adaptive difficulty levels based on performance
• Real-time feedback for immediate learning reinforcement`
    },
    {
      icon: <FaChartLine className="text-4xl text-purple-600" />,
      title: "Adaptive Learning",
      content: `Our platform automatically adjusts the difficulty of exercises based on each student's performance. This ensures that every student gets a personalized learning experience that matches their current skill level and helps them progress at their own pace.`
    },
    {
      icon: <FaUsers className="text-4xl text-orange-600" />,
      title: "Teacher Dashboard",
      content: `Teachers can:
• Monitor student progress in real-time
• Create and assign custom challenges
• Generate detailed performance reports
• Track engagement and completion rates
• Analyze learning patterns and identify areas for improvement`
    },
    {
      icon: <LiaSchoolSolid className="text-4xl text-teal-600" />,
      title: "Classroom Management",
      content: `• Create and manage virtual classrooms
• Add students to classrooms with unique codes
• Organize lessons and activities
• Track individual and class-wide progress
• Generate comprehensive reports for parents and administrators`
    },
    {
      icon: <FaCog className="text-4xl text-gray-600" />,
      title: "System Features",
      content: `• Secure authentication and data protection
• Cross-platform compatibility (desktop and mobile)
• 99% system uptime for reliable learning
• Support for 100+ simultaneous users
• Fast loading times (under 10 seconds)`
    }
  ];

  const objectives = [
    {
      title: "Enhanced Engagement",
      description: "Game-based challenges improve student motivation and participation"
    },
    {
      title: "Personalized Learning",
      description: "Adapts exercises to individual skill levels for optimal learning"
    },
    {
      title: "Real-Time Progress Tracking",
      description: "Students and teachers get detailed insights into learning progress"
    },
    {
      title: "Better Retention",
      description: "Interactive activities enhance memory and understanding"
    },
    {
      title: "Teacher Support",
      description: "Educators can customize challenges and analyze student data"
    }
  ];

  return (
    <div className="px-4 sm:px-6 lg:py-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Header type="h1" fontSize="5xl" weight="bold" className="mb-4 text-primary dark:text-white">
            Help & Support
          </Header>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Everything you need to know about MathQuest - Your interactive multiplication learning platform
          </p>
          <div className="h-[1px] w-full bg-gradient-to-r from-[#18C8FF] via-[#4B8CFF] to-[#6D6DFF] mb-8"></div>
        </div>

        {/* Quick Contact Button */}
        <div className="text-center mb-12">
          <Button 
            onClick={() => setIsContactModalOpen(true)}
            rounded="full"
            size="sm"
          >
            <FaEnvelope className="text-xl mr-2" />
            Contact Support
          </Button>
        </div>

        {/* Help Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {helpSections.map((section, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 mb-4">
                {section.icon}
                <Header type="h3" fontSize="xl" weight="bold" className="text-gray-800 dark:text-white">
                  {section.title}
                </Header>
              </div>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Expected Benefits */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-8 mb-12">
          <Header type="h2" fontSize="3xl" weight="bold" className="text-center mb-8 text-gray-800 dark:text-white">
            Expected Benefits & Impact
          </Header>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.map((objective, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <Header type="h4" fontSize="lg" weight="semibold" className="text-gray-800 dark:text-white">
                    {objective.title}
                  </Header>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  {objective.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-12 border border-gray-200 dark:border-gray-700">
          <Header type="h2" fontSize="3xl" weight="bold" className="text-center mb-8 text-gray-800 dark:text-white">
            Who is MathQuest For?
          </Header>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaGraduationCap className="text-2xl text-blue-600" />
              </div>
              <Header type="h3" fontSize="lg" weight="semibold" className="mb-2 text-gray-800 dark:text-white">
                Grade 4 Students
              </Header>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Primary users who need to improve their multiplication skills through interactive learning
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BiGroup className="text-2xl text-green-600" />
              </div>
              <Header type="h3" fontSize="lg" weight="semibold" className="mb-2 text-gray-800 dark:text-white">
                Teachers
              </Header>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                Educators who want to track student progress and create engaging learning experiences
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <MdOutlineAdminPanelSettings className="text-2xl text-purple-600" />
              </div>
              <Header type="h3" fontSize="lg" weight="semibold" className="mb-2 text-gray-800 dark:text-white">
                Administrators
              </Header>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                School administrators who need to monitor system usage and manage user accounts
              </p>
            </div>
          </div>
        </div>

        <Modal
          isOpen={isContactModalOpen}
          onClose={() => {
            setIsContactModalOpen(false);
            setStatus('');
            setTicketNumber('');
          }}
          title="Contact Support"
          className=""
        >
          {status === 'success' && (
            <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
              <p className="font-semibold mb-2">Feedback submitted successfully!</p>
              <p className="mb-2">Your ticket number is: <span className="font-bold">{ticketNumber}</span></p>
              <p className="mb-4">We've sent a confirmation email with your ticket details. We'll review your feedback and get back to you soon.</p>
              <Button
                onClick={() => {
                  setIsContactModalOpen(false);
                  setStatus('');
                  setTicketNumber('');
                }}
                rounded="full"
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Close
              </Button>
            </div>
          )}
          
          {status === 'error' && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
              <p className="mb-4">Error submitting feedback. Please try again.</p>
              <Button
                onClick={() => setStatus('')}
                rounded="full"
                size="sm"
                variant="cancel"
              >
                Try Again
              </Button>
            </div>
          )}

          {status !== 'success' && (
            <form onSubmit={handleContactSubmit} className="space-y-4">
          
              <div className="flex items-center gap-4">
                <Label htmlFor="subject" className="text-gray-700 dark:text-gray-300 min-w-20 text-sm font-medium">
                  Subject:
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={contactForm.subject}
                  onChange={handleContactChange}
                  required
                  variant="gray"
                  placeholder="Enter subject"
                  className="flex-1"
                />
              </div>
              <div className="flex items-start gap-4">
                <Label htmlFor="message" className="text-gray-700 dark:text-gray-300 min-w-20 text-sm font-medium pt-2">
                  Message:
                </Label>
                <Textarea
                  id="message"
                  name="message"
                  value={contactForm.message}
                  onChange={handleContactChange}
                  required
                  placeholder="Enter your message or feedback"
                  rows={4}
                  className="px-3 py-2 border bg-white border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm flex-1 text-gray-700 dark:text-gray-700 min-w-20 text-sm font-medium pt-2"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  onClick={() => {
                    setIsContactModalOpen(false);
                    setStatus('');
                    setTicketNumber('');
                  }}
                  variant="cancel"
                  rounded="full"
                  size="sm"
                  className="w-full md:w-1/2 lg:w-1/4"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  rounded="full"
                  size="sm"
                  className="w-full md:w-1/2 lg:w-1/4"
                >
                  Send Message
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default HelpPage; 