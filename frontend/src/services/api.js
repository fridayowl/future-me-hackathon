// frontend/src/services/api.js
// API service for communicating with Future Me backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
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
        const errorData = await response.json();
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

  // Health check
  async healthCheck() {
    return this.request('/health');
  }

  // Get sample Fi MCP data
  async getSampleData() {
    return this.request('/api/sample-data');
  }

  // Analyze user profile from Fi MCP data
  async analyzeProfile(fiMCPData) {
    return this.request('/api/profile/analyze', {
      method: 'POST',
      body: fiMCPData,
    });
  }

  // Chat with Future Me
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

  // Generate Council of Yous conversation
  async generateCouncil(message, userProfile, ages = [30, 40, 60]) {
    return this.request('/api/chat/council', {
      method: 'POST',
      body: {
        message,
        userProfile,
        ages,
      },
    });
  }

  // Generate persona characteristics for specific age
  async generatePersona(age, userProfile) {
    const queryParams = new URLSearchParams({
      profile: JSON.stringify(userProfile),
    });
    
    return this.request(`/api/persona/generate/${age}?${queryParams}`);
  }

  // Batch generate personas for multiple ages
  async generateMultiplePersonas(ages, userProfile) {
    const promises = ages.map(age => this.generatePersona(age, userProfile));
    
    try {
      const results = await Promise.allSettled(promises);
      
      return results.reduce((acc, result, index) => {
        if (result.status === 'fulfilled') {
          acc[ages[index]] = result.value.persona;
        } else {
          console.error(`Failed to generate persona for age ${ages[index]}:`, result.reason);
          acc[ages[index]] = null;
        }
        return acc;
      }, {});
      
    } catch (error) {
      console.error('Batch persona generation failed:', error);
      throw error;
    }
  }

  // Helper method to validate API connectivity
  async validateConnection() {
    try {
      await this.healthCheck();
      console.log('✅ Backend connection successful');
      return true;
    } catch (error) {
      console.error('❌ Backend connection failed:', error);
      return false;
    }
  }

  // Helper method to format financial numbers
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  // Helper method to calculate age from employment date
  calculateAgeFromEmployment(employmentDate, assumedStartAge = 22) {
    if (!employmentDate) return null;
    
    const startYear = parseInt(employmentDate.split('-')[2]);
    const currentYear = new Date().getFullYear();
    const workingYears = currentYear - startYear;
    
    return assumedStartAge + workingYears;
  }

  // Helper method to extract basic info from Fi MCP data
  extractBasicInfo(fiMCPData) {
    try {
      const netWorthItem = fiMCPData.dataItems?.find(item => item.netWorthSummary);
      const creditItem = fiMCPData.dataItems?.find(item => item.creditReportData);
      const epfItem = fiMCPData.dataItems?.find(item => item.epfAccountData);

      return {
        netWorth: parseInt(netWorthItem?.netWorthSummary?.totalNetWorthValue?.units || "0"),
        creditScore: parseInt(creditItem?.creditReportData?.creditReports?.[0]?.creditReportData?.score?.bureauScore || "0"),
        totalDebt: parseInt(creditItem?.creditReportData?.creditReports?.[0]?.creditReportData?.creditAccount?.creditAccountSummary?.totalOutstandingBalance?.outstandingBalanceAll || "0"),
        employer: epfItem?.epfAccountData?.uanAccounts?.[0]?.rawDetails?.est_details?.[0]?.est_name || "Unknown",
        employmentDate: epfItem?.epfAccountData?.uanAccounts?.[0]?.rawDetails?.est_details?.[0]?.doj_epf,
      };
    } catch (error) {
      console.error('Error extracting basic info:', error);
      return null;
    }
  }
}

// Create and export singleton instance
export const apiService = new ApiService();

// Export class for testing or multiple instances
export default ApiService;