import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        // Fetch latest profile to ensure data sync
        try {
          const res = await authAPI.getProfile();
          if (res.data?.success) {
            const latestUser = {
              id: res.data.data.id,
              email: res.data.data.email,
              role: res.data.data.role,
              fullName: res.data.data.full_name,
              avatarUrl: res.data.data.avatar_url || '',
            };
            setUser(latestUser);
            localStorage.setItem('user', JSON.stringify(latestUser));
          }
        } catch (err) {
          console.error('Failed to verify session token:', err);
          if (err.response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      if (res.data?.success) {
        const { token: returnedToken, user: userObj } = res.data;
        setToken(returnedToken);
        
        const mappedUser = {
          id: userObj.id,
          email: userObj.email,
          role: userObj.role,
          fullName: userObj.fullName,
          avatarUrl: userObj.avatarUrl || '',
        };
        
        setUser(mappedUser);
        localStorage.setItem('token', returnedToken);
        localStorage.setItem('user', JSON.stringify(mappedUser));
        return { success: true };
      }
      return { success: false, message: 'Login failed. Invalid response from server.' };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please check your credentials.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName) => {
    setLoading(true);
    try {
      const res = await authAPI.register({ email, password, fullName });
      if (res.data?.success) {
        const { token: returnedToken, user: userObj } = res.data;
        setToken(returnedToken);
        
        const mappedUser = {
          id: userObj.id,
          email: userObj.email,
          role: userObj.role,
          fullName: userObj.fullName,
          avatarUrl: userObj.avatarUrl || '',
        };
        
        setUser(mappedUser);
        localStorage.setItem('token', returnedToken);
        localStorage.setItem('user', JSON.stringify(mappedUser));
        return { success: true };
      }
      return { success: false, message: 'Registration failed. Invalid response from server.' };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed. Email might already be registered.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  const forgotPassword = async (email) => {
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.data?.success) {
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Failed to request password reset.' };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to request password reset.' };
    }
  };

  const uploadAvatar = async (file) => {
    if (!user) return null;
    
    // Fallback: Generate a beautiful, seeded robot avatar using Dicebear
    const randomSeed = Math.random().toString(36).substring(7);
    const mockAvatarUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(user.fullName || 'User')}-${randomSeed}`;
    
    try {
      const res = await authAPI.updateProfile({ avatarUrl: mockAvatarUrl });
      if (res.data?.success) {
        setUser((prev) => ({ ...prev, avatarUrl: mockAvatarUrl }));
        
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.avatarUrl = mockAvatarUrl;
        localStorage.setItem('user', JSON.stringify(storedUser));
        
        return mockAvatarUrl;
      }
      return null;
    } catch (err) {
      console.error('Failed to update avatar profile:', err);
      throw err;
    }
  };

  const updateProfileState = (updatedData) => {
    if (user) {
      const newUserObj = {
        ...user,
        fullName: updatedData.fullName || user.fullName,
        avatarUrl: updatedData.avatarUrl || user.avatarUrl,
      };
      setUser(newUserObj);
      localStorage.setItem('user', JSON.stringify(newUserObj));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        forgotPassword,
        uploadAvatar,
        updateProfileState,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin' || user?.email?.endsWith('@carbonlytix.com'),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
