const express = require('express');
const FiMCPService = require('../services/fiMCPService');
const ProfileAnalyzer = require('../services/profileAnalyzer');

const router = express.Router();
const fiMCPService = new FiMCPService();
const profileAnalyzer = new ProfileAnalyzer();

// Initialize MCP connection
router.post('/connect', async (req, res) => {
  try {
    const { userId, authToken } = req.body;

    if (!userId || !authToken) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'userId and authToken are required'
      });
    }

    const connection = await fiMCPService.initializeMCPConnection(userId, authToken);
    
    res.json({
      success: true,
      sessionId: connection.sessionId,
      capabilities: connection.capabilities,
      message: 'Successfully connected to Fi MCP'
    });

  } catch (error) {
    console.error('MCP connection error:', error);
    res.status(500).json({
      error: 'MCP connection failed',
      message: error.message
    });
  }
});

// Fetch and analyze financial data
router.post('/analyze', async (req, res) => {
  try {
    const { sessionId, dataTypes } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        error: 'Missing session ID',
        message: 'Active MCP session required'
      });
    }

    // Fetch data from Fi MCP
    const financialData = await fiMCPService.fetchFinancialData(sessionId, dataTypes);
    
    // Analyze the data using existing profile analyzer
    const profileAnalysis = await profileAnalyzer.analyzeHumanProfile(financialData);

    res.json({
      success: true,
      profile: profileAnalysis,
      rawData: financialData,
      message: 'Financial data analyzed successfully'
    });

  } catch (error) {
    console.error('MCP analysis error:', error);
    res.status(500).json({
      error: 'Financial analysis failed',
      message: error.message
    });
  }
});

// Disconnect from MCP
router.post('/disconnect', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (sessionId) {
      await fiMCPService.closeMCPConnection(sessionId);
    }

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

module.exports = router;