import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { geminiShelfAnalysisSchema } from '../schemas/geminiSchemas.js';

const ai = env.GEMINI_API_KEY ? new GoogleGenAI({ apiKey: env.GEMINI_API_KEY }) : null;

const SYSTEM_PROMPT = `You are ShelfSight AI, a retail shelf-audit and visual intelligence assistant.

Your role is to analyze retail shelf images and identify visible operational issues that may require action by a store employee, merchandising manager, or inventory manager.

You must be factual, conservative, and uncertainty-aware.
You must not claim that a product is present, absent, misplaced, damaged, or incorrectly priced unless there is sufficient visual evidence in the image.
If the image is blurry, too dark, partially obstructed, cropped, distant, low resolution, or otherwise unclear, state that clearly and lower confidence values.
You must not invent brand names, product names, price values, stock quantities, shelf positions, labels, or planogram details that are not visibly supported by the image or supplied shelf context.
You must treat price-label mismatches as suspected mismatches unless the visual evidence is very clear.
You must return only valid JSON that matches the required schema. Do not return markdown. Do not return explanations outside the JSON object. Do not include comments.

The compliance score must be an integer from 0 to 100:
- 90 to 100: Well-organized shelf with no meaningful visible issues.
- 70 to 89: Minor issues requiring non-urgent correction.
- 40 to 69: Multiple operational issues or likely availability concerns.
- 0 to 39: Critical shelf condition with substantial availability or organization issues.

Use severity consistently:
- LOW: Minor visual issue with low operational impact.
- MEDIUM: Issue should be corrected during normal store operations.
- HIGH: Issue likely affects customer experience, product availability, or compliance.
- CRITICAL: Issue requires immediate attention, such as a clearly empty high-demand shelf section or significant disruption.

Your recommended actions must be concise, specific, operational, and actionable.`;

export async function analyzeShelfImage({ imagePath, imageMimeType = 'image/jpeg', auditContext }) {
  if (!ai || !env.GEMINI_API_KEY) {
    throw new Error('Gemini is not configured.');
  }

  const prompt = `Analyze this retail shelf image for a shelf audit.

Context:
- Store name: ${auditContext.storeName || 'Unknown store'}
- Store location: ${auditContext.storeCity || 'Unknown'}, ${auditContext.storeCountry || 'Unknown'}
- Shelf section: ${auditContext.shelfName || 'Unknown shelf'}
- Shelf category: ${auditContext.shelfCategory || 'Other'}
- Shelf description: ${auditContext.shelfDescription || 'No shelf description provided'}
- Expected products or planogram notes: ${auditContext.expectedProducts || 'Not provided'}
- Auditor notes: ${auditContext.auditNotes || 'No notes'}

Identify only visually supportable retail shelf observations.

Required tasks:
1. Assess the overall condition of the shelf.
2. Produce a compliance score from 0 to 100.
3. Identify visible products when reasonably recognizable.
4. Identify visible stock-out, low-stock, misplaced-product, empty-space, shelf-disorganization, damaged-packaging, unknown-product, price-label mismatch, or planogram-violation concerns.
5. Assign a confidence value from 0 to 1 to every finding.
6. Assign severity to every issue.
7. Recommend a clear operational action for every issue.
8. If the image quality is insufficient, include that in imageQualityNotes and avoid overconfident findings.
9. Return only valid JSON matching the exact schema below.

Required JSON schema:
{
  "overallShelfScore": 0,
  "summary": "string",
  "imageQualityNotes": "string",
  "detectedProducts": [
    {
      "productName": "string or null",
      "brand": "string or null",
      "status": "available | low_stock | out_of_stock | misplaced | unknown",
      "confidence": 0.0,
      "estimatedFacings": 0,
      "notes": "string"
    }
  ],
  "issues": [
    {
      "issueType": "OUT_OF_STOCK | LOW_STOCK | MISPLACED_PRODUCT | PRICE_LABEL_MISMATCH | PLANOGRAM_VIOLATION | UNKNOWN_PRODUCT | DAMAGED_PACKAGING | SHELF_DISORGANIZATION | EMPTY_SHELF_SPACE",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "productName": "string or null",
      "brand": "string or null",
      "estimatedFacings": 0,
      "confidence": 0.0,
      "description": "string",
      "recommendedAction": "string",
      "boundingBox": {
        "x": 0,
        "y": 0,
        "width": 0,
        "height": 0
      }
    }
  ]
}`;

  const image = await fsReadFile(imagePath);

  const response = await ai.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: [
      {
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: imageMimeType,
              data: image.toString('base64'),
            },
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: 'application/json',
    },
  });

  const rawText = response.text || response?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!rawText) {
    throw new Error('AI returned empty output.');
  }

  let parsed;
  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    throw new Error('AI returned invalid JSON.');
  }

  const validated = geminiShelfAnalysisSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error('AI output failed validation.');
  }

  return {
    raw: parsed,
    analysis: validated.data,
  };
}

function fsReadFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (error, content) => {
      if (error) reject(error);
      else resolve(content);
    });
  });
}
