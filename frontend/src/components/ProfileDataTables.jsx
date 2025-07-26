import React from 'react';
import { User, TrendingUp, CreditCard, Building, Calendar, Target, Home, Car, Bike } from 'lucide-react';

const ProfileDataTables = ({ profileData }) => {
  if (!profileData) {
    return (
      <div className="p-8 text-center text-gray-500">
        No profile data available
      </div>
    );
  }

  const { basicInfo, futureStages } = profileData;

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercentage = (value) => {
    if (value === undefined || value === null) return '0%';
    return `${value}%`;
  };

  const getAssetIcon = (assetType) => {
    switch (assetType) {
      case 'car': return <Car className="w-4 h-4" />;
      case 'bike': return <Bike className="w-4 h-4" />;
      case 'home': return <Home className="w-4 h-4" />;
      default: return null;
    }
  };

  const getChanceColor = (chance) => {
    if (chance >= 70) return 'text-green-600 bg-green-50';
    if (chance >= 40) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Basic Info Section */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        marginBottom: '32px'
      }}>
        <div style={{
          backgroundColor: '#2563eb',
          color: 'white',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <User size={20} />
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Basic Financial Profile</h2>
        </div>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          padding: '24px'
        }}>
          {/* Demographics */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#1f2937', 
              borderBottom: '1px solid #e5e7eb', 
              paddingBottom: '8px',
              margin: 0
            }}>Demographics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Age:</span>
                <span style={{ fontWeight: '500' }}>{basicInfo?.demographics?.estimatedAge} years</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Experience:</span>
                <span style={{ fontWeight: '500' }}>{basicInfo?.demographics?.workExperience} years</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Employer:</span>
                <span style={{ fontWeight: '500', fontSize: '12px' }}>{basicInfo?.demographics?.employer}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Join Date:</span>
                <span style={{ fontWeight: '500' }}>{basicInfo?.demographics?.joinDate}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#1f2937', 
              borderBottom: '1px solid #e5e7eb', 
              paddingBottom: '8px',
              margin: 0
            }}>Financial Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Net Worth:</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(basicInfo?.financialSummary?.netWorth)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Savings:</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(basicInfo?.financialSummary?.liquidSavings)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Total Debt:</span>
                <span style={{ fontWeight: '500', color: '#dc2626' }}>{formatCurrency(basicInfo?.financialSummary?.totalDebt)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Credit Score:</span>
                <span style={{ fontWeight: '500', color: '#059669' }}>{basicInfo?.financialSummary?.creditScore}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Debt Ratio:</span>
                <span style={{ fontWeight: '500' }}>{basicInfo?.financialSummary?.debtToSavingsRatio}</span>
              </div>
            </div>
          </div>

          {/* Credit Profile */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#1f2937', 
              borderBottom: '1px solid #e5e7eb', 
              paddingBottom: '8px',
              margin: 0
            }}>Credit Profile</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Total Accounts:</span>
                <span style={{ fontWeight: '500' }}>{basicInfo?.creditProfile?.totalAccounts}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Active:</span>
                <span style={{ fontWeight: '500' }}>{basicInfo?.creditProfile?.activeAccounts}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Credit Cards:</span>
                <span style={{ fontWeight: '500' }}>{basicInfo?.creditProfile?.creditCards?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Payment Rating:</span>
                <span style={{ fontWeight: '500', color: '#059669' }}>{basicInfo?.creditProfile?.paymentHistory?.overallRating}</span>
              </div>
            </div>
          </div>

          {/* Employment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ 
              fontWeight: '600', 
              color: '#1f2937', 
              borderBottom: '1px solid #e5e7eb', 
              paddingBottom: '8px',
              margin: 0
            }}>Employment</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>EPF Balance:</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(basicInfo?.employmentProfile?.pensionBalance)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Employee Contribution:</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(basicInfo?.employmentProfile?.employeeContribution)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Employer Contribution:</span>
                <span style={{ fontWeight: '500' }}>{formatCurrency(basicInfo?.employmentProfile?.employerContribution)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Credit Cards Details */}
        {basicInfo?.creditProfile?.creditCards?.length > 0 && (
          <div style={{
            borderTop: '1px solid #e5e7eb',
            backgroundColor: '#f9fafb',
            padding: '24px'
          }}>
            <h3 style={{
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: '0 0 16px 0'
            }}>
              <CreditCard size={16} />
              Credit Cards
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{
                width: '100%',
                fontSize: '14px',
                borderCollapse: 'collapse'
              }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #d1d5db' }}>
                    <th style={{ textAlign: 'left', padding: '8px 0', fontWeight: '600' }}>Bank</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>Outstanding</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>Limit</th>
                    <th style={{ textAlign: 'right', padding: '8px 0', fontWeight: '600' }}>Utilization</th>
                  </tr>
                </thead>
                <tbody>
                  {basicInfo.creditProfile.creditCards.map((card, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '8px 0', fontWeight: '500' }}>{card.bank}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0' }}>{formatCurrency(card.outstanding)}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0' }}>{formatCurrency(card.limit)}</td>
                      <td style={{ textAlign: 'right', padding: '8px 0' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: card.utilization > 70 ? '#fef2f2' : 
                            card.utilization > 30 ? '#fefce8' : '#f0fdf4',
                          color: card.utilization > 70 ? '#991b1b' : 
                            card.utilization > 30 ? '#a16207' : '#166534'
                        }}>
                          {formatPercentage(card.utilization)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Future Stages Section */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{
          background: 'linear-gradient(to right, #7c3aed, #2563eb)',
          color: 'white',
          padding: '16px',
          borderRadius: '12px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: 0
          }}>
            <TrendingUp size={20} />
            Future Financial Stages
          </h2>
          <p style={{ color: '#c4b5fd', marginTop: '4px', margin: '4px 0 0 0' }}>Projected financial journey based on current profile</p>
        </div>

        {futureStages?.map((stage, index) => (
          <div key={index} style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div style={{
              background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
              color: 'white',
              padding: '16px'
            }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>{stage.versionName}</h3>
              <div style={{
                display: 'flex',
                gap: '16px',
                marginTop: '8px',
                fontSize: '14px'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Calendar size={16} />
                  Age: {stage.estimatedAgeRange}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Target size={16} />
                  Timeframe: {stage.timeframeYearsFromCurrent} years
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
              {/* Financial Projections */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Financial Projections</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net Worth:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(stage.detailedFinancialProjection?.projectedNetWorth)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Debt:</span>
                    <span className="font-medium text-red-600">
                      {formatCurrency(stage.detailedFinancialProjection?.projectedTotalDebt)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Credit Score:</span>
                    <span className="font-medium">{stage.detailedFinancialProjection?.projectedCreditScore}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Savings:</span>
                    <span className="font-medium">
                      {formatCurrency(stage.detailedFinancialProjection?.projectedMonthlySavings)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Emergency Fund:</span>
                    <span className="font-medium">{stage.detailedFinancialProjection?.emergencyFundMonths} months</span>
                  </div>
                </div>
              </div>

              {/* Career & Income */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Career & Income</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monthly Income:</span>
                    <span className="font-medium">{formatCurrency(stage.careerFinancials?.estimatedMonthlyIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Income Growth:</span>
                    <span className="font-medium text-green-600">{stage.careerFinancials?.incomeGrowthFromCurrent}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Stability:</span>
                    <span className="font-medium">{stage.careerFinancials?.jobStability}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stress Level:</span>
                    <span className="font-medium">{stage.financialStressLevel}</span>
                  </div>
                </div>
              </div>

              {/* Asset Ownership */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-800 border-b pb-2">Asset Ownership Projection</h4>
                <div className="space-y-3">
                  {stage.assetOwnershipProjection && Object.entries(stage.assetOwnershipProjection).map(([assetType, asset]) => (
                    <div key={assetType} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getAssetIcon(assetType)}
                          <span className="font-medium capitalize">{assetType}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getChanceColor(asset.chanceOfAcquisition)}`}>
                          {asset.chanceOfAcquisition}%
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 mb-1">
                        Status: <span className="font-medium">{asset.ownershipStatus}</span>
                      </div>
                      <div className="text-xs text-gray-600 leading-relaxed">
                        {asset.notes}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Key Milestones & Strategies */}
            <div className="border-t bg-gray-50 p-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Key Milestones</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Debt Free Target:</span>
                      <span className="font-medium">{stage.realisticMilestones?.debtFreeTarget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Credit Score Goal:</span>
                      <span className="font-medium">{stage.realisticMilestones?.creditScoreGoal}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Savings Target:</span>
                      <span className="font-medium">{formatCurrency(stage.realisticMilestones?.savingsTarget)}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">Key Challenges & Strategies</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600 block mb-1">Challenges:</span>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {stage.keyFinancialChallenges?.map((challenge, idx) => (
                          <li key={idx}>{challenge}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-gray-600 block mb-1">Strategies:</span>
                      <ul className="list-disc list-inside text-xs space-y-1">
                        {stage.practicalStrategies?.map((strategy, idx) => (
                          <li key={idx}>{strategy}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
               
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">{stage.summary}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfileDataTables;