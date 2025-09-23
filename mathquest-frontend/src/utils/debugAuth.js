// Debug utility to check authentication status
export const debugAuth = () => {
  console.log('=== Authentication Debug ===');
  
  // Check localStorage
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  console.log('Token exists:', !!token);
  console.log('User exists:', !!user);
  
  if (token) {
    console.log('Token (first 20 chars):', token.substring(0, 20) + '...');
  }
  
  if (user) {
    try {
      const userObj = JSON.parse(user);
      console.log('User data:', {
        id: userObj.id,
        username: userObj.username,
        email: userObj.email,
        roles: userObj.roles,
        hasToken: !!userObj.token
      });
    } catch (e) {
      console.error('Error parsing user data:', e);
    }
  }
  
  // Test API call
  console.log('Testing API call...');
  return fetch('/api/multiplication-learning/progress', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
    return response.text();
  })
  .then(data => {
    console.log('API Response Data:', data);
  })
  .catch(error => {
    console.error('API Error:', error);
  });
};

// Make it available globally
window.debugAuth = debugAuth;
