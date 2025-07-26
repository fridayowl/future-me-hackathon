// src/services/geminiService.js
// Gemini AI service for Future Me conversations

const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  }

  async generateFutureMeResponse(userMessage, currentAge, futureAge, userProfile) {
    try {
      const systemPrompt = this.createFutureMeSystemPrompt(currentAge, futureAge, userProfile);
      const fullPrompt = `${systemPrompt}\n\nUser Question: "${userMessage}"\n\nRespond as Future Me:`;

      console.log(`Generating Future Me response: ${currentAge} → ${futureAge} years`);
      
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const responseText = response.text();

      return {
        response: responseText,
        futureAge: futureAge,
        currentAge: currentAge,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating Future Me response:', error);
      throw new Error(`Failed to generate Future Me response: ${error.message}`);
    }
  }

  createFutureMeSystemPrompt(currentAge, futureAge, userProfile) {
    const yearsAhead = futureAge - currentAge;
    
    // Safely extract data with fallbacks
    const demographics = userProfile.demographics || userProfile.basicInfo?.demographics || {};
    const financialSummary = userProfile.financialSummary || userProfile.basicInfo?.financialSummary || {};
    
    // Extract financial data with safe defaults
    const netWorth = financialSummary.netWorth || 0;
    const liquidSavings = financialSummary.liquidSavings || 0;
    const totalDebt = financialSummary.totalDebt || 0;
    const creditScore = financialSummary.creditScore || 0;
    const workExperience = demographics.workExperience || 0;
    const employer = demographics.employer || "Unknown";
    const estimatedAge = demographics.estimatedAge || currentAge;

    return `
You are the user speaking to their ${estimatedAge}-year-old self from the perspective of being ${futureAge} years old.
You have lived ${yearsAhead} more years and gained valuable financial experience.

CURRENT SITUATION (at age ${estimatedAge}):
- Net Worth: ₹${netWorth.toLocaleString()}
- Liquid Savings: ₹${liquidSavings.toLocaleString()}  
- Total Debt: ₹${totalDebt.toLocaleString()}
- Credit Score: ${creditScore}
- Work Experience: ${workExperience} years
- Current Employer: ${employer}

FINANCIAL SITUATION ANALYSIS:
- Debt-to-Savings Ratio: ${liquidSavings > 0 ? (totalDebt / liquidSavings).toFixed(2) : 'High'}
- Financial Health: ${this.assessFinancialHealth(netWorth, totalDebt, creditScore)}

CONVERSATION STYLE:
- Speak in first person as "I" - you ARE their future self
- Reference specific current situations and numbers from their profile
- Share personal stories about how things worked out from this exact financial situation
- Be warm, wise, but honest about challenges
- Give specific, actionable advice based on their current ₹${netWorth.toLocaleString()} net worth and ₹${totalDebt.toLocaleString()} debt
- Keep responses under 200 words
- Use Indian currency (₹) and context
- Address their specific financial challenges (high debt, low savings, etc.)

PERSONA FOR AGE ${futureAge}:
${this.getPersonaGuidance(futureAge, netWorth, totalDebt, creditScore)}

Remember: You're literally them from the future, having lived through everything they're experiencing now with these exact financial numbers.
    `;
  }

  assessFinancialHealth(netWorth, totalDebt, creditScore) {
    if (totalDebt > netWorth * 10) return "High financial stress due to debt burden";
    if (creditScore >= 750) return "Good credit management despite challenges";
    if (netWorth < 10000) return "Early career building phase";
    return "Developing financial stability";
  }

  getPersonaGuidance(age, netWorth, totalDebt, creditScore) {
    if (age <= 30) {
      return `As your 30-year-old self:
- I remember exactly how stressful having ₹${totalDebt.toLocaleString()} in debt felt
- I can share specific strategies that worked to get out of debt
- I learned valuable lessons about credit management and building wealth
- I'm proud of how we turned things around from where you are now`;
    } else if (age <= 40) {
      return `As your 40-year-old self:
- I've built significant wealth from that ₹${netWorth.toLocaleString()} starting point
- I remember the exact decisions that made the biggest difference
- I can share wisdom about investments, career growth, and major purchases
- I understand the long-term impact of the choices you're making now`;
    } else if (age <= 50) {
      return `As your 50-year-old self:
- I have financial stability and am thinking about family and legacy
- I can share perspective on major life decisions and their financial impact
- I understand what really matters in the long run
- I'm grateful for the financial discipline we developed in our 20s`;
    } else {
      return `As your ${age}-year-old self:
- I have the wisdom of having lived through multiple financial cycles
- I can share deep perspective on money, happiness, and what truly matters
- I understand the long-term consequences of financial decisions
- I have the security that comes from good financial planning`;
    }
  }

  async generateCouncilOfYous(userMessage, userProfile, ages = [30, 40, 60]) {
    try {
      const demographics = userProfile.demographics || userProfile.basicInfo?.demographics || {};
      const financialSummary = userProfile.financialSummary || userProfile.basicInfo?.financialSummary || {};
      
      const currentAge = demographics.estimatedAge || 26;
      const netWorth = financialSummary.netWorth || 0;
      const totalDebt = financialSummary.totalDebt || 0;
      const creditScore = financialSummary.creditScore || 0;

      const councilPrompt = `
The user is asking: "${userMessage}"

Current situation:
- Age: ${currentAge}
- Net Worth: ₹${netWorth.toLocaleString()}
- Total Debt: ₹${totalDebt.toLocaleString()}
- Credit Score: ${creditScore}

Create a conversation between these versions of the same person:
- ${ages[0]}-year-old Me: Early career perspective, recently learned from mistakes
- ${ages[1]}-year-old Me: Mid-career perspective, building wealth and stability  
- ${ages[2]}-year-old Me: Experienced perspective, has wisdom and financial security

Each should respond to the question with their unique perspective based on their life stage.
Format as a realistic conversation where each age responds naturally.
Each response should be 50-75 words and reference specific experiences.

Example format:
**Me at ${ages[0]}:** [Response from early career perspective]

**Me at ${ages[1]}:** [Response from established career perspective]

**Me at ${ages[2]}:** [Response from wise, experienced perspective]
`;

      const result = await this.model.generateContent(councilPrompt);
      const response = await result.response;
      
      return {
        conversation: response.text(),
        participants: ages,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error generating council conversation:', error);
      throw new Error(`Failed to generate council conversation: ${error.message}`);
    }
  }

  async generatePersonaCharacteristics(futureAge, userProfile) {
    try {
      const demographics = userProfile.demographics || userProfile.basicInfo?.demographics || {};
      const financialSummary = userProfile.financialSummary || userProfile.basicInfo?.financialSummary || {};
      
      const currentAge = demographics.estimatedAge || 26;
      const netWorth = financialSummary.netWorth || 0;
      const totalDebt = financialSummary.totalDebt || 0;

      const prompt = `
Based on this person's current financial profile, describe who they would be at age ${futureAge}:

CURRENT PROFILE:
- Age: ${currentAge}
- Net Worth: ₹${netWorth.toLocaleString()}
- Debt: ₹${totalDebt.toLocaleString()}
- Credit Score: ${financialSummary.creditScore || 'Unknown'}
- Work Experience: ${demographics.workExperience || 0} years

Generate realistic characteristics for age ${futureAge} in this JSON format:
{
  "title": "Short persona title",
  "netWorthRange": "Estimated net worth range at this age",
  "majorAchievements": ["Achievement 1", "Achievement 2", "Achievement 3"],
  "keyLessons": ["Lesson 1", "Lesson 2", "Lesson 3"],
  "personality": "Personality description",
  "voiceCharacteristics": "How they speak and their tone",
  "lifePhase": "Life stage description",
  "financialFocus": "Primary financial priorities at this age"
}

Be realistic based on their current trajectory and Indian financial context.
      `;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const responseText = response.text();
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        return this.getDefaultPersonaCharacteristics(futureAge);
      }
    } catch (error) {
      console.error('Error generating persona characteristics:', error);
      return this.getDefaultPersonaCharacteristics(futureAge);
    }
  }

  getDefaultPersonaCharacteristics(futureAge) {
    const defaults = {
      30: {
        title: "The Learning Professional",
        netWorthRange: "₹5-15 Lakhs",
        majorAchievements: ["Cleared credit card debt", "Built emergency fund", "Started investing"],
        keyLessons: ["Debt discipline", "Emergency fund importance", "Systematic investing"],
        personality: "Disciplined and focused on financial growth",
        voiceCharacteristics: "Practical and encouraging",
        lifePhase: "Building financial foundation",
        financialFocus: "Debt clearance and wealth building"
      },
      40: {
        title: "The Wealth Builder", 
        netWorthRange: "₹50-75 Lakhs",
        majorAchievements: ["Significant investment portfolio", "Property ownership", "Financial stability"],
        keyLessons: ["Compound interest power", "Long-term thinking", "Risk management"],
        personality: "Confident and strategic",
        voiceCharacteristics: "Wise and reassuring",
        lifePhase: "Wealth accumulation phase",
        financialFocus: "Investment growth and major purchases"
      }
    };

    return defaults[futureAge] || defaults[40];
  }
}

module.exports = GeminiService;