// frontend/src/components/ProfileAnalysis.jsx
// Component for uploading and analyzing Fi MCP data
import { Handle, Position } from "@xyflow/react";
import React, { useState, useRef } from "react";

const ProfileAnalysis = ({ onAnalyzeProfile, isLoading }) => {
  const [uploadedData, setUploadedData] = useState(null);

  const handleFile = (file) => {
    // if (file.type !== "application/json") {
    //   alert("Please upload a JSON file");
    //   return;
    // }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const jsonData = JSON.parse(e.target.result);
        setUploadedData(jsonData);
      } catch (error) {
        alert("Invalid JSON file format");
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

    const netWorth = data.dataItems.find((item) => item.netWorthSummary);
    const credit = data.dataItems.find((item) => item.creditReportData);
    const epf = data.dataItems.find((item) => item.epfAccountData);

    return {
      netWorth: netWorth?.netWorthSummary?.totalNetWorthValue?.units || "0",
      creditScore:
        credit?.creditReportData?.creditReports?.[0]?.creditReportData?.score
          ?.bureauScore || "N/A",
      employer:
        epf?.epfAccountData?.uanAccounts?.[0]?.rawDetails?.est_details?.[0]
          ?.est_name || "Unknown",
      totalDebt:
        credit?.creditReportData?.creditReports?.[0]?.creditReportData
          ?.creditAccount?.creditAccountSummary?.totalOutstandingBalance
          ?.outstandingBalanceAll || "0",
    };
  };

  const previewInfo = uploadedData ? extractPreviewInfo(uploadedData) : null;

  return (
    <div className="profile-analysis" style={{ backgroundColor: "#0b0f10" }}>
      {
        <div className="preview-section">
          {previewInfo && (
            <div className="preview-grid">
              <div className="preview-item">
                <span className="preview-label">Net Worth</span>
                <span className="preview-value">
                  ₹{parseInt(previewInfo.netWorth).toLocaleString()}
                </span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Credit Score</span>
                <span className="preview-value">{previewInfo.creditScore}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Total Debt</span>
                <span className="preview-value">
                  ₹{parseInt(previewInfo.totalDebt).toLocaleString()}
                </span>
              </div>
              <div className="preview-item">
                <span className="preview-label">Employer</span>
                <span className="preview-value">{previewInfo.employer}</span>
              </div>
              <Handle type="source" position={Position.Bottom} />{" "}
            </div>
          )}
          {/* <div className="preview-actions">
            <button
              className="analyze-button"
              onClick={handleAnalyze}
              disabled={isLoading}
            >
              {isLoading ? "Analyzing..." : "Start Analysis"}
            </button>
            <button
              className="cancel-button"
              onClick={() => {
                setUploadedData(null);
              }}
            >
              Upload Different File
            </button>
          </div> */}
        </div>
      }
    </div>
  );
};

export default ProfileAnalysis;
