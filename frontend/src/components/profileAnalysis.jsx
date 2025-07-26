// frontend/src/components/ProfileAnalysis.jsx
// Component for uploading and analyzing Fi MCP data

import React, { useState, useRef } from 'react';
import { Upload, User, CreditCard, TrendingUp, AlertCircle } from 'lucide-react';

const ProfileAnalysis = ({ onAnalyzeProfile, onLoadSample, isLoading }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedData, setUploadedData] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file.type !== "application/json") {
      alert("Please upload a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        setUploadedData(jsonData);
        setShowPreview(true);
      } catch (error) {
        alert("Invalid JSON file format",error);
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    if (uploadedData) {
      onAnalyzeProfile(uploadedData);
    }
  };

  const extractPreviewInfo = (data) => {
    if (!data || !data.dataItems) return null;

    const netWorth = data.dataItems.find(item => item.netWorthSummary);
    const credit = data.dataItems.find(item => item.creditReportData);
    const epf = data.dataItems.find(item => item.epfAccountData);

    return {
      netWorth: netWorth?.netWorthSummary?.totalNetWorthValue?.units || '0',
      creditScore: credit?.creditReportData?.creditReports?.[0]?.creditReportData?.score?.bureauScore || 'N/A',
      employer: epf?.epfAccountData?.uanAccounts?.[0]?.rawDetails?.est_details?.[0]?.est_name || 'Unknown',
      totalDebt: credit?.creditReportData?.creditReports?.[0]?.creditReportData?.creditAccount?.creditAccountSummary?.totalOutstandingBalance?.outstandingBalanceAll || '0'
    };
  };

  const previewInfo = uploadedData ? extractPreviewInfo(uploadedData) : null;

  return (
    <div className="profile-analysis">
      <div className="analysis-header">
        <h2>Analyze Your Financial Profile</h2>
        <p>Upload your Fi Money MCP data to start your conversation with Future You</p>
      </div>

      {!showPreview ? (
        <div className="upload-section">
          {/* File Upload Area */}
          <div
            className={`upload-area ${dragActive ? 'drag-active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={48} className="upload-icon" />
            <h3>Upload Fi MCP Data</h3>
            <p>Drag and drop your JSON file here, or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileInput}
              style={{ display: 'none' }}
            />
          </div>

          {/* Sample Data Option */}
          <div className="sample-section">
            <div className="divider">
              <span>OR</span>
            </div>
            <button 
              className="sample-button"
              onClick={onLoadSample}
              disabled={isLoading}
            >
              <User size={20} />
              Try with Sample Data
            </button>
            <p className="sample-description">
              Use our sample profile to see Future Me in action
            </p>
          </div>

          {/* Features Preview */}
          <div className="features-preview">
            <h3>What You'll Get</h3>
            <div className="features-grid">
              <div className="feature">
                <CreditCard size={24} />
                <h4>Complete Financial Analysis</h4>
                <p>Detailed breakdown of your assets, liabilities, and financial behavior</p>
              </div>
              <div className="feature">
                <User size={24} />
                <h4>Future Me Conversations</h4>
                <p>Chat with different versions of yourself at 30, 40, 60+ years old</p>
              </div>
              <div className="feature">
                <TrendingUp size={24} />
                <h4>Personalized Advice</h4>
                <p>Get specific financial guidance based on your actual data</p>
              </div>
              <div className="feature">
                <AlertCircle size={24} />
                <h4>Risk Assessment</h4>
                <p>Identify financial risks and opportunities for your future</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="preview-section">
          <h3>Data Preview</h3>
          <div className="preview-grid">
            <div className="preview-item">
              <span className="preview-label">Net Worth</span>
              <span className="preview-value">₹{parseInt(previewInfo.netWorth).toLocaleString()}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Credit Score</span>
              <span className="preview-value">{previewInfo.creditScore}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Total Debt</span>
              <span className="preview-value">₹{parseInt(previewInfo.totalDebt).toLocaleString()}</span>
            </div>
            <div className="preview-item">
              <span className="preview-label">Employer</span>
              <span className="preview-value">{previewInfo.employer}</span>
            </div>
          </div>

          <div className="preview-actions">
            <button 
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? 'Analyzing...' : 'Start Analysis'}
            </button>
            <button 
              className="cancel-button"
              onClick={() => {
                setShowPreview(false);
                setUploadedData(null);
              }}
            >
              Upload Different File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileAnalysis;