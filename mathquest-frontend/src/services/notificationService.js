import api from './api';

class NotificationService {
  // Get notifications for current user
  async getNotifications() {
    try {
      const response = await api.get('/notifications');
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  // Get notifications by type
  async getNotificationsByType(type) {
    try {
      const response = await api.get(`/notifications/${type}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${type} notifications:`, error);
      throw error;
    }
  }

  // Mark notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Mark all notifications of a type as read
  async markTypeAsRead(type) {
    try {
      const response = await api.put(`/notifications/type/${type}/read`);
      return response.data;
    } catch (error) {
      console.error(`Error marking ${type} notifications as read:`, error);
      throw error;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  // Create a new notification
  async createNotification(notificationData) {
    try {
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Delete notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  // Get notification counts by type
  async getNotificationCounts() {
    try {
      const response = await api.get('/notifications/counts');
      return response.data;
    } catch (error) {
      console.error('Error fetching notification counts:', error);
      // Return default counts if API fails
      return {
        dashboard: 0,
        classrooms: 0,
        activities: 0,
        leaderboard: 0,
        profile: 0,
        help: 0
      };
    }
  }

  // Subscribe to real-time notifications (WebSocket)
  subscribeToNotifications(callback) {
    // This would implement WebSocket connection for real-time notifications
    // For now, we'll use polling in the context
    console.log('Real-time notifications subscription not implemented yet');
  }

  // Unsubscribe from real-time notifications
  unsubscribeFromNotifications() {
    console.log('Real-time notifications unsubscription not implemented yet');
  }
}

export default new NotificationService();
