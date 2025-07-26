// frontend/src/App.jsx
// Main React application for Future Me frontend

import React, { useState } from 'react';
import ProfileAnalysis from './components/profileAnalysis';
import ChatInterface from './components/ChatInterface';
import PersonaSelector from './components/personaSelector';
import { apiService } from './services/api';
import './App.css';

function App() {
  const [currentStep, setCurrentStep] = useState('profile'); // 'profile', 'chat'
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState({ age: 40, characteristics: null });

  // Load sample data for demo
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

  // Analyze uploaded Fi MCP data
  const analyzeProfile = async (fiMCPData) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const profileAnalysis = await apiService.analyzeProfile(fiMCPData);
      setUserProfile(profileAnalysis.profile);
      setCurrentStep('chat');
      
    } catch (err) {
      setError(`Profile analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToProfile = () => {
    setCurrentStep('profile');
    setUserProfile(null);
    setError(null);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="gradient-text">Future Me</span>
          </h1>
          <p className="app-subtitle">
            Your AI-powered temporal financial advisor
          </p>
          
          {userProfile && (
            <button 
              onClick={resetToProfile}
              className="reset-button"
            >
              New Analysis
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="app-main">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Analyzing your financial future...</p>
          </div>
        )}

        {currentStep === 'profile' && (
          <div className="step-container">
            <ProfileAnalysis 
              onAnalyzeProfile={analyzeProfile}
              onLoadSample={loadSampleData}
              isLoading={isLoading}
            />
          </div>
        )}

        {currentStep === 'chat' && userProfile && (
          <div className="step-container chat-container">
            {/* Profile Summary */}
            <div className="profile-summary">
              <h2>Your Financial Profile</h2>
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-label">Age</span>
                  <span className="stat-value">{userProfile.demographics?.estimatedAge || 'Unknown'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Credit Score</span>
                  <span className="stat-value">{userProfile.financialSummary?.creditScore || 'N/A'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Net Worth</span>
                  <span className="stat-value">₹{userProfile.financialSummary?.netWorth?.toLocaleString() || '0'}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Debt</span>
                  <span className="stat-value">₹{userProfile.financialSummary?.totalDebt?.toLocaleString() || '0'}</span>
                </div>
              </div>
            </div>

            {/* Persona Selector */}
            <PersonaSelector 
              currentAge={userProfile.demographics?.estimatedAge || 26}
              selectedAge={selectedPersona.age}
              onAgeSelect={(age) => setSelectedPersona({ age, characteristics: null })}
              userProfile={userProfile}
            />

            {/* Chat Interface */}
            <ChatInterface 
              userProfile={userProfile}
              selectedPersona={selectedPersona}
              onPersonaUpdate={setSelectedPersona}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Built for Google Cloud Agentic AI Day Hackathon | Team Shogun</p>
      </footer>
    </div>
  );
}

export default App;