import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

export const getGeminiClient = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const generateTextStream = async function* (model: string, prompt: string, systemInstruction?: string, signal?: AbortSignal) {
  const client = getGeminiClient();
  const responseStream = await client.models.generateContentStream({
    model,
    contents: prompt,
    config: {
      systemInstruction,
    }
  });

  for await (const chunk of responseStream) {
    if (signal?.aborted) {
      throw new Error('AbortError');
    }
    yield chunk.text;
  }
};

export const generateText = async (model: string, prompt: string, systemInstruction?: string, signal?: AbortSignal) => {
  const client = getGeminiClient();
  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      systemInstruction,
    }
  });
  if (signal?.aborted) {
    throw new Error('AbortError');
  }
  return response.text || '';
};

export const generateTriage = async (model: string, submissionList: string, guidance: string, signal?: AbortSignal) => {
  const client = getGeminiClient();
  const prompt = `
  You are an expert Medical Device Regulatory Affairs (RA) Reviewer.
  Analyze the following "Manufacturer's Submission List" against the provided "Review Instructions/Guidelines".
  Categorize each item from the submission list into one of three categories:
  1. Required (必要項目): Mandatory items that will cause rejection if missing.
  2. Not Required (非必要項目): Exempted or unnecessary items based on the context.
  3. Optional (選用/建議項目): Not mandatory but helpful for fast-track or priority review.

  Review Instructions/Guidelines:
  ${guidance}

  Manufacturer's Submission List:
  ${submissionList}

  Return the result as a JSON object strictly matching this schema:
  {
    "submission_triage": {
      "required": [ { "item": "item name", "reference": "article/clause", "reason": "why it is required" } ],
      "not_required": [ { "item": "item name", "reason": "why it is not required" } ],
      "optional": [ { "item": "item name", "reference": "article/clause", "reason": "why it is optional" } ]
    }
  }
  `;

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          submission_triage: {
            type: Type.OBJECT,
            properties: {
              required: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    reference: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["item", "reason"]
                }
              },
              not_required: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["item", "reason"]
                }
              },
              optional: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    item: { type: Type.STRING },
                    reference: { type: Type.STRING },
                    reason: { type: Type.STRING }
                  },
                  required: ["item", "reason"]
                }
              }
            },
            required: ["required", "not_required", "optional"]
          }
        },
        required: ["submission_triage"]
      }
    }
  });

  if (signal?.aborted) {
    throw new Error('AbortError');
  }

  return JSON.parse(response.text || '{}');
};
