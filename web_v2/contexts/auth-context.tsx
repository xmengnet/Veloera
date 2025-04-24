import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

interface User {
  id: number;
  username: string;
  display_name: string;
  role: number;
  status: number;
  email: string;
  quota: number;
  used_quota: number;
  request_count: number;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (username: string, password: string, email?: string, verificationCode?: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => false,
  register: async () => false,
  logout: () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Check if user is authenticated on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userId = localStorage.getItem('userId');
        
        if (userId) {
          const response = await api.get<User>('/api/user/self');
          
          if (response.success && response.data) {
            setUser(response.data);
          } else {
            // Clear invalid user data
            localStorage.removeItem('userId');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/api/user/login', { username, password });
      
      if (response.success && response.data) {
        // Save user ID to localStorage
        localStorage.setItem('userId', response.data.id.toString());
        
        // Update user state
        setUser(response.data);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // Register function
  const register = async (
    username: string, 
    password: string, 
    email?: string, 
    verificationCode?: string
  ): Promise<boolean> => {
    try {
      const registerData: any = { username, password };
      
      // Add optional fields if provided
      if (email) registerData.email = email;
      if (verificationCode) registerData.verification_code = verificationCode;
      
      const response = await api.post('/api/user/register', registerData);
      
      return response.success;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  // Logout function
  const logout = () => {
    // Clear user data
    localStorage.removeItem('userId');
    setUser(null);
    
    // Redirect to home page
    router.push('/');
  };

  // Refresh user data
  const refreshUser = async () => {
    try {
      const response = await api.get<User>('/api/user/self');
      
      if (response.success && response.data) {
        setUser(response.data);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
