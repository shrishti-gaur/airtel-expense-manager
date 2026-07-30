/**
 * AI Service Placeholder
 */
export class AiService {
  /**
   * Analyze expense logs for policy compliance, fraud markers, and taxonomy tags
   * TODO: Integrate Gemini API / Google Vertex AI for advanced text audit analysis.
   */
  async analyzeNarrative(text) {
    console.log(`[AI Service] Auditing expense narrative: "${text}"`);

    // Simulate AI model latency
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Return mock classifications
    return {
      autoSuggestedCategory: 'Internet & Communications',
      policyCompliance: {
        isCompliant: true,
        riskScore: 0.08,
        rulesChecked: [
          { ruleId: 'EXP_LMT_CHECK', passed: true, reason: 'Amount matches category allowances' },
          {
            ruleId: 'MERCHANT_CHECK',
            passed: true,
            reason: 'Merchant is a recognized telecom brand',
          },
        ],
      },
      tags: ['telecom', 'airtel', 'monthly-subscription'],
      auditConfidence: 0.98,
    };
  }
}

export const aiService = new AiService();
