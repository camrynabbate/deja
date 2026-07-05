import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { setMonitoringUser } from '@/lib/monitoring';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    let authChangeId = 0;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      const changeId = ++authChangeId;
      if (firebaseUser) {
        let role = 'user';
        try {
          const token = await firebaseUser.getIdTokenResult();
          if (token.claims.admin === true) role = 'admin';
        } catch (error) {
          console.error('[AuthContext] Could not load account permissions:', error);
        }
        if (changeId !== authChangeId) return;
        const nextUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          full_name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          role,
        };
        setUser(nextUser);
        setMonitoringUser(nextUser);
      } else {
        setUser(null);
        setMonitoringUser(null);
      }
      setIsLoadingAuth(false);
    });
    return () => {
      authChangeId += 1;
      unsubscribe();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      logout,
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
