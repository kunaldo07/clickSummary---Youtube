import { apiService } from './apiService';

class AuthService {
  async signInWithGoogle(credential) {
    try {
      const response = await apiService.post('/auth/google', { 
        credential 
      });
      return response.data;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const response = await apiService.post('/auth/signout');
      return response.data;
    } catch (error) {
      console.error('Sign-out error:', error);
      throw error;
    }
  }

  async verifyToken() {
    try {
      const response = await apiService.get('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  }

  async refreshToken() {
    try {
      const response = await apiService.post('/auth/refresh');
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  getStoredToken() {
    return localStorage.getItem('youtube_summarizer_token');
  }

  getStoredUser() {
    const userData = localStorage.getItem('youtube_summarizer_user');
    return userData ? JSON.parse(userData) : null;
  }

  clearStoredAuth() {
    localStorage.removeItem('youtube_summarizer_token');
    localStorage.removeItem('youtube_summarizer_user');
  }

  isAuthenticated() {
    const token = this.getStoredToken();
    const user = this.getStoredUser();
    return !!(token && user);
  }
}

export const authService = new AuthService();
