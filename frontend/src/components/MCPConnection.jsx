/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  Shield,
  Database,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { toast } from "react-hot-toast";

const MCPConnection = ({ onAnalyzeProfile, isLoading, onConnectionChange }) => {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [sessionId, setSessionId] = useState(null);
  const [error, setError] = useState(null);
  const [mcpServerHealth, setMcpServerHealth] = useState(null);
  const [userCredentials, setUserCredentials] = useState({
    userId: "9999999999", // Default for testing
    authToken: "demo_token", // Default for testing
  });

  // Check MCP server health on component mount
  useEffect(() => {
    checkMCPServerHealth();
  }, []);

  const checkMCPServerHealth = async () => {
    try {
      // Import apiService dynamically to avoid circular imports
      const { apiService } = await import("../services/api");
      const healthResult = await apiService.checkMCPHealth();
      setMcpServerHealth(healthResult);
    } catch (error) {
      console.error("Health check error:", error);
      setMcpServerHealth({
        success: false,
        message: "Cannot check MCP server status",
      });
    }
  };

  const connectToMCP = async () => {
    try {
      setConnectionStatus("connecting");
      setError(null);

      // Import apiService dynamically
      const { apiService } = await import("../services/api");

      const response = await apiService.connectToMCP(
        userCredentials.userId,
        userCredentials.authToken
      );

      setSessionId(response.sessionId);
      setConnectionStatus("connected");
      onConnectionChange?.(true, response.sessionId);
    } catch (err) {
      setError(`Connection failed: ${err.message}`);
      setConnectionStatus("error");
      onConnectionChange?.(false, null);
    }
  };

  const disconnectFromMCP = async () => {
    try {
      if (sessionId) {
        const { apiService } = await import("../services/api");
        await apiService.disconnectFromMCP(sessionId);
      }

      setSessionId(null);
      setConnectionStatus("disconnected");
      setError(null);
      onConnectionChange?.(false, null);
    } catch (err) {
      console.error("Disconnect error:", err);
      setError(`Disconnect failed: ${err.message}`);
    }
  };

  const analyzeFinancialData = async () => {
    try {
      setError(null);
      await toast.promise(
        (async () => {
          const { apiService } = await import("../services/api");
          const response = await apiService.analyzeMCPData(sessionId);
          onAnalyzeProfile(response.profile);
          // Optionally return something if needed
          return response;
        })(),
        {
          pending: "Analyzing...",
          success: "Analysis complete!",
          error: "Analysis failed",
        }
      );
    } catch (err) {
      setError(`Analysis failed: ${err.message}`);
    }
  };

  const handleInputChange = (field, value) => {
    setUserCredentials((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-600";
      case "connecting":
        return "text-yellow-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className={getStatusColor()} size={24} />;
      case "connecting":
        return <div className="loading-spinner small" />;
      case "error":
        return <WifiOff className={getStatusColor()} size={24} />;
      default:
        return <WifiOff className={getStatusColor()} size={24} />;
    }
  };

  return (
    <div className="mcp-connection">
      <div className="connection-header">
        <h2>Connect to Fi MCP</h2>
        <p>
          Securely connect to your Fi Money account for real-time financial data
        </p>
      </div>

      {/* MCP Server Health Status */}
      {mcpServerHealth && (
        <div
          className={`health-status ${
            mcpServerHealth.success ? "success" : "error"
          }`}
        >
          {mcpServerHealth.success ? (
            <CheckCircle size={20} className="text-green-600" />
          ) : (
            <AlertCircle size={20} className="text-red-600" />
          )}
          <span>Fi MCP Server (localhost:8080): {mcpServerHealth.message}</span>
          <button
            onClick={checkMCPServerHealth}
            className="refresh-button"
            disabled={isLoading}
          >
            Refresh
          </button>
        </div>
      )}

      {/* <div className="connection-status">
        <div className="status-indicator">
          {getStatusIcon()}
          <span className={`status-text ${getStatusColor()}`}>
            {connectionStatus === 'connected' && 'Connected to Fi MCP'}
            {connectionStatus === 'connecting' && 'Connecting...'}
            {connectionStatus === 'disconnected' && 'Not Connected'}
            {connectionStatus === 'error' && 'Connection Error'}
          </span>
        </div>
      </div> */}

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {connectionStatus === "disconnected" && (
        <div className="connection-form">
          <div className="credential-inputs">
            <div className="input-group">
              <label htmlFor="userId">Fi Money User ID</label>
              <input
                id="userId"
                type="text"
                value={userCredentials.userId}
                onChange={(e) => handleInputChange("userId", e.target.value)}
                placeholder="Enter your Fi Money User ID"
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <label htmlFor="authToken">Authentication Token</label>
              <input
                id="authToken"
                type="password"
                value={userCredentials.authToken}
                onChange={(e) => handleInputChange("authToken", e.target.value)}
                placeholder="Enter your authentication token"
                disabled={isLoading}
              />
            </div>
          </div>

          <button
            className="connect-button"
            onClick={connectToMCP}
            disabled={
              !userCredentials.userId ||
              !userCredentials.authToken ||
              isLoading ||
              !mcpServerHealth?.success
            }
          >
            <Shield size={20} />
            {mcpServerHealth?.success
              ? "Connect Securely"
              : "MCP Server Unavailable"}
          </button>

          <div className="security-notice">
            <Shield size={16} />
            <p>
              Your credentials are encrypted and never stored. All data remains
              under your control.
            </p>
          </div>
        </div>
      )}

      {connectionStatus === "connected" && (
        <div className="connected-actions">
          <div className="session-info">
            <Database size={20} />
            <span>Session: {sessionId?.substring(0, 12)}...</span>
          </div>

          <div className="action-buttons">
            <button
              className="analyze-button primary"
              onClick={analyzeFinancialData}
              disabled={isLoading}
            >
              <Database size={20} />
              Analyze My Financial Data
            </button>

            <button
              className="disconnect-button secondary"
              onClick={disconnectFromMCP}
              disabled={isLoading}
            >
              <WifiOff size={16} />
              Disconnect
            </button>
          </div>
        </div>
      )}

      <div className="features-preview">
        <h3>Real-time Financial Insights</h3>
        <div className="features-grid">
          <div className="feature">
            <Database size={24} />
            <h4>Live Data Connection</h4>
            <p>Access your current financial data directly from Fi Money</p>
          </div>
          <div className="feature">
            <Shield size={24} />
            <h4>Secure & Private</h4>
            <p>End-to-end encryption with no data storage on our servers</p>
          </div>
          <div className="feature">
            <Wifi size={24} />
            <h4>Real-time Updates</h4>
            <p>Always get the most current financial information</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MCPConnection;
