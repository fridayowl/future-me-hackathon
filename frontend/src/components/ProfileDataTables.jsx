/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import {
  User, DollarSign, CreditCard, Briefcase, TrendingUp, Calendar, Target,
  Shield, Home, Car, Bike, PiggyBank, Calculator, Zap, ArrowUp, ArrowDown,
  Plus, Minus, AlertTriangle, CheckCircle, Clock
} from 'lucide-react';

const ProfileDataTables = ({ profileData, onStartConversation }) => {
  const [originalFutureStages, setOriginalFutureStages] = useState([]);
  const [modifiedFutureStages, setModifiedFutureStages] = useState([]);
  const [selectedAction, setSelectedAction] = useState(null);
  const [actionForm, setActionForm] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize future stages
  useEffect(() => {
    if (profileData?.futureStages) {
      setOriginalFutureStages([...profileData.futureStages]);
      setModifiedFutureStages([...profileData.futureStages]);
    }
  }, [profileData]);

  const { basicInfo, behaviorAnalysis, riskAssessment, futureStages } = profileData || {};

  // Investment options based on real Indian market
  const investmentOptions = [
    {
      type: "SIP - Large Cap",
      minAmount: 500,
      expectedReturn: 12,
      risk: "Low",
      description: "Blue-chip companies like HDFC, TCS, Reliance",
      icon: <TrendingUp className="w-4 h-4" />
    },
    {
      type: "SIP - Mid Cap",
      minAmount: 1000,
      expectedReturn: 15,
      risk: "Medium",
      description: "Growing companies with higher potential",
      icon: <Target className="w-4 h-4" />
    },
    {
      type: "SIP - Small Cap",
      minAmount: 1000,
      expectedReturn: 18,
      risk: "High",
      description: "High growth potential with volatility",
      icon: <Zap className="w-4 h-4" />
    },
    {
      type: "PPF",
      minAmount: 500,
      expectedReturn: 7.1,
      risk: "None",
      description: "Tax-free returns, 15-year lock-in",
      icon: <Shield className="w-4 h-4" />
    },
    {
      type: "ELSS",
      minAmount: 500,
      expectedReturn: 14,
      risk: "Medium",
      description: "Tax-saving fund, 3-year lock-in",
      icon: <PiggyBank className="w-4 h-4" />
    }
  ];

  // Loan options
  const loanOptions = [
    {
      type: "Personal Loan",
      maxAmount: 500000,
      interestRate: 16,
      maxTenure: 5,
      purpose: "Emergency, debt consolidation",
      icon: <DollarSign className="w-4 h-4" />
    },
    {
      type: "Home Loan",
      maxAmount: 5000000,
      interestRate: 8.5,
      maxTenure: 20,
      purpose: "Property purchase",
      icon: <Home className="w-4 h-4" />
    },
    {
      type: "Car Loan",
      maxAmount: 1000000,
      interestRate: 9.5,
      maxTenure: 7,
      purpose: "Vehicle purchase",
      icon: <Car className="w-4 h-4" />
    },
    {
      type: "Education Loan",
      maxAmount: 2000000,
      interestRate: 11,
      maxTenure: 15,
      purpose: "Higher education",
      icon: <Briefcase className="w-4 h-4" />
    }
  ];

  // Calculate investment impact on future stages
  const calculateInvestmentImpact = (monthlyAmount, expectedReturn, investmentType) => {
    return modifiedFutureStages.map(stage => {
      const years = stage.timeframeYearsFromCurrent || 0;
      const annualReturn = expectedReturn / 100;
      const monthlyReturn = annualReturn / 12;
      const totalMonths = years * 12;

      if (totalMonths === 0 || !monthlyAmount) {
        return stage;
      }

      // SIP Future Value calculation
      const futureValue = monthlyAmount * (((1 + monthlyReturn) ** totalMonths - 1) / monthlyReturn) * (1 + monthlyReturn);
      
      // Calculate new projections
      const additionalWealth = Math.round(futureValue);
      const currentNetWorth = stage.detailedFinancialProjection?.projectedNetWorth || 0;
      const currentMonthlySavings = stage.detailedFinancialProjection?.projectedMonthlySavings || 0;
      const currentInvestmentValue = stage.detailedFinancialProjection?.investmentValue || 0;
      
      const newNetWorth = currentNetWorth + additionalWealth;
      const newMonthlySavings = currentMonthlySavings + monthlyAmount;
      
      return {
        ...stage,
        detailedFinancialProjection: {
          ...stage.detailedFinancialProjection,
          projectedNetWorth: newNetWorth,
          projectedMonthlySavings: newMonthlySavings,
          investmentValue: currentInvestmentValue + additionalWealth
        },
        changes: {
          netWorthIncrease: additionalWealth,
          investmentAdded: futureValue,
          actionType: `${investmentType} SIP`,
          monthlyCommitment: monthlyAmount
        }
      };
    });
  };

  // Calculate loan impact
  const calculateLoanImpact = (loanAmount, interestRate, tenure, loanType) => {
    if (!loanAmount || !interestRate || !tenure) {
      return modifiedFutureStages;
    }

    const monthlyRate = interestRate / 100 / 12;
    const totalMonths = tenure * 12;
    const emi = (loanAmount * monthlyRate * (1 + monthlyRate) ** totalMonths) / ((1 + monthlyRate) ** totalMonths - 1);

    return modifiedFutureStages.map(stage => {
      const years = stage.timeframeYearsFromCurrent || 0;
      const monthsPaid = Math.min(years * 12, totalMonths);
      const totalPaid = emi * monthsPaid;
      const principalPaid = loanAmount * (monthsPaid / totalMonths);
      const interestPaid = totalPaid - principalPaid;
      const remainingDebt = Math.max(0, loanAmount - principalPaid);
      
      const currentNetWorth = stage.detailedFinancialProjection?.projectedNetWorth || 0;
      const currentTotalDebt = stage.detailedFinancialProjection?.projectedTotalDebt || 0;
      
      const newNetWorth = currentNetWorth - remainingDebt;
      const newTotalDebt = currentTotalDebt + remainingDebt;

      // Update asset ownership based on loan type
      let updatedAssetOwnership = { ...stage.assetOwnershipProjection };
      
      if (loanType === "Car Loan") {
        updatedAssetOwnership = {
          ...updatedAssetOwnership,
          car: {
            ...updatedAssetOwnership?.car,
            ownershipStatus: years >= tenure ? "Owned (paid off)" : "Owned (loan)",
            chanceOfAcquisition: 100, // Already acquired
            notes: `Purchased with ${loanType}`
          },
          // Reduce bike acquisition chance (already have car)
          bike: {
            ...updatedAssetOwnership?.bike,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.bike?.chanceOfAcquisition || 0) - 30)
          }
        };
      } else if (loanType === "Education Loan") {
        // Education loan reduces other asset acquisition chances due to EMI burden
        updatedAssetOwnership = {
          ...updatedAssetOwnership,
          car: {
            ...updatedAssetOwnership?.car,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.car?.chanceOfAcquisition || 0) - 20)
          },
          bike: {
            ...updatedAssetOwnership?.bike,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.bike?.chanceOfAcquisition || 0) - 10)
          },
          home: {
            ...updatedAssetOwnership?.home,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.home?.chanceOfAcquisition || 0) - 15)
          }
        };
      } else if (loanType === "Home Loan") {
        updatedAssetOwnership = {
          ...updatedAssetOwnership,
          home: {
            ...updatedAssetOwnership?.home,
            ownershipStatus: years >= tenure ? "Owned (paid off)" : "Owned (loan)",
            chanceOfAcquisition: 100, // Already acquired
            notes: `Purchased with ${loanType}`
          },
          // Reduce other asset chances (tight budget after home loan)
          car: {
            ...updatedAssetOwnership?.car,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.car?.chanceOfAcquisition || 0) - 25)
          },
          bike: {
            ...updatedAssetOwnership?.bike,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.bike?.chanceOfAcquisition || 0) - 15)
          }
        };
      } else if (loanType === "Personal Loan") {
        // Personal loan reduces all asset acquisition chances
        updatedAssetOwnership = {
          ...updatedAssetOwnership,
          car: {
            ...updatedAssetOwnership?.car,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.car?.chanceOfAcquisition || 0) - 15)
          },
          bike: {
            ...updatedAssetOwnership?.bike,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.bike?.chanceOfAcquisition || 0) - 10)
          },
          home: {
            ...updatedAssetOwnership?.home,
            chanceOfAcquisition: Math.max(0, (updatedAssetOwnership?.home?.chanceOfAcquisition || 0) - 20)
          }
        };
      }
      
      return {
        ...stage,
        detailedFinancialProjection: {
          ...stage.detailedFinancialProjection,
          projectedNetWorth: newNetWorth,
          projectedTotalDebt: newTotalDebt
        },
        assetOwnershipProjection: updatedAssetOwnership,
        changes: {
          debtAdded: remainingDebt,
          interestPaid: Math.round(interestPaid),
          actionType: loanType,
          monthlyEMI: Math.round(emi),
          loanAmount: loanAmount,
          assetAcquired: loanType === "Car Loan" ? "Car" : loanType === "Home Loan" ? "Home" : null
        }
      };
    });
  };

  // Apply financial action
  const applyAction = () => {
    if (selectedAction === 'investment') {
      const newStages = calculateInvestmentImpact(
        parseInt(actionForm.amount) || 0,
        actionForm.expectedReturn || 12,
        actionForm.investmentType || 'Investment'
      );
      setModifiedFutureStages(newStages);
    } else if (selectedAction === 'loan') {
      const newStages = calculateLoanImpact(
        parseInt(actionForm.amount) || 0,
        actionForm.interestRate || 16,
        parseInt(actionForm.tenure) || 5,
        actionForm.loanType || 'Loan'
      );
      setModifiedFutureStages(newStages);
    }

    setHasChanges(true);
    setSelectedAction(null);
    setActionForm({});
  };

  // Reset to original projections
  const resetProjections = () => {
    setModifiedFutureStages([...originalFutureStages]);
    setHasChanges(false);
  };

  // Safe value formatting functions
  const formatCurrency = (amount) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) return '₹0';
    if (numAmount >= 10000000) return `₹${(numAmount / 10000000).toFixed(1)}Cr`;
    if (numAmount >= 100000) return `₹${(numAmount / 100000).toFixed(1)}L`;
    if (numAmount >= 1000) return `₹${(numAmount / 1000).toFixed(0)}K`;
    return `₹${numAmount.toLocaleString()}`;
  };

  const formatLargeCurrency = (amount) => {
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount === 0) return '₹0';
    return `₹${numAmount.toLocaleString()}`;
  };

  // Safe value getter with fallbacks
  const safeGetValue = (value, fallback = 0) => {
    if (value === null || value === undefined || isNaN(Number(value))) {
      return fallback;
    }
    return Number(value);
  };

  const safeGetString = (value, fallback = 'N/A') => {
    if (!value || value === null || value === undefined) {
      return fallback;
    }
    return String(value);
  };

  if (!profileData) {
    return <div className="p-4 text-center">Loading profile data…</div>;
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '24px',
      backgroundColor: '#f9fafb'
    }}>
      {/* Present Profile with Action Buttons */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(400px, 1fr) 350px',
        gap: '24px',
        marginBottom: '32px'
      }}>
        {/* Current Profile Table */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            background: 'linear-gradient(to right, #059669, #10b981)',
            color: 'white',
            padding: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0
            }}>
              <User size={20} />
              Current Financial Profile
            </h2>
            <p style={{ color: '#d1fae5', marginTop: '4px', margin: '4px 0 0 0' }}>
              Real-time data from Fi Money MCP
            </p>
          </div>

          {/* Profile Content */}
          <div style={{ padding: '24px' }}>
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
                  <span style={{ fontWeight: '500' }}>
                    {formatCurrency(safeGetValue(basicInfo?.financialSummary?.netWorth))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Savings:</span>
                  <span style={{ fontWeight: '500' }}>
                    {formatCurrency(safeGetValue(basicInfo?.financialSummary?.liquidSavings))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Total Debt:</span>
                  <span style={{ fontWeight: '500', color: '#dc2626' }}>
                    {formatCurrency(safeGetValue(basicInfo?.financialSummary?.totalDebt))}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Credit Score:</span>
                  <span style={{ fontWeight: '500', color: '#059669' }}>
                    {safeGetValue(basicInfo?.financialSummary?.creditScore, 'N/A')}
                  </span>
                </div>
              </div>
            </div>

            {/* Demographics */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
              <h3 style={{ 
                fontWeight: '600', 
                color: '#1f2937', 
                borderBottom: '1px solid #e5e7eb', 
                paddingBottom: '8px',
                margin: 0
              }}>Personal Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Age Range:</span>
                  <span style={{ fontWeight: '500' }}>
                    {safeGetString(basicInfo?.demographics?.estimatedAge)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Experience:</span>
                  <span style={{ fontWeight: '500' }}>
                    {safeGetValue(basicInfo?.demographics?.workExperience)} years
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Employer:</span>
                  <span style={{ fontWeight: '500' }}>
                    {safeGetString(basicInfo?.demographics?.employer)}
                  </span>
                </div>
              </div>
            </div>

            {/* Human Description */}
            {profileData.humanDescription && (
              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: '#f0f9ff', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', color: '#1e40af', margin: '0 0 8px 0' }}>Financial Personality</h4>
                <p style={{ fontSize: '14px', color: '#1e3a8a', margin: 0, fontStyle: 'italic' }}>
                  "{safeGetString(profileData.humanDescription.summary, 'Financial profile analysis available')}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Actions Panel */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(to right, #7c3aed, #2563eb)',
            color: 'white',
            padding: '16px'
          }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0
            }}>
              <Calculator size={18} />
              Financial Actions
            </h3>
            <p style={{ color: '#c4b5fd', fontSize: '12px', margin: '4px 0 0 0' }}>
              Take actions that change your future
            </p>
          </div>

          <div style={{ padding: '20px' }}>
            {hasChanges && (
              <div style={{
                backgroundColor: '#ecfdf5',
                border: '1px solid #10b981',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#065f46' }}>
                    Future projections updated!
                  </span>
                </div>
                <button
                  onClick={resetProjections}
                  style={{
                    fontSize: '12px',
                    color: '#059669',
                    textDecoration: 'underline',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    marginTop: '4px'
                  }}
                >
                  Reset to original
                </button>
              </div>
            )}

            {/* Investment Actions */}
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0' }}>
                Start Investing
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {investmentOptions.slice(0, 3).map((option) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      setSelectedAction('investment');
                      setActionForm({ 
                        investmentType: option.type,
                        expectedReturn: option.expectedReturn,
                        amount: option.minAmount 
                      });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e5e7eb';
                      e.target.style.borderColor = '#9ca3af';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {option.icon}
                      <span style={{ fontWeight: '500' }}>{option.type}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: '600' }}>
                      {option.expectedReturn}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Loan Actions */}
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0' }}>
                Get Loans
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {loanOptions.slice(0, 3).map((option) => (
                  <button
                    key={option.type}
                    onClick={() => {
                      setSelectedAction('loan');
                      setActionForm({ 
                        loanType: option.type,
                        interestRate: option.interestRate,
                        maxAmount: option.maxAmount,
                        tenure: 5 
                      });
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px',
                      backgroundColor: '#fef3c7',
                      border: '1px solid #f59e0b',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#fde68a';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#fef3c7';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {option.icon}
                      <span style={{ fontWeight: '500' }}>{option.type}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: '#d97706', fontWeight: '600' }}>
                      {option.interestRate}%
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Button */}
            {onStartConversation && (
              <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #e5e7eb' }}>
                <button
                  onClick={onStartConversation}
                  style={{
                    width: '100%',
                    padding: '12px',
                    backgroundColor: '#7c3aed',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <Clock size={16} />
                  Talk to Future Me
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Modal */}
      {selectedAction && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '400px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', margin: '0 0 16px 0' }}>
              {selectedAction === 'investment' ? 'Configure Investment' : 'Configure Loan'}
            </h3>

            {selectedAction === 'investment' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Investment Type
                  </label>
                  <select
                    value={actionForm.investmentType || ''}
                    onChange={(e) => {
                      const selected = investmentOptions.find(opt => opt.type === e.target.value);
                      setActionForm({
                        ...actionForm,
                        investmentType: e.target.value,
                        expectedReturn: selected?.expectedReturn || 12
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    {investmentOptions.map(option => (
                      <option key={option.type} value={option.type}>
                        {option.type} ({option.expectedReturn}% returns)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Monthly Investment Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={actionForm.amount || ''}
                    onChange={(e) => setActionForm({ ...actionForm, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., 5000"
                  />
                </div>
              </div>
            )}

            {selectedAction === 'loan' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Loan Type
                  </label>
                  <select
                    value={actionForm.loanType || ''}
                    onChange={(e) => {
                      const selected = loanOptions.find(opt => opt.type === e.target.value);
                      setActionForm({
                        ...actionForm,
                        loanType: e.target.value,
                        interestRate: selected?.interestRate || 16
                      });
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                  >
                    {loanOptions.map(option => (
                      <option key={option.type} value={option.type}>
                        {option.type} ({option.interestRate}% interest)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Loan Amount (₹)
                  </label>
                  <input
                    type="number"
                    value={actionForm.amount || ''}
                    onChange={(e) => setActionForm({ ...actionForm, amount: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., 500000"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                    Tenure (Years)
                  </label>
                  <input
                    type="number"
                    value={actionForm.tenure || ''}
                    onChange={(e) => setActionForm({ ...actionForm, tenure: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '14px'
                    }}
                    placeholder="e.g., 5"
                  />
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                onClick={applyAction}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#059669',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Apply & See Impact
              </button>
              <button
                onClick={() => {
                  setSelectedAction(null);
                  setActionForm({});
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  backgroundColor: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Future Stages Section with Change Highlights */}
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
            Future Financial Stages {hasChanges && <span style={{ fontSize: '14px', backgroundColor: '#10b981', padding: '4px 8px', borderRadius: '12px' }}>Updated</span>}
          </h2>
          <p style={{ color: '#c4b5fd', marginTop: '4px', margin: '4px 0 0 0' }}>
            {hasChanges ? 'Projections updated based on your actions' : 'Projected financial journey based on current profile'}
          </p>
        </div>

        {modifiedFutureStages?.map((stage, index) => {
          const original = originalFutureStages[index];
          const hasChangesInStage = hasChanges && stage.changes;
          
          return (
            <div key={index} style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              boxShadow: hasChangesInStage ? '0 4px 12px rgba(16, 185, 129, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              border: hasChangesInStage ? '2px solid #10b981' : 'none',
              overflow: 'hidden'
            }}>
              <div style={{
                background: hasChangesInStage ? 
                  'linear-gradient(to right, #10b981, #059669)' : 
                  'linear-gradient(to right, #6366f1, #8b5cf6)',
                color: 'white',
                padding: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                    {safeGetString(stage.versionName, `Stage ${index + 1}`)}
                  </h3>
                  {hasChangesInStage && (
                    <div style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.2)', 
                      padding: '4px 12px', 
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      UPDATED
                    </div>
                  )}
                </div>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  marginTop: '8px',
                  fontSize: '14px'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={16} />
                    Age: {safeGetString(stage.estimatedAgeRange, 'N/A')}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Target size={16} />
                    Timeframe: {safeGetValue(stage.timeframeYearsFromCurrent, 0)} years
                  </span>
                </div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Changes Alert */}
                {hasChangesInStage && stage.changes && (
                  <div style={{
                    backgroundColor: '#ecfdf5',
                    border: '1px solid #10b981',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Zap size={16} style={{ color: '#10b981' }} />
                      <span style={{ fontWeight: '600', color: '#065f46' }}>
                        Impact of {safeGetString(stage.changes.actionType, 'Financial Action')}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#065f46' }}>
                      {stage.changes.netWorthIncrease && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <ArrowUp size={14} style={{ color: '#10b981' }} />
                          <span>Net Worth increased by {formatCurrency(stage.changes.netWorthIncrease)}</span>
                        </div>
                      )}
                      {stage.changes.debtAdded && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <ArrowDown size={14} style={{ color: '#dc2626' }} />
                          <span>Debt added: {formatCurrency(stage.changes.debtAdded)}</span>
                        </div>
                      )}
                      {stage.changes.assetAcquired && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <CheckCircle size={14} style={{ color: '#10b981' }} />
                          <span style={{ fontWeight: '600' }}>Asset acquired: {stage.changes.assetAcquired}</span>
                        </div>
                      )}
                      {stage.changes.monthlyCommitment && (
                        <div style={{ fontSize: '12px', color: '#047857' }}>
                          Monthly commitment: ₹{safeGetValue(stage.changes.monthlyCommitment, 0).toLocaleString()}
                        </div>
                      )}
                      {stage.changes.monthlyEMI && (
                        <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                          Monthly EMI: ₹{safeGetValue(stage.changes.monthlyEMI, 0).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
                  {/* Financial Projections */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontWeight: '600', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: 0 }}>
                      Financial Projections
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Net Worth:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '500', color: '#059669' }}>
                            {formatCurrency(safeGetValue(stage.detailedFinancialProjection?.projectedNetWorth))}
                          </span>
                          {hasChangesInStage && original && 
                           safeGetValue(stage.detailedFinancialProjection?.projectedNetWorth) !== safeGetValue(original.detailedFinancialProjection?.projectedNetWorth) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ArrowUp size={12} style={{ color: '#10b981' }} />
                              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                                +{formatCurrency(safeGetValue(stage.detailedFinancialProjection?.projectedNetWorth) - safeGetValue(original.detailedFinancialProjection?.projectedNetWorth))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Total Debt:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '500', color: '#dc2626' }}>
                            {formatCurrency(safeGetValue(stage.detailedFinancialProjection?.projectedTotalDebt))}
                          </span>
                          {hasChangesInStage && original && 
                           safeGetValue(stage.detailedFinancialProjection?.projectedTotalDebt) !== safeGetValue(original.detailedFinancialProjection?.projectedTotalDebt) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <ArrowUp size={12} style={{ color: '#dc2626' }} />
                              <span style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>
                                +{formatCurrency(safeGetValue(stage.detailedFinancialProjection?.projectedTotalDebt) - safeGetValue(original.detailedFinancialProjection?.projectedTotalDebt))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Credit Score:</span>
                        <span style={{ fontWeight: '500' }}>
                          {safeGetValue(stage.detailedFinancialProjection?.projectedCreditScore, 'N/A')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Monthly Savings:</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: '500' }}>
                            {formatCurrency(safeGetValue(stage.detailedFinancialProjection?.projectedMonthlySavings))}
                          </span>
                          {hasChangesInStage && original && 
                           safeGetValue(stage.detailedFinancialProjection?.projectedMonthlySavings) !== safeGetValue(original.detailedFinancialProjection?.projectedMonthlySavings) && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Plus size={12} style={{ color: '#10b981' }} />
                              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>
                                +{formatCurrency(safeGetValue(stage.detailedFinancialProjection?.projectedMonthlySavings) - safeGetValue(original.detailedFinancialProjection?.projectedMonthlySavings))}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Emergency Fund:</span>
                        <span style={{ fontWeight: '500' }}>
                          {safeGetValue(stage.detailedFinancialProjection?.emergencyFundMonths, 0)} months
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Career & Income */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontWeight: '600', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: 0 }}>
                      Career & Income
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Monthly Income:</span>
                        <span style={{ fontWeight: '500' }}>
                          {formatCurrency(safeGetValue(stage.careerFinancials?.estimatedMonthlyIncome))}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Income Growth:</span>
                        <span style={{ fontWeight: '500', color: '#059669' }}>
                          {safeGetString(stage.careerFinancials?.incomeGrowthFromCurrent)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Job Stability:</span>
                        <span style={{ fontWeight: '500' }}>
                          {safeGetString(stage.careerFinancials?.jobStability)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#6b7280' }}>Stress Level:</span>
                        <span style={{ fontWeight: '500' }}>
                          {safeGetString(stage.financialStressLevel)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Asset Ownership */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <h4 style={{ fontWeight: '600', color: '#1f2937', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px', margin: 0 }}>
                      Asset Ownership
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Car size={14} />
                          Car:
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: '500' }}>
                            {safeGetString(stage.assetOwnershipProjection?.car?.ownershipStatus, 'None')}
                          </span>
                          {stage.assetOwnershipProjection?.car?.chanceOfAcquisition && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#059669',
                              backgroundColor: '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {safeGetValue(stage.assetOwnershipProjection.car.chanceOfAcquisition, 0)}% chance
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Bike size={14} />
                          Bike:
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: '500' }}>
                            {safeGetString(stage.assetOwnershipProjection?.bike?.ownershipStatus, 'None')}
                          </span>
                          {stage.assetOwnershipProjection?.bike?.chanceOfAcquisition && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#059669',
                              backgroundColor: '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {safeGetValue(stage.assetOwnershipProjection.bike.chanceOfAcquisition, 0)}% chance
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Home size={14} />
                          Home:
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ fontWeight: '500' }}>
                            {safeGetString(stage.assetOwnershipProjection?.home?.ownershipStatus, 'Renting')}
                          </span>
                          {stage.assetOwnershipProjection?.home?.chanceOfAcquisition && (
                            <span style={{ 
                              fontSize: '12px', 
                              color: '#059669',
                              backgroundColor: '#ecfdf5',
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}>
                              {safeGetValue(stage.assetOwnershipProjection.home.chanceOfAcquisition, 0)}% chance
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestones */}
                <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <h4 style={{ fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0' }}>Key Milestones</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '14px' }}>
                    {stage.realisticMilestones?.debtFreeTarget && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle size={14} style={{ color: '#059669' }} />
                        <span>{safeGetString(stage.realisticMilestones.debtFreeTarget)}</span>
                      </div>
                    )}
                    {stage.realisticMilestones?.firstMajorPurchase && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Target size={14} style={{ color: '#7c3aed' }} />
                        <span>{safeGetString(stage.realisticMilestones.firstMajorPurchase)}</span>
                      </div>
                    )}
                    {stage.realisticMilestones?.creditScoreGoal && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <TrendingUp size={14} style={{ color: '#2563eb' }} />
                        <span>Credit Score: {safeGetValue(stage.realisticMilestones.creditScoreGoal)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#eff6ff', borderLeft: '4px solid #2563eb', borderRadius: '0 8px 8px 0' }}>
                  <p style={{ fontSize: '14px', color: '#1e40af', margin: 0, fontStyle: 'italic' }}>
                    "{safeGetString(stage.summary, 'Financial stage progression analysis')}"
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Credit Profile Section (existing tables) */}
      {basicInfo?.creditProfile && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          marginTop: '32px'
        }}>
          <div style={{
            background: 'linear-gradient(to right, #dc2626, #ef4444)',
            color: 'white',
            padding: '16px'
          }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              margin: 0
            }}>
              <CreditCard size={20} />
              Credit Profile Details
            </h2>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Credit Summary */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <h3 style={{ 
                fontWeight: '600', 
                color: '#1f2937', 
                borderBottom: '1px solid #e5e7eb', 
                paddingBottom: '8px',
                margin: 0
              }}>Credit Overview</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Total Accounts:</span>
                  <span style={{ fontWeight: '500' }}>{safeGetValue(basicInfo.creditProfile.totalAccounts)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Active:</span>
                  <span style={{ fontWeight: '500', color: '#059669' }}>{safeGetValue(basicInfo.creditProfile.activeAccounts)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#6b7280' }}>Closed:</span>
                  <span style={{ fontWeight: '500' }}>{safeGetValue(basicInfo.creditProfile.closedAccounts)}</span>
                </div>
              </div>
            </div>

            {/* Credit Cards Table */}
            {basicInfo.creditProfile.creditCards?.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  borderBottom: '1px solid #e5e7eb', 
                  paddingBottom: '8px',
                  margin: '0 0 16px 0'
                }}>Credit Cards</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Bank</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Credit Limit</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Current Balance</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Utilization</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {basicInfo.creditProfile.creditCards.map((card, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', fontWeight: '500' }}>{safeGetString(card.bank)}</td>
                          <td style={{ padding: '12px' }}>{formatLargeCurrency(safeGetValue(card.creditLimit))}</td>
                          <td style={{ padding: '12px' }}>{formatLargeCurrency(safeGetValue(card.currentBalance))}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: safeGetValue(card.utilization) > 70 ? '#fef2f2' : 
                                safeGetValue(card.utilization) > 30 ? '#fefce8' : '#f0fdf4',
                              color: safeGetValue(card.utilization) > 70 ? '#991b1b' : 
                                safeGetValue(card.utilization) > 30 ? '#a16207' : '#166534'
                            }}>
                              {safeGetValue(card.utilization).toFixed(1)}%
                            </span>
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: card.status === 'Active' ? '#f0fdf4' : '#fef2f2',
                              color: card.status === 'Active' ? '#166534' : '#991b1b'
                            }}>
                              {safeGetString(card.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Loans Table */}
            {basicInfo.creditProfile.loans?.length > 0 && (
              <div>
                <h3 style={{ 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  borderBottom: '1px solid #e5e7eb', 
                  paddingBottom: '8px',
                  margin: '0 0 16px 0'
                }}>Active Loans</h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Bank</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Loan Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Original Amount</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Current Balance</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', borderBottom: '1px solid #e5e7eb' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {basicInfo.creditProfile.loans.map((loan, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #f3f4f6' }}>
                          <td style={{ padding: '12px', fontWeight: '500' }}>{safeGetString(loan.bank)}</td>
                          <td style={{ padding: '12px' }}>{safeGetString(loan.loanType)}</td>
                          <td style={{ padding: '12px' }}>{formatLargeCurrency(safeGetValue(loan.originalAmount))}</td>
                          <td style={{ padding: '12px' }}>{formatLargeCurrency(safeGetValue(loan.currentBalance))}</td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              backgroundColor: loan.status === 'Active' ? '#fef3c7' : '#f0fdf4',
                              color: loan.status === 'Active' ? '#d97706' : '#166534'
                            }}>
                              {safeGetString(loan.status)}
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
        </div>
      )}
    </div>
  );
};

export default ProfileDataTables;