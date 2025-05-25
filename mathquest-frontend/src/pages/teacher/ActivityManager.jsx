import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FaEdit, FaTrash, FaEye, FaChartBar, FaListAlt, FaTasks, FaGamepad } from 'react-icons/fa';
import activityService from '../../services/activityService';
import ClassroomGamesTab from './ClassroomGamesTab';

const ActivityManager = ({ classroomId }) => {
  const [activeTab, setActiveTab] = useState('games');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classroomId) {
      setLoading(false);
      setActivities([]);
      return;
    }

    const fetchActivities = async () => {
      setLoading(true);
      try {
        const activitiesData = await activityService.getActivitiesByClassroomId(classroomId);
        setActivities(activitiesData || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
        toast.error('Failed to load activities for the classroom.');
        setActivities([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [classroomId]);

  const gameActivities = activities.filter(activity => activity.type === 'GAME');
  const quizActivities = activities.filter(activity => activity.type === 'QUIZ');
  const assignmentActivities = activities.filter(activity => activity.type === 'ASSIGNMENT');

  const renderActivityItem = (activity) => (
    <div key={activity.id} className="bg-white p-4 rounded-lg shadow mb-3 flex justify-between items-center">
      <div>
        <h3 className="text-md font-semibold text-gray-800">{activity.title}</h3>
        <p className="text-sm text-gray-600">{activity.description || 'No description.'}</p>
      </div>
      <div className="flex space-x-2">
        <button className="p-2 text-blue-600 hover:text-blue-800"><FaEye /></button>
        <button className="p-2 text-yellow-500 hover:text-yellow-700"><FaEdit /></button>
        <button className="p-2 text-red-500 hover:text-red-700"><FaTrash /></button>
        <button className="p-2 text-indigo-500 hover:text-indigo-700"><FaChartBar /></button>
      </div>
    </div>
  );

  if (!classroomId && !loading) {
    return (
      <div className="mt-4 p-6 bg-white rounded-lg shadow text-center text-gray-600">
        Please select a classroom to see its activities.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="flex border-b mb-6">
        <button
          className={`flex items-center px-4 py-3 mr-2 focus:outline-none ${activeTab === 'games' ? 'border-b-2 border-blue-500 text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('games')}
        >
          <FaGamepad className="mr-2" /> Games
        </button>
        <button
          className={`flex items-center px-4 py-3 mr-2 focus:outline-none ${activeTab === 'quizzes' ? 'border-b-2 border-blue-500 text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('quizzes')}
        >
          <FaListAlt className="mr-2" /> Quizzes
        </button>
        <button
          className={`flex items-center px-4 py-3 focus:outline-none ${activeTab === 'assignments' ? 'border-b-2 border-blue-500 text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('assignments')}
        >
          <FaTasks className="mr-2" /> Assignments
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          <p className="ml-3 text-gray-600">Loading activities...</p>
        </div>
      ) : (
        <>
          {activeTab === 'games' && (
            <ClassroomGamesTab classroomId={classroomId} />
          )}
          {activeTab === 'quizzes' && (
            <div>
              {quizActivities.length > 0 ? (
                quizActivities.map(renderActivityItem)
              ) : (
                <div className="text-center p-6 bg-white rounded-lg shadow text-gray-500">
                  No quizzes available for this classroom yet.
                </div>
              )}
            </div>
          )}
          {activeTab === 'assignments' && (
            <div>
              {assignmentActivities.length > 0 ? (
                assignmentActivities.map(renderActivityItem)
              ) : (
                <div className="text-center p-6 bg-white rounded-lg shadow text-gray-500">
                  No assignments available for this classroom yet.
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ActivityManager; 