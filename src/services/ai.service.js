import { GoogleGenerativeAI } from "@google/generative-ai";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";

let genAI = null;

const getAIClient = () => {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

// Clean markdown code blocks from AI response
const cleanJsonResponse = (text) => {
  return text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
};

// Clean HTML response - remove markdown code blocks
const cleanHtmlResponse = (text) => {
  return text
    .replace(/```html\n?/gi, '')
    .replace(/```\n?/g, '')
    .trim();
};

const generateRfpEmailBody =  async (rfp, vendorName) => {
  const prompt = `
    Create a professional RFP email to vendor "${vendorName}".
    Use the following structured RFP data:
    ${JSON.stringify(rfp, null, 2)}

    Email must include:
    - Summary of requirement
    - Budget
    - Items with specification
    - Delivery timeline
    - Payment terms
    - Warranty
    - A polite call to action asking the vendor to reply with pricing and proposal

    IMPORTANT: Return ONLY the raw HTML code without any markdown formatting or code blocks.
    Do NOT wrap the HTML in \`\`\`html or any other code block markers.
    Start directly with <!DOCTYPE html> or <html> tag.
  `;

  const model = getAIClient().getGenerativeModel({ model: "gemini-2.0-flash" });
  const aiRes = await model.generateContent(prompt);

  // Clean any markdown code blocks from response
  return cleanHtmlResponse(aiRes.response.text());
};

const parseVendorEmail = async (emailBody) => {
  if (!emailBody) {
    throw new ApiError(400, "Email body is required for parsing");
  }

  const prompt = `
    Extract the following details from this vendor proposal email.
    Email:${emailBody}

    Return JSON with:
    {
      "totalPrice": number,
      "pricingBreakdown": [],
      "deliveryDays": number,
      "warranty": string,
      "paymentTerms": string
    }

    If something is missing, put null.
  `;

  const model = getAIClient().getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);

  let parsed = result.response.text();

  try {
    return JSON.parse(cleanJsonResponse(parsed));
  } catch (err) {
    throw new ApiError(400, "Failed to parse AI JSON output");
  }
};

const compareProposalsAI = async (rfp, proposals) => {
  const model = getAIClient().getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt = `
Compare these vendor proposals for the following RFP:

RFP:
${JSON.stringify(rfp, null, 2)}

Proposals:
${JSON.stringify(proposals, null, 2)}

Your tasks:
1. Compare each vendor on:
   - Total price
   - Delivery days
   - Warranty
   - Payment terms
   - Completeness and clarity
2. Give each vendor a score from 0–100
3. Recommend ONE vendor with a clear reason

Return JSON only:
{
  "summary": "",
  "recommendation": "",
  "vendors": [
    {
      "vendorName": "",
      "score": 0,
      "price": 0,
      "deliveryDays": 0,
      "warranty": ""
    }
  ]
}
`;

  const response = await model.generateContent(prompt);

  try {
    return JSON.parse(cleanJsonResponse(response.response.text()));
  } catch (err) {
    throw new ApiError(400, "Failed to parse AI comparison JSON");
  }
};


export { generateRfpEmailBody, parseVendorEmail, compareProposalsAI};

