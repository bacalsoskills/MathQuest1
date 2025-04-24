import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hardcoded users
  const users = [
    { email: 'admin@gmail.com', password: 'admin', role: 'admin' },
    { email: 'user@gmail.com', password: 'user', role: 'user' },
    { email: 'user', password: 'user', role: 'user' }
  ];

  useEffect(() => {
    // Load user data from localStorage on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
      const userData = {
        email: user.email,
        role: user.role
      };
      
      setCurrentUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return { success: true, user: userData };
    } else {
      return { success: false, error: 'Invalid email or password' };
    }
  };

  const register = (email, password) => {
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      return { success: false, error: 'User already exists' };
    }
    
    // In a real app, you would add the user to a database
    // For now, we'll just simulate success
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('user');
  };

  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 