import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiFetch } from '../lib/api';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  dbUser: any | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      fetchUser(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchUser = async (token: string) => {
    try {
      const response = await apiFetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setDbUser(data);
        setUser({ id: data.id, email: data.email });
        setIsAdmin(data.is_admin === 1);
      } else {
        localStorage.removeItem('auth_token');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const response = await apiFetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    let isJson = response.headers.get('content-type')?.includes('application/json');
    let data: any = {};
    
    if (isJson) {
      data = await response.json().catch(() => ({}));
    } else {
      await response.text().catch(() => '');
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      throw new Error('Server returned HTML instead of JSON. The route might have been redirected or intercepted.');
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Signin failed');
    }
    
    const { token, user } = data;
    localStorage.setItem('auth_token', token);
    setUser(user);
    fetchUser(token);
  };

  const signUp = async (email: string, password: string) => {
    const response = await apiFetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    let isJson = response.headers.get('content-type')?.includes('application/json');
    let data: any = {};
    
    if (isJson) {
      data = await response.json().catch(() => ({}));
    } else {
      await response.text().catch(() => '');
      if (!response.ok) throw new Error(`Server error: ${response.status}`);
      throw new Error('Server returned HTML instead of JSON. The route might have been redirected or intercepted.');
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || 'Signup failed');
    }
    
    const { token, user } = data;
    localStorage.setItem('auth_token', token);
    setUser(user);
    fetchUser(token);
  };

  const signOut = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setDbUser(null);
    setIsAdmin(false);
  };

  const refreshUser = async () => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      await fetchUser(token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, dbUser, isAdmin, isLoading, signIn, signUp, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
