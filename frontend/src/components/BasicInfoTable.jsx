/* eslint-disable no-unused-vars */
// src/components/BasicInfoTable.jsx
import React from 'react';
import './BasicInfoTable.css'; // Create this CSS file for styling

const BasicInfoTable = ({ basicInfo }) => {
  if (!basicInfo) {
    return <p>No basic financial information available.</p>;
  }

  const { demographics, financialSummary, creditProfile, employmentProfile } = basicInfo;

  return (
    <div className="basic-info-table-container">
      <h2>Current Financial Snapshot</h2>

      {/* Demographics */}
      <h3>Demographics</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Estimated Age:</strong></td>
            <td>{demographics.estimatedAge} years</td>
          </tr>
          <tr>
            <td><strong>Current Employer:</strong></td>
            <td>{demographics.employer}</td>
          </tr>
          <tr>
            <td><strong>Work Experience:</strong></td>
            <td>{demographics.workExperience} years</td>
          </tr>
          <tr>
            <td><strong>Employment Start Date:</strong></td>
            <td>{demographics.joinDate}</td>
          </tr>
        </tbody>
      </table>

      {/* Financial Summary */}
      <h3>Financial Summary</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Net Worth:</strong></td>
            <td>₹{financialSummary.netWorth?.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Liquid Savings:</strong></td>
            <td>₹{financialSummary.liquidSavings?.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Total Debt:</strong></td>
            <td>₹{financialSummary.totalDebt?.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Credit Score:</strong></td>
            <td>{financialSummary.creditScore}</td>
          </tr>
          <tr>
            <td><strong>Debt-to-Savings Ratio:</strong></td>
            <td>{financialSummary.debtToSavingsRatio}</td>
          </tr>
        </tbody>
      </table>

      {/* Credit Profile */}
      <h3>Credit Profile</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Total Accounts:</strong></td>
            <td>{creditProfile.totalAccounts}</td>
          </tr>
          <tr>
            <td><strong>Active Accounts:</strong></td>
            <td>{creditProfile.activeAccounts}</td>
          </tr>
          <tr>
            <td><strong>Closed Accounts:</strong></td>
            <td>{creditProfile.closedAccounts}</td>
          </tr>
          <tr>
            <td><strong>On-Time Payments:</strong></td>
            <td>{creditProfile.paymentHistory.onTimePaymentPercentage}% ({creditProfile.paymentHistory.overallRating})</td>
          </tr>
          <tr>
            <td><strong>Has Car Loan:</strong></td>
            <td>{creditProfile.hasCarLoan ? 'Yes' : 'No'}</td>
          </tr>
          <tr>
            <td><strong>Has Bike Loan:</strong></td>
            <td>{creditProfile.hasBikeLoan ? 'Yes' : 'No'}</td>
          </tr>
          <tr>
            <td><strong>Has Home Loan:</strong></td>
            <td>{creditProfile.hasHomeLoan ? 'Yes' : 'No'}</td>
          </tr>
        </tbody>
      </table>

      {creditProfile.creditCards && creditProfile.creditCards.length > 0 && (
        <>
          <h4>Credit Cards</h4>
          <table className="info-table nested-table">
            <thead>
              <tr>
                <th>Bank</th>
                <th>Outstanding</th>
                <th>Limit</th>
                <th>Utilization</th>
              </tr>
            </thead>
            <tbody>
              {creditProfile.creditCards.map((card, index) => (
                <tr key={index}>
                  <td>{card.bank}</td>
                  <td>₹{card.outstanding?.toLocaleString()}</td>
                  <td>₹{card.limit?.toLocaleString()}</td>
                  <td>{card.utilization}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

    </div>
  );
};

export default BasicInfoTable;