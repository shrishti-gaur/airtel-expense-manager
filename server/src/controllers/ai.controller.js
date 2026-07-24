import { aiService } from '../services/ai.service.js';
import { sendSuccess } from '../utils/response.util.js';

export class AiController {
  /**
   * Run policy and taxonomy audits on expense logs
   */
  async analyzeExpense(req, res, next) {
    try {
      const { expenseText } = req.body;
      const analysisResult = await aiService.analyzeNarrative(expenseText);
      return sendSuccess(res, 'AI compliance analysis completed successfully', analysisResult);
    } catch (error) {
      next(error);
    }
  }
}

export const aiController = new AiController();
