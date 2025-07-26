/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import PresentMe from './PresentMe';
import FutureMe from './FutureMe';

const nodeTypes = {
  presentMe: PresentMe,
  futureMe: FutureMe,
};

const ProfileFlow = ({ profileData, onStartConversation }) => {
  console.log("profile data ", profileData)
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [originalFutureStages, setOriginalFutureStages] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [appliedActions, setAppliedActions] = useState([]);

  // Enhanced financial action calculator
  const calculateFinancialImpact = useCallback((actionType, actionData, currentProfile) => {
    const impact = {
      netWorthChange: 0,
      debtChange: 0,
      monthlyCommitmentChange: 0,
      creditScoreChange: 0,
      assetChanges: {},
      futureProjections: []
    };

    const currentNetWorth = currentProfile.basicInfo?.financialSummary?.netWorth || 0;
    const currentDebt = currentProfile.basicInfo?.financialSummary?.totalDebt || 0;
    const currentIncome = currentProfile.basicInfo?.demographics?.monthlyIncome || 50000;

    switch (actionType) {
      case 'start_sip':
        // Calculate SIP impact on future wealth
        const { sipAmount, sipDuration } = actionData;
        const annualReturn = 0.12;
        const monthlyReturn = annualReturn / 12;
        
        // Future value of SIP
        const futureValue = sipAmount * 
          (((Math.pow(1 + monthlyReturn, sipDuration) - 1) / monthlyReturn) * (1 + monthlyReturn));
        
        impact.netWorthChange = futureValue - (sipAmount * sipDuration);
        impact.monthlyCommitmentChange = -sipAmount; // Negative because it's an expense
        impact.assetChanges.investments = futureValue;
        
        // Generate future projections
        for (let i = 0; i < 3; i++) {
          const yearsAhead = (i + 1) * 3; // 3, 6, 9 years
          const monthsAhead = yearsAhead * 12;
          const partialSIPValue = Math.min(monthsAhead, sipDuration);
          
          const projectedValue = sipAmount * 
            (((Math.pow(1 + monthlyReturn, partialSIPValue) - 1) / monthlyReturn) * (1 + monthlyReturn));
          
          impact.futureProjections.push({
            stage: i,
            netWorthIncrease: projectedValue - (sipAmount * partialSIPValue),
            totalInvestmentValue: projectedValue
          });
        }
        break;

      case 'take_loan':
        const { loanAmount, loanTenure, loanType } = actionData;
        const interestRate = loanType === 'home' ? 0.085 : loanType === 'car' ? 0.095 : 0.11;
        const monthlyRate = interestRate / 12;
        
        // EMI calculation
        const emi = loanAmount * 
          (monthlyRate * Math.pow(1 + monthlyRate, loanTenure)) / 
          (Math.pow(1 + monthlyRate, loanTenure) - 1);
        
        const totalPayment = emi * loanTenure;
        const totalInterest = totalPayment - loanAmount;
        
        impact.debtChange = loanAmount;
        impact.monthlyCommitmentChange = -emi;
        impact.creditScoreChange = -20; // Temporary dip from new credit inquiry
        
        // Asset acquisition
        if (loanType === 'home') {
          impact.assetChanges.realEstate = loanAmount;
        } else if (loanType === 'car') {
          impact.assetChanges.vehicle = loanAmount;
        }
        
        // Future projections
        for (let i = 0; i < 3; i++) {
          const yearsAhead = (i + 1) * 3;
          const monthsAhead = yearsAhead * 12;
          const remainingTenure = Math.max(0, loanTenure - monthsAhead);
          const paidEMIs = Math.min(monthsAhead, loanTenure);
          
          // Calculate remaining principal
          let remainingPrincipal = loanAmount;
          for (let month = 0; month < paidEMIs; month++) {
            const interestPayment = remainingPrincipal * monthlyRate;
            const principalPayment = emi - interestPayment;
            remainingPrincipal -= principalPayment;
          }
          
          impact.futureProjections.push({
            stage: i,
            debtReduction: loanAmount - Math.max(0, remainingPrincipal),
            remainingDebt: Math.max(0, remainingPrincipal),
            totalInterestPaid: (paidEMIs * emi) - (loanAmount - Math.max(0, remainingPrincipal))
          });
        }
        break;

      case 'make_repayment':
        const { repaymentAmount } = actionData;
        const interestSaved = repaymentAmount * 0.24; // Assuming 24% average interest
        
        impact.debtChange = -repaymentAmount;
        impact.netWorthChange = interestSaved; // Interest saved is wealth gained
        impact.creditScoreChange = Math.min(50, Math.round(repaymentAmount / 1000));
        
        // Future projections
        for (let i = 0; i < 3; i++) {
          const yearsAhead = (i + 1) * 3;
          const compoundInterestSaved = interestSaved * Math.pow(1.24, yearsAhead);
          
          impact.futureProjections.push({
            stage: i,
            netWorthIncrease: compoundInterestSaved,
            creditScoreIncrease: impact.creditScoreChange * (i + 1)
          });
        }
        break;
    }

    return impact;
  }, []);

  // Apply financial action and update future stages
  const applyFinancialAction = useCallback((actionType, actionData) => {
    if (!profileData) return;

    console.log('Applying financial action:', actionType, actionData);
    
    const impact = calculateFinancialImpact(actionType, actionData, profileData);
    const newAction = {
      id: Date.now(),
      type: actionType,
      data: actionData,
      impact,
      timestamp: new Date().toISOString()
    };

    // Update applied actions
    setAppliedActions(prev => [...prev, newAction]);

    // Calculate updated future stages
    const updatedStages = profileData.futureStages.map((stage, index) => {
      const futureProjection = impact.futureProjections[index];
      if (!futureProjection) return stage;

      // Create updated stage with changes
      const updatedStage = {
        ...stage,
        detailedFinancialProjection: {
          ...stage.detailedFinancialProjection,
          projectedNetWorth: stage.detailedFinancialProjection.projectedNetWorth + (futureProjection.netWorthIncrease || 0),
          projectedTotalDebt: Math.max(0, stage.detailedFinancialProjection.projectedTotalDebt + (futureProjection.debtReduction ? -futureProjection.debtReduction : impact.debtChange || 0)),
          projectedCreditScore: Math.min(850, Math.max(300, stage.detailedFinancialProjection.projectedCreditScore + (futureProjection.creditScoreIncrease || impact.creditScoreChange || 0))),
          projectedMonthlySavings: stage.detailedFinancialProjection.projectedMonthlySavings + (impact.monthlyCommitmentChange || 0),
          projectedInvestments: stage.detailedFinancialProjection.projectedInvestments + (futureProjection.totalInvestmentValue || 0)
        },
        // Add change indicator
        changes: {
          action: newAction,
          appliedAt: new Date().toISOString(),
          summary: generateChangeSummary(actionType, actionData, futureProjection)
        }
      };

      // Update asset ownership based on action
      if (actionType === 'take_loan') {
        if (actionData.loanType === 'home') {
          updatedStage.assetOwnershipProjection.home = {
            ...updatedStage.assetOwnershipProjection.home,
            ownershipStatus: 'Owned (loan)',
            notes: `Acquired through loan of ₹${actionData.loanAmount.toLocaleString()}`
          };
        } else if (actionData.loanType === 'car') {
          updatedStage.assetOwnershipProjection.car = {
            ...updatedStage.assetOwnershipProjection.car,
            ownershipStatus: 'Owned (loan)',
            notes: `Acquired through loan of ₹${actionData.loanAmount.toLocaleString()}`
          };
        }
      }

      return updatedStage;
    });

    // Update nodes in-place without changing positions
    setNodes(currentNodes => 
      currentNodes.map(node => {
        if (node.type === 'presentMe') {
          // Update present node data with new profile
          return {
            ...node,
            data: {
              ...node.data,
              humanDescription: {
                ...node.data.humanDescription,
                // Keep the same data structure but could add applied actions indicator
              },
              onFinancialAction: applyFinancialAction,
            }
          };
        } else if (node.type === 'futureMe') {
          // Find the corresponding updated stage
          const stageIndex = parseInt(node.id.replace('future-', ''));
          const updatedStage = updatedStages[stageIndex];
          
          if (updatedStage) {
            return {
              ...node,
              data: {
                ...node.data,
                detailedFinancialProjection: updatedStage.detailedFinancialProjection,
                assetOwnershipProjection: updatedStage.assetOwnershipProjection,
                changes: updatedStage.changes,
              },
              style: updatedStage.changes ? {
                ...node.style,
                border: '3px solid #10b981',
                boxShadow: '0 4px 16px rgba(16, 185, 129, 0.4)',
                transform: 'scale(1.02)',
              } : node.style,
              className: updatedStage.changes ? 'updated-node' : node.className
            };
          }
        }
        return node;
      })
    );

    // Update edges to show changes
    setEdges(currentEdges => 
      currentEdges.map(edge => {
        if (edge.source === 'present' && edge.target.startsWith('future-')) {
          const stageIndex = parseInt(edge.target.replace('future-', ''));
          const updatedStage = updatedStages[stageIndex];
          
          return {
            ...edge,
            style: {
              stroke: updatedStage?.changes ? '#10b981' : '#6366f1',
              strokeWidth: updatedStage?.changes ? 3 : 2,
            },
            animated: updatedStage?.changes ? true : false,
          };
        }
        return edge;
      })
    );

    setHasChanges(true);
  }, [profileData, calculateFinancialImpact]);

  const generateChangeSummary = (actionType, actionData, futureProjection) => {
    switch (actionType) {
      case 'start_sip':
        return `Started SIP of ₹${actionData.sipAmount.toLocaleString()}/month. Expected wealth increase: ₹${futureProjection?.netWorthIncrease?.toLocaleString() || 0}`;
      case 'take_loan':
        return `Took ${actionData.loanType} loan of ₹${actionData.loanAmount.toLocaleString()}. Debt reduction: ₹${futureProjection?.debtReduction?.toLocaleString() || 0}`;
      case 'make_repayment':
        return `Made repayment of ₹${actionData.repaymentAmount.toLocaleString()}. Net worth boost: ₹${futureProjection?.netWorthIncrease?.toLocaleString() || 0}`;
      default:
        return 'Financial action applied';
    }
  };

  // Convert profile data to React Flow nodes and edges
  const convertProfileToNodes = useCallback((profile) => {
    if (!profile) return { nodes: [], edges: [] };

    const newNodes = [];
    const newEdges = [];

    // Create Present Me node with financial action handler
    const presentNode = {
      id: 'present',
      type: 'presentMe',
      position: { x: 300, y: 100 },
      data: {
        humanDescription: {
          name: profileData.basicInfo?.demographics?.estimatedName || 'SHIXXXX',
          age: profile.basicInfo?.demographics?.estimatedAge || 'Unknown',
          lifeStage: profile.basicInfo?.demographics?.lifeStage || 'Professional',
          netWorth: profile.basicInfo?.financialSummary?.netWorth || 0,
          totalLiability: profile.basicInfo?.financialSummary?.totalDebt || 0,
          creditScore: profile.basicInfo?.financialSummary?.creditScore || 'N/A',
          employment: {
            currentEmployer: profile.basicInfo?.demographics?.employer || 'Unknown',
            workExperienceYears: profile.basicInfo?.demographics?.workExperience || 0,
            careerTrajectory: profile.basicInfo?.demographics?.careerTrajectory || 'Stable',
            monthlyIncome: profile.basicInfo?.demographics?.monthlyIncome || 50000,
          },
          profileImage: profile.basicInfo?.demographics?.profileImage || '',
        },
        // Pass the financial action handler to PresentMe
        onFinancialAction: applyFinancialAction,
      },
    };
    newNodes.push(presentNode);

    // Create Future Me nodes from futureStages
    if (profile.futureStages && Array.isArray(profile.futureStages)) {
      profile.futureStages.forEach((stage, index) => {
        const futureNode = {
          id: `future-${index}`,
          type: 'futureMe',
          position: { 
            x: 100 + (index * 350), 
            y: 350 
          },
          data: {
            versionName: stage.versionName || `Future Me ${index + 1}`,
            estimatedAgeRange: stage.estimatedAgeRange || 'Unknown',
            estimatedYearRange: stage.estimatedYearRange || 'Unknown',
            summary: stage.summary || 'Financial progression stage',
            detailedFinancialProjection: {
              projectedNetWorth: stage.detailedFinancialProjection?.projectedNetWorth || 0,
              projectedTotalDebt: stage.detailedFinancialProjection?.projectedTotalDebt || 0,
              projectedMonthlySavings: stage.detailedFinancialProjection?.projectedMonthlySavings || 0,
              projectedCreditScore: stage.detailedFinancialProjection?.projectedCreditScore || 0,
              projectedInvestments: stage.detailedFinancialProjection?.projectedInvestments || 0,
            },
            financialStressLevel: stage.financialStressLevel || 'Unknown',
            assetOwnershipProjection: stage.assetOwnershipProjection || {},
            creditScore: stage.creditScore || {},
            goals: stage.goals || [],
            profileImage: stage.profileImage || '',
            incomeProjection: stage.incomeProjection || {},
            // Add change indicators if they exist
            changes: stage.changes || null,
          },
        };
        newNodes.push(futureNode);

        // Create edge from present to this future stage
        const edge = {
          id: `edge-present-future-${index}`,
          source: 'present',
          target: `future-${index}`,
          markerEnd: { type: MarkerType.Arrow },
          style: {
            stroke: stage.changes ? '#10b981' : '#6366f1',
            strokeWidth: stage.changes ? 3 : 2,
          },
          animated: stage.changes ? true : false,
        };
        newEdges.push(edge);
      });
    }

    return { nodes: newNodes, edges: newEdges };
  }, [applyFinancialAction, profileData]);

  // Initialize nodes and edges when profileData changes
  useEffect(() => {
    if (profileData) {
      const { nodes: newNodes, edges: newEdges } = convertProfileToNodes(profileData);
      setNodes(newNodes);
      setEdges(newEdges);
      
      // Store original future stages for comparison
      if (profileData.futureStages) {
        setOriginalFutureStages([...profileData.futureStages]);
      }
    }
  }, [profileData, convertProfileToNodes]);

  // Reset to original projections
  const resetProjections = useCallback(() => {
    if (originalFutureStages.length > 0) {
      const originalProfile = {
        ...profileData,
        futureStages: originalFutureStages
      };
      const { nodes: newNodes, edges: newEdges } = convertProfileToNodes(originalProfile);
      setNodes(newNodes);
      setEdges(newEdges);
      setHasChanges(false);
      setAppliedActions([]);
    }
  }, [originalFutureStages, profileData, convertProfileToNodes]);

  const onNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [],
  );

  const onConnect = useCallback(
    (connection) => setEdges((eds) => addEdge({ 
      ...connection, 
      markerEnd: { type: MarkerType.Arrow },
      style: { stroke: '#6366f1', strokeWidth: 2 }
    }, eds)),
    [],
  );

  if (!profileData) {
    return (
      <div style={{ 
        width: '100%', 
        height: '400px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '12px'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <h3>No Profile Data Available</h3>
          <p>Please connect to Fi MCP or load sample data to view your financial journey.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '800px', position: 'relative' }}>
      {/* Header with controls */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        right: '16px',
        zIndex: 10,
        background: 'linear-gradient(to right, #7c3aed, #2563eb)',
        color: 'white',
        padding: '16px',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>
            Your Financial Journey
            {hasChanges && (
              <span style={{ 
                fontSize: '14px', 
                backgroundColor: '#10b981', 
                padding: '4px 8px', 
                borderRadius: '12px',
                marginLeft: '12px'
              }}>
                {appliedActions.length} Action{appliedActions.length !== 1 ? 's' : ''} Applied
              </span>
            )}
          </h2>
          <p style={{ margin: '4px 0 0 0', color: '#c4b5fd', fontSize: '14px' }}>
            Interactive visualization of your present and future financial states
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {hasChanges && (
            <button
              onClick={resetProjections}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.2)';
              }}
            >
              Reset Changes
            </button>
          )}
          
          {onStartConversation && (
            <button
              onClick={onStartConversation}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#059669';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = '#10b981';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              💬 Talk to Future Me
            </button>
          )}
        </div>
      </div>

      {/* React Flow */}
      <div style={{ 
        width: '100%', 
        height: '100%', 
        paddingTop: '120px',
        backgroundColor: '#f8fafc'
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{
            padding: 0.1,
            includeHiddenNodes: false,
          }}
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: '#6366f1' },
            markerEnd: { type: MarkerType.Arrow }
          }}
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
          }}
        />
      </div>

      {/* Actions History Panel */}
      {appliedActions.length > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          background: 'white',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxWidth: '350px',
          zIndex: 10,
          maxHeight: '300px',
          overflowY: 'auto'
        }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>
            Applied Actions ({appliedActions.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {appliedActions.map((action, index) => (
              <div
                key={action.id}
                style={{
                  padding: '10px',
                  backgroundColor: '#f0f9ff',
                  borderRadius: '8px',
                  border: '1px solid #e0f2fe',
                  fontSize: '13px'
                }}
              >
                <div style={{ fontWeight: '600', color: '#0369a1', marginBottom: '4px' }}>
                  {action.type === 'start_sip' && '📈 SIP Investment'}
                  {action.type === 'take_loan' && '🏠 Loan Taken'}
                  {action.type === 'make_repayment' && '💰 Repayment'}
                </div>
                <div style={{ color: '#6b7280' }}>
                  {action.impact.futureProjections[0] && 
                    generateChangeSummary(action.type, action.data, action.impact.futureProjections[0])
                  }
                </div>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '4px' }}>
                  {new Date(action.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileFlow;