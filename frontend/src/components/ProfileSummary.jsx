import React from "react";

const ProfileSummary = ({ userProfile }) => (
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
          {userProfile.financialSummary?.netWorth?.toLocaleString() || "0"}
        </span>
      </div>
      <div className="stat">
        <span className="stat-label">Total Debt</span>
        <span className="stat-value">
          ₹
          {userProfile.financialSummary?.totalDebt?.toLocaleString() || "0"}
        </span>
      </div>
    </div>
  </div>
);


