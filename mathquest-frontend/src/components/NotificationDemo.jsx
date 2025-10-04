import React from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Button } from '../ui/button';

const NotificationDemo = () => {
  const { notifications, addNotification, clearAllNotifications, getTotalNotifications } = useNotifications();

  const handleAddNotification = (type) => {
    addNotification(type, 1);
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-semibold mb-4">Notification System Demo</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Total Notifications: <span className="font-bold text-red-500">{getTotalNotifications()}</span>
        </p>
        
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>Dashboard: {notifications.dashboard}</div>
          <div>Classrooms: {notifications.classrooms}</div>
          <div>Activities: {notifications.activities}</div>
          <div>Leaderboard: {notifications.leaderboard}</div>
          <div>Profile: {notifications.profile}</div>
          <div>Help: {notifications.help}</div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={() => handleAddNotification('dashboard')}
            size="sm"
            variant="outline"
          >
            + Dashboard
          </Button>
          <Button 
            onClick={() => handleAddNotification('classrooms')}
            size="sm"
            variant="outline"
          >
            + Classrooms
          </Button>
          <Button 
            onClick={() => handleAddNotification('activities')}
            size="sm"
            variant="outline"
          >
            + Activities
          </Button>
          <Button 
            onClick={() => handleAddNotification('leaderboard')}
            size="sm"
            variant="outline"
          >
            + Leaderboard
          </Button>
        </div>
        
        <Button 
          onClick={clearAllNotifications}
          size="sm"
          variant="destructive"
          className="w-full"
        >
          Clear All Notifications
        </Button>
      </div>
    </div>
  );
};

export default NotificationDemo;
