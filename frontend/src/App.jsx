// frontend/src/App.jsx
// Main React application for Future Me frontend

import React, { useState } from "react";
import ProfileAnalysis from "./components/profileAnalysis";
import ChatInterface from "./components/ChatInterface";
import ProfileSummary from "./components/ProfileSummary";
import PersonaSelector from "./components/personaSelector";
import { apiService } from "./services/api";
import { useRef } from "react";
import { Upload as UploadIcon } from "lucide-react";
import Upload from "./components/Upload";
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
  // const loadSampleData = async () => {
  //   try {
  //     setIsLoading(true);
  //     setError(null);

  //     const sampleData = await apiService.getSampleData();
  //     const profileAnalysis = await apiService.analyzeProfile(sampleData.data);

  //     setUserProfile(profileAnalysis.profile);
  //     setCurrentStep("chat");
  //   } catch (err) {
  //     setError(`Failed to load sample data: ${err.message}`);
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

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
      <Upload
        fileInputRef={fileInputRef}
        isLoading={isLoading}
        handleFileInput={handleFileInput}
      />
      {/* Main Content */}
      <main className="app-main">
        {currentStep === "profile" && (
          <div className="step-container">
            <ProfileAnalysis
              humanDescription={{
                name: "Individual X",
                age: 28,
                lifeStage: "Early Career Professional",
                netWorth: 3148,
                totalLiability: 50077,
                creditScore: 758,
                employment: {
                  currentEmployer: "SIMPLY VYAPAR APPS PRIVATE LIMITED",
                  workExperienceYears: 6.57,
                  careerTrajectory: "Early Career",
                },
              }}
            />
          </div>
        )}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {currentStep === "chat" && userProfile && (
          <div className="step-container chat-container">
            {/* Profile Summary */}
            <ProfileSummary
              humanDescription={{
                name: "Individual X",
                age: 28,
                lifeStage: "Early Career Professional",
                netWorth: 3148,
                totalLiability: 50077,
                creditScore: 758,
                employment: {
                  currentEmployer: "SIMPLY VYAPAR APPS PRIVATE LIMITED",
                  workExperienceYears: 6.57,
                  careerTrajectory: "Early Career",
                },
              }}
            />

            {/* Persona Selector */}
            {/* <PersonaSelector
              currentAge={userProfile.demographics?.estimatedAge || 26}
              selectedAge={selectedPersona.age}
              onAgeSelect={(age) =>
                setSelectedPersona({ age, characteristics: null })
              }
              userProfile={userProfile}
            /> */}

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
