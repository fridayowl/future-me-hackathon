// frontend/src/App.jsx
// Main React application for Future Me frontend

import React, { useState, useCallback } from "react";
import ChatInterface from "./components/ChatInterface";
import ProfileSummary from "./components/ProfileSummary";
import { Handle, Position } from "@xyflow/react";

// Simple custom node for n2 with a visible handle
const SimpleNode = ({ data }) => (
  <div style={{ background: '#222', color: '#fff', padding: 16, borderRadius: 8, minWidth: 120, textAlign: 'center' }}>
    {data.label}
    <Handle type="target" position={Position.Top} style={{ background: '#2bbda2' }} />
  </div>
);
import PersonaSelector from "./components/personaSelector";
import { apiService } from "./services/api";
import { useRef } from "react";
import { Upload as UploadIcon } from "lucide-react";
import Upload from "./components/Upload";
import "./App.css";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from "@xyflow/react";
const nodeTypes = {
  profileSummary: (props) => (
    <div style={{ position: 'relative' }}>
      <ProfileSummary {...props} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#2bbda2' }} />
    </div>
  ),
  simple: SimpleNode,
};

const initialNodes = [
  {
    id: "n1",
    type: 'profileSummary',
    position: { x: 0, y: 0 },
    data: {
      humanDescription: {
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
      },
    },
    sourcePosition: 'bottom',
  },
  {
    id: "n2",
    type: 'simple',
    position: { x: 0, y: 100 },
    data: { label: "Node 2" },
    targetPosition: 'top',
  },
];

const initialEdges = [
  {
    id: "n1-n2",
    source: "n1",
    target: "n2",
    sourceHandle: null, // default handle
    targetHandle: null, // default handle
    type: 'default',
  },
];

import "@xyflow/react/dist/style.css";

function App() {
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const onNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );
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
        <div className="h-96 w-screen">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          />
        </div>
      <Upload
        fileInputRef={fileInputRef}
        isLoading={isLoading}
        handleFileInput={handleFileInput}
      />
      {/* Main Content */}
      <main className="app-main">
        {/* {currentStep === "profile" && (
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
        )} */}
        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        {currentStep === "chat" && userProfile && (
          <div className="step-container chat-container">
            {/* Profile Summary */}

            {/* ProfileSummary is now rendered as a custom node in ReactFlow */}

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
