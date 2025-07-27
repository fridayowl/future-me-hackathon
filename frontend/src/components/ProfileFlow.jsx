/* eslint-disable no-case-declarations */
/* eslint-disable no-unused-vars */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  ReactFlow,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import futureImage0 from '../assets/image1.png'; 
import futureImage1 from '../assets/image2.png';
import futureImage2 from '../assets/image3.png';
import futureImage3 from '../assets/image4.png';
import PresentMe from './PresentMe';
import FutureMe from './FutureMe';

const nodeTypes = {
  presentMe: PresentMe,
  futureMe: FutureMe,
};

const ProfileFlow = ({ profileData, onStartConversation }) => {
  console.log("profile data ", profileData);
  
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [originalFutureStages, setOriginalFutureStages] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [appliedActions, setAppliedActions] = useState([]);
  const reactFlowInstanceRef = useRef(null);
  
  // ADD: Loading state for actions
  const [isApplyingAction, setIsApplyingAction] = useState(false);

  const futureImages = [
    futureImage1,
    futureImage2,
    futureImage3,
    futureImage0,
  ];

  // Generate change summary helper function
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

  // Enhanced financial action calculator - FIXED: No dependencies to avoid circular references
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
  }, []); // FIXED: Empty dependencies to avoid circular references

  // Apply financial action and update future stages - MODIFIED: Added loading state
  const applyFinancialAction = useCallback((actionType, actionData) => {
    if (!profileData) return;

    // SET: Start loading
    setIsApplyingAction(true);

    console.log('Applying financial action:', actionType, actionData);
    
    // ADD: Simulate async processing with setTimeout to show loader
    setTimeout(() => {
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

      // FIXED: Update nodes in-place without changing positions and without circular references
      setNodes(currentNodes => 
        currentNodes.map(node => {
          if (node.type === 'presentMe') {
            // Update present node data but keep the same function reference to avoid circular updates
            return {
              ...node, // Preserve ALL existing properties including position
              data: {
                ...node.data,
                // Don't pass the function here to avoid circular references
              }
            };
          } else if (node.type === 'futureMe') {
            // Find the corresponding updated stage
            const stageIndex = parseInt(node.id.replace('future-', ''));
            const updatedStage = updatedStages[stageIndex];
            
            if (updatedStage) {
              return {
                ...node, // Preserve ALL existing properties including position
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
      
      // SET: End loading after updates are complete
      setIsApplyingAction(false);
    }, 60000); // 1 second delay to show loader
  }, [profileData, calculateFinancialImpact]); // FIXED: Only include essential dependencies

  // Convert profile data to React Flow nodes and edges - FIXED: Stable reference to prevent infinite loops
  const convertProfileToNodes = useCallback((profile) => {
    if (!profile) return { nodes: [], edges: [] };

    const newNodes = [];
    const newEdges = [];

    // Create Present Me node with financial action handler
    const presentNode = {
      id: 'present',
      type: 'presentMe',
      position: { x: 3900, y: -500 },
      data: {
        humanDescription: {
          name: profile.basicInfo?.demographics?.estimatedName || 'SHIXXXX',
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
          profileImage: futureImages[3] || '',
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
            x: 2000 + (index * 990), 
            y: 60 
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
            profileImage: futureImages[index] || stage.profileImage,
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
  }, []); // FIXED: Empty dependencies to prevent infinite loops

  // Initialize nodes and edges when profileData changes - FIXED: Removed convertProfileToNodes from dependencies
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
  }, [profileData]); // FIXED: Only depend on profileData

  // Reset to original projections
  const resetProjections = useCallback(() => {
    if (originalFutureStages.length > 0 && profileData) {
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
        height: '80vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f9fafb',
        borderRadius: '12px',
        margin: '0 auto'
      }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <h3>No Profile Data Available</h3>
          <p>Please connect to Fi MCP or load sample data to view your financial journey.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '90vh', 
      position: 'relative',
      margin: '0 auto'
    }}>
      {/* ADD: Loading Overlay */}
      {isApplyingAction && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          borderRadius: '12px'
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* Loading Spinner */}
            <div style={{
              width: '40px',
              height: '40px',
              border: '4px solid #e5e7eb',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#374151'
            }}>
              Applying Financial Action...
            </div>
            <div style={{
              fontSize: '14px',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Updating your future projections
            </div>
          </div>
        </div>
      )}

      {/* React Flow */}
      <div style={{ 
        width: '100%', 
        height: '100%'
      }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          nodesDraggable={false}  // FIXED: Prevent node dragging
          panOnDrag={false}       // FIXED: Prevent panning with drag
          preventScrolling={true}  // Allow scrolling
          fitView={true}        // FIXED: Prevent auto-fitting which causes position changes
          fitViewOptions={{
            padding: 0.1,
            includeHiddenNodes: true,
          }}
          defaultEdgeOptions={{
            style: { strokeWidth: 2, stroke: '#10b981' },
            markerEnd: { type: MarkerType.Arrow }
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

      {/* ADD: CSS for spinner animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ProfileFlow;