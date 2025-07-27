/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from 'react';
import { Handle } from '@xyflow/react';
import { MessageCircle, Send, Sparkles, TrendingUp, Target, Heart, Book, Lightbulb, X, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PresentMe({ data }) {
  console.log('PresentMe data:', data);

  const [showActions, setShowActions] = useState(true);
  const [activeAction, setActiveAction] = useState(null);
  const [actionData, setActionData] = useState({
    sipAmount: 5000,
    sipDuration: 60, // months
    loanAmount: 500000,
    loanType: 'home',
    loanTenure: 240, // months
    repaymentAmount: 10000
  });

  // Chat state
  const [showChat, setShowChat] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log('PresentMe data:', data);
  }, [data]);

  // Extract data from the correct structure
  const humanData = data?.humanDescription || data;
  const onFinancialAction = data?.onFinancialAction;

  const {
    name,
    age,
    netWorth,
    totalLiability,
    creditScore,
    employment,
    profileImage,
  } = humanData;

  // Chat templates
  const chatTemplates = [
    {
      id: 1,
      title: "How to make future better",
      subtitle: "Get actionable advice for improvement",
      icon: TrendingUp,
      color: "bg-blue-500",
      prompt: "Based on my current financial situation, what are the top 3 things I can do to make my future significantly better?"
    },
    {
      id: 2,
      title: "Future goals & dreams",
      subtitle: "Discuss your aspirations",
      icon: Target,
      color: "bg-purple-500",
      prompt: "I want to talk about my future goals and dreams. Help me understand how to achieve them financially."
    },
    {
      id: 3,
      title: "Financial wellness check",
      subtitle: "Review your current health",
      icon: Heart,
      color: "bg-green-500",
      prompt: "Can you give me an honest assessment of my current financial health and what I should focus on?"
    },
    {
      id: 4,
      title: "Investment strategies",
      subtitle: "Explore better investment options",
      icon: Sparkles,
      color: "bg-yellow-500",
      prompt: "What investment strategies would work best for someone in my current financial situation?"
    },
    {
      id: 5,
      title: "Learn something new",
      subtitle: "Financial education & tips",
      icon: Book,
      color: "bg-indigo-500",
      prompt: "Teach me something new about personal finance that could benefit someone in my situation."
    },
    {
      id: 6,
      title: "Quick wins",
      subtitle: "Easy improvements I can make today",
      icon: Lightbulb,
      color: "bg-orange-500",
      prompt: "What are some quick wins or easy changes I can make today to improve my financial situation?"
    }
  ];

  const formatCurrency = (amount) =>
    amount != null ? `₹${amount.toLocaleString('en-IN')}` : '₹0';

  const handleActionSubmit = (actionType) => {
    if (onFinancialAction) {
      const action = {
        type: actionType,
        data: actionData,
        timestamp: new Date().toISOString()
      };

      // Calculate projected impact based on action type
      let projectedImpact = {};

      switch (actionType) {
        case 'start_sip':
          projectedImpact = calculateSIPImpact(actionData.sipAmount, actionData.sipDuration);
          break;
        case 'take_loan':
          projectedImpact = calculateLoanImpact(actionData.loanAmount, actionData.loanTenure);
          break;
        case 'make_repayment':
          projectedImpact = calculateRepaymentImpact(actionData.repaymentAmount);
          break;
        default:
          break;
      }

      onFinancialAction(actionType, { ...actionData, projectedImpact });
    }
    setActiveAction(null);
    setShowActions(false);
  };

  // Chat functions
  const handleTemplateClick = (template) => {
    setSelectedTemplate(template);
    setInputMessage(template.prompt);

    // Auto-send the template message
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

    // Simulate Fi MCP response with personalized data
    setTimeout(() => {
      const aiResponse = {
        id: Date.now() + 1,
        text: generatePersonalizedResponse(messageToSend, humanData),
        sender: 'fi-mcp',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  const generatePersonalizedResponse = (prompt, userData) => {
    const userName = userData.name || 'there';
    const userAge = userData.age || 25;
    const netWorthValue = userData.netWorth || 0;
    const creditScoreValue = userData.creditScore || 'N/A';

    if (prompt.includes('make future better')) {
      return `Hi ${userName}! Based on your current profile, here are 3 key areas to focus on:

**1. Emergency Fund Building**
With your current net worth of ${formatCurrency(netWorthValue)}, aim to build a 6-month emergency fund. Even ₹5,000/month can create a solid safety net.

**2. Investment Diversification**
At age ${userAge}, you have time for growth investments. Consider adding international equity funds to your portfolio.

**3. Credit Score Optimization**
Your current credit score is ${creditScoreValue}. ${creditScoreValue > 750 ? 'Great job! Maintain this score.' : 'Focus on improving this to unlock better loan rates.'}

Which area interests you most?`;
    }

    if (prompt.includes('goals and dreams')) {
      return `${userName}, let's map out your financial journey!

At ${userAge}, you're at a great stage to build wealth. With your current net worth of ${formatCurrency(netWorthValue)}, let's explore:

- Home ownership plans?
- Retirement goals (target age and lifestyle)?
- Family financial security?
- Business or entrepreneurship dreams?

Your current financial foundation gives us a good starting point. What's the one goal that excites you most about your future?`;
    }

    if (prompt.includes('financial health')) {
      const debtRatio = totalLiability && netWorthValue ? ((totalLiability / netWorthValue) * 100).toFixed(1) : 'N/A';

      return `${userName}, here's your honest financial health assessment:

**✅ Strengths:**
- Net worth: ${formatCurrency(netWorthValue)}
- You're actively managing finances
- ${employment?.currentEmployer ? `Stable employment at ${employment.currentEmployer}` : 'Working on career stability'}

**⚠️ Areas for improvement:**
- Debt-to-asset ratio: ${debtRatio}%
- ${creditScoreValue < 700 ? 'Credit score needs attention' : 'Credit score is healthy'}
- Consider increasing investment allocation

**🎯 Next steps:**
1. ${totalLiability > 0 ? 'Focus on debt reduction strategy' : 'Build investment portfolio'}
2. Optimize tax-saving investments
3. Review insurance coverage

Overall assessment: ${netWorthValue > 100000 ? 'You\'re on a solid path!' : 'Good foundation, room for growth!'} What specific area would you like to improve first?`;
    }

    return `That's a great question, ${userName}! Based on your profile - age ${userAge}, net worth ${formatCurrency(netWorthValue)} - I can provide personalized insights.

Your current financial position shows ${netWorthValue > 0 ? 'positive momentum' : 'potential for growth'}. Let me know what specific aspect of your finances you'd like to explore, and I'll give you targeted advice based on your actual Fi MCP data.

What would you like to dive deeper into?`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const calculateSIPImpact = (monthlyAmount, durationMonths) => {
    const annualReturn = 0.12; // 12% expected annual return
    const monthlyReturn = annualReturn / 12;

    // Future value of SIP calculation
    const futureValue = monthlyAmount *
      (((Math.pow(1 + monthlyReturn, durationMonths) - 1) / monthlyReturn) * (1 + monthlyReturn));

    const totalInvestment = monthlyAmount * durationMonths;
    const gains = futureValue - totalInvestment;

    return {
      futureValue: Math.round(futureValue),
      totalInvestment,
      expectedGains: Math.round(gains),
      netWorthIncrease: Math.round(futureValue)
    };
  };

  const calculateLoanImpact = (loanAmount, tenureMonths) => {
    const interestRate = 0.085; // 8.5% annual interest
    const monthlyRate = interestRate / 12;

    // EMI calculation
    const emi = loanAmount *
      (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);

    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - loanAmount;

    return {
      emi: Math.round(emi),
      totalPayment: Math.round(totalPayment),
      totalInterest: Math.round(totalInterest),
      netWorthDecrease: Math.round(totalInterest),
      monthlyCommitment: Math.round(emi)
    };
  };

  const calculateRepaymentImpact = (repaymentAmount) => {
    const currentDebt = totalLiability || 0;
    const interestSaved = repaymentAmount * 0.24; // 24% annual interest saved - this is a rough estimate for illustrative purposes

    return {
      debtReduction: repaymentAmount,
      interestSaved: Math.round(interestSaved),
      newDebtLevel: Math.max(0, currentDebt - repaymentAmount),
      creditScoreImprovement: Math.min(50, Math.round(repaymentAmount / 1000)) // Max 50 points, 1 point per 1000 repayment
    };
  };

  const ActionModal = ({ actionType, onClose }) => {
    const getActionTitle = () => {
      switch (actionType) {
        case 'start_sip': return 'Start SIP Investment';
        case 'take_loan': return 'Take Loan';
        case 'make_repayment': return 'Make Loan Repayment';
        default: return 'Financial Action';
      }
    };

    const renderActionForm = () => {
      switch (actionType) {
        case 'start_sip':
          return (
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Monthly SIP Amount</label>
              <input
                type="number"
                value={actionData.sipAmount}
                onChange={(e) => setActionData({ ...actionData, sipAmount: parseInt(e.target.value) })}
                style={styles.input}
                placeholder="₹5,000"
              />
              <label style={styles.inputLabel}>Duration (months)</label>
              <input
                type="number"
                value={actionData.sipDuration}
                onChange={(e) => setActionData({ ...actionData, sipDuration: parseInt(e.target.value) })}
                style={styles.input}
                placeholder="60"
              />
              <div style={styles.projection}>
                <p>Expected Value: ₹{calculateSIPImpact(actionData.sipAmount, actionData.sipDuration).futureValue.toLocaleString()}</p>
                <p>Expected Gains: ₹{calculateSIPImpact(actionData.sipAmount, actionData.sipDuration).expectedGains.toLocaleString()}</p>
              </div>
            </div>
          );

        case 'take_loan':
          return (
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Loan Amount</label>
              <input
                type="number"
                value={actionData.loanAmount}
                onChange={(e) => setActionData({ ...actionData, loanAmount: parseInt(e.target.value) })}
                style={styles.input}
                placeholder="₹5,00,000"
              />
              <label style={styles.inputLabel}>Loan Type</label>
              <select
                value={actionData.loanType}
                onChange={(e) => setActionData({ ...actionData, loanType: e.target.value })}
                style={styles.input}
              >
                <option value="home">Home Loan</option>
                <option value="car">Car Loan</option>
                <option value="personal">Personal Loan</option>
              </select>
              <label style={styles.inputLabel}>Tenure (months)</label>
              <input
                type="number"
                value={actionData.loanTenure}
                onChange={(e) => setActionData({ ...actionData, loanTenure: parseInt(e.target.value) })}
                style={styles.input}
                placeholder="240"
              />
              <div style={styles.projection}>
                <p>Monthly EMI: ₹{calculateLoanImpact(actionData.loanAmount, actionData.loanTenure).emi.toLocaleString()}</p>
                <p>Total Interest: ₹{calculateLoanImpact(actionData.loanAmount, actionData.loanTenure).totalInterest.toLocaleString()}</p>
              </div>
            </div>
          );

        case 'make_repayment':
          return (
            <div style={styles.formGroup}>
              <label style={styles.inputLabel}>Repayment Amount</label>
              <input
                type="number"
                value={actionData.repaymentAmount}
                onChange={(e) => setActionData({ ...actionData, repaymentAmount: parseInt(e.target.value) })}
                style={styles.input}
                placeholder="₹10,000"
              />
              <div style={styles.projection}>
                <p>Interest Saved: ₹{calculateRepaymentImpact(actionData.repaymentAmount).interestSaved.toLocaleString()}</p>
                <p>Credit Score Boost: +{calculateRepaymentImpact(actionData.repaymentAmount).creditScoreImprovement}</p>
              </div>
            </div>
          );

        default:
          return null;
      }
    };

    return (
      <div style={styles.modalOverlay}>
        <div style={styles.modal}>
          <div style={styles.modalHeader}>
            <h3 style={styles.modalTitle}>{getActionTitle()}</h3>
            <button onClick={onClose} style={styles.closeButton}>×</button>
          </div>
          <div style={styles.modalContent}>
            {renderActionForm()}
          </div>
          <div style={styles.modalActions}>
            <button onClick={onClose} style={styles.cancelButton}>Cancel</button>
            <button
              onClick={() => handleActionSubmit(actionType)}
              style={styles.submitButton}
            >
              Apply Action
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div style={{ ...styles.container, flexDirection: showChat ? 'row' : 'column' }}>
        {/* Image Card (left-most) */}
        <div style={styles.imageCard}>
          <img
            src={profileImage}
            alt="User Visual"
            style={styles.fullHeightImage}
          />
        </div>

        {/* Financial Actions Panel (Middle) */}
        {showActions && (
          <div style={styles.actionsPanel}>
            <h4 style={styles.actionsPanelTitle}>Take Action</h4>
            <div style={styles.actionButtons}>
              <button
                onClick={() => setActiveAction('start_sip')}
                style={{ ...styles.actionButton, backgroundColor: '#059669' }}
              >
                📈 Start SIP
              </button>
              <button
                onClick={() => setActiveAction('take_loan')}
                style={{ ...styles.actionButton, backgroundColor: '#dc2626' }}
              >
                🏠 Take Loan
              </button>
              <button
                onClick={() => setActiveAction('make_repayment')}
                style={{ ...styles.actionButton, backgroundColor: '#7c3aed' }}
              >
                💰 Make Repayment
              </button>
            </div>

            {/* Quick Stats */}
            <div style={styles.quickStats}>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Debt-to-Income</span>
                <span style={styles.statValue}>
                  {totalLiability && employment?.monthlyIncome
                    ? `${Math.round((totalLiability / (employment.monthlyIncome * 12)) * 100)}%`
                    : 'N/A'
                  }
                </span>
              </div>
              <div style={styles.statItem}>
                <span style={styles.statLabel}>Available Credit</span>
                <span style={styles.statValue}>
                  {creditScore > 700 ? 'Good' : creditScore > 600 ? 'Fair' : 'Poor'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Main PresentMe Card (Right of actions) */}
        <div style={{ ...styles.card, width: showChat ? '450px' : '450px' }}>
          <div style={{ ...styles.content, flexDirection: 'column', flex: 1 }}>
            <div style={styles.textSection}>
              <div style={styles.headerRow}>
                <h2 style={styles.heading}>Present Me</h2>
                <button
                  onClick={() => setShowChat(!showChat)}
                  style={{ ...styles.chatToggle, backgroundColor: showChat ? '#10b981' : '#3b82f6' }}
                  title={showChat ? 'Hide Chat' : 'Show Chat'}
                >
                  {showChat ? <ChevronRight size={16} /> : <MessageCircle size={16} />}
                </button>
              </div>
              <div style={styles.details}>
                <Detail label="Name" value={name} />
                <Detail label="Age" value={age} />
                <Detail label="Net Worth" value={formatCurrency(netWorth)} />
                <Detail label="Total Liability" value={formatCurrency(totalLiability)} />
                <Detail label="Credit Score" value={creditScore} />
                <Detail label="Employer" value={employment?.currentEmployer} />
                <Detail label="Experience" value={`${employment?.workExperienceYears} years`} />
                <Detail label="Career Trajectory" value={employment?.careerTrajectory} />
                <Detail label="Life Stage" value={humanData.lifeStage} />
              </div>

              {/* Action Toggle Button (Can remain or be removed if actions are always visible) */}
              {!showActions && ( // Only show toggle if actions are hidden
                <button
                  onClick={() => setShowActions(!showActions)}
                  style={styles.actionToggle}
                >
                  🎯 Financial Actions
                </button>
              )}
            </div>

          
          </div>

          <Handle type="source" position="bottom" />
        </div>

        {/* Chat Panel */}
        {showChat && (
          <div style={styles.chatPanel}>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
              <div style={styles.chatHeaderContent}>
                <MessageCircle style={styles.chatIcon} size={20} />
                <div>
                  <h3 style={styles.chatTitle}>Fi MCP Assistant</h3>
                  <p style={styles.chatSubtitle}>Ask anything about your finances</p>
                </div>
              </div>
              <button
                onClick={() => setShowChat(false)}
                style={styles.chatCloseButton}
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat Templates (show when no messages) */}
            {messages.length === 0 && (
              <div style={styles.chatTemplates}>
                <h4 style={styles.templatesTitle}>Quick start conversations:</h4>
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
                          <div style={{
                            ...styles.templateIcon, backgroundColor: template.color === 'bg-blue-500' ? '#3b82f6' :
                              template.color === 'bg-purple-500' ? '#8b5cf6' :
                                template.color === 'bg-green-500' ? '#10b981' :
                                  template.color === 'bg-yellow-500' ? '#f59e0b' :
                                    template.color === 'bg-indigo-500' ? '#6366f1' : '#f97316'
                          }}>
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

                <div style={styles.chatPromo}>
                  <div style={styles.promoText}>✨ Powered by Fi MCP</div>
                  <div style={styles.promoSubtext}>Get personalized financial insights based on your real data</div>
                </div>
              </div>
            )}

            {/* Chat Messages */}
            {messages.length > 0 && (
              <div style={styles.chatMessages}>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    style={{ ...styles.messageContainer, justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start' }}
                  >
                    <div
                      style={{
                        ...styles.messageBubble,
                        backgroundColor: message.sender === 'user' ? '#3b82f6' : '#f3f4f6',
                        color: message.sender === 'user' ? 'white' : '#1f2937'
                      }}
                    >
                      <div style={styles.messageText}>{message.text}</div>
                      <div style={{
                        ...styles.messageTime,
                        color: message.sender === 'user' ? 'rgba(255,255,255,0.7)' : '#9ca3af'
                      }}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div style={{ ...styles.messageContainer, justifyContent: 'flex-start' }}>
                    <div style={{ ...styles.messageBubble, backgroundColor: '#f3f4f6' }}>
                      <div style={styles.typingIndicator}>
                        <div style={styles.typingDot}></div>
                        <div style={{ ...styles.typingDot, animationDelay: '0.1s' }}></div>
                        <div style={{ ...styles.typingDot, animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Back to Templates Button (when messages exist) */}
            {messages.length > 0 && (
              <div style={styles.backToTemplates}>
                <button
                  onClick={() => {
                    setMessages([]);
                    setSelectedTemplate(null);
                  }}
                  style={styles.backButton}
                >
                  <ChevronLeft size={14} /> Back to templates
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
                  placeholder="Ask about your finances..."
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
        )}
      </div>

      {/* Action Modal */}
      {activeAction && (
        <ActionModal
          actionType={activeAction}
          onClose={() => setActiveAction(null)}
        />
      )}
    </>
  );
}

function Detail({ label, value }) {
  return (
    <div style={styles.detailRow}>
      <div style={styles.label}>{label}</div>
      <div style={styles.value}>{value || 'N/A'}</div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    gap: '16px',
    alignItems: 'flex-start',
  },
  // New Image Card style
  imageCard: {
    height:'250px',
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '10px', // Smaller padding to keep image prominent
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center', // Center the image vertically
    alignItems: 'center', // Center the image horizontally
    width: '200px', // Fixed width for the image card
    // The height will be dynamically set by a parent that wraps all three cards
    flexShrink: 0, // Prevent it from shrinking
  },
  fullHeightImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover', // Cover the entire area of the card
    borderRadius: '12px',
  },
  card: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    fontFamily: 'Inter, sans-serif',
    display: 'flex',
    flexDirection: 'column', // Changed to column for inner content
    flex: 1, // Allow it to take available space
    position: 'relative',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  textSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heading: {
    fontSize: '1.2rem',
    fontWeight: 600,
    color: '#111827',
    textAlign: 'left',
    marginBottom: '4px',
    margin: 0,
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
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.95rem',
    borderBottom: '1px dashed #e5e7eb',
    paddingBottom: '4px',
  },
  label: {
    fontWeight: 500,
    color: '#6b7280',
  },
  value: {
    fontWeight: 600,
    color: '#1f2937',
  },
  profileImage: {
    width: '80px',
    height: '80px',
    borderRadius: '12px',
    objectFit: 'cover',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    alignSelf: 'flex-end',
    marginTop: 'auto',
  },
  actionToggle: {
    marginTop: '12px',
    padding: '8px 16px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  actionsPanel: {
    background: '#ffffff', // Changed to match other cards
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '250px', // Fixed width for action card
    flexShrink: 0,
  },
  actionsPanelTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  actionButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  actionButton: {
    padding: '10px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  quickStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px dashed #d1d5db',
  },
  statItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
  },
  statValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  chatPanel: {
    width: '380px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    height: '600px', // Fixed height for chat panel
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
  },
  chatHeader: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#10b981',
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
  chatPromo: {
    marginTop: '16px',
    padding: '12px',
    background: 'linear-gradient(135deg, #f0f9ff 0%, #e0e7ff 100%)',
    borderRadius: '8px',
    border: '1px solid #c7d2fe',
  },
  promoText: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6366f1',
    marginBottom: '4px',
  },
  promoSubtext: {
    fontSize: '10px',
    color: '#6366f1',
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
    color: '#3b82f6',
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
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  // Modal Styles (no changes)
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    width: '400px',
    maxWidth: '90vw',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
  },
  modalContent: {
    marginBottom: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputLabel: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px',
  },
  input: {
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  projection: {
    backgroundColor: '#f0f9ff',
    padding: '12px',
    borderRadius: '8px',
    marginTop: '8px',
    fontSize: '13px',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};