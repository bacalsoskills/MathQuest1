// Test script to check if the backend is working
import api from '../services/api';

export const testBackendConnection = async () => {
  console.log('Testing backend connection...');
  
  try {
    // Test basic API connection
    const response = await api.get('/api/multiplication-learning/progress');
    console.log('✅ Backend is working! Response:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Backend connection failed:', error);
    
    if (error.response) {
      // Server responded with error status
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received. Is the backend running?');
    } else {
      // Something else happened
      console.error('Error setting up request:', error.message);
    }
    
    return { success: false, error: error.message };
  }
};

// Test function you can call from browser console
window.testBackend = testBackendConnection;
