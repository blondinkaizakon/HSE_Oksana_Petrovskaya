
// Переключено на локальную модель Qwen
// Используем QwenService вместо GeminiService
import { qwen } from './qwenService';

export class GeminiService {
  // Переименовано для обратной совместимости, но использует локальную модель
  async analyzeText(text: string, levelDescription: string) {
    return qwen.analyzeText(text, levelDescription);
  }
}

export const gemini = new GeminiService();
