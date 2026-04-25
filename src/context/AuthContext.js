import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import api, { setAuthToken } from '../services/api';

const AuthContext = createContext();
const TOKEN_STORAGE_KEY = 'token';

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  loading: true,
  error: null
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const validateToken = useCallback(async (token) => {
    try {
      const response = await api.get('/users/profile');
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: response.data,
          token
        }
      });
    } catch (error) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setAuthToken(null);
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    if (state.token) {
      setAuthToken(state.token);
      validateToken(state.token);
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.token, validateToken]);

  const login = async (email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      const response = await api.post('/auth/login', {
        email,
        password
      });

      const { token, user } = response.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setAuthToken(token);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Login failed'
      });
      return { success: false, error: error.response?.data?.message };
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'CLEAR_ERROR' });
      const response = await api.post('/auth/register', userData);

      const { token, user } = response.data;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setAuthToken(token);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token }
      });

      return { success: true };
    } catch (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error.response?.data?.message || 'Registration failed'
      });
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout
      }}
    >
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
