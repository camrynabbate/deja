import React, { createContext, useContext } from 'react';

const AuthContext = createContext();

const LOCAL_USER = {
  email: 'you@vera.local',
  full_name: 'You',
  role: 'admin',
};

export const AuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={{
      user: LOCAL_USER,
      isAuthenticated: true,
      isLoadingAuth: false,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout: () => {},
      navigateToLogin: () => {},
      checkAppState: () => {},
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
