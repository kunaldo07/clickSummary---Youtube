import axios from 'axios';
import config from '../config/environment';

// API Configuration - Optimized for speed with environment awareness
const API_CONFIG = {
  BASE_URL: config.API_URL,
  TIMEOUT: 5000,  // Reduced timeout for faster responses
  RETRY_ATTEMPTS: 2,  // Fewer retries for speed
  RETRY_DELAY: 500   // Faster retry delay
};

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor - Add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('youtube_summarizer_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add timestamp for cache busting
        config.metadata = { startTime: new Date() };
        
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors and retries
    this.client.interceptors.response.use(
      (response) => {
        const duration = new Date() - response.config.metadata.startTime;
        console.log(`✅ API Response: ${response.status} ${response.config.url} (${duration}ms)`);
        return response;
      },
      async (error) => {
        const duration = error.config?.metadata ? new Date() - error.config.metadata.startTime : 0;
        console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.url} (${duration}ms)`, error.response?.data);

        // Handle authentication errors (but be less aggressive during initialization)
        if (error.response?.status === 401) {
          console.warn('🔒 Authentication error detected');
          
          // Only clear auth and redirect for specific routes, not during token verification
          const isTokenVerification = error.config?.url?.includes('/auth/me');
          const isAuthRoute = error.config?.url?.includes('/auth/');
          
          if (!isTokenVerification && !isAuthRoute) {
            console.warn('🔒 Clearing session due to auth failure');
            this.clearAuth();
            window.location.href = '/signin';
          }
          
          return Promise.reject(error);
        }

        // Handle network errors with retry
        if (this.shouldRetry(error)) {
          return this.retryRequest(error);
        }

        return Promise.reject(error);
      }
    );
  }

  shouldRetry(error) {
    // Retry on network errors or 5xx server errors
    return (
      !error.response || 
      error.code === 'NETWORK_ERROR' ||
      error.code === 'ECONNABORTED' ||
      (error.response.status >= 500 && error.response.status <= 599)
    );
  }

  async retryRequest(error) {
    const config = error.config;
    
    if (!config.retryCount) {
      config.retryCount = 0;
    }

    if (config.retryCount >= API_CONFIG.RETRY_ATTEMPTS) {
      return Promise.reject(error);
    }

    config.retryCount += 1;
    
    console.log(`🔄 Retrying API request (${config.retryCount}/${API_CONFIG.RETRY_ATTEMPTS}): ${config.url}`);

    // Exponential backoff
    const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, config.retryCount - 1);
    await new Promise(resolve => setTimeout(resolve, delay));

    return this.client(config);
  }

  clearAuth() {
    localStorage.removeItem('youtube_summarizer_token');
    localStorage.removeItem('youtube_summarizer_user');
  }

  // HTTP Methods
  async get(url, config = {}) {
    try {
      const response = await this.client.get(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async patch(url, data = {}, config = {}) {
    try {
      const response = await this.client.patch(url, data, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(url, config);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Health check
  async checkHealth() {
    try {
      const response = await this.client.get('/health');
      return {
        healthy: true,
        status: response.data.status,
        timestamp: response.data.timestamp
      };
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  // Error handling
  handleError(error) {
    if (error.response) {
      // Server responded with error status
      const errorMessage = error.response.data?.message || error.response.data?.error || error.message;
      return new Error(errorMessage);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Network error: Unable to reach the server');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }

  // Upload file
  async uploadFile(url, file, onProgress = () => {}) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await this.client.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Download file
  async downloadFile(url, filename) {
    try {
      const response = await this.client.get(url, {
        responseType: 'blob'
      });

      // Create blob link to download
      const href = URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);

      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }
}

export const apiService = new ApiService();
