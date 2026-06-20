import dotenv from 'dotenv';

dotenv.config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_MODEL = 'llama3-8b-8192';

export class GroqService {
  /**
   * Sends chat message to Groq completions API
   * @param {string} message 
   * @param {object} userContext 
   * @returns {Promise<string>}
   */
  static async getChatResponse(message, userContext = {}) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      return "Hello! I am EcoChat, your sustainability assistant. It looks like the Groq AI API Key is not configured yet, but I can tell you that reducing meat intake, switching to LED lights, and taking public transit are great ways to reduce your footprint!";
    }

    const { fullName = 'User', metrics = {} } = userContext;
    const carbonContext = metrics.monthlyEmissions 
      ? `The user's monthly emissions are ${metrics.monthlyEmissions.toFixed(1)} kg CO2e (Transport: ${metrics.transportation || 0}kg, Energy: ${metrics.electricity || 0}kg, Food: ${metrics.food || 0}kg, Waste: ${metrics.waste || 0}kg, Water: ${metrics.water || 0}kg).`
      : "The user has not logged any activities yet.";

    try {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: `You are EcoChat, a helpful sustainability and climate-tech AI assistant for the Carbonlytix platform.
Your goal is to guide users to lower their carbon footprint with practical, positive advice.
User Name: ${fullName}
Carbon Context: ${carbonContext}
Keep responses friendly, encouraging, and under 150 words. Focus on carbon reductions and sustainability facts.`,
            },
            {
              role: 'user',
              content: message,
            },
          ],
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API responded with status ${response.status}`);
      }

      const result = await response.json();
      return result.choices[0]?.message?.content || "Sorry, I couldn't formulate a response.";
    } catch (error) {
      console.error('Groq Chat error:', error);
      return "I apologize, but I encountered an error while processing your request. Please try again later.";
    }
  }

  /**
   * Generates AI carbon recommendations using Groq
   * @param {object} categories 
   * @returns {Promise<Array|null>}
   */
  static async getAIRecommendations(categories) {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
      return null; // Gracefully fall back to local recommendation generator
    }

    try {
      const prompt = `Based on the following 30-day carbon footprint breakdowns (in kg CO2e):
- Transportation: ${categories.transportation || 0}
- Electricity: ${categories.electricity || 0}
- Food: ${categories.food || 0}
- Waste: ${categories.waste || 0}
- Water: ${categories.water || 0}

Generate exactly 3 personalized, highly actionable carbon reduction recommendations. 
Return ONLY a valid JSON array matching this structure:
[
  {
    "id": "ai_rec_1",
    "title": "Actionable Short Title",
    "description": "Encouraging description detailing how they can make the change and what the projected benefit is.",
    "category": "transportation | electricity | food | waste | water",
    "estimatedSavings": 25, (integer value of estimated savings in kg CO2e / month)
    "difficulty": "Easy | Medium | Hard",
    "impact": "Low | Medium | High",
    "icon": "Bus | Zap | Leaf | Trash2 | Droplet"
  }
]`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a sustainability expert that output recommendations only in raw JSON format.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.5,
          response_format: { type: 'json_object' }, // Request json output
        }),
      });

      if (!response.ok) {
        throw new Error('Groq recommendation request failed');
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      // Parse content
      const parsed = JSON.parse(content);
      // Support nested arrays or keys if LLM wrapped it
      const recs = Array.isArray(parsed) ? parsed : (parsed.recommendations || Object.values(parsed)[0]);
      
      if (Array.isArray(recs) && recs.length > 0) {
        return recs;
      }
      return null;
    } catch (err) {
      console.error('Groq Recommendations generation failed, falling back:', err);
      return null;
    }
  }
}
