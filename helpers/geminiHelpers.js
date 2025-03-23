import { GoogleGenerativeAI } from "@google/generative-ai";
import { getGeminiPrompt, parseAIresponse } from "../utils/geminiUtils.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const fetchAnimeRecommendationsFromGemini = async (type, input) => {
  try {
    const prompt = getGeminiPrompt(type, input);
    const result = await model.generateContent(prompt);
    return parseAIresponse(result);
  } catch (error) {
    console.error("Error fetching recommendations from Gemini API: ", error);
    return { recommendations: [] };
  }
};

export { fetchAnimeRecommendationsFromGemini };
