
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
      let futureStages = await this.generateFutureStages(partialProfile);

      // NEW: Calculate and add acquisition chances to each future stage
      // Pass basicInfo to this function for initial asset status verification and deterministic calculation
      futureStages = this.addAcquisitionChances(futureStages, basicProfile.creditProfile);


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
    const prompt = `Analyze this person's financial profile and create a detailed human description.
    **Generate ONLY the JSON object, without any markdown code blocks (e.g., \\\json).**
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
    const prompt = `Analyze the financial behavior patterns of this person.
    **Generate ONLY the JSON object, without any markdown code blocks (e.g., \\\json).**
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
    const prompt = `Provide a comprehensive financial risk assessment for this individual.
    **Generate ONLY the JSON object, without any markdown code blocks (e.g., \\\json).**
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
   * Generate next three future stages of the person based on their current profile.
   * This now acts as the "Future Me Versions" generator.
   * @param {Object} completeProfile - The already analyzed complete profile.
   * @returns {Array<Object>} An array of objects, each describing a future stage.
   */
  async generateFutureStages(completeProfile) {
    const { basicInfo } = completeProfile; // Destructure basicInfo for easier access

    // Current financial snapshot
    const currentNetWorth = basicInfo.financialSummary.netWorth;
    const currentDebt = basicInfo.financialSummary.totalDebt;
    const currentAge = basicInfo.demographics.estimatedAge;
    const currentCreditScore = basicInfo.financialSummary.creditScore;
    const currentSavings = basicInfo.financialSummary.liquidSavings;

    // Estimate current income based on EPF contributions and industry standards
    const estimatedCurrentIncome = this.estimateCurrentIncome(basicInfo);

    const currentDate = "Friday, July 26, 2025"; // Current date placeholder
    const currentLocation = "Kochi, Kerala, India"; // Current location placeholder

    // Removed specific assetProjectionInstructions. Gemini will focus on general asset status/notes.
    // Our new `addAcquisitionChances` method will set the precise percentages and potentially adjust status/notes.

    const prompt = `You are a financial analyst creating realistic future projections for an individual.
    Based on their CURRENT DIRE financial situation, create THREE progressive future stages with REALISTIC and SPECIFIC financial numbers.

    **CRITICAL CONTEXT - CURRENT FINANCIAL REALITY:**
    - Net Worth: ₹${currentNetWorth.toLocaleString()} (EXTREMELY LOW - almost broke)
    - Total Debt: ₹${currentDebt.toLocaleString()} (16x higher than net worth!)
    - Debt-to-Savings Ratio: ${basicInfo.financialSummary.debtToSavingsRatio} (CRITICAL)
    - Credit Score: ${currentCreditScore} (Good, but debt is crushing)
    - Age: ${currentAge} years
    - Estimated Monthly Income: ₹${Math.round(estimatedCurrentIncome/12).toLocaleString()}
    - Credit Card Utilization (Federal Bank): ${basicInfo.creditProfile.creditCards.find(c => c.bank === 'Federal Bank')?.utilization || 'N/A'}% (DANGEROUS if high)
    - Current Home Loan: ${basicInfo.creditProfile.hasHomeLoan ? 'Yes' : 'No'}
    - Current Car Loan: ${basicInfo.creditProfile.hasCarLoan ? 'Yes' : 'No'}
    - Current Bike Loan: ${basicInfo.creditProfile.hasBikeLoan ? 'Yes' : 'No'}

    **GENERATE ONLY JSON - NO MARKDOWN:**

    Create realistic projections considering:
    1. With ₹3,148 net worth and ₹50,077 debt, how can they realistically grow?
    2. What specific income growth is needed to service debt AND build wealth?
    3. How long will debt payoff actually take with realistic savings rates?
    4. What are the mathematical possibilities given current financial constraints?
    5. **For each stage, provide a realistic "ownershipStatus" (e.g., "None", "Renting", "Likely Acquisition", "Owned (loan)", "Owned (paid off)") and descriptive "notes" for car, bike, and home.** Consider the current asset ownership and financial progression.

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
          "housingSituation": "string", // e.g., "renting apartment", "owning first home", "owning larger home"
          "estimatedMonthlyRentMortgage": "number" // Qualitative, e.g., "Moderate", "High", "Paid off"
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
        "assetOwnershipProjection": {
          "car": {
            "ownershipStatus": "string", // "None", "Owned (paid off)", "Owned (loan)", "Likely Acquisition", "Upgrade Planned"
            "notes": "string" // e.g., "Expected to purchase a mid-range sedan after debt clearance."
            // 'chanceOfAcquisition' will be added by the backend code
          },
          "bike": {
            "ownershipStatus": "string", // "None", "Owned (paid off)", "Owned (loan)", "Likely Acquisition"
            "notes": "string" // e.g., "Likely to retain existing bike."
            // 'chanceOfAcquisition' will be added by the backend code
          },
          "home": {
            "ownershipStatus": "string", // "Renting", "Owned (loan)", "Owned (paid off)", "Second Home Acquisition"
            "notes": "string" // e.g., "Primary residence fully owned, considering investment property."
            // 'chanceOfAcquisition' will be added by the backend code
          }
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
        "summary": "string" // A concise overview of this future version
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
    - First home purchase feasibility analysis (if not already owned)
    - Investment portfolio starting amounts

    Stage 3 (10-15 years): WEALTH ACCUMULATION
    - Compound growth projections based on Stage 2 foundations
    - Realistic property appreciation and investment returns
    - Factor in family expenses, inflation, economic cycles

    Current Financial Context:
    - Location: ${currentLocation}
    - Employer: ${basicInfo.demographics.employer}
    - Work Experience: ${basicInfo.demographics.workExperience} years
    - Current Credit Cards: ${basicInfo.creditProfile.creditCards.map(c => `${c.bank} (${c.utilization}%)`).join(', ') || 'N/A'}
    - Current Loans: ${basicInfo.creditProfile.loans.map(l => `${l.bank} (${this.getLoanType(l.accountType)})`).join(', ') || 'N/A'}
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
   * NEW METHOD: Calculates and adds acquisition chances to each future stage's assets.
   * This method now also *corrects* or sets the ownershipStatus and notes based on initial data
   * and financial projections, overriding Gemini's potentially illogical outputs.
   * @param {Array<Object>} futureStages - Array of future stage objects from Gemini.
   * @param {Object} currentCreditProfile - The initial creditProfile from basicInfo.
   * @returns {Array<Object>} Updated future stages with acquisition chances.
   */
  addAcquisitionChances(futureStages, currentCreditProfile) {
    return futureStages.map(stage => {
      const projectedNetWorth = stage.detailedFinancialProjection.projectedNetWorth;
      const projectedMonthlyIncome = stage.careerFinancials.estimatedMonthlyIncome;
      const projectedTotalDebt = stage.detailedFinancialProjection.projectedTotalDebt;
      const emergencyFundMonths = stage.detailedFinancialProjection.emergencyFundMonths;
      const timeframeYears = parseFloat(stage.timeframeYearsFromCurrent.split('-')[0]) || 0; // Get lower bound of timeframe

      // --- Car Acquisition Logic ---
      if (currentCreditProfile.hasCarLoan) {
        // If they currently have a car loan, it means they own a car
        stage.assetOwnershipProjection.car.ownershipStatus = "Owned (loan)";
        stage.assetOwnershipProjection.car.chanceOfAcquisition = 100;
        stage.assetOwnershipProjection.car.notes = "Currently owns a car. Focus on paying off the loan or considering an upgrade.";
        // More sophisticated logic: If projected total debt (excluding home loan if applicable) is near zero
        if (projectedTotalDebt <= (projectedMonthlyIncome * 0.5) && projectedNetWorth > 0 && timeframeYears >= 2) { // Example: assume small remaining debt is fine
             stage.assetOwnershipProjection.car.ownershipStatus = "Owned (paid off)";
             stage.assetOwnershipProjection.car.notes = "Existing car loan paid off. Potential for upgrade to a newer model.";
        }
      } else {
        // If they don't have a car loan currently
        let chance = 0;
        let notes = "Car acquisition highly unlikely due to current financial situation and debt focus.";

        if (projectedTotalDebt <= 0) { // Must be debt-free or near debt-free
          if (projectedNetWorth >= 250000 && projectedMonthlyIncome >= 40000 && timeframeYears >= 3) {
            chance = 75; // Good financial standing, good chance for a budget-to-mid-range car
            notes = "Strong financial standing after debt elimination. High chance of acquiring a budget-to-mid-range car (e.g., ₹6-10 Lakhs).";
          } else if (projectedNetWorth >= 120000 && projectedMonthlyIncome >= 30000 && timeframeYears >= 2) {
            chance = 45; // Some savings, moderate income, possible for a very basic/used car
            notes = "Moderate financial position. Possible to acquire a very basic or used car on EMI (e.g., ₹3-5 Lakhs).";
          }
        }
        stage.assetOwnershipProjection.car.ownershipStatus = chance >= 40 ? "Likely Acquisition" : "None"; // Set status based on calculated chance
        stage.assetOwnershipProjection.car.notes = notes;
        stage.assetOwnershipProjection.car.chanceOfAcquisition = chance;
      }

      // --- Bike Acquisition Logic ---
      if (currentCreditProfile.hasBikeLoan) {
        // If they currently have a bike loan, they own a bike
        stage.assetOwnershipProjection.bike.ownershipStatus = "Owned (loan)";
        stage.assetOwnershipProjection.bike.chanceOfAcquisition = 100;
        stage.assetOwnershipProjection.bike.notes = "Currently owns a bike. Focus on paying off the loan or considering an upgrade.";
         if (projectedTotalDebt <= (projectedMonthlyIncome * 0.2) && projectedNetWorth > 0 && timeframeYears >= 1) { // Small remaining debt ok
             stage.assetOwnershipProjection.bike.ownershipStatus = "Owned (paid off)";
             stage.assetOwnershipProjection.bike.notes = "Existing bike loan paid off. May retain or upgrade to a higher-end model.";
        }
      } else {
        // If they don't have a bike loan currently
        let chance = 0;
        let notes = "Bike acquisition unlikely given current debt focus.";

        if (projectedTotalDebt <= 0) { // Must be debt-free or near debt-free
          if (projectedNetWorth >= 60000 && projectedMonthlyIncome >= 25000 && timeframeYears >= 1) {
            chance = 90; // Very high chance for a new bike
            notes = "Strong financial standing after debt elimination. Very high chance of acquiring a new bike (e.g., ₹90,000 - ₹1.8 Lakhs).";
          } else if (projectedNetWorth >= 25000 && projectedMonthlyIncome >= 18000 && timeframeYears >= 0.5) {
            chance = 70; // Good chance for a reliable used bike
            notes = "Good financial position. Likely to acquire a reliable used bike.";
          }
        }
        stage.assetOwnershipProjection.bike.ownershipStatus = chance >= 60 ? "Likely Acquisition" : "None";
        stage.assetOwnershipProjection.bike.notes = notes;
        stage.assetOwnershipProjection.bike.chanceOfAcquisition = chance;
      }

      // --- Home Acquisition Logic ---
      if (currentCreditProfile.hasHomeLoan) {
        // If they currently have a home loan, they own a home
        stage.assetOwnershipProjection.home.ownershipStatus = "Owned (loan)";
        stage.assetOwnershipProjection.home.chanceOfAcquisition = 100;
        stage.assetOwnershipProjection.home.notes = "Currently owns a home with a mortgage. Focus on paying off the loan.";
         if (projectedTotalDebt <= 0 && projectedNetWorth >= 5000000 && timeframeYears >= 10) { // Significant net worth implies equity
             stage.assetOwnershipProjection.home.ownershipStatus = "Owned (paid off)";
             stage.assetOwnershipProjection.home.notes = "Existing home loan fully paid off.";
        }
      } else {
        // If they don't have a home loan currently
        let chance = 0;
        let notes = "Homeownership is a significant long-term goal, highly unlikely in early stages without substantial financial improvement.";

        if (projectedTotalDebt <= 0 && emergencyFundMonths >= 6) { // Must be debt-free and have emergency fund
          if (projectedNetWorth >= 2000000 && projectedMonthlyIncome >= 70000 && timeframeYears >= 7) {
            chance = 85; // Excellent financial position for a home
            notes = "Excellent financial position for homeownership. Highly likely to acquire a first home with manageable mortgage.";
          } else if (projectedNetWorth >= 1000000 && projectedMonthlyIncome >= 50000 && timeframeYears >= 5) {
            chance = 55; // Decent chance, possibly a smaller home or longer savings period
            notes = "Good financial progress. Decent chance to acquire a modest first home with significant downpayment saved.";
          } else if (projectedNetWorth >= 400000 && projectedMonthlyIncome >= 35000 && timeframeYears >= 8) {
             chance = 25; // Low chance, early saving for downpayment
             notes = "Building savings for a downpayment. Home acquisition possible towards the later part of this stage or next, requiring consistent savings.";
          }
        }
        stage.assetOwnershipProjection.home.ownershipStatus = chance >= 50 ? "Likely Acquisition" : "Renting"; // Set status based on calculated chance
        if (chance === 0) stage.assetOwnershipProjection.home.ownershipStatus = "Renting"; // Explicitly rent if 0% chance
        stage.assetOwnershipProjection.home.notes = notes;
        stage.assetOwnershipProjection.home.chanceOfAcquisition = chance;
      }

      return stage;
    });
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
    let estimatedBasicSalary = (totalEPFContribution / (workExperience > 0 ? workExperience : 1)) / 0.12;
    let estimatedCTC = estimatedBasicSalary / 0.45; // Assuming basic is 45% of CTC

    // Sanity check and adjustments based on current financial situation
    // Someone with ₹50K debt likely has income constraints
    const minIncome = 300000; // ₹3L minimum for someone with 6+ years experience (adjust based on age/exp)
    const maxIncome = 800000; // ₹8L reasonable maximum given debt situation (adjust based on market)

    // Adjust min/max income based on work experience to be more realistic for early/mid-career
    if (workExperience < 5) {
      estimatedCTC = Math.max(200000, Math.min(500000, estimatedCTC)); // Lower range for less experienced
    } else if (workExperience >= 5 && workExperience < 10) {
      estimatedCTC = Math.max(350000, Math.min(900000, estimatedCTC));
    } else { // 10+ years experience
      estimatedCTC = Math.max(500000, Math.min(1500000, estimatedCTC)); // Higher range for experienced
    }

    // Apply the estimatedCTC range
    estimatedCTC = Math.max(minIncome, Math.min(maxIncome, estimatedCTC));


    // Adjust based on debt-to-income red flags or very low net worth
    // High debt or very low net worth usually indicates income vs lifestyle mismatch or recent financial struggles
    if (basicInfo.financialSummary.debtToSavingsRatio !== "Infinite" && parseFloat(basicInfo.financialSummary.debtToSavingsRatio) > 5) {
      estimatedCTC *= 0.85; // Slightly lower income than calculated if highly leveraged
    } else if (basicInfo.financialSummary.netWorth < 10000) { // Very low net worth
      estimatedCTC *= 0.9;
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
    if (totalDebt <= 0) {
      return { payoffTimeMonths: 0, payoffTimeYears: 0, totalInterestPaid: 0, monthlyPaymentRequired: 0 };
    }

    const monthlyPayment = monthlyIncome * savingsRate;
    if (monthlyPayment <= 0) { // Cannot pay off debt
        return { payoffTimeMonths: Infinity, payoffTimeYears: Infinity, totalInterestPaid: Infinity, monthlyPaymentRequired: 0 };
    }

    const averageAPR = 0.24; // 24% average interest rate for personal/credit card loans in India
    const monthlyInterestRate = averageAPR / 12;

    let remainingDebt = totalDebt;
    let months = 0;
    let totalInterestPaid = 0;

    while (remainingDebt > 0 && months < 360) { // Cap at 30 years to prevent infinite loops
      const interestPayment = remainingDebt * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;

      if (principalPayment <= 0) { // If payment barely covers interest, or not at all
          return { payoffTimeMonths: Infinity, payoffTimeYears: Infinity, totalInterestPaid: Infinity, monthlyPaymentRequired: Math.round(monthlyPayment) };
      }

      remainingDebt -= principalPayment;
      totalInterestPaid += interestPayment;
      months++;
    }

    return {
      payoffTimeMonths: months,
      payoffTimeYears: parseFloat((months / 12).toFixed(1)),
      totalInterestPaid: Math.round(totalInterestPaid),
      monthlyPaymentRequired: Math.round(monthlyPayment)
    };
  }

  /**
   * Project net worth growth with realistic assumptions
   * @param {Object} startingPosition - Current financial position (netWorth, monthlyIncome)
   * @param {number} years - Years to project
   * @param {number} avgSavingsRate - Average savings rate (decimal)
   * @param {number} investmentReturn - Expected annual return (decimal)
   * @param {number} incomeGrowthRate - Annual income growth rate (decimal)
   * @returns {Object} Net worth projection
   */
  projectNetWorthGrowth(startingPosition, years, avgSavingsRate = 0.20, investmentReturn = 0.12, incomeGrowthRate = 0.08) {
    let { netWorth, monthlyIncome } = startingPosition;

    let projectedNetWorth = netWorth;
    let totalSavingsContributed = 0;
    let finalMonthlyIncome = monthlyIncome;

    for (let year = 1; year <= years; year++) {
      const annualSavings = finalMonthlyIncome * 12 * avgSavingsRate;
      totalSavingsContributed += annualSavings;

      // Apply investment returns to existing wealth and new savings
      projectedNetWorth = (projectedNetWorth + annualSavings) * (1 + investmentReturn);

      // Factor in income growth
      finalMonthlyIncome *= (1 + incomeGrowthRate);
    }

    return {
      projectedNetWorth: Math.round(projectedNetWorth),
      totalSavingsContributed: Math.round(totalSavingsContributed),
      finalMonthlyIncome: Math.round(finalMonthlyIncome)
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
