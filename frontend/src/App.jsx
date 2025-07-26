/* eslint-disable no-unused-vars */

import React, { useState } from 'react';
import MCPConnection from './components/MCPConnection';
import ProfileAnalysis from './components/profileAnalysis';
import ChatInterface from './components/ChatInterface';
import PersonaSelector from './components/personaSelector';
import { apiService } from './services/api';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState('connection'); // 'connection', 'profile', 'chat'
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mcpConnected, setMcpConnected] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [mcpSessionId, setMcpSessionId] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState({ age: 40, characteristics: null });

  // Handle MCP connection status changes
  const handleConnectionChange = (connected, sessionId) => {
    setMcpConnected(connected);
    setMcpSessionId(sessionId);
    if (!connected) {
      setCurrentStep('connection');
      setUserProfile(null);
    }
  };

  // Load sample data for demo (fallback option)
  const loadSampleData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const sampleData = await apiService.getSampleData();
      const profileAnalysis = await apiService.analyzeProfile(sampleData.data);
      
      setUserProfile(profileAnalysis.profile);
      setCurrentStep('chat');
      
    } catch (err) {
      setError(`Failed to load sample data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // FIXED: Handle both raw data and already-analyzed profiles
  const analyzeProfile = async (profileData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Check if the data is already analyzed (has basicInfo, behaviorAnalysis, etc.)
      if (profileData.basicInfo || profileData.demographics || profileData.financialSummary) {
        console.log('Received already-analyzed profile data');
        setUserProfile(profileData);
        setCurrentStep('chat');
        return;
      }

      // If it's raw Fi MCP data, analyze it
      if (profileData.dataItems) {
        console.log('Analyzing raw Fi MCP data');
        const profileAnalysis = await apiService.analyzeProfile(profileData);
        setUserProfile(profileAnalysis.profile);
        setCurrentStep('chat');
        return;
      }

      // If it's some other format, try to analyze it anyway
      console.log('Attempting to analyze unknown data format');
      const profileAnalysis = await apiService.analyzeProfile(profileData);
      setUserProfile(profileAnalysis.profile);
      setCurrentStep('chat');
      
    } catch (err) {
      setError(`Profile analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToConnection = () => {
    setCurrentStep('connection');
    setUserProfile(null);
    setError(null);
  };

  const resetToProfile = () => {
    setCurrentStep('profile');
    setUserProfile(null);
    setError(null);
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>Future Me</h1>
        <p>AI-powered financial conversations with your future self</p>
        {mcpConnected && (
          <div className="connection-indicator">
            <span className="status-dot connected"></span>
            <span>Connected to Fi MCP</span>
          </div>
        )}
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <span>{error}</span>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {currentStep === 'connection' && (
          <MCPConnection
            onAnalyzeProfile={analyzeProfile}
            onConnectionChange={handleConnectionChange}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'profile' && (
          <ProfileAnalysis
            onAnalyzeProfile={analyzeProfile}
            onLoadSample={loadSampleData}
            isLoading={isLoading}
          />
        )}

        {currentStep === 'chat' && userProfile && (
          <ChatInterface
            userProfile={userProfile}
            onReset={resetToConnection}
            selectedPersona={selectedPersona}
            setSelectedPersona={setSelectedPersona}
          />
        )}

        {/* Navigation */}
        <div className="app-navigation">
          {currentStep !== 'connection' && (
            <button
              className="nav-button"
              onClick={resetToConnection}
              disabled={isLoading}
            >
              ← Back to Connection
            </button>
          )}
          
          {mcpConnected && currentStep === 'connection' && (
            <button
              className="nav-button secondary"
              onClick={() => setCurrentStep('profile')}
              disabled={isLoading}
            >
              Use File Upload Instead
            </button>
          )}
        </div>
      </main>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>
            {currentStep === 'connection' ? 'Connecting to Fi MCP...' :
             currentStep === 'profile' ? 'Analyzing your financial profile...' :
             'Processing...'}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;