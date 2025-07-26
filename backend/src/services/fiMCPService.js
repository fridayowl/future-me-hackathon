class FiMCPService {
  constructor() {
    this.mcpServerUrl = process.env.FI_MCP_SERVER_URL || 'http://localhost:8080';
    this.mcpStreamEndpoint = '/mcp/stream';
  }

  /**
   * Initialize MCP connection
   * This follows the MCP remote connection pattern
   */
  async initializeMCPConnection(userId, authToken) {
    try {
      // Initialize MCP remote connection
      const connectionResponse = await fetch(`${this.mcpServerUrl}${this.mcpStreamEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          method: 'initialize',
          params: {
            userId: userId,
            capabilities: ['financial_data', 'profile_analysis']
          }
        })
      });

      if (!connectionResponse.ok) {
        throw new Error(`MCP connection failed: ${connectionResponse.status}`);
      }

      const connectionData = await connectionResponse.json();
      return {
        success: true,
        sessionId: connectionData.sessionId,
        capabilities: connectionData.capabilities
      };

    } catch (error) {
      console.error('Fi MCP connection error:', error);
      throw new Error(`Failed to connect to Fi MCP: ${error.message}`);
    }
  }

  /**
   * Fetch user's financial data from Fi MCP
   */
  async fetchFinancialData(sessionId, dataTypes = ['all']) {
    try {
      const response = await fetch(`${this.mcpServerUrl}${this.mcpStreamEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'call_tool',
          params: {
            sessionId: sessionId,
            name: 'get_financial_data',
            arguments: {
              data_types: dataTypes,
              include_details: true
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Fi MCP data fetch failed: ${response.status}`);
      }

      const mcpResponse = await response.json();
      
      // Transform MCP response to match existing data structure
      return this.transformMCPDataToFiFormat(mcpResponse.result);

    } catch (error) {
      console.error('Fi MCP data fetch error:', error);
      throw new Error(`Failed to fetch data from Fi MCP: ${error.message}`);
    }
  }

  /**
   * Transform MCP response to Fi Money JSON format
   * This ensures compatibility with existing analysis code
   */
  transformMCPDataToFiFormat(mcpData) {
    return {
      dataItems: [
        // Net Worth Summary
        {
          componentDescription: "Retrieve net worth summary of the user",
          netWorthSummary: mcpData.netWorth || {
            totalNetWorthValue: { units: "0" },
            totalAssetsValue: { units: "0" },
            totalLiabilitiesValue: { units: "0" }
          }
        },
        // Credit Report Data
        {
          componentDescription: "Retrieve credit report data for the user",
          creditReportData: mcpData.creditReport || {
            creditReports: [{
              creditReportData: {
                score: { bureauScore: "0" },
                creditAccount: {
                  creditAccountSummary: {
                    totalOutstandingBalance: { outstandingBalanceAll: "0" }
                  }
                }
              }
            }]
          }
        },
        // EPF Account Data
        {
          componentDescription: "Retrieve EPF account details",
          epfAccountData: mcpData.epfData || {
            uanAccounts: [{
              rawDetails: {
                est_details: [{
                  est_name: "Unknown",
                  doj_epf: "01/01/2020"
                }]
              }
            }]
          }
        },
        // Investment Declarations
        {
          componentDescription: "Retrieve details of manually connected assets on fi app",
          investmentDeclarations: mcpData.investments || {}
        }
      ]
    };
  }

  /**
   * Close MCP connection
   */
  async closeMCPConnection(sessionId) {
    try {
      await fetch(`${this.mcpServerUrl}${this.mcpStreamEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method: 'close_session',
          params: {
            sessionId: sessionId
          }
        })
      });
    } catch (error) {
      console.error('Error closing MCP connection:', error);
    }
  }
}

module.exports = FiMCPService;