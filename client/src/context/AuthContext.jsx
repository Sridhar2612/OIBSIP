import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await API.get('/auth/me');
          setUser(res.data.data.user);
        } catch (error) {
          console.error('Session verification failed:', error);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      const { token: jwtToken, user: userData } = res.data.data;
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}! 🍕`);
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      return { success: false, message: msg, error: error.response?.data?.error };
    }
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await API.post('/auth/admin/login', { email, password });
      const { token: jwtToken, user: userData } = res.data.data;
      localStorage.setItem('token', jwtToken);
      setToken(jwtToken);
      setUser(userData);
      toast.success('Admin authorized successfully 👑');
      return { success: true };
    } catch (error) {
      const msg = error.response?.data?.message || 'Admin authentication failed';
      toast.error(msg);
      return { success: false, message: msg, error: error.response?.data?.error };
    }
  };

  const register = async (formData) => {
    try {
      const res = await API.post('/auth/register', formData);
      toast.success('Account created! Please check your email to verify.');
      return { success: true, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const verifyEmail = async (verificationToken) => {
    try {
      const res = await API.post('/auth/verify-email', { token: verificationToken });
      toast.success(res.data.message);
      return { success: true, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Email verification failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const resendVerification = async (email) => {
    try {
      const res = await API.post('/auth/resend-verification', { email });
      toast.success(res.data.message);
      return { success: true, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to resend verification';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const forgotPassword = async (email) => {
    try {
      const res = await API.post('/auth/forgot-password', { email });
      toast.success(res.data.message);
      return { success: true, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Request failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const resetPassword = async (resetToken, password) => {
    try {
      const res = await API.post(`/auth/reset-password/${resetToken}`, { password });
      toast.success(res.data.message);
      return { success: true, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Password reset failed';
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        adminLogin,
        register,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
