// backend/src/app.js
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
    service: 'Future Me Backend'
  });
});

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

// Profile Analysis Routes
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Future Me Backend running on port ${PORT}`);
  console.log(`📱 Health check: http://localhost:${PORT}/health`);
  console.log(`🤖 Google AI API Key: ${process.env.GOOGLE_AI_API_KEY ? 'Configured' : 'Missing!'}`);
});

module.exports = app;