// src/components/FutureStagesTable.jsx
import React from 'react';
import './FutureStagesTable.css'; // Create this CSS file for styling

const FutureStagesTable = ({ stage }) => {
  if (!stage) {
    return <p>No future stage data available.</p>;
  }

  const {
    versionName,
    estimatedAgeRange,
    timeframeYearsFromCurrent,
    estimatedYearRange,
    keyLifeEvents,
    locationContext,
    careerFinancials,
    detailedFinancialProjection,
    assetOwnershipProjection,
    realisticMilestones,
    financialStressLevel,
    keyFinancialChallenges,
    practicalStrategies,
    summary,
  } = stage;

  return (
    <div className="future-stage-table-container">
      <h2>{versionName}</h2>
      <p className="summary-text">{summary}</p>

      <h3>Overview</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Estimated Age:</strong></td>
            <td>{estimatedAgeRange} years</td>
          </tr>
          <tr>
            <td><strong>Timeframe (from current):</strong></td>
            <td>{timeframeYearsFromCurrent} years</td>
          </tr>
          <tr>
            <td><strong>Estimated Year Range:</strong></td>
            <td>{estimatedYearRange}</td>
          </tr>
          <tr>
            <td><strong>Key Life Events:</strong></td>
            <td>{keyLifeEvents.join(', ')}</td>
          </tr>
          <tr>
            <td><strong>Financial Stress Level:</strong></td>
            <td>{financialStressLevel}</td>
          </tr>
        </tbody>
      </table>

      <h3>Location & Housing</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Likely City/Region:</strong></td>
            <td>{locationContext.likelyCityOrRegion}</td>
          </tr>
          <tr>
            <td><strong>Housing Situation:</strong></td>
            <td>{locationContext.housingSituation}</td>
          </tr>
          <tr>
            <td><strong>Est. Monthly Rent/Mortgage:</strong></td>
            <td>
              {locationContext.estimatedMonthlyRentMortgage === 0 ? 'Paid off' : `₹${locationContext.estimatedMonthlyRentMortgage?.toLocaleString()}`}
            </td>
          </tr>
        </tbody>
      </table>

      <h3>Career & Financials</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Estimated Monthly Income:</strong></td>
            <td>₹{careerFinancials.estimatedMonthlyIncome?.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Income Growth:</strong></td>
            <td>{careerFinancials.incomeGrowthFromCurrent}</td>
          </tr>
          <tr>
            <td><strong>Job Stability:</strong></td>
            <td>{careerFinancials.jobStability}</td>
          </tr>
        </tbody>
      </table>

      <h3>Detailed Financial Projection</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Projected Net Worth:</strong></td>
            <td>₹{detailedFinancialProjection.projectedNetWorth?.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Projected Total Debt:</strong></td>
            <td>₹{detailedFinancialProjection.projectedTotalDebt?.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Projected Credit Score:</strong></td>
            <td>{detailedFinancialProjection.projectedCreditScore}</td>
          </tr>
          <tr>
            <td><strong>Projected Monthly Savings:</strong></td>
            <td>₹{detailedFinancialProjection.projectedMonthlySavings?.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Projected Investments:</strong></td>
            <td>₹{detailedFinancialProjection.projectedInvestments?.toLocaleString()}</td>
          </tr>
          <tr>
            <td><strong>Debt-to-Income Ratio:</strong></td>
            <td>{detailedFinancialProjection.debtToIncomeRatio}</td>
          </tr>
          <tr>
            <td><strong>Emergency Fund:</strong></td>
            <td>{detailedFinancialProjection.emergencyFundMonths} months</td>
          </tr>
          <tr>
            <td><strong>Major Assets:</strong></td>
            <td>{detailedFinancialProjection.majorAssets.join(', ')}</td>
          </tr>
          <tr>
            <td><strong>Major Liabilities:</strong></td>
            <td>{detailedFinancialProjection.majorLiabilities.length > 0 ? detailedFinancialProjection.majorLiabilities.join(', ') : 'None'}</td>
          </tr>
        </tbody>
      </table>

      <h3>Asset Ownership Projection</h3>
      <table className="info-table nested-table">
        <thead>
          <tr>
            <th>Asset</th>
            <th>Ownership Status</th>
            <th>Chance of Acquisition</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Car</td>
            <td>{assetOwnershipProjection.car.ownershipStatus}</td>
            <td>{assetOwnershipProjection.car.chanceOfAcquisition}%</td>
            <td>{assetOwnershipProjection.car.notes}</td>
          </tr>
          <tr>
            <td>Bike</td>
            <td>{assetOwnershipProjection.bike.ownershipStatus}</td>
            <td>{assetOwnershipProjection.bike.chanceOfAcquisition}%</td>
            <td>{assetOwnershipProjection.bike.notes}</td>
          </tr>
          <tr>
            <td>Home</td>
            <td>{assetOwnershipProjection.home.ownershipStatus}</td>
            <td>{assetOwnershipProjection.home.chanceOfAcquisition}%</td>
            <td>{assetOwnershipProjection.home.notes}</td>
          </tr>
        </tbody>
      </table>

      <h3>Realistic Milestones</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Debt-Free Target:</strong></td>
            <td>{realisticMilestones.debtFreeTarget}</td>
          </tr>
          <tr>
            <td><strong>First Major Purchase:</strong></td>
            <td>{realisticMilestones.firstMajorPurchase}</td>
          </tr>
          <tr>
            <td><strong>Credit Score Goal:</strong></td>
            <td>{realisticMilestones.creditScoreGoal}</td>
          </tr>
          <tr>
            <td><strong>Savings Target:</strong></td>
            <td>₹{realisticMilestones.savingsTarget?.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <h3>Challenges & Strategies</h3>
      <table className="info-table">
        <tbody>
          <tr>
            <td><strong>Key Financial Challenges:</strong></td>
            <td>{keyFinancialChallenges.join(', ')}</td>
          </tr>
          <tr>
            <td><strong>Practical Strategies:</strong></td>
            <td>{practicalStrategies.join(', ')}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default FutureStagesTable;