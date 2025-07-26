// src/services/profileAnalyzer.js
// Human Profile Analyzer using Google Gemini AI

const { GoogleGenerativeAI } = require('@google/generative-ai');

class ProfileAnalyzer {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  /**
   * Analyze Fi MCP data and create detailed human profile
   * @param {Object} fiMCPData - Raw Fi Money MCP data
   * @returns {Object} Detailed human profile
   */
  async analyzeHumanProfile(fiMCPData) {
    try {
      console.log('Starting profile analysis...');
      
      // First, extract basic financial data
      const basicProfile = this.extractBasicFinancialData(fiMCPData);
      
      // Generate detailed human description using Gemini
      const humanDescription = await this.generateHumanDescription(basicProfile);
      
      // Analyze financial behavior patterns
      const behaviorAnalysis = await this.analyzeBehaviorPatterns(basicProfile);
      
      // Generate risk assessment
      const riskAssessment = await this.generateRiskAssessment(basicProfile);
      
      // Create complete profile
      const completeProfile = {
        basicInfo: basicProfile,
        humanDescription: humanDescription,
        behaviorAnalysis: behaviorAnalysis,
        riskAssessment: riskAssessment,
        generatedAt: new Date().toISOString()
      };

      console.log('Profile analysis completed successfully');
      return completeProfile;

    } catch (error) {
      console.error('Error in profile analysis:', error);
      throw new Error(`Profile analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract basic financial data from Fi MCP
   */
  extractBasicFinancialData(fiMCPData) {
    console.log('Extracting basic financial data...');
    
    // Extract net worth
    const netWorthItem = fiMCPData.dataItems?.find(item => item.netWorthSummary);
    const netWorth = parseInt(netWorthItem?.netWorthSummary?.totalNetWorthValue?.units || "0");
    const savingsAmount = parseInt(netWorthItem?.netWorthSummary?.assetValues?.[0]?.value?.units || "0");

    // Extract credit data
    const creditItem = fiMCPData.dataItems?.find(item => item.creditReportData);
    const creditData = creditItem?.creditReportData?.creditReports?.[0]?.creditReportData;
    const creditScore = parseInt(creditData?.score?.bureauScore || "0");
    const totalDebt = parseInt(creditData?.creditAccount?.creditAccountSummary?.totalOutstandingBalance?.outstandingBalanceAll || "0");

    // Extract credit accounts
    const accounts = creditData?.creditAccount?.creditAccountDetails || [];
    const activeAccounts = accounts.filter(acc => acc.accountStatus === "11");
    const closedAccounts = accounts.filter(acc => acc.accountStatus === "13");

    // Extract EPF data
    const epfItem = fiMCPData.dataItems?.find(item => item.epfAccountData);
    const epfData = epfItem?.epfAccountData?.uanAccounts?.[0]?.rawDetails;
    const employmentInfo = epfData?.est_details?.[0];

    // Extract credit cards
    const creditCards = activeAccounts.filter(acc => acc.portfolioType === "R");
    const loans = activeAccounts.filter(acc => acc.portfolioType === "I");

    return {
      demographics: {
        estimatedAge: this.estimateAge(employmentInfo?.doj_epf),
        employer: employmentInfo?.est_name || "Unknown",
        workExperience: this.calculateWorkExperience(employmentInfo?.doj_epf),
        joinDate: employmentInfo?.doj_epf,
        currentDate: new Date().toISOString().split('T')[0]
      },
      
      financialSummary: {
        netWorth: netWorth,
        liquidSavings: savingsAmount,
        totalDebt: totalDebt,
        creditScore: creditScore,
        debtToSavingsRatio: savingsAmount > 0 ? (totalDebt / savingsAmount).toFixed(2) : "Infinite"
      },

      creditProfile: {
        totalAccounts: accounts.length,
        activeAccounts: activeAccounts.length,
        closedAccounts: closedAccounts.length,
        creditCards: this.processCreditCards(creditCards),
        loans: this.processLoans(loans),
        paymentHistory: this.analyzePaymentHistory(accounts)
      },

      employmentProfile: {
        currentEmployer: employmentInfo?.est_name,
        epfMemberId: employmentInfo?.member_id,
        office: employmentInfo?.office,
        joinDate: employmentInfo?.doj_epf,
        exitDate: employmentInfo?.doe_epf,
        pensionBalance: parseInt(epfData?.overall_pf_balance?.pension_balance || "0"),
        employeeContribution: parseInt(epfData?.overall_pf_balance?.employee_share_total?.credit || "0"),
        employerContribution: parseInt(epfData?.overall_pf_balance?.employer_share_total?.credit || "0")
      }
    };
  }

  /**
   * Generate detailed human description using Gemini AI
   */
  async generateHumanDescription(basicProfile) {
    const prompt = `
    Analyze this person's financial profile and create a detailed human description:

    DEMOGRAPHICS:
    - Estimated Age: ${basicProfile.demographics.estimatedAge} years
    - Work Experience: ${basicProfile.demographics.workExperience} years
    - Current Employer: ${basicProfile.demographics.employer}
    - Employment Start: ${basicProfile.demographics.joinDate}

    FINANCIAL SITUATION:
    - Net Worth: ₹${basicProfile.financialSummary.netWorth.toLocaleString()}
    - Liquid Savings: ₹${basicProfile.financialSummary.liquidSavings.toLocaleString()}
    - Total Debt: ₹${basicProfile.financialSummary.totalDebt.toLocaleString()}
    - Credit Score: ${basicProfile.financialSummary.creditScore}
    - Debt-to-Savings Ratio: ${basicProfile.financialSummary.debtToSavingsRatio}

    CREDIT PROFILE:
    - Total Credit Accounts: ${basicProfile.creditProfile.totalAccounts}
    - Active Accounts: ${basicProfile.creditProfile.activeAccounts}
    - Credit Cards: ${basicProfile.creditProfile.creditCards.length}
    - Loans: ${basicProfile.creditProfile.loans.length}

    EMPLOYMENT:
    - EPF Balance: ₹${basicProfile.employmentProfile.pensionBalance?.toLocaleString() || '0'}
    - Total EPF Contributions: ₹${(basicProfile.employmentProfile.employeeContribution + basicProfile.employmentProfile.employerContribution)?.toLocaleString() || '0'}

    Create a detailed human profile including:
    1. LIFE STAGE & LIFESTYLE: Describe their current life phase, likely lifestyle, and spending patterns
    2. FINANCIAL PERSONALITY: Risk tolerance, spending habits, financial discipline level
    3. CAREER SITUATION: Professional status, income estimation, career trajectory
    4. FINANCIAL STRESS LEVELS: Current financial pressures and concerns
    5. FINANCIAL GOALS: Likely short-term and long-term financial aspirations
    6. BEHAVIORAL INSIGHTS: Decision-making patterns, financial literacy level
    7. SOCIAL ECONOMIC STATUS: Economic class, family responsibilities, lifestyle choices

    Be specific, empathetic, and realistic. Use the data to paint a complete picture of this person's financial life.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Analyze financial behavior patterns using Gemini AI
   */
  async analyzeBehaviorPatterns(basicProfile) {
    const prompt = `
    Analyze the financial behavior patterns of this person:

    CREDIT BEHAVIOR:
    - Credit Score: ${basicProfile.financialSummary.creditScore} (${this.getCreditScoreCategory(basicProfile.financialSummary.creditScore)})
    - Active Credit Accounts: ${basicProfile.creditProfile.activeAccounts}
    - Closed Accounts: ${basicProfile.creditProfile.closedAccounts}
    - Current Debt: ₹${basicProfile.financialSummary.totalDebt.toLocaleString()}
    - Liquid Savings: ₹${basicProfile.financialSummary.liquidSavings.toLocaleString()}

    EMPLOYMENT STABILITY:
    - Current Job Duration: ${basicProfile.demographics.workExperience} years
    - Employer: ${basicProfile.demographics.employer}

    Provide detailed analysis of:
    1. CREDIT MANAGEMENT STYLE: How they handle credit and debt
    2. SAVINGS BEHAVIOR: Their approach to building wealth and emergency funds
    3. SPENDING PATTERNS: Likely spending habits and financial priorities
    4. RISK TAKING BEHAVIOR: Conservative vs aggressive financial decisions
    5. FINANCIAL DISCIPLINE: Level of self-control and planning
    6. DEBT STRATEGY: How they approach borrowing and repayment
    7. INVESTMENT MINDSET: Likely investment preferences and risk appetite

    Be analytical and provide specific insights based on the financial data patterns.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  /**
   * Generate comprehensive risk assessment using Gemini AI
   */
  async generateRiskAssessment(basicProfile) {
    const prompt = `
    Provide a comprehensive financial risk assessment for this individual:

    FINANCIAL HEALTH INDICATORS:
    - Net Worth: ₹${basicProfile.financialSummary.netWorth.toLocaleString()}
    - Debt-to-Savings Ratio: ${basicProfile.financialSummary.debtToSavingsRatio}
    - Credit Score: ${basicProfile.financialSummary.creditScore}
    - Employment Stability: ${basicProfile.demographics.workExperience} years with current employer
    - Active Credit Accounts: ${basicProfile.creditProfile.activeAccounts}

    CREDIT UTILIZATION:
    ${basicProfile.creditProfile.creditCards.map(card => 
      `- ${card.bank}: ₹${card.outstanding.toLocaleString()} / ₹${card.limit.toLocaleString()} (${card.utilization}%)`
    ).join('\n')}

    Analyze and provide:
    1. IMMEDIATE RISKS: Critical financial risks requiring urgent attention
    2. MEDIUM-TERM RISKS: Potential problems in 1-3 years if current patterns continue
    3. LONG-TERM RISKS: Retirement and wealth-building concerns
    4. OPPORTUNITY COSTS: What they're missing by current financial choices
    5. RISK MITIGATION STRATEGIES: Specific actionable steps to reduce risks
    6. FINANCIAL HEALTH SCORE: Overall rating from 1-10 with explanation
    7. RED FLAGS: Warning signs that need immediate attention

    Be specific, actionable, and prioritize risks by urgency and impact.
    `;

    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  }

  // Helper methods
  estimateAge(joinDate) {
    if (!joinDate) return 26; // Default
    const joinYear = parseInt(joinDate.split('-')[2]);
    const currentYear = new Date().getFullYear();
    const workingYears = currentYear - joinYear;
    return 22 + workingYears; // Assuming started working at 22
  }

  calculateWorkExperience(joinDate) {
    if (!joinDate) return 0;
    const joinYear = parseInt(joinDate.split('-')[2]);
    const currentYear = new Date().getFullYear();
    return currentYear - joinYear;
  }

  processCreditCards(creditCards) {
    return creditCards.map(card => ({
      bank: this.getBankName(card.subscriberName),
      outstanding: parseInt(card.currentBalance || "0"),
      limit: parseInt(card.creditLimitAmount || "0"),
      utilization: this.calculateUtilization(card.currentBalance, card.creditLimitAmount),
      accountAge: this.calculateAccountAge(card.openDate)
    }));
  }

  processLoans(loans) {
    return loans.map(loan => ({
      bank: this.getBankName(loan.subscriberName),
      outstanding: parseInt(loan.currentBalance || "0"),
      originalAmount: parseInt(loan.highestCreditOrOriginalLoanAmount || "0"),
      accountType: this.getLoanType(loan.accountType),
      status: loan.accountStatus,
      openDate: loan.openDate
    }));
  }

  analyzePaymentHistory(accounts) {
    const totalAccounts = accounts.length;
    const defaultAccounts = accounts.filter(acc => acc.paymentRating > 0).length;
    const onTimePercentage = ((totalAccounts - defaultAccounts) / totalAccounts * 100).toFixed(1);
    
    return {
      totalAccounts,
      defaultAccounts,
      onTimePaymentPercentage: onTimePercentage,
      overallRating: onTimePercentage > 95 ? "Excellent" : onTimePercentage > 85 ? "Good" : "Needs Improvement"
    };
  }

  getBankName(subscriberName) {
    const bankMappings = {
      "HDFC Bank Ltd": "HDFC Bank",
      "Federal Bank": "Federal Bank", 
      "IDFC FIRST BANK LIMITED": "IDFC First Bank",
      "Karur Vysya Bank Ltd": "Karur Vysya Bank"
    };
    return bankMappings[subscriberName] || subscriberName;
  }

  getLoanType(accountType) {
    const loanTypes = {
      "00": "Other",
      "05": "Personal Loan",
      "06": "Consumer Loan",
      "10": "Credit Card"
    };
    return loanTypes[accountType] || "Unknown";
  }

  calculateUtilization(current, limit) {
    if (!limit || limit === "0") return 0;
    return Math.round((parseInt(current || "0") / parseInt(limit)) * 100);
  }

  calculateAccountAge(openDate) {
    if (!openDate) return 0;
    const openYear = parseInt(openDate.substring(0, 4));
    const currentYear = new Date().getFullYear();
    return currentYear - openYear;
  }

  getCreditScoreCategory(score) {
    if (score >= 750) return "Excellent";
    if (score >= 700) return "Good";
    if (score >= 650) return "Fair";
    return "Poor";
  }
}

module.exports = ProfileAnalyzer;