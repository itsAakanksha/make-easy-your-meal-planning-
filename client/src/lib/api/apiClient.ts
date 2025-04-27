import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Create axios instance with default config
const axiosInstance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // To handle cookies/sessions
});

// Request interceptor for API calls
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
axiosInstance.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh token
        const refreshResponse = await axiosInstance.post('/users/refresh-token');
        const { token } = refreshResponse.data;
        
        if (token) {
          localStorage.setItem('auth_token', token);
          axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
          return axiosInstance(originalRequest);
        }
      } catch (refreshError) {
        // If refresh token fails, redirect to login
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Type-safe wrapper functions
const apiClient = {
  get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.get(url, config) as unknown as Promise<T>,
    
  post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.post(url, data, config) as unknown as Promise<T>,
    
  put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.put(url, data, config) as unknown as Promise<T>,
    
  patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.patch(url, data, config) as unknown as Promise<T>,
    
  delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => 
    axiosInstance.delete(url, config) as unknown as Promise<T>,
};

export default apiClient;