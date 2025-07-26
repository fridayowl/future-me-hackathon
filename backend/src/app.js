// backend/src/app.js
// Main Express application for Future Me backend with Fi MCP integration

const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const ProfileAnalyzer = require('./services/profileAnalyzer');
const GeminiService = require('./services/geminiService');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize services
const profileAnalyzer = new ProfileAnalyzer();
const geminiService = new GeminiService();

// Simple CORS middleware that works
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Future Me Backend with Fi MCP Integration'
  });
});

// ===== HELPER FUNCTIONS =====

// Helper function to ensure data has the required dataItems structure
function ensureDataItemsStructure(data) {
  // If it already has dataItems, return as-is
  if (data && data.dataItems) {
    return data;
  }

  // If it's null or undefined, create a basic structure
  if (!data) {
    return {
      dataItems: [
        {
          componentDescription: "Default financial data",
          netWorthSummary: {
            totalNetWorthValue: { units: "0" }
          }
        }
      ]
    };
  }

  // If it's already in dataItems format but not wrapped
  if (Array.isArray(data)) {
    return { dataItems: data };
  }

  // If it's a single object that looks like MCP data, wrap it
  if (typeof data === 'object') {
    // Check if it looks like Fi MCP tool result
    if (data.content || data.text || data.result) {
      return {
        dataItems: [
          {
            componentDescription: "Fi MCP tool result",
            mcpToolData: data
          }
        ]
      };
    }

    // Check if it looks like financial data directly
    if (data.netWorthSummary || data.creditReportData || data.epfAccountData) {
      return {
        dataItems: [data]
      };
    }

    // Otherwise, wrap the entire object
    return {
      dataItems: [
        {
          componentDescription: "Raw financial data",
          rawData: data
        }
      ]
    };
  }

  // If it's a string, try to parse it
  if (typeof data === 'string') {
    try {
      const parsed = JSON.parse(data);
      return ensureDataItemsStructure(parsed);
    } catch (parseError) {
      // If parsing fails, create a basic structure
      return {
        dataItems: [
          {
            componentDescription: "Text data",
            textData: data
          }
        ]
      };
    }
  }

  // Fallback: create a minimal structure
  return {
    dataItems: [
      {
        componentDescription: "Unknown data format",
        unknownData: data
      }
    ]
  };
}

// Helper function to transform Fi MCP response to our expected format
function transformFiMCPResponse(mcpResult) {
  console.log('Transforming Fi MCP response:', typeof mcpResult, mcpResult);
  
  try {
    // Handle different types of MCP responses
    if (mcpResult.content) {
      // If there's a content field, try to parse it
      if (typeof mcpResult.content === 'string') {
        try {
          const parsedContent = JSON.parse(mcpResult.content);
          return ensureDataItemsStructure(parsedContent);
        } catch (parseError) {
          console.log('Failed to parse MCP content as JSON:', parseError.message);
          return ensureDataItemsStructure(mcpResult.content);
        }
      } else if (typeof mcpResult.content === 'object') {
        return ensureDataItemsStructure(mcpResult.content);
      }
    }

    // If there's a text field
    if (mcpResult.text) {
      try {
        const parsedText = JSON.parse(mcpResult.text);
        return ensureDataItemsStructure(parsedText);
      } catch (parseError) {
        return ensureDataItemsStructure(mcpResult.text);
      }
    }

    // If it's already structured data
    if (mcpResult.dataItems) {
      return mcpResult;
    }

    // Otherwise, wrap the entire result
    return ensureDataItemsStructure(mcpResult);

  } catch (error) {
    console.error('Error transforming Fi MCP response:', error);
    return ensureDataItemsStructure(mcpResult);
  }
}

// ===== Fi MCP INTEGRATION ROUTES =====

// Check Fi MCP server health and connectivity
app.get('/api/mcp/health', async (req, res) => {
  try {
    const mcpServerUrl = process.env.FI_MCP_SERVER_URL || 'http://localhost:8080';
    
    // For Fi MCP server, we'll try the MCP stream endpoint 
    // which is the main communication channel
    const streamEndpoint = `${mcpServerUrl}/mcp/stream`;
    
    try {
      // Try to establish connection to MCP stream endpoint
      const response = await fetch(streamEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "initialize",
          params: {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
              name: "future-me-backend",
              version: "1.0.0"
            }
          }
        }),
        timeout: 5000
      });

      if (response.ok) {
        const data = await response.json();
        res.json({
          success: true,
          mcpServerUrl: mcpServerUrl,
          mcpStatus: 'available',
          protocolVersion: data.result?.protocolVersion || 'unknown',
          serverCapabilities: data.result?.capabilities || {},
          message: 'Fi MCP server is running and responding to MCP protocol'
        });
      } else {
        // If the server responds but with an error, it's still running
        res.json({
          success: true,
          mcpServerUrl: mcpServerUrl,
          mcpStatus: 'available',
          message: 'Fi MCP server is running (responds to requests)'
        });
      }

    } catch (fetchError) {
      // Check if the port is at least responding
      try {
        const portCheck = await fetch(mcpServerUrl, { 
          method: 'GET',
          timeout: 2000 
        });
        
        // If we get any response (even 404), the server is running
        res.json({
          success: true,
          mcpServerUrl: mcpServerUrl,
          mcpStatus: 'available',
          portStatus: portCheck.status,
          message: 'Fi MCP server is running on port 8080'
        });
        
      } catch (portError) {
        res.status(503).json({
          success: false,
          mcpServerUrl: mcpServerUrl,
          mcpStatus: 'unavailable',
          message: 'Fi MCP server is not responding'
        });
      }
    }

  } catch (error) {
    res.status(500).json({
      success: false,
      mcpServerUrl: process.env.FI_MCP_SERVER_URL,
      mcpStatus: 'error',
      message: `Error checking Fi MCP server: ${error.message}`
    });
  }
});

// Initialize MCP connection with Fi MCP server
app.post('/api/mcp/connect', async (req, res) => {
  try {
    const { userId, authToken } = req.body;

    if (!userId || !authToken) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId and authToken are required'
      });
    }

    const mcpServerUrl = process.env.FI_MCP_SERVER_URL || 'http://localhost:8080';
    const streamEndpoint = `${mcpServerUrl}/mcp/stream`;

    console.log('Initializing MCP connection to:', streamEndpoint);

    // Step 1: Initialize MCP protocol
    const initResponse = await fetch(streamEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {
            roots: {
              listChanged: true
            },
            sampling: {}
          },
          clientInfo: {
            name: "future-me-app",
            version: "1.0.0"
          }
        }
      })
    });

    if (!initResponse.ok) {
      throw new Error(`MCP initialization failed: HTTP ${initResponse.status}`);
    }

    const initData = await initResponse.json();
    
    if (initData.error) {
      throw new Error(`MCP error: ${initData.error.message}`);
    }

    // Generate session ID for tracking
    const sessionId = `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Store session info (in production, use Redis or database)
    // For now, we'll just return the session ID
    
    res.json({
      success: true,
      sessionId: sessionId,
      mcpProtocolVersion: initData.result?.protocolVersion,
      serverCapabilities: initData.result?.capabilities,
      serverInfo: initData.result?.serverInfo,
      message: 'Successfully connected to Fi MCP server'
    });

  } catch (error) {
    console.error('MCP connection error:', error);
    res.status(500).json({
      error: 'MCP connection failed',
      message: error.message
    });
  }
});

// Fetch and analyze financial data from Fi MCP server - FIXED VERSION
app.post('/api/mcp/analyze', async (req, res) => {
  try {
    const { sessionId, dataTypes } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing session ID',
        message: 'Active MCP session required'
      });
    }

    const mcpServerUrl = process.env.FI_MCP_SERVER_URL || 'http://localhost:8080';
    const streamEndpoint = `${mcpServerUrl}/mcp/stream`;

    console.log('Fetching financial data from Fi MCP for session:', sessionId);

    let financialData;
    let dataSource = 'sample_fallback'; // Default to sample

    try {
      // Step 1: List available tools from Fi MCP server
      const toolsResponse = await fetch(streamEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "tools/list",
          params: {}
        })
      });

      if (toolsResponse.ok) {
        const toolsData = await toolsResponse.json();
        console.log('Available Fi MCP tools:', toolsData.result?.tools);

        // Step 2: Try to call financial data tools
        if (toolsData.result?.tools && toolsData.result.tools.length > 0) {
          // Look for financial data tools
          const financialDataTool = toolsData.result.tools.find(tool => 
            tool.name.includes('financial') || 
            tool.name.includes('account') || 
            tool.name.includes('net_worth') ||
            tool.name.includes('fi_money') ||
            tool.name.includes('data')
          );

          if (financialDataTool) {
            console.log('Found financial data tool:', financialDataTool.name);
            
            // Call the financial data tool
            const dataResponse = await fetch(streamEndpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                jsonrpc: "2.0",
                id: 3,
                method: "tools/call",
                params: {
                  name: financialDataTool.name,
                  arguments: {
                    userId: sessionId.split('_')[1], // Extract user context
                    includeDetails: true
                  }
                }
              })
            });

            if (dataResponse.ok) {
              const toolResult = await dataResponse.json();
              if (toolResult.result && !toolResult.error) {
                // Transform Fi MCP tool response to our expected format
                financialData = transformFiMCPResponse(toolResult.result);
                dataSource = 'fi_mcp_live';
              } else {
                throw new Error('Fi MCP tool call failed: ' + (toolResult.error?.message || 'Unknown error'));
              }
            } else {
              throw new Error('Failed to call Fi MCP financial data tool');
            }
          } else {
            console.log('No financial data tools found, available tools:', toolsData.result.tools.map(t => t.name));
            throw new Error('No financial data tools available from Fi MCP server');
          }
        } else {
          throw new Error('No tools available from Fi MCP server');
        }
      } else {
        throw new Error(`Fi MCP tools/list failed: HTTP ${toolsResponse.status}`);
      }
    } catch (mcpError) {
      console.log('Fi MCP failed, using sample data:', mcpError.message);
      // Use sample data as fallback
      financialData = require('./data/fiMCPSample.json');
      dataSource = 'sample_fallback';
    }

    // Ensure the data has the required structure for ProfileAnalyzer
    if (!financialData || !financialData.dataItems) {
      console.log('Transforming data to expected format...');
      financialData = ensureDataItemsStructure(financialData);
    }

    console.log('Financial data structure:', {
      hasDataItems: !!financialData.dataItems,
      dataItemsCount: financialData.dataItems?.length || 0,
      dataSource: dataSource
    });

    // Analyze the data using existing profile analyzer
    const profileAnalysis = await profileAnalyzer.analyzeHumanProfile(financialData);

    res.json({
      success: true,
      profile: profileAnalysis,
      dataSource: dataSource,
      sessionId: sessionId,
      message: `Financial data analyzed successfully from ${dataSource}`
    });

  } catch (error) {
    console.error('MCP analysis error:', error);
    
    // Final fallback - always try sample data
    try {
      console.log('Attempting final fallback to sample data...');
      const sampleData = require('./data/fiMCPSample.json');
      
      // Ensure sample data has correct structure
      const validSampleData = ensureDataItemsStructure(sampleData);
      const profileAnalysis = await profileAnalyzer.analyzeHumanProfile(validSampleData);
      
      res.json({
        success: true,
        profile: profileAnalysis,
        dataSource: 'sample_emergency_fallback',
        sessionId: req.body.sessionId,
        warning: `Fi MCP connection failed, used sample data: ${error.message}`,
        message: 'Financial data analyzed using sample data (emergency fallback)'
      });
    } catch (fallbackError) {
      console.error('Even sample data failed:', fallbackError);
      res.status(500).json({
        error: 'Financial analysis failed',
        message: `Fi MCP failed: ${error.message}. Sample data also failed: ${fallbackError.message}`,
        debug: {
          originalError: error.message,
          fallbackError: fallbackError.message,
          sessionId: req.body.sessionId
        }
      });
    }
  }
});

// Disconnect from Fi MCP server
app.post('/api/mcp/disconnect', async (req, res) => {
  try {
    const { sessionId } = req.body;

    console.log('Disconnecting MCP session:', sessionId);

    // In a real implementation, you would close the MCP connection here
    // For now, just acknowledge the disconnection

    res.json({
      success: true,
      message: 'Disconnected from Fi MCP'
    });

  } catch (error) {
    console.error('MCP disconnection error:', error);
    res.status(500).json({
      error: 'Disconnection failed',
      message: error.message
    });
  }
});

// Debug endpoint to test Fi MCP communication
app.post('/api/mcp/debug', async (req, res) => {
  try {
    const mcpServerUrl = process.env.FI_MCP_SERVER_URL || 'http://localhost:8080';
    const streamEndpoint = `${mcpServerUrl}/mcp/stream`;

    // Test basic MCP initialize call
    const response = await fetch(streamEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: {
            name: "future-me-debug",
            version: "1.0.0"
          }
        }
      })
    });

    const responseText = await response.text();
    
    res.json({
      mcpServerUrl: mcpServerUrl,
      endpoint: streamEndpoint,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      responseBody: responseText,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      error: error.message,
      mcpServerUrl: process.env.FI_MCP_SERVER_URL || 'http://localhost:8080',
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint to check data structure
app.get('/api/mcp/test-data-structure', (req, res) => {
  try {
    const sampleData = require('./data/fiMCPSample.json');
    
    res.json({
      sampleDataStructure: {
        hasDataItems: !!sampleData.dataItems,
        dataItemsCount: sampleData.dataItems?.length || 0,
        dataItemsTypes: sampleData.dataItems?.map(item => 
          Object.keys(item).filter(key => key !== 'componentDescription')
        ) || [],
        sampleFirstItem: sampleData.dataItems?.[0] || null
      },
      transformedSample: ensureDataItemsStructure({ test: 'data' }),
      message: 'Data structure test completed'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Test failed',
      message: error.message
    });
  }
});

// ===== EXISTING ROUTES (for backward compatibility) =====

// Sample Fi MCP Data Route
app.get('/api/sample-data', (req, res) => {
  try {
    const sampleData = require('./data/fiMCPSample.json');
    res.json({
      success: true,
      data: sampleData,
      message: 'Sample Fi MCP data retrieved'
    });
  } catch (error) {
    console.error('Error loading sample data:', error);
    res.status(500).json({
      error: 'Failed to load sample data',
      message: 'Sample data file not found or invalid'
    });
  }
});

// Profile Analysis Routes (existing - for file uploads)
app.post('/api/profile/analyze', async (req, res) => {
  try {
    console.log('Received profile analysis request');
    const fiMCPData = req.body;
    
    if (!fiMCPData || !fiMCPData.dataItems) {
      return res.status(400).json({
        error: 'Invalid Fi MCP data format',
        message: 'Request body must contain Fi MCP data with dataItems array'
      });
    }

    const profileAnalysis = await profileAnalyzer.analyzeHumanProfile(fiMCPData);
    
    res.json({
      success: true,
      profile: profileAnalysis,
      message: 'Profile analysis completed successfully'
    });

  } catch (error) {
    console.error('Profile analysis error:', error);
    res.status(500).json({
      error: 'Profile analysis failed',
      message: error.message
    });
  }
});

// Future Me Chat Route
app.post('/api/chat/future-me', async (req, res) => {
  try {
    console.log('Received Future Me chat request');
    const { message, currentAge, futureAge, userProfile } = req.body;

    if (!message || !currentAge || !futureAge || !userProfile) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Request must include message, currentAge, futureAge, and userProfile'
      });
    }

    if (futureAge <= currentAge) {
      return res.status(400).json({
        error: 'Invalid age parameters',
        message: 'Future age must be greater than current age'
      });
    }

    const futureMeResponse = await geminiService.generateFutureMeResponse(
      message, 
      currentAge, 
      futureAge, 
      userProfile
    );

    res.json({
      success: true,
      ...futureMeResponse,
      message: 'Future Me response generated successfully'
    });

  } catch (error) {
    console.error('Future Me chat error:', error);
    res.status(500).json({
      error: 'Failed to generate Future Me response',
      message: error.message
    });
  }
});

// Council of Yous Route
app.post('/api/chat/council', async (req, res) => {
  try {
    console.log('Received Council of Yous request');
    const { message, userProfile, ages } = req.body;

    if (!message || !userProfile || !ages) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Request must include message, userProfile, and ages array'
      });
    }

    // Generate responses from multiple age personas
    const councilResponses = await Promise.all(
      ages.map(async (age) => {
        const response = await geminiService.generateFutureMeResponse(
          message,
          userProfile.demographics?.estimatedAge || 25,
          age,
          userProfile
        );
        return {
          age: age,
          response: response.response
        };
      })
    );

    res.json({
      success: true,
      councilResponses: councilResponses,
      message: 'Council of Yous responses generated successfully'
    });

  } catch (error) {
    console.error('Council generation error:', error);
    res.status(500).json({
      error: 'Failed to generate Council responses',
      message: error.message
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Future Me Backend with Fi MCP running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 Fi MCP Server: ${process.env.FI_MCP_SERVER_URL || 'http://localhost:8080'}`);
  console.log(`🤖 Google AI API Key: ${process.env.GOOGLE_AI_API_KEY ? 'Configured' : 'Missing!'}`);
  
  // Test Fi MCP server on startup
  const mcpServerUrl = process.env.FI_MCP_SERVER_URL || 'http://localhost:8080';
  
  console.log(`\n🔍 Testing Fi MCP server connection...`);
  
  // Simple port connectivity test
  fetch(mcpServerUrl, { method: 'GET', timeout: 3000 })
    .then(response => {
      console.log(`✅ Fi MCP server is responding on ${mcpServerUrl} (HTTP ${response.status})`);
      console.log(`🔗 MCP stream endpoint: ${mcpServerUrl}/mcp/stream`);
    })
    .catch(error => {
      console.log(`❌ Cannot reach Fi MCP server at ${mcpServerUrl}: ${error.message}`);
      console.log(`💡 Make sure Fi MCP server is running: go run . (in fi-mcp-dev directory)`);
    });
});

module.exports = app;