// frontend/src/App.jsx
// Main React application for Future Me frontend

import React, { useState } from "react";
import ProfileAnalysis from "./components/profileAnalysis";
import ChatInterface from "./components/chatInterface";
import PersonaSelector from "./components/personaSelector";
import { apiService } from "./services/api";
import { useRef } from "react";
import { Upload } from "lucide-react";
import "./App.css";

function App() {
  const fileInputRef = useRef();
  const [currentStep, setCurrentStep] = useState("profile"); // 'profile', 'chat'
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPersona, setSelectedPersona] = useState({
    age: 40,
    characteristics: null,
  });

  // Load sample data for demo
  const loadSampleData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const sampleData = await apiService.getSampleData();
      const profileAnalysis = await apiService.analyzeProfile(sampleData.data);

      setUserProfile(profileAnalysis.profile);
      setCurrentStep("chat");
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
      setCurrentStep("chat");
    } catch (err) {
      setError(`Profile analysis failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetToProfile = () => {
    setCurrentStep("profile");
    setUserProfile(null);
    setError(null);
  };

  // Handle file input change
  const handleFileInput = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      setIsLoading(true);
      setError(null);
      const text = await file.text();
      await analyzeProfile(text);
    } catch (err) {
      setError(`Failed to read file: ${err.message}`);
    } finally {
      setIsLoading(false);
      // Reset file input so the same file can be uploaded again if needed
      event.target.value = "";
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          {userProfile && (
            <button onClick={resetToProfile} className="reset-button">
              New Analysis
            </button>
          )}
        </div>
      </header>
      <div className="sample-section">
        <div className="sample-section">
          <button
            className="sample-button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload size={20} />
            Upload Fi data
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt"
            onChange={handleFileInput}
            style={{ display: "none" }}
          />

          <p className="sample-description">
            Use our sample profile to see Future Me in action
          </p>
        </div>
      </div>
      {/* Main Content */}
      <main className="app-main">
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}
        {currentStep === "profile" && (
          <div className="step-container">
            {analyzeProfile ?? (
              <ProfileAnalysis
                onAnalyzeProfile={analyzeProfile}
                onLoadSample={loadSampleData}
                isLoading={isLoading}
              />
            )}
          </div>
        )}

        {currentStep === "chat" && userProfile && (
          <div className="step-container chat-container">
            {/* Profile Summary */}
            <div className="profile-summary">
              <h2>Your Financial Profile</h2>
              <div className="profile-stats">
                <div className="stat">
                  <span className="stat-label">Age</span>
                  <span className="stat-value">
                    {userProfile.demographics?.estimatedAge || "Unknown"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Credit Score</span>
                  <span className="stat-value">
                    {userProfile.financialSummary?.creditScore || "N/A"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Net Worth</span>
                  <span className="stat-value">
                    ₹
                    {userProfile.financialSummary?.netWorth?.toLocaleString() ||
                      "0"}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Total Debt</span>
                  <span className="stat-value">
                    ₹
                    {userProfile.financialSummary?.totalDebt?.toLocaleString() ||
                      "0"}
                  </span>
                </div>
              </div>
            </div>

            {/* Persona Selector */}
            <PersonaSelector
              currentAge={userProfile.demographics?.estimatedAge || 26}
              selectedAge={selectedPersona.age}
              onAgeSelect={(age) =>
                setSelectedPersona({ age, characteristics: null })
              }
              userProfile={userProfile}
            />

            {/* Chat Interface */}
            <div className="flex">
              <ChatInterface
                userProfile={userProfile}
                selectedPersona={selectedPersona}
                onPersonaUpdate={setSelectedPersona}
              />
              <ChatInterface
                userProfile={userProfile}
                selectedPersona={selectedPersona}
                onPersonaUpdate={setSelectedPersona}
              />
              <ChatInterface
                userProfile={userProfile}
                selectedPersona={selectedPersona}
                onPersonaUpdate={setSelectedPersona}
              />
            </div>
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
