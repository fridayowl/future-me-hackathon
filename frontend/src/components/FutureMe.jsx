
/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { MessageCircle, Send, X, ChevronLeft, ChevronRight, Clock, TrendingUp, AlertTriangle, Lightbulb, Target, Zap } from 'lucide-react';
import defaultImage from '../assets/user_asset.png'; // Your placeholder image

export default function FutureMe({ data, allFutureScenarios, presentData }) {
  if (!data) return null;

  // Chat state
  const [showChat, setShowChat] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    versionName,
    estimatedAgeRange,
    estimatedYearRange,
    summary,
    detailedFinancialProjection,
    financialStressLevel,
    assetOwnershipProjection,
    creditScore,
    goals,
    profileImage,
    incomeProjection,
    futureIndex = 1, // Which future this is (1, 2, 3, etc.)
  } = data;

  // Determine which scenarios to consider based on future index
  const getRelevantScenarios = () => {
    const scenarios = [];
    if (presentData) scenarios.push({ ...presentData, type: 'present', name: 'Present Me' });
    
    if (allFutureScenarios && Array.isArray(allFutureScenarios)) {
      // Include all previous futures up to current one
      for (let i = 0; i < futureIndex && i < allFutureScenarios.length; i++) {
        scenarios.push({ 
          ...allFutureScenarios[i], 
          type: 'future', 
          name: `Future ${i + 1}`,
          index: i + 1
        });
      }
    }
    
    return scenarios;
  };

  // Chat templates focused on future scenario analysis
  const chatTemplates = [
    {
      id: 1,
      title: "Impact of a purchase",
      subtitle: "What happens if I buy something expensive?",
      icon: TrendingUp,
      color: "bg-blue-500",
      prompt: `What would happen to this future scenario if I purchased a luxury watch worth ₹2 lakhs today? How would it affect my path to achieving ${versionName}?`
    },
    {
      id: 2,
      title: "What led me here?",
      subtitle: "Understand the journey to this future",
      icon: Clock,
      color: "bg-purple-500",
      prompt: `Looking at my current state as ${versionName}, what key decisions and events led me to this future? What were the turning points?`
    },
    {
      id: 3,
      title: "Alternative scenarios",
      subtitle: "Compare with other possible futures",
      icon: Target,
      color: "bg-green-500",
      prompt: `How does this future scenario compare to my other possible futures? What makes this path unique and what are the trade-offs?`
    },
    {
      id: 4,
      title: "Risk assessment",
      subtitle: "What could go wrong?",
      icon: AlertTriangle,
      color: "bg-red-500",
      prompt: `What are the biggest risks that could prevent me from reaching this future state? What should I be cautious about?`
    },
    {
      id: 5,
      title: "Advice to past me",
      subtitle: "Wisdom from this future",
      icon: Lightbulb,
      color: "bg-yellow-500",
      prompt: `As ${versionName}, what advice would you give to your past self about financial decisions? What should they prioritize?`
    },
    {
      id: 6,
      title: "Course corrections",
      subtitle: "How to optimize this path",
      icon: Zap,
      color: "bg-indigo-500",
      prompt: `If I want to reach this future scenario, what course corrections should I make now? What specific actions would optimize this path?`
    }
  ];

  // Enhanced response generation considering multiple scenarios
  const generateScenarioResponse = (prompt, currentFuture, relevantScenarios) => {
    const futureName = currentFuture.versionName || 'Future Me';
    const netWorth = currentFuture.detailedFinancialProjection?.projectedNetWorth || 0;
    const age = currentFuture.estimatedAgeRange || 'Unknown';
    
    if (prompt.includes('purchase') || prompt.includes('buy')) {
      return `As ${futureName} at ${age}, let me analyze the impact of that ₹2 lakh watch purchase:

**Immediate Impact:**
- Reduces current liquid savings by ₹2L
- Opportunity cost: ₹2L invested could become ₹${Math.round(200000 * 1.12 ** 10).toLocaleString()} in 10 years

**Path to My Future:**
${netWorth > 2000000 ? 
  `✅ **Minimal Impact**: With my projected net worth of ₹${netWorth.toLocaleString()}, this purchase won't significantly derail my path.` :
  `⚠️ **Moderate Impact**: This purchase could delay reaching my projected net worth of ₹${netWorth.toLocaleString()} by 6-12 months.`}

**Considering Previous Scenarios:**
${relevantScenarios.length > 1 ? 
  `Looking at my journey from ${relevantScenarios[0]?.name} to now, small indulgences are manageable if they bring genuine joy. The key is ensuring it doesn't become a pattern.` :
  `Based on your current financial trajectory, this purchase should be weighed against your long-term goals.`}

**My Recommendation:** ${netWorth > 2000000 ? 'Go for it if it brings you happiness!' : 'Consider waiting until your emergency fund is stronger.'}`;
    }

    if (prompt.includes('led me here') || prompt.includes('journey')) {
      const scenarios = relevantScenarios.slice().reverse(); // Present to current future
      
      return `Looking back at my journey to become ${futureName}:

**The Path That Led Here:**
${scenarios.map((scenario, index) => {
  if (scenario.type === 'present') {
    return `🏁 **${scenario.name}**: Started with net worth of ₹${(scenario.netWorth || 0).toLocaleString()} and credit score ${scenario.creditScore || 'Unknown'}`;
  } else {
    return `📈 **${scenario.name}**: Built up to ₹${(scenario.detailedFinancialProjection?.projectedNetWorth || 0).toLocaleString()} through consistent investing`;
  }
}).join('\n')}

**Key Turning Points:**
1. **Consistent SIP Investing**: Started small but stayed disciplined
2. **Debt Management**: ${currentFuture.detailedFinancialProjection?.projectedTotalDebt < 100000 ? 'Successfully minimized debt' : 'Managed debt strategically'}
3. **Career Growth**: Income increased from ₹${(presentData?.employment?.monthlyIncome || 50000).toLocaleString()} to ₹${(incomeProjection?.monthly || 100000).toLocaleString()}
4. **Smart Asset Allocation**: Diversified investments across equity, debt, and real estate

**What Made the Difference:**
- Patience during market volatility
- Increasing SIP amounts with salary hikes
- Avoiding lifestyle inflation traps
- Building multiple income streams

The journey wasn't just about money—it's about building financial discipline and long-term thinking.`;
    }

    if (prompt.includes('compare') || prompt.includes('alternative')) {
      return `Comparing ${futureName} with other possible futures:

**This Scenario (${futureName}):**
- Net Worth: ₹${netWorth.toLocaleString()}
- Stress Level: ${financialStressLevel}
- Age Range: ${age}

**Compared to Other Paths:**
${futureIndex === 1 ? 
  `This is likely your conservative/balanced approach. You prioritized stability over aggressive growth.` :
  futureIndex === 2 ?
  `This represents a more aggressive investment strategy compared to Future 1. Higher risk, potentially higher rewards.` :
  `This is your most ambitious scenario, building on lessons from previous futures.`}

**Trade-offs of This Path:**
✅ **Advantages:**
- ${netWorth > 1000000 ? 'Strong wealth accumulation' : 'Stable financial foundation'}
- ${financialStressLevel === 'Low' ? 'Low stress lifestyle' : 'Manageable stress levels'}
- Diversified asset portfolio

⚠️ **Trade-offs:**
- ${futureIndex === 1 ? 'Potentially missed higher growth opportunities' : 'Higher risk tolerance required'}
- Time investment in financial planning
- Some lifestyle adjustments needed

**Why This Path Works:**
${futureIndex <= 2 ? 
  'This scenario balances growth with security, making it sustainable long-term.' :
  'This builds on previous scenarios, incorporating lessons learned and optimizing for maximum impact.'}`;
    }

    if (prompt.includes('risk') || prompt.includes('wrong')) {
      return `${futureName} here - let me share the key risks I see:

**Major Risks to This Future:**

🔴 **Market Risks:**
- Extended bear market could delay goals by 2-3 years
- Inflation exceeding investment returns
- Currency devaluation affecting international investments

🔴 **Personal Risks:**
- Job loss or career stagnation
- Health emergencies depleting savings
- Family financial obligations

🔴 **Behavioral Risks:**
- Lifestyle inflation during income growth
- Panic selling during market downturns
- Abandoning SIPs during tough times

**Scenario-Specific Risks:**
${futureIndex === 1 ? 
  'Being too conservative might mean missing growth opportunities during bull markets.' :
  futureIndex === 2 ?
  'Higher risk tolerance could lead to significant losses if not managed properly.' :
  'Complexity of this strategy might lead to over-optimization and analysis paralysis.'}

**Risk Mitigation Strategies:**
1. **Emergency Fund**: Maintain 12+ months expenses
2. **Insurance**: Adequate health and term life coverage
3. **Diversification**: Don't put all eggs in one basket
4. **Regular Reviews**: Quarterly portfolio rebalancing
5. **Stay Informed**: Continuous financial education

**From Experience:**
The biggest risk isn't market volatility—it's losing discipline and abandoning your long-term plan during temporary setbacks.`;
    }

    if (prompt.includes('advice') || prompt.includes('past')) {
      const presentNetWorth = presentData?.netWorth || 0;
      const growthMultiple = netWorth / Math.max(presentNetWorth, 100000);
      
      return `Speaking as ${futureName} to my past self:

**Most Important Advice:**

💡 **Start NOW, Not Tomorrow:**
Your future wealth of ₹${netWorth.toLocaleString()} grew ${growthMultiple.toFixed(1)}x because you started early. Every month you delay costs compound interest.

💡 **Automate Everything:**
Set up automatic SIPs, bill payments, and transfers. Remove emotion from money decisions.

💡 **Increase Investments with Income:**
Every salary hike, increase your SIP by 20%. This single habit built most of my wealth.

**Specific to Your Journey:**
${relevantScenarios.length > 1 ? 
  `Looking at the progression from ${relevantScenarios[0]?.name} to ${futureName}, the key was consistency, not perfection.` :
  'Focus on building sustainable financial habits rather than trying to time the market.'}

**Mistakes to Avoid:**
1. Don't try to time the market—time IN the market matters more
2. Avoid lifestyle inflation—live like you earn 80% of your salary
3. Don't chase hot investment tips—stick to index funds and blue chips
4. Never use credit cards for lifestyle purchases you can't afford

**Mindset Shifts:**
- Think in decades, not quarters
- Focus on net worth growth, not monthly returns
- Treat investments like utilities—boring but essential
- Celebrate small wins to stay motivated

**Personal Note:**
The discipline you build now creates the freedom I enjoy. Every small sacrifice compounds into massive opportunity.`;
    }

    if (prompt.includes('course correction') || prompt.includes('optimize')) {
      return `${futureName} here with optimization strategies:

**Course Corrections for This Path:**

🎯 **Immediate Actions (Next 3 Months):**
1. Increase SIP by ₹${Math.min(5000, Math.round(netWorth * 0.001))} if possible
2. Review and optimize current portfolio allocation
3. Set up automated emergency fund building
4. Review insurance coverage gaps

🎯 **Medium-term Optimizations (6-12 Months):**
1. **Asset Rebalancing**: ${futureIndex === 1 ? 'Consider adding 10% international equity' : 'Optimize debt-equity ratio based on age'}
2. **Tax Optimization**: Maximize 80C, 80D deductions
3. **Income Growth**: Upskill for ${Math.round((incomeProjection?.growthRate || 10))}% annual increment
4. **Expense Tracking**: Use apps to identify optimization opportunities

**Based on Multi-Scenario Analysis:**
${relevantScenarios.length > 1 ? 
  `Comparing your trajectory across scenarios, focus on:\n- Consistency over perfection\n- Gradual risk increase as wealth grows\n- Learning from each scenario's strengths` :
  'Build foundation habits that will serve you across all possible futures.'}

**Optimization Priorities:**
${futureIndex === 1 ? 
  '**Conservative Path**: Focus on building emergency fund and consistent SIPs before taking higher risks.' :
  futureIndex === 2 ?
  '**Balanced Growth**: Optimize the gains from Future 1 while adding calculated risks for higher returns.' :
  '**Advanced Strategy**: Build on all previous learnings to create a sophisticated, high-growth approach.'}

**Success Metrics to Track:**
- Monthly savings rate (target: 30%+)
- Portfolio growth vs. benchmark
- Emergency fund months covered
- Debt-to-income ratio

**Remember**: Small, consistent optimizations compound into significant results. Focus on one improvement at a time.`;
    }

    // Default response
    return `Great question! As ${futureName}, I'm here to help you understand this future scenario.

**About This Future:**
- Net Worth: ₹${netWorth.toLocaleString()}
- Financial Stress: ${financialStressLevel}
- Age: ${age}

**Multi-Scenario Context:**
${relevantScenarios.length > 1 ? 
  `This future builds on ${relevantScenarios.length - 1} previous scenario(s), incorporating lessons learned and optimizations.` :
  'This represents one possible path based on your current trajectory.'}

What specific aspect of this future would you like to explore? I can discuss the journey here, compare with alternatives, or suggest optimizations.`;
  };

  // Chat functions
  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setInputMessage(template.prompt);
    handleSendMessage(template.prompt);
  };

  const handleSendMessage = async (messageToSend = inputMessage) => {
    if (!messageToSend.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: messageToSend,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Generate scenario-aware response
    setTimeout(() => {
      const relevantScenarios = getRelevantScenarios();
      const aiResponse = {
        id: Date.now() + 1,
        text: generateScenarioResponse(messageToSend, data, relevantScenarios),
        sender: 'future-me',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <>
      <div style={styles.outerContainer}>
        {/* Main FutureMe Card (Left Side) */}
        <div style={{...styles.originalContainer, width: '400px'}}> {/* Reduced width */}
          {/* Top connector only */}
          <Handle type="target" position={Position.Top} style={styles.handle} />

          <div style={styles.card}>
            {/* Content */}
            <div style={styles.content}>
              <div style={styles.headerRow}>
                <h2 style={styles.header}>🔮 Future Me at {estimatedAgeRange}</h2>
                <button
                  onClick={() => setShowChat(!showChat)}
                  style={{...styles.chatToggle, backgroundColor: showChat ? '#10b981' : '#8b5cf6'}}
                  title={showChat ? 'Hide Chat' : 'Show Chat'}
                >
                  {showChat ? <ChevronRight size={16} /> : <MessageCircle size={16} />}
                </button>
              </div>

              <p style={styles.info}><strong>Version:</strong> {versionName}</p>
              <p style={styles.info}><strong>Years:</strong> {estimatedYearRange}</p>
              <p style={styles.info}><strong>Summary:</strong> {summary}</p>

              {detailedFinancialProjection && (
                <div style={styles.section}>
                  <h3 style={styles.subheader}>📈 Financial Projection</h3>
                  <p style={styles.info}>Projected Net Worth: ₹{detailedFinancialProjection.projectedNetWorth?.toLocaleString('en-IN')}</p>
                  <p style={styles.info}>Projected Total Debt: ₹{detailedFinancialProjection.projectedTotalDebt?.toLocaleString('en-IN')}</p>
                  <p style={styles.info}>Monthly Savings: ₹{detailedFinancialProjection.projectedMonthlySavings?.toLocaleString('en-IN')}</p>
                  <p style={styles.info}>Credit Score: {detailedFinancialProjection.projectedCreditScore}</p>
                </div>
              )}

              {creditScore && (
                <div style={styles.section}>
                  <h3 style={styles.subheader}>📊 Credit Score</h3>
                  <p style={styles.info}>Projected Score: {creditScore.projected} ({creditScore.status})</p>
                </div>
              )}

              {incomeProjection && (
                <div style={styles.section}>
                  <h3 style={styles.subheader}>💼 Income Projection</h3>
                  <p style={styles.info}>Monthly: ₹{incomeProjection.monthly?.toLocaleString('en-IN')}</p>
                  <p style={styles.info}>Growth Rate: {incomeProjection.growthRate}%</p>
                </div>
              )}

              <p style={styles.info}><strong>Stress Level:</strong> {financialStressLevel}</p>

              {assetOwnershipProjection && (
                <div style={styles.section}>
                  <h3 style={styles.subheader}>🏠 Asset Ownership Projection</h3>
                  {Object.entries(assetOwnershipProjection).map(([name, asset]) => (
                    <AssetItem key={name} name={name} data={asset} />
                  ))}
                </div>
              )}

              {goals?.length > 0 && (
                <div style={styles.section}>
                  <h3 style={styles.subheader}>🎯 Goals</h3>
                  <ul style={styles.list}>
                    {goals.map((goal, idx) => (
                      <li key={idx} style={styles.goal}>{goal}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Image Card and Chat Panel Stacked */}
        {showChat && (
          <div style={styles.rightPanel}>
            {/* New Image Card */}
            <div style={styles.imageCard}>
                <img
                    src={profileImage || defaultImage}
                    alt="Future Me Profile"
                    style={styles.imageCardImage}
                />
                <div style={styles.imageCardText}>
                    <p style={styles.imageCardTitle}>{versionName}</p>
                    <p style={styles.imageCardSubtitle}>{estimatedAgeRange} • {estimatedYearRange}</p>
                </div>
            </div>

            {/* Chat Panel */}
            <div style={styles.chatPanel}>
              {/* Chat Header */}
              <div style={styles.chatHeader}>
                <div style={styles.chatHeaderContent}>
                  <MessageCircle style={styles.chatIcon} size={20} />
                  <div>
                    <h3 style={styles.chatTitle}>Scenario Analysis</h3>
                    <p style={styles.chatSubtitle}>Explore this future path</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowChat(false)}
                  style={styles.chatCloseButton}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Scenario Context Banner */}
              <div style={styles.scenarioContext}>
                <div style={styles.contextText}>
                  <strong>{versionName}</strong> • Considering {getRelevantScenarios().length} scenario(s)
                </div>
                <div style={styles.contextSubtext}>
                  Future {futureIndex} - {estimatedAgeRange}
                </div>
              </div>

              {/* Chat Templates */}
              {messages.length === 0 && (
                <div style={styles.chatTemplates}>
                  <h4 style={styles.templatesTitle}>Explore this future scenario:</h4>
                  <div style={styles.templatesList}>
                    {chatTemplates.map((template) => {
                      const IconComponent = template.icon;
                      return (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateClick(template)}
                          style={styles.templateButton}
                        >
                          <div style={styles.templateContent}>
                            <div style={{...styles.templateIcon, backgroundColor: 
                                          template.color === 'bg-blue-500' ? '#3b82f6' : 
                                          template.color === 'bg-purple-500' ? '#8b5cf6' :
                                          template.color === 'bg-green-500' ? '#10b981' :
                                          template.color === 'bg-red-500' ? '#ef4444' :
                                          template.color === 'bg-yellow-500' ? '#f59e0b' : '#6366f1'}}>
                              <IconComponent color="white" size={14} />
                            </div>
                            <div style={styles.templateText}>
                              <div style={styles.templateTitle}>{template.title}</div>
                              <div style={styles.templateSubtitle}>{template.subtitle}</div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Chat Messages */}
              {messages.length > 0 && (
                <div style={styles.chatMessages}>
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      style={{...styles.messageContainer, justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start'}}
                    >
                      <div
                        style={{...styles.messageBubble, 
                               backgroundColor: message.sender === 'user' ? '#8b5cf6' : '#f3f4f6',
                               color: message.sender === 'user' ? 'white' : '#1f2937'}}
                      >
                        <div style={styles.messageText}>{message.text}</div>
                        <div style={{...styles.messageTime, 
                                    color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : '#9ca3af'}}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div style={{...styles.messageContainer, justifyContent: 'flex-start'}}>
                      <div style={{...styles.messageBubble, backgroundColor: '#f3f4f6'}}>
                        <div style={styles.typingIndicator}>
                          <div style={styles.typingDot}></div>
                          <div style={{...styles.typingDot, animationDelay: '0.1s'}}></div>
                          <div style={{...styles.typingDot, animationDelay: '0.2s'}}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Back to Templates Button */}
              {messages.length > 0 && (
                <div style={styles.backToTemplates}>
                  <button
                    onClick={() => {
                      setMessages([]);
                      setSelectedTemplate(null);
                    }}
                    style={styles.backButton}
                  >
                    <ChevronLeft size={14} /> Back to scenario questions
                  </button>
                </div>
              )}

              {/* Chat Input */}
              <div style={styles.chatInput}>
                <div style={styles.inputContainer}>
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about this future scenario..."
                    style={styles.chatInputField}
                    disabled={isLoading}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isLoading || !inputMessage.trim()}
                    style={styles.sendButton}
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function AssetItem({ name, data }) {
  if (!data) return null;
  const { ownershipStatus, notes, chanceOfAcquisition = 0 } = data;

  return (
    <div style={styles.assetRow}>
      <div style={styles.assetTitle}>
        <strong>{name}</strong> – {ownershipStatus}
      </div>
      <div style={styles.assetChance}>
        🟢 Chance of Owning: {chanceOfAcquisition}%
      </div>
      <div style={styles.progressBar}>
        <div
          style={{
            ...styles.progress,
            width: `${chanceOfAcquisition}%`,
            backgroundColor: chanceOfAcquisition >= 70 ? '#22c55e' : '#facc15',
          }}
        />
      </div>
      {notes && <p style={styles.assetNote}>💡 {notes}</p>}
    </div>
  );
}

const styles = {
  outerContainer: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start', // Align items to the top
  },
  originalContainer: {
    fontFamily: 'sans-serif',
    border: '1px solid #ddd',
    borderRadius: 16,
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    backgroundColor: '#fff',
    overflow: 'hidden',
    position: 'relative',
    width: '400px', // Reduced width for the main card
  },
  handle: {
    background: '#555',
    width: 10,
    height: 10,
  },
  card: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
  },
  content: {
    padding: 20,
    flex: 1, 
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  chatToggle: {
    padding: '8px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#111827',
    margin: 0,
  },
  subheader: {
    fontSize: '1.1rem',
    marginTop: 16,
    marginBottom: 6,
    color: '#1d4ed8',
  },
  info: {
    fontSize: '0.95rem',
    color: '#374151',
    marginBottom: 4,
  },
  section: {
    marginTop: 12,
  },
  list: {
    paddingLeft: 16,
    margin: 0,
  },
  goal: {
    fontSize: '0.9rem',
    color: '#4b5563',
  },
  assetRow: {
    marginBottom: 14,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    border: '1px solid #e5e7eb',
  },
  assetTitle: {
    fontSize: '1rem',
    marginBottom: 4,
    color: '#111827',
  },
  assetChance: {
    fontSize: '0.82rem',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  assetNote: {
    fontSize: '0.8rem',
    color: '#6b7280',
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    transition: 'width 0.3s ease-in-out',
  },
  // Right Panel to stack image card and chat panel
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px', // Space between image card and chat panel
    width: '380px', // Consistent width for the right stack
  },
  // New Image Card Styles
  imageCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    textAlign: 'center',
  },
  imageCardImage: {
    width: '120px',
    height: '120px',
    borderRadius: '50%', 
    objectFit: 'cover',
    marginBottom: '15px',
    border: '4px solid #8b5cf6', 
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  imageCardText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  imageCardTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: '5px',
    margin: 0,
  },
  imageCardSubtitle: {
    fontSize: '0.9rem',
    color: '#6b7280',
    margin: 0,
  },
  // Chat Panel Styles 
  chatPanel: {
    width: '380px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: '600px', // Keep chat panel height consistent
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
  },
  chatHeader: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
    borderRadius: '16px 16px 0 0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatHeaderContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  chatIcon: {
    color: 'white',
  },
  chatTitle: {
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  chatSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: '12px',
    margin: 0,
  },
  chatCloseButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scenarioContext: {
    padding: '12px 16px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  contextText: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px',
  },
  contextSubtext: {
    fontSize: '11px',
    color: '#6b7280',
  },
  chatTemplates: {
    padding: '16px',
    flex: 1,
    overflowY: 'auto',
  },
  templatesTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '12px',
    margin: '0 0 12px 0',
  },
  templatesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  templateButton: {
    width: '100%',
    padding: '12px',
    textAlign: 'left',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
  },
  templateContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
  },
  templateIcon: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  templateText: {
    flex: 1,
    minWidth: 0,
  },
  templateTitle: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: '13px',
    marginBottom: '2px',
  },
  templateSubtitle: {
    fontSize: '11px',
    color: '#6b7280',
  },
  chatMessages: {
    flex: 1,
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  messageContainer: {
    display: 'flex',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: '10px 12px',
    borderRadius: '12px',
    fontSize: '13px',
    lineHeight: '1.4',
  },
  messageText: {
    whiteSpace: 'pre-wrap',
  },
  messageTime: {
    fontSize: '10px',
    marginTop: '4px',
  },
  typingIndicator: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
  },
  typingDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#9ca3af',
    animation: 'bounce 1.5s ease-in-out infinite',
  },
  backToTemplates: {
    padding: '8px 16px',
    borderTop: '1px solid #e5e7eb',
  },
  backButton: {
    width: '100%',
    padding: '8px',
    fontSize: '12px',
    color: '#8b5cf6',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    transition: 'all 0.2s',
  },
  chatInput: {
    padding: '16px',
    borderTop: '1px solid #e5e7eb',
  },
  inputContainer: {
    display: 'flex',
    gap: '8px',
  },
  chatInputField: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  sendButton: {
    padding: '10px 12px',
    backgroundColor: '#8b5cf6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  // Keyframe for typing indicator (added for completeness, assuming it's in a CSS file normally)
  '@keyframes bounce': {
    '0%, 80%, 100%': { transform: 'translateY(0)' },
    '40%': { transform: 'translateY(-4px)' },
  },
};
