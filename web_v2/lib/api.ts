import { redirect } from 'next/navigation';

interface ApiOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
}

interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}

// Get user ID from localStorage
const getUserId = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('userId');
  }
  return null;
};

// Create API client with authentication handling
const api = {
  fetch: async <T = any>(endpoint: string, options: ApiOptions = {}): Promise<ApiResponse<T>> => {
    const userId = getUserId();
    const isApiEndpoint = endpoint.startsWith('/api/');
    
    // Set default headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add Veloera-User header for authenticated API requests
    if (isApiEndpoint && userId) {
      headers['Veloera-User'] = userId;
    }
    
    // Prepare request options
    const requestOptions: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: 'include', // Include cookies
    };
    
    // Add body for non-GET requests
    if (options.body && requestOptions.method !== 'GET') {
      requestOptions.body = JSON.stringify(options.body);
    }
    
    try {
      const response = await fetch(endpoint, requestOptions);
      
      // Handle 401 Unauthorized
      if (response.status === 401) {
        // Get current path for redirect after login
        const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
        
        // Redirect to login page with next parameter
        redirect(`/login?next=${encodeURIComponent(currentPath)}`);
      }
      
      // Parse response
      const data = await response.json();
      return data as ApiResponse<T>;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        message: 'Network error',
        data: null as unknown as T,
      };
    }
  },
  
  // Convenience methods for different HTTP methods
  get: <T = any>(endpoint: string, options: Omit<ApiOptions, 'method' | 'body'> = {}) => {
    return api.fetch<T>(endpoint, { ...options, method: 'GET' });
  },
  
  post: <T = any>(endpoint: string, body: any, options: Omit<ApiOptions, 'method' | 'body'> = {}) => {
    return api.fetch<T>(endpoint, { ...options, method: 'POST', body });
  },
  
  put: <T = any>(endpoint: string, body: any, options: Omit<ApiOptions, 'method' | 'body'> = {}) => {
    return api.fetch<T>(endpoint, { ...options, method: 'PUT', body });
  },
  
  delete: <T = any>(endpoint: string, options: Omit<ApiOptions, 'method'> = {}) => {
    return api.fetch<T>(endpoint, { ...options, method: 'DELETE' });
  },
  
  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const userId = getUserId();
    
    if (!userId) {
      return false;
    }
    
    try {
      const response = await api.get('/api/user/self');
      return response.success;
    } catch (error) {
      return false;
    }
  },
};

export default api;
