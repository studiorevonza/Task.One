// API Service for tasq.one
const API_BASE_URL = 'http://localhost:3001/api';

class ApiService {
  private token: string | null;

  constructor() {
    this.token = localStorage.getItem('authToken');
  }

  // Set authentication token
  setAuthToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  // Get authentication headers
  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  // Generic API request method
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: this.getAuthHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      
      // If it's a network error or connection refused, provide helpful message
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please make sure the backend is running.');
      }
      
      // Handle specific API errors
      if (error.message.includes('ECONNREFUSED')) {
        throw new Error('Database connection failed. Using local storage fallback.');
      }
      
      throw error;
    }
  }

  // Authentication endpoints
  async login(email, password) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.success && response.data.token) {
      this.setAuthToken(response.data.token);
    }
    
    return response;
  }

  async register(name, email, password) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    
    if (response.success && response.data.token) {
      this.setAuthToken(response.data.token);
    }
    
    return response;
  }

  async getProfile() {
    return await this.request('/auth/profile');
  }

  async getUserProfile(userId) {
    return await this.request(`/users/${userId}/profile`);
  }

  async getUserAnalytics(userId) {
    return await this.request(`/users/${userId}/analytics`);
  }

  async getUserSecuritySettings(userId) {
    return await this.request(`/users/${userId}/security`);
  }

  async updateUserProfile(userId, profileData) {
    return await this.request(`/users/${userId}/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async updateUserSecuritySettings(userId, securityData) {
    return await this.request(`/users/${userId}/security`, {
      method: 'PUT',
      body: JSON.stringify(securityData)
    });
  }

  async updateProfile(userData) {
    return await this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }

  // Task endpoints
  async getTasks(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/tasks${queryParams ? `?${queryParams}` : ''}`;
    return await this.request(endpoint);
  }

  async getTask(id) {
    return await this.request(`/tasks/${id}`);
  }

  async createTask(taskData) {
    return await this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  async updateTask(id, taskData) {
    return await this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    });
  }

  async deleteTask(id) {
    return await this.request(`/tasks/${id}`, {
      method: 'DELETE'
    });
  }

  async getTaskStats() {
    return await this.request('/tasks/stats/overview');
  }

  // Project endpoints
  async getProjects() {
    return await this.request('/projects');
  }

  async getProject(id) {
    return await this.request(`/projects/${id}`);
  }

  async createProject(projectData) {
    return await this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async updateProject(id, projectData) {
    return await this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(id) {
    return await this.request(`/projects/${id}`, {
      method: 'DELETE'
    });
  }

  async getProjectStats(id) {
    return await this.request(`/projects/${id}/stats`);
  }

  // Time tracking endpoints
  async getTimeEntries(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = `/time${queryParams ? `?${queryParams}` : ''}`;
    return await this.request(endpoint);
  }

  // Categories endpoints
  async getCategories() {
    return await this.request('/categories');
  }

  // Tags endpoints
  async getTags() {
    return await this.request('/tags');
  }

  // Logout
  logout() {
    this.setAuthToken(null);
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;