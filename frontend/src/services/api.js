class ApiService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.mcpServerURL = 'http://localhost:8080'; // Direct connection for health checks
  }

  // Generic request method
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      console.log(`Making request to: ${url}`);
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data);
      return data;

    } catch (error) {
      console.error('API Request failed:', error);
      throw error;
    }
  }

  // Existing methods
  async healthCheck() {
    return this.request('/health');
  }

  async getSampleData() {
    return this.request('/api/sample-data');
  }

  async analyzeProfile(fiMCPData) {
    return this.request('/api/profile/analyze', {
      method: 'POST',
      body: fiMCPData,
    });
  }

  async chatWithFutureMe(message, currentAge, futureAge, userProfile) {
    return this.request('/api/chat/future-me', {
      method: 'POST',
      body: {
        message,
        currentAge,
        futureAge,
        userProfile,
      },
    });
  }

  // MCP-specific methods - FIXED TO USE CORRECT BACKEND ROUTES
  async connectToMCP(userId, authToken) {
    return this.request('/api/mcp/connect', {
      method: 'POST',
      body: {
        userId,
        authToken,
      },
    });
  }

  async analyzeMCPData(sessionId, dataTypes = ['all']) {
    return this.request('/api/mcp/analyze', {
      method: 'POST',
      body: {
        sessionId,
        dataTypes,
      },
    });
  }

  async disconnectFromMCP(sessionId) {
    return this.request('/api/mcp/disconnect', {
      method: 'POST',
      body: {
        sessionId,
      },
    });
  }

  // Check MCP server health through backend
  async checkMCPHealth() {
    try {
      return await this.request('/api/mcp/health');
    } catch (error) {
      console.error('MCP health check failed:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  // Direct Fi MCP server health check (optional)
  async checkMCPServerDirect() {
    try {
      const response = await fetch(`${this.mcpServerURL}/health`);
      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Fi MCP server is running' : 'Fi MCP server unavailable'
      };
    } catch (error) {
      return {
        success: false,
        message: `Cannot reach Fi MCP server at ${this.mcpServerURL}: ${error.message}`
      };
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();
export default ApiService;
