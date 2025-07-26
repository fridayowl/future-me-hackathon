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

      // Generate detailed human description using Gemini, now targeting JSON output
      const humanDescription = await this.generateHumanDescription(basicProfile);

      // Analyze financial behavior patterns, targeting JSON output
      const behaviorAnalysis = await this.analyzeBehaviorPatterns(basicProfile);

      // Generate risk assessment, targeting JSON output
      const riskAssessment = await this.generateRiskAssessment(basicProfile);

      // Create partial profile to pass to future stages analysis
      const partialProfile = {
        basicInfo: basicProfile,
        humanDescription: humanDescription,
        behaviorAnalysis: behaviorAnalysis,
        riskAssessment: riskAssessment,
      };

      // Generate future stages based on the complete profile, incorporating new details
      const futureStages = await this.generateFutureStages(partialProfile);

      // Create complete profile
      const completeProfile = {
        basicInfo: basicProfile,
        humanDescription: humanDescription, // This will now be a JSON object
        behaviorAnalysis: behaviorAnalysis, // This will now be a JSON object
        riskAssessment: riskAssessment,     // This will now be a JSON object
        futureStages: futureStages,         // New: Future stages prediction
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

    // Attempt to infer car/bike/home loans based on loan types.
    // This is a simplification; a real system would need more detailed loan data.
    // These accountType mappings are examples. Verify with your actual data.
    const hasCarLoan = loans.some(loan => this.getLoanType(loan.accountType) === "Auto Loan");
    const hasBikeLoan = loans.some(loan => this.getLoanType(loan.accountType) === "Two-Wheeler Loan");
    const hasHomeLoan = loans.some(loan => this.getLoanType(loan.accountType) === "Home Loan");

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
        paymentHistory: this.analyzePaymentHistory(accounts),
        hasCarLoan: hasCarLoan,
        hasBikeLoan: hasBikeLoan,
        hasHomeLoan: hasHomeLoan,
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
   * Safely parse JSON output from Gemini, removing potential markdown fences.
   * @param {string} text - The raw text response from Gemini.
   * @returns {Object} Parsed JSON object.
   */
  safeParseGeminiJson(text) {
    // Remove markdown code block fences and "json" keyword if present
    const cleanedText = text.replace(/```json\s*|\s*```/g, '').trim();
    try {
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error("Failed to parse JSON from Gemini. Cleaned text:", cleanedText);
      throw error;
    }
  }

  /**
   * Generate detailed human description using Gemini AI
   * Now outputs a JSON object based on a defined schema.
   */
  async generateHumanDescription(basicProfile) {
    const prompt = `
    Analyze this person's financial profile and create a detailed human description.
    **Generate ONLY the JSON object, without any markdown code blocks (e.g., \`\`\`json).**

    The JSON output must strictly adhere to the following schema:
    {
      "name": "string",
      "age": "number",
      "lifeStage": "string",
      "netWorth": "number",
      "totalLiability": "number",
      "creditScore": "number",
      "employment": {
        "currentEmployer": "string",
        "workExperienceYears": "number",
        "careerTrajectory": "string"
      },
      "metroPolitanOrCity": "string",
      "loans": {
        "hasCarLoan": "boolean",
        "hasBikeLoan": "boolean",
        "hasHomeLoan": "boolean",
        "otherLoans": "array"
      },
      "financialPersonality": {
        "riskTolerance": "string",
        "spendingHabits": "string",
        "financialDisciplineLevel": "string"
      },
      "financialStressLevels": "string",
      "financialGoals": {
        "shortTerm": "array",
        "longTerm": "array"
      },
      "behavioralInsights": {
        "decisionMakingPatterns": "string",
        "financialLiteracyLevel": "string"
      },
      "socioEconomicStatus": {
        "economicClass": "string",
        "familyResponsibilities": "string",
        "lifestyleChoices": "string"
      },
      "summary": "string"
    }

    Based on the following data:

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
    - Has Car Loan: ${basicProfile.creditProfile.hasCarLoan}
    - Has Bike Loan: ${basicProfile.creditProfile.hasBikeLoan}
    - Has Home Loan: ${basicProfile.creditProfile.hasHomeLoan}

    EMPLOYMENT:
    - EPF Balance: ₹${basicProfile.employmentProfile.pensionBalance?.toLocaleString() || '0'}
    - Total EPF Contributions: ₹${(basicProfile.employmentProfile.employeeContribution + basicProfile.employmentProfile.employerContribution)?.toLocaleString() || '0'}

    Infer "metroPolitanOrCity" based on the general context of Fi Money users (e.g., "Major Indian Metro City" or "Tier 2 Indian City").
    For "name", use a placeholder like "Individual X".
    For "lifeStage", categorize them based on age and financial situation (e.g., "Early Career Professional", "Mid-Career with Growing Family", "Pre-Retirement"). Use the getLifeStage helper function for this.
    Provide a concise "summary" of the profile.
    `;

    const result = await this.model.generateContent(prompt, {
      responseMimeType: 'application/json' // Crucial for JSON output
    });
    const response = await result.response;
    return this.safeParseGeminiJson(response.text()); // Use the safe parsing method
  }

  /**
   * Analyze financial behavior patterns using Gemini AI
   * Now outputs a JSON object.
   */
  async analyzeBehaviorPatterns(basicProfile) {
    const prompt = `
    Analyze the financial behavior patterns of this person.
    **Generate ONLY the JSON object, without any markdown code blocks (e.g., \`\`\`json).**

    The JSON output must strictly adhere to the following schema:
    {
      "creditManagementStyle": "string",
      "savingsBehavior": "string",
      "spendingPatterns": "string",
      "riskTakingBehavior": "string",
      "financialDiscipline": "string",
      "debtStrategy": "string",
      "investmentMindset": "string"
    }

    Based on the following data:

    CREDIT BEHAVIOR:
    - Credit Score: ${basicProfile.financialSummary.creditScore} (${this.getCreditScoreCategory(basicProfile.financialSummary.creditScore)})
    - Active Credit Accounts: ${basicProfile.creditProfile.activeAccounts}
    - Closed Accounts: ${basicProfile.creditProfile.closedAccounts}
    - Current Debt: ₹${basicProfile.financialSummary.totalDebt.toLocaleString()}
    - Liquid Savings: ₹${basicProfile.financialSummary.liquidSavings.toLocaleString()}
    - Debt-to-Savings Ratio: ${basicProfile.financialSummary.debtToSavingsRatio}
    - Payment History Overall Rating: ${basicProfile.creditProfile.paymentHistory.overallRating}

    EMPLOYMENT STABILITY:
    - Current Job Duration: ${basicProfile.demographics.workExperience} years
    - Employer: ${basicProfile.demographics.employer}

    Provide specific, analytical insights for each field.
    `;

    const result = await this.model.generateContent(prompt, {
      responseMimeType: 'application/json'
    });
    const response = await result.response;
    return this.safeParseGeminiJson(response.text());
  }

  /**
   * Generate comprehensive risk assessment using Gemini AI
   * Now outputs a JSON object.
   */
  async generateRiskAssessment(basicProfile) {
    const prompt = `
    Provide a comprehensive financial risk assessment for this individual.
    **Generate ONLY the JSON object, without any markdown code blocks (e.g., \`\`\`json).**

    The JSON output must strictly adhere to the following schema:
    {
      "financialHealthScore": {
        "score": "number",
        "explanation": "string"
      },
      "redFlags": "array",
      "immediateRisks": "array",
      "mediumTermRisks": "array",
      "longTermRisks": "array",
      "opportunityCosts": "array",
      "riskMitigationStrategies": "array"
    }

    Based on the following data:

    FINANCIAL HEALTH INDICATORS:
    - Net Worth: ₹${basicProfile.financialSummary.netWorth.toLocaleString()}
    - Debt-to-Savings Ratio: ${basicProfile.financialSummary.debtToSavingsRatio}
    - Credit Score: ${basicProfile.financialSummary.creditScore} (${this.getCreditScoreCategory(basicProfile.financialSummary.creditScore)})
    - Employment Stability: ${basicProfile.demographics.workExperience} years with current employer
    - Active Credit Accounts: ${basicProfile.creditProfile.activeAccounts}
    - Total Debt: ₹${basicProfile.financialSummary.totalDebt.toLocaleString()}
    - Liquid Savings: ₹${basicProfile.financialSummary.liquidSavings.toLocaleString()}

    CREDIT UTILIZATION:
    ${basicProfile.creditProfile.creditCards.map(card =>
      `- ${card.bank}: ₹${card.outstanding.toLocaleString()} / ₹${card.limit.toLocaleString()} (${card.utilization}%)`
    ).join('\n')}

    Analyze and provide specific, actionable insights for each field. For "redFlags", list any critical warning signs. For arrays, list distinct points.
    `;

    const result = await this.model.generateContent(prompt, {
      responseMimeType: 'application/json'
    });
    const response = await result.response;
    return this.safeParseGeminiJson(response.text());
  }

 /**
 * Enhanced generateFutureStages method with realistic financial projections
 * This replaces the existing method in ProfileAnalyzer class
 */
async generateFutureStages(completeProfile) {
  const { basicInfo, humanDescription, behaviorAnalysis, riskAssessment } = completeProfile;

  // Current financial snapshot
  const currentNetWorth = basicInfo.financialSummary.netWorth;
  const currentDebt = basicInfo.financialSummary.totalDebt;
  const currentAge = basicInfo.demographics.estimatedAge;
  const currentCreditScore = basicInfo.financialSummary.creditScore;
  const currentSavings = basicInfo.financialSummary.liquidSavings;
  
  // Estimate current income based on EPF contributions and industry standards
  const estimatedCurrentIncome = this.estimateCurrentIncome(basicInfo);
  
  const currentDate = "Friday, July 26, 2025";
  const currentLocation = "Kochi, Kerala, India";

  const prompt = `
  You are a financial analyst creating realistic future projections for an individual. 
  Based on their CURRENT DIRE financial situation, create THREE progressive future stages with REALISTIC and SPECIFIC financial numbers.

  **CRITICAL CONTEXT - CURRENT FINANCIAL REALITY:**
  - Net Worth: ₹${currentNetWorth.toLocaleString()} (EXTREMELY LOW - almost broke)
  - Total Debt: ₹${currentDebt.toLocaleString()} (16x higher than net worth!)
  - Debt-to-Savings Ratio: ${basicInfo.financialSummary.debtToSavingsRatio} (CRITICAL)
  - Credit Score: ${currentCreditScore} (Good, but debt is crushing)
  - Age: ${currentAge} years
  - Estimated Monthly Income: ₹${Math.round(estimatedCurrentIncome/12).toLocaleString()}
  - Credit Card Utilization: 72% on Federal Bank (DANGEROUS)

  **GENERATE ONLY JSON - NO MARKDOWN:**
  
  Create realistic projections considering:
  1. With ₹3,148 net worth and ₹50,077 debt, how can they realistically grow?
  2. What specific income growth is needed to service debt AND build wealth?
  3. How long will debt payoff actually take with realistic savings rates?
  4. What are the mathematical possibilities given current financial constraints?

  Schema (JSON Array of 3 objects):
  [
    {
      "versionName": "string",
      "estimatedAgeRange": "string",
      "timeframeYearsFromCurrent": "string", 
      "estimatedYearRange": "string",
      "keyLifeEvents": ["array of specific life events"],
      "locationContext": {
        "likelyCityOrRegion": "string",
        "housingSituation": "string",
        "estimatedMonthlyRentMortgage": "number"
      },
      "careerFinancials": {
        "estimatedMonthlyIncome": "number",
        "incomeGrowthFromCurrent": "string",
        "jobStability": "string"
      },
      "detailedFinancialProjection": {
        "projectedNetWorth": "number",
        "projectedTotalDebt": "number", 
        "projectedCreditScore": "number",
        "projectedMonthlySavings": "number",
        "projectedInvestments": "number",
        "debtToIncomeRatio": "string",
        "emergencyFundMonths": "number",
        "majorAssets": ["array"],
        "majorLiabilities": ["array with amounts"]
      },
      "realisticMilestones": {
        "debtFreeTarget": "string",
        "firstMajorPurchase": "string", 
        "creditScoreGoal": "number",
        "savingsTarget": "number"
      },
      "financialStressLevel": "string",
      "keyFinancialChallenges": ["array"],
      "practicalStrategies": ["array"],
      "summary": "string"
    }
  ]

  **REALISTIC CONSTRAINTS TO FOLLOW:**
  - Someone with ₹3K net worth CANNOT have ₹50L net worth in 5-7 years without extraordinary circumstances
  - Debt payoff with current income will take 2-4 years minimum
  - Income growth in India: 8-15% annually for good performers
  - Savings rate: Start at 10-15%, grow to 25-30% over time
  - Credit score can improve to 800+ if debt is managed well
  - Home purchase realistic only after debt clearance + 20% down payment saved

  **MATHEMATICAL APPROACH:**
  Stage 1 (2-4 years): Focus on DEBT ELIMINATION
  - Project debt reduction timeline with realistic EMI payments
  - Calculate achievable net worth after debt clearance
  - Factor in modest income growth (10-12% annually)

  Stage 2 (5-8 years): FOUNDATION BUILDING  
  - Post-debt financial freedom calculations
  - First home purchase feasibility analysis
  - Investment portfolio starting amounts

  Stage 3 (10-15 years): WEALTH ACCUMULATION
  - Compound growth projections based on Stage 2 foundations
  - Realistic property appreciation and investment returns
  - Factor in family expenses, inflation, economic cycles

  Current Financial Context:
  - Location: ${currentLocation}
  - Employer: ${basicInfo.demographics.employer}
  - Work Experience: ${basicInfo.demographics.workExperience} years
  - Current Credit Cards: Federal Bank (72% utilization), HDFC (22% utilization), IDFC (0% utilization)
  - Monthly Debt Service Estimate: ₹${Math.round(currentDebt * 0.025).toLocaleString()} (assuming 30% APR average)

  Make each projection mathematically sound and achievable given the harsh current reality.
  `;

  const result = await this.model.generateContent(prompt, {
    responseMimeType: 'application/json'
  });
  const response = await result.response;
  return this.safeParseGeminiJson(response.text());
}

/**
 * Estimate current income based on EPF contributions and employment data
 * @param {Object} basicInfo - Basic profile information
 * @returns {number} Estimated annual income
 */
estimateCurrentIncome(basicInfo) {
  // EPF contribution is typically 12% of basic salary
  // Employee + Employer contribution gives us a baseline
  const totalEPFContribution = basicInfo.employmentProfile.employeeContribution + 
                               basicInfo.employmentProfile.employerContribution;
  
  // Work experience and job role estimation
  const workExperience = basicInfo.demographics.workExperience;
  
  // Base estimation from EPF (rough calculation)
  // EPF is 12% of basic salary, and basic is typically 40-50% of CTC
  let estimatedBasicSalary = (totalEPFContribution / workExperience) / 0.12;
  let estimatedCTC = estimatedBasicSalary / 0.45; // Assuming basic is 45% of CTC
  
  // Sanity check and adjustments based on current financial situation
  // Someone with ₹50K debt likely has income constraints
  const minIncome = 300000; // ₹3L minimum for someone with 6+ years experience
  const maxIncome = 800000; // ₹8L reasonable maximum given debt situation
  
  estimatedCTC = Math.max(minIncome, Math.min(maxIncome, estimatedCTC));
  
  // Adjust based on debt-to-income red flags
  // High debt usually indicates income vs lifestyle mismatch
  if (basicInfo.financialSummary.debtToSavingsRatio > 10) {
    estimatedCTC = estimatedCTC * 0.8; // Likely lower income than calculated
  }
  
  return Math.round(estimatedCTC);
}

/**
 * Calculate realistic debt payoff timeline
 * @param {number} totalDebt - Current total debt
 * @param {number} monthlyIncome - Monthly income
 * @param {number} savingsRate - Percentage of income for debt repayment
 * @returns {Object} Debt payoff projections
 */
calculateDebtPayoffProjection(totalDebt, monthlyIncome, savingsRate = 0.30) {
  const monthlyPayment = monthlyIncome * savingsRate;
  const averageAPR = 0.24; // 24% average credit card APR in India
  const monthlyInterestRate = averageAPR / 12;
  
  // Calculate payoff time using standard debt formula
  const payoffMonths = Math.log(1 + (totalDebt * monthlyInterestRate) / monthlyPayment) / 
                       Math.log(1 + monthlyInterestRate);
  
  const totalInterestPaid = (monthlyPayment * payoffMonths) - totalDebt;
  
  return {
    payoffTimeMonths: Math.ceil(payoffMonths),
    payoffTimeYears: Math.ceil(payoffMonths / 12),
    totalInterestPaid: Math.round(totalInterestPaid),
    monthlyPaymentRequired: Math.round(monthlyPayment)
  };
}

/**
 * Project net worth growth with realistic assumptions
 * @param {Object} startingPosition - Current financial position
 * @param {number} years - Years to project
 * @param {number} avgSavingsRate - Average savings rate
 * @param {number} investmentReturn - Expected annual return
 * @returns {Object} Net worth projection
 */
projectNetWorthGrowth(startingPosition, years, avgSavingsRate = 0.20, investmentReturn = 0.12) {
  const { netWorth, monthlyIncome } = startingPosition;
  
  let projectedNetWorth = netWorth;
  let totalSavings = 0;
  
  for (let year = 1; year <= years; year++) {
    const annualSavings = monthlyIncome * 12 * avgSavingsRate;
    totalSavings += annualSavings;
    
    // Apply investment returns to existing wealth
    projectedNetWorth = (projectedNetWorth + annualSavings) * (1 + investmentReturn);
    
    // Factor in income growth (conservative 8% annually)
    monthlyIncome *= 1.08;
  }
  
  return {
    projectedNetWorth: Math.round(projectedNetWorth),
    totalSavingsContributed: Math.round(totalSavings),
    finalMonthlyIncome: Math.round(monthlyIncome)
  };
}
  // Helper methods
  /**
   * Estimates age based on date of joining, assuming a typical starting work age.
   * @param {string} joinDate - Date of joining EPF in 'YYYY-MM-DD' format.
   * @returns {number} Estimated age in years.
   */
  estimateAge(joinDate) {
    if (!joinDate) return 26; // Default age if no join date

    const doj = new Date(joinDate); // Directly parse 'YYYY-MM-DD'
    if (isNaN(doj.getTime())) { // Check if date parsing was successful
      console.warn(`Invalid joinDate format: ${joinDate}. Defaulting age.`);
      return 26;
    }

    const today = new Date();
    const currentYear = today.getFullYear();
    const joinYear = doj.getFullYear();

    let workingYears = currentYear - joinYear;

    // Adjust working years if birthday/anniversary for current year hasn't passed yet
    if (today.getMonth() < doj.getMonth() || (today.getMonth() === doj.getMonth() && today.getDate() < doj.getDate())) {
      workingYears--;
    }

    const assumedStartWorkingAge = 22; // A common age for starting professional work after graduation

    // Calculate estimated age, ensuring it's not impossibly low or high
    let estimatedAge = assumedStartWorkingAge + workingYears;

    // Add some sanity checks:
    if (estimatedAge < 18) return 22; // Minimum reasonable working age
    if (estimatedAge > 70) return 60; // Max reasonable working age (e.g., if data is very old)

    return estimatedAge;
  }

  /**
   * Calculates work experience in years from date of joining.
   * @param {string} joinDate - Date of joining EPF in 'YYYY-MM-DD' format.
   * @returns {number} Work experience in years (can be fractional).
   */
  calculateWorkExperience(joinDate) {
    if (!joinDate) return 0;

    const doj = new Date(joinDate); // Directly parse 'YYYY-MM-DD'
    if (isNaN(doj.getTime())) { // Check if date parsing was successful
      console.warn(`Invalid joinDate format: ${joinDate}. Returning 0 work experience.`);
      return 0;
    }

    const today = new Date();

    let diffInMilliseconds = today.getTime() - doj.getTime();
    if (diffInMilliseconds < 0) return 0; // Future date, should not happen for DOJ

    const years = diffInMilliseconds / (1000 * 60 * 60 * 24 * 365.25); // Average days in a year including leap years
    return parseFloat(years.toFixed(1)); // Return rounded to one decimal place
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
    // Payment rating > 0 typically indicates some form of delinquency or default.
    // Assuming '0' means on-time or no negative history.
    const defaultAccounts = accounts.filter(acc => parseInt(acc.paymentRating || "0") > 0).length;
    const onTimePercentage = totalAccounts > 0 ? ((totalAccounts - defaultAccounts) / totalAccounts * 100).toFixed(1) : "100.0";

    return {
      totalAccounts,
      defaultAccounts,
      onTimePaymentPercentage: parseFloat(onTimePercentage),
      overallRating: parseFloat(onTimePercentage) > 95 ? "Excellent" : parseFloat(onTimePercentage) > 85 ? "Good" : "Needs Improvement"
    };
  }

  getBankName(subscriberName) {
    const bankMappings = {
      "HDFC BANK LTD": "HDFC Bank",
      "FEDERAL BANK LIMITED": "Federal Bank",
      "IDFC FIRST BANK LIMITED": "IDFC First Bank",
      "KARUR VYSYA BANK LIMITED": "Karur Vysya Bank",
      "ICICI BANK LIMITED": "ICICI Bank",
      "STATE BANK OF INDIA": "State Bank of India",
      "AXIS BANK LIMITED": "Axis Bank",
      "KOTAK MAHINDRA BANK LIMITED": "Kotak Mahindra Bank",
      "PUNJAB NATIONAL BANK": "Punjab National Bank",
      "CANARA BANK": "Canara Bank",
      // Add more mappings as needed
    };
    // Normalize input to upper case for better matching if source data varies
    const normalizedName = subscriberName.toUpperCase();
    for (const key in bankMappings) {
        if (normalizedName.includes(key)) { // Use .includes for partial matches like "HDFC BANK LTD" vs "HDFC Bank"
            return bankMappings[key];
        }
    }
    return subscriberName; // Return original if no specific mapping found
  }

  getLoanType(accountType) {
    const loanTypes = {
      "00": "Other",
      "01": "Home Loan",
      "02": "Auto Loan",
      "05": "Personal Loan",
      "06": "Consumer Loan",
      "07": "Two-Wheeler Loan",
      "10": "Credit Card"
    };
    return loanTypes[accountType] || "Unknown";
  }

  calculateUtilization(current, limit) {
    if (!limit || parseInt(limit) === 0) return 0;
    return Math.round((parseInt(current || "0") / parseInt(limit)) * 100);
  }

  calculateAccountAge(openDate) {
    if (!openDate) return 0;
    const openDateObj = new Date(openDate); // Directly parse 'YYYY-MM-DD'
    if (isNaN(openDateObj.getTime())) {
      console.warn(`Invalid openDate format: ${openDate}. Returning 0 account age.`);
      return 0;
    }
    const currentDateObj = new Date();
    const diffTime = Math.abs(currentDateObj.getTime() - openDateObj.getTime());
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
    return diffYears;
  }

  getCreditScoreCategory(score) {
    if (score >= 750) return "Excellent";
    if (score >= 700) return "Good";
    if (score >= 650) return "Fair";
    return "Poor";
  }

  // Helper to determine life stage based on age (can be expanded)
  getLifeStage(age) {
    if (age >= 18 && age <= 25) return "Early Career Professional/Young Adult";
    if (age > 25 && age <= 35) return "Mid-Career Professional/Young Family";
    if (age > 35 && age <= 50) return "Established Professional/Growing Family";
    if (age > 50 && age <= 65) return "Pre-Retirement/Seasoned Professional";
    if (age > 65) return "Retired/Senior Citizen";
    return "Unknown"; // For ages outside typical working range or if age is not estimable
  }
}

module.exports = ProfileAnalyzer;