import React, { useState } from 'react';
import { Header } from '../ui/heading';
import { Button } from '../ui/button';
import  Modal  from '../ui/modal';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { FaQuestionCircle, FaGraduationCap, FaGamepad, FaChartLine, FaUsers, FaCog, FaEnvelope, FaCompass, FaSkullCrossbones, FaShip, FaAnchor, FaMap, FaScroll, FaCoins, FaFeatherAlt } from 'react-icons/fa';
import { MdOutlineFeedback } from 'react-icons/md';
import { BiGroup } from 'react-icons/bi';
import { LiaSchoolSolid } from 'react-icons/lia';
import { BsPersonFillCheck } from 'react-icons/bs';
import { MdOutlineAdminPanelSettings } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  const { darkMode } = useTheme();

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
      icon: <FaShip className="text-4xl text-yellow-600" />,
      title: "About MathQuest",
      content: `MathQuest is a pirate-themed educational adventure designed specifically for Grade 4 students to master their multiplication skills. Our platform combines nautical adventures, treasure hunts, and real-time feedback to make learning multiplication an exciting journey across the seven seas!`
    },
    {
      icon: <FaFeatherAlt className="text-4xl text-yellow-600" />,
      title: "Pirate Adventures & Quests",
      content: `• Interactive treasure hunts with challenges and rewards
• Captain's leaderboards to encourage friendly competition
• Achievement badges and progress tracking
• Adaptive difficulty levels based on performance
• Real-time feedback for immediate learning reinforcement`
    },
    {
      icon: <FaCompass className="text-4xl text-yellow-600" />,
      title: "Adaptive Learning Compass",
      content: `Our platform automatically adjusts the difficulty of quests based on each student's performance. This ensures that every young pirate gets a personalized learning experience that matches their current skill level and helps them navigate the seas of knowledge at their own pace.`
    },
    {
      icon: <FaUsers className="text-4xl text-yellow-600" />,
      title: "Captain's Dashboard",
      content: `Teachers can:
• Monitor crew progress in real-time
• Create and assign custom treasure hunts
• Generate detailed performance reports
• Track engagement and completion rates
• Analyze learning patterns and identify areas for improvement`
    },
    {
      icon: <FaAnchor className="text-4xl text-yellow-600" />,
      title: "Fleet Management",
      content: `• Create and manage virtual ships (classrooms)
• Add crew members with unique boarding codes
• Organize scrolls (lessons) and quests (activities)
• Track individual and fleet-wide progress
• Generate comprehensive reports for parents and administrators`
    },
    {
      icon: <FaCog className="text-4xl text-yellow-600" />,
      title: "Ship Systems",
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
      description: "Pirate adventures and treasure hunts improve student motivation and participation"
    },
    {
      title: "Personalized Learning",
      description: "Adapts quests to individual skill levels for optimal learning"
    },
    {
      title: "Real-Time Progress Tracking",
      description: "Students and captains get detailed insights into learning progress"
    },
    {
      title: "Better Retention",
      description: "Interactive nautical activities enhance memory and understanding"
    },
    {
      title: "Captain Support",
      description: "Educators can customize treasure hunts and analyze crew data"
    }
  ];

  return (
    <div 
      className="px-4 sm:px-6 lg:py-8 min-h-screen"
      style={{
        backgroundImage: darkMode
          ? "linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(3,7,18,1) 100%)"
          : "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #f59e0b 100%)",
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaCompass className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-2xl'} />
            <Header type="h1" fontSize="5xl" weight="bold" className={(darkMode ? 'text-yellow-200' : 'text-blue-800') + ' tracking-wide'}>
              Captain's Log & Support
            </Header>
            <FaSkullCrossbones className={(darkMode ? 'text-yellow-400' : 'text-yellow-700') + ' text-2xl'} />
          </div>

          <div className={`h-[1px] w-full mb-8 ${
            darkMode 
              ? 'bg-gradient-to-r from-yellow-500 via-yellow-400 to-yellow-500' 
              : 'bg-gradient-to-r from-yellow-600 via-yellow-500 to-yellow-600'
          }`}></div>
        </div>

        {/* Quick Contact Button */}
        <div className="text-center mb-12">
          <Button 
            onClick={() => setIsContactModalOpen(true)}
            rounded="full"
            size="sm"
            className={`transition-all duration-300 hover:scale-105 ${
              darkMode 
                ? 'bg-yellow-500 hover:bg-yellow-400 text-[#0b1022]' 
                : 'bg-yellow-600 hover:bg-yellow-500 text-white'
            }`}
          >
            <FaEnvelope className="text-xl mr-2" />
            Send Message in a Bottle
          </Button>
        </div>

        {/* Help Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {helpSections.map((section, index) => (
            <div key={index} className={`rounded-2xl shadow-2xl p-6 border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] ${
              darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
            }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
              <div className="flex items-center gap-4 mb-4">
                {section.icon}
                <Header type="h3" fontSize="xl" weight="bold" className={darkMode ? 'text-yellow-200' : 'text-yellow-800'}>
                  {section.title}
                </Header>
              </div>
              <p className={`leading-relaxed whitespace-pre-line ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {section.content}
              </p>
            </div>
          ))}
        </div>

        {/* Expected Benefits */}
        <div className={`rounded-2xl p-8 mb-12 border-2 backdrop-blur-sm ${
          darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
        }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <FaCoins className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
            <Header type="h2" fontSize="3xl" weight="bold" className={darkMode ? 'text-yellow-200' : 'text-yellow-800'}>
              Treasure Benefits & Impact
            </Header>
            <FaCoins className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {objectives.map((objective, index) => (
              <div key={index} className={`rounded-xl p-6 shadow-md border-2 transition-all duration-300 hover:scale-105 ${
                darkMode ? 'bg-[#0f1428]/80 border-yellow-700/40' : 'bg-[#fbf4de] border-yellow-300'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${
                    darkMode ? 'bg-yellow-500' : 'bg-yellow-600'
                  }`}></div>
                  <Header type="h4" fontSize="lg" weight="semibold" className={darkMode ? 'text-yellow-200' : 'text-yellow-800'}>
                    {objective.title}
                  </Header>
                </div>
                <p className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {objective.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Target Audience */}
        <div className={`rounded-2xl shadow-2xl p-8 mb-12 border-2 backdrop-blur-sm ${
          darkMode ? 'bg-[#0b1022]/85 border-yellow-700/40' : 'bg-[#f5ecd2] border-yellow-300'
        }`} style={{ boxShadow: darkMode ? '0 10px 25px rgba(255, 215, 0, 0.08)' : '0 10px 25px rgba(0,0,0,0.08)' }}>
          <div className="flex items-center justify-center gap-3 mb-8">
            <FaMap className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
            <Header type="h2" fontSize="3xl" weight="bold" className={darkMode ? 'text-yellow-200' : 'text-yellow-800'}>
              Who Joins the MathQuest Fleet?
            </Header>
            <FaMap className={darkMode ? 'text-yellow-400' : 'text-yellow-600'} />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                darkMode ? 'bg-yellow-500/20' : 'bg-yellow-600/20'
              }`}>
                <FaShip className={`text-2xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <Header type="h3" fontSize="lg" weight="semibold" className={`mb-2 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Young Pirates (Grade 4)
              </Header>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Primary crew members who need to master their multiplication skills through nautical adventures
              </p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                darkMode ? 'bg-yellow-500/20' : 'bg-yellow-600/20'
              }`}>
                <FaUsers className={`text-2xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <Header type="h3" fontSize="lg" weight="semibold" className={`mb-2 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Captains (Teachers)
              </Header>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Fleet commanders who want to track crew progress and create engaging treasure hunts
              </p>
            </div>
            <div className="text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                darkMode ? 'bg-yellow-500/20' : 'bg-yellow-600/20'
              }`}>
                <FaAnchor className={`text-2xl ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
              </div>
              <Header type="h3" fontSize="lg" weight="semibold" className={`mb-2 ${darkMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
                Fleet Admirals (Admins)
              </Header>
              <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Port authorities who need to monitor fleet operations and manage crew accounts
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
          title="Send Message in a Bottle"
          className=""
        >
          {status === 'success' && (
            <div className={`mb-4 p-4 rounded-lg border-2 ${
              darkMode ? 'bg-green-900/30 text-green-300 border-green-700/40' : 'bg-green-100 text-green-700 border-green-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <FaScroll className="text-lg" />
                <p className="font-semibold">Message sent successfully!</p>
              </div>
              <p className="mb-2">Your message bottle number is: <span className="font-bold">{ticketNumber}</span></p>
              <p className="mb-4">We've sent a confirmation message with your bottle details. We'll review your message and get back to you soon.</p>
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
            <div className={`mb-4 p-4 rounded-lg border-2 ${
              darkMode ? 'bg-red-900/30 text-red-300 border-red-700/40' : 'bg-red-100 text-red-700 border-red-300'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <FaSkullCrossbones className="text-lg" />
                <p>Error sending message bottle. Please try again.</p>
              </div>
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
                <Label htmlFor="subject" className={`min-w-20 text-sm font-medium ${
                  darkMode ? 'text-yellow-200' : 'text-yellow-800'
                }`}>
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
                <Label htmlFor="message" className={`min-w-20 text-sm font-medium pt-2 ${
                  darkMode ? 'text-yellow-200' : 'text-yellow-800'
                }`}>
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
                  className={`w-full md:w-1/2 lg:w-1/4 transition-all duration-300 hover:scale-105 ${
                    darkMode 
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-[#0b1022]' 
                      : 'bg-yellow-600 hover:bg-yellow-500 text-white'
                  }`}
                >
                  <FaEnvelope className="mr-2" />
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