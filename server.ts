import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables from .env if present
dotenv.config();

const app = express();
const PORT = 3000;

// Use higher body limit because users upload base64 images
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ limit: "15mb", extended: true }));

// Lazy init GoogleGenAI
let ai: GoogleGenAI | null = null;
function getGeminiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please add it in the Settings > Secrets panel.");
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return ai;
}

// API Routes
app.post("/api/analyze", async (req, res) => {
  try {
    const { image, answers } = req.body;

    if (!answers) {
      return res.status(400).json({ error: "Contextual answers are required." });
    }

    const aiClient = getGeminiClient();

    const parts: any[] = [];

    if (image) {
      // Parse base64 image
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        parts.push({
          inlineData: {
            mimeType,
            data
          }
        });
      }
    }

    const promptText = `Here is my skin profile questionnaire:
- User-reported Skin Type: ${answers.skinType || "Unspecified"}
- Main Skin Concerns: ${Array.isArray(answers.concerns) ? answers.concerns.join(", ") : "None"}
- Sensitivity Level: ${answers.sensitivity || "Normal"}
- Routine Preference: ${answers.routineComplexity || "Simple"}
- Primary Complexion Goal: ${answers.primaryGoal || "Healthy Radiance"}
- Age Group: ${answers.ageGroup || "Unspecified"}
- Gender Context: ${answers.gender || "Unspecified"}
- Local Climate: ${answers.climate || "Unspecified"}

Please analyze my selfie photo (if available) alongside this questionnaire to determine my skin characteristics, visual cues, and key skincare ingredient needs. Provide morning and evening routines with precise explanations of how and why the recommended ingredients are beneficial for my specific concerns.`;

    parts.push({ text: promptText });

    const systemInstruction = `You are an expert dermatological advisor and skincare cosmetic chemist.
Analyze the user's selfie image (if provided) and their questionnaire context to identify their precise skin profile.
Provide highly customized, evidence-based skincare ingredient and product routine suggestions.
For the recommended active chemical constituents (ingredients), always provide 2 to 3 actual, popular, highly rated real-world products from the online market (e.g. from CeraVe, The Ordinary, Paula's Choice, La Roche-Posay, COSRX, Inkey List, etc.) containing those ingredients.
Be encouraging, professional, and clear.
Explain scientific terms (e.g. explain why Niacinamide, Salicylic Acid, Vitamin C, Hyaluronic Acid, or Ceramides work) in an accessible, visual manner.
If the selfie is missing, blurry, or dark, politely state in visualObservations that you've based your analysis primarily on their questionnaire details, but still provide excellent customized guidance.
Do not make definitive medical diagnoses; formulate a cosmetic improvement routine.
Your response must be strictly valid JSON conforming to the requested schema.`;

    const analysisSchema = {
      type: Type.OBJECT,
      properties: {
        skinTypeFromAI: {
          type: Type.STRING,
          description: "Summary skin classification analyzed from the selfie combined with user-provided details."
        },
        visualObservations: {
          type: Type.STRING,
          description: "Observations about texture, redness, dry patches, or pigmentation visible from the selfie and questionnaire details."
        },
        primaryConcernsIdentified: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "List of top skin concerns detected or confirmed."
        },
        ingredientRecommendations: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Name of the skincare ingredient, e.g., Salicylic Acid, Hyaluronic Acid, Niacinamide." },
              reason: { type: Type.STRING, description: "Detailed, accessible explanation of why this ingredient works effectively for their unique complexion." },
              benefits: { type: Type.STRING, description: "Key benefit summary, e.g. 'Calms redness & balances oil'" },
              popularMarketProducts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    brand: { type: Type.STRING, description: "Skincare brand name, e.g. CeraVe, The Ordinary, La Roche-Posay, Paula's Choice." },
                    productName: { type: Type.STRING, description: "Full name of the actual product, e.g. 'Effaclar Duo Dual Action Acne Treatment'." },
                    howItHelps: { type: Type.STRING, description: "Short explanation of how this specific market product serves their routine." }
                  },
                  required: ["brand", "productName", "howItHelps"]
                },
                description: "List of popular real-world products currently available on the online market containing this specific constituent."
              }
            },
            required: ["name", "reason", "benefits", "popularMarketProducts"]
          }
        },
        routine: {
          type: Type.OBJECT,
          properties: {
            morning: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER, description: "Step number starting from 1." },
                  category: { type: Type.STRING, description: "Skincare category (e.g., Cleanser, Toner, Vitamin C Serum, Moisturizer, Sunscreen)." },
                  productName: { type: Type.STRING, description: "Recommended product name (e.g., 'Hydrating Foam Cleanser')." },
                  keyIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skincare ingredients highlighted in this step." },
                  howToUse: { type: Type.STRING, description: "Brief application directions." },
                  whyItWorks: { type: Type.STRING, description: "Explanation connecting their skin needs with the ingredients." }
                },
                required: ["step", "category", "productName", "keyIngredients", "howToUse", "whyItWorks"]
              }
            },
            night: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  step: { type: Type.INTEGER, description: "Step number starting from 1." },
                  category: { type: Type.STRING, description: "Skincare category (e.g., Cleanser, Exfoliator, Retinol Serum, Night Cream)." },
                  productName: { type: Type.STRING, description: "Recommended product name (e.g., 'Overnight Calming Ceramide Cream')." },
                  keyIngredients: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Skincare ingredients highlighted in this step." },
                  howToUse: { type: Type.STRING, description: "Brief application directions." },
                  whyItWorks: { type: Type.STRING, description: "Explanation connecting their skin needs with the ingredients." }
                },
                required: ["step", "category", "productName", "keyIngredients", "howToUse", "whyItWorks"]
              }
            }
          },
          required: ["morning", "night"]
        },
        lifestyleTips: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Actionable daily tips to enhance their skin health."
        }
      },
      required: ["skinTypeFromAI", "visualObservations", "primaryConcernsIdentified", "ingredientRecommendations", "routine", "lifestyleTips"]
    };

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini AI.");
    }

    const result = JSON.parse(text);
    return res.json(result);

  } catch (error: any) {
    console.error("Analysis Error:", error);
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during skin analysis."
    });
  }
});

// Configure Vite or Serve Static Files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
